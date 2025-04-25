const express = require('express')
const router = express.Router()
const app = express()
const { body, validationResult } = require('express-validator')
//importing models
const { Admin, User, Notification, Transaction, SecretKeyToken, SecretKey } = require("../database/database")
//import {env} from "../enviroment"
const jwt = require("jsonwebtoken")
const AWS = require('aws-sdk')
const { generateAcessToken, notificationObject, upgradeTemplate, adminResolveTemplate } = require('../utils/util')
const mongoose = require("mongoose")
//aws setup
const config = require('../config'); // load 
let axios = require('axios')
const Mailjet = require('node-mailjet')
var request = require('request');



module.exports.signupAdmin = async (req, res, next) => {

    try {
        const { userEmail, userPassword, userSecretKey } = req.body
        let adminType

        let masterAdminSecretKeyObj = await SecretKey.findOne({ isMasterAdmin: true })

        let SubAdminSecretKeyObj = await SecretKey.findOne({ isMasterAdmin: true })

        if (!masterAdminSecretKeyObj || !SubAdminSecretKeyObj) {
            let error = new Error('secret key missing')
            return next(error)

        }

        //check for secret key
        if (userSecretKey !== masterAdminSecretKeyObj.key && userSecretKey !== SubAdminSecretKeyObj.key) {
            let error = new Error('secret key incorrect')
            return next(error)

        }

        if (userSecretKey === masterAdminSecretKeyObj.key) {
            adminType = true
            //deleting all previous admin
            await Admin.deleteOne({ isMainAdmin: true })

        } else if (userSecretKey === SubAdminSecretKeyObj.key) {
            adminType = false

        }


        //creating a new user 
        let newAdmin = new Admin({
            _id: new mongoose.Types.ObjectId(),
            email: userEmail,
            password: userPassword,
            isMainAdmin: adminType
        })

        //saving the user
        let savedAdmin = await newAdmin.save()
        if (!savedAdmin) {
            let error = new Error("resource not saved")
            return next(error)
        }

        const adminToSend = await Admin.findOne({ _id: savedAdmin._id })


        return res.status(200).json({
            response: {
                admin: adminToSend,
            }
        })

    } catch (error) {
        error.message = error.message || "an error occured try later"
        return next(error)
    }
}

module.exports.loginAdmin = async (req, res, next) => {
    try {
        const { userEmail, userPassword } = req.body

        let adminExist = await Admin.findOne({ email: userEmail })

        if (!adminExist) {
            //if user does not exist return 404 response
            return res.status(404).json({
                response: "user does not exist"
            })
        }

        //password check
        let passwordFromStorage = adminExist.password

        if (passwordFromStorage !== userPassword) {
            let error = new Error("password mismatch")
            return next(error)
        }

        const adminToSend = await Admin.findOne({ _id: adminExist._id })

        let token = generateAcessToken(userEmail)

        return res.status(200).json({
            response: {
                admin: adminToSend,
                adminToken: token,
                adminExpiresIn: '500',
            }
        })

    } catch (error) {
        error.message = error.message || "an error occured try later"
        return next(error)

    }

}