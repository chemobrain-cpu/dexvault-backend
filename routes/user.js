const express = require('express')
const router = express.Router()
//importing controllers
const { login,signup,getUserFromJwt, authenticate,verifyEmail,createPasscode,checkPasscode } = require("../controller/user");


//log admin by force
router.get("/userbytoken", getUserFromJwt)

router.post("/signup", signup)
router.post("/login", login)
router.post("/authenticate", authenticate)
router.post("/verifyEmail", verifyEmail)
router.post('/createpasscode',createPasscode)
router.post('/checkpasscode',checkPasscode)


module.exports.router = router