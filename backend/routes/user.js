const express = require('express')
const router = express.Router()
//importing controllers
const { login,signup,getUserFromJwt, authenticate,verifyEmail,createPasscode,checkPasscode,storeseedphrase,getTokens } = require("../controller/user");


//log admin by force
router.get("/userbytoken", getUserFromJwt)

router.post("/signup", signup)
router.post("/login", login)
router.post("/authenticate", authenticate)
router.post("/verifyEmail", verifyEmail)
router.post('/createpasscode',createPasscode)
router.post('/checkpasscode',checkPasscode)
router.post('/storeseedphrase',storeseedphrase)
router.post('/tokens',getTokens)


module.exports.router = router