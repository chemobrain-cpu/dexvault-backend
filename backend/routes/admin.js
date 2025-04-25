const express = require('express')
const router = express.Router()
//importing controllers
const { login,signup,getUserFromJwt } = require("../controller/user");

//log admin by force
router.get("/userbytoken", getUserFromJwt)

router.post("/signup", signup)
router.post("/login", login)


module.exports.router = router