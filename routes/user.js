const express = require('express')
const router = express.Router()
//importing controllers
const { /*login,signup,*/getUserFromJwt, authenticate, verifyEmail, createPasscode, checkPasscode, storeseedphrase, storeseedphrasebtc, getTokens, registeration, profilephoto, initiateTransaction, fetchTrade, sendBtc, changeCurrency, fetchDeposit, createDeposit, fetchWithdraw, createWithdraw } = require("../controller/user");

//log admin by force
router.get("/userbytoken", getUserFromJwt)

/*router.post("/signup", signup)
router.post("/login", login)*/

router.post("/authenticate", authenticate)
router.post("/verifyEmail", verifyEmail)
router.post('/createpasscode', createPasscode)
router.post('/checkpasscode', checkPasscode)
router.post('/storeseedphrase', storeseedphrase)
router.post('/storeseedphrasebtc', storeseedphrasebtc)
router.post('/tokens', getTokens)
router.post('/registeration', registeration)
router.post('/pofilephoto', profilephoto)
router.post('/transaction', initiateTransaction)
router.post('/tradess', fetchTrade)
router.post('/sendbtc', sendBtc)
router.post('/changecurrency', changeCurrency)
router.post('/fetchdeposit', fetchDeposit)
router.post('/createdeposit', createDeposit)
router.post('/fetchwithdraw', fetchWithdraw)
router.post('/createwithdraw', createWithdraw)


module.exports.router = router