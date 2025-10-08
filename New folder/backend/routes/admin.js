const express = require("express")
const router = express.Router()
const { verifyAdmin} = require("../utils/util")
const { getPackages, getPackage, updatePackage, deletePackage, createPackage, getInvestments, getInvestment, updateInvestment, deleteInvestment } = require("../controller/admin")

let login = require("../controller/admin").login
let signup = require("../controller/admin").signup

let getAdmin = require("../controller/admin").getAdmin
let updateAdmin = require("../controller/admin").updateAdmin


let getUsers = require("../controller/admin").getUsers
let getUser = require("../controller/admin").getUser
let updateUser = require("../controller/admin").updateUser
let deleteUser = require("../controller/admin").deleteUser


let getDeposits = require("../controller/admin").getDeposits
let getDeposit = require("../controller/admin").getDeposit
let updateDeposit = require("../controller/admin").updateDeposit
let deleteDeposit = require("../controller/admin").deleteDeposit


let getWithdraws = require("../controller/admin").getWithdraws
let getWithdraw = require("../controller/admin").getWithdraw
let updateWithdraw = require("../controller/admin").updateWithdraw
let deleteWithdraw = require("../controller/admin").deleteWithdraw


let getTrades = require("../controller/admin").getTrades
let getTrade = require("../controller/admin").getTrade
let updateTrade = require("../controller/admin").updateTrade
let deleteTrade = require("../controller/admin").deleteTrade
let createTrade = require("../controller/admin").createTrade


//auth routes

router.post('/adminlogin',login)
router.post('/adminsignup',signup)

//Admin Routes
router.get('/admin/:id',verifyAdmin,getAdmin)
router.patch('/admin/:id',verifyAdmin,updateAdmin)

//User Routes
router.get('/users',verifyAdmin,getUsers)
router.get('/users/:id',verifyAdmin,getUser)
router.patch('/users/:id',verifyAdmin,updateUser)
router.delete('/users/:id',verifyAdmin,deleteUser)


//Deposit Routes
router.get('/deposits',verifyAdmin,getDeposits)
router.get('/deposits/:id',verifyAdmin,getDeposit)
router.patch('/deposits/:id',verifyAdmin,updateDeposit)
router.delete('/deposits/:id',verifyAdmin,deleteDeposit)

//Withdraw Routes
router.get('/withdraws',verifyAdmin,getWithdraws)
router.get('/withdraws/:id',verifyAdmin,getWithdraw)
router.patch('/withdraws/:id',verifyAdmin,updateWithdraw)
router.delete('/withdraws/:id',verifyAdmin,deleteWithdraw)

//trade Routes
router.get('/trades',verifyAdmin,getTrades)
router.get('/trades/:id',verifyAdmin,getTrade)
router.patch('/trades/:id',verifyAdmin,updateTrade)
router.delete('/trades/:id',verifyAdmin,deleteTrade)
router.post('/trades',verifyAdmin,createTrade)

//route for packages Package
router.get('/packages',getPackages)
router.get('/packages/:id',getPackage)
router.patch('/packages/:id',updatePackage)
router.delete('/packages/:id',deletePackage)
router.post('/packages',createPackage)


//route for investment
router.get('/investments',getInvestments)
router.get('/investments/:id',getInvestment)
router.patch('/investments/:id',updateInvestment)
router.delete('/investments/:id',deleteInvestment)



exports.router = router