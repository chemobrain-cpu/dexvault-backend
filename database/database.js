const mongoose = require('mongoose')


const UserSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    fullName: {
        type: String,
    },
    email: {
        type: String,
    },
    passcode: {
        type: String,
    },
    isSetPasscode: {
        type: Boolean,
        default:false
    },
    seedPhrase:{
        type: String,
    },
    nid:{
        type: String,
    },
    country:{
        type: String,
    },
    state:{
        type: String,
    },
    address:{
        type: String,
    },
    passportUrl:{
        type: String,
    },
    infoVerified:{
        type: Boolean,
        default:false
    },
    profilePhotoUrl:{
        type: String,
    },
    photoVerified:{
        type: Boolean,
        default:false
    },
    firstName:{
        type: String,
    },
    lastName:{
        type: String,
    },
    currentPlan:{
        type: String,
    },
    availableBalance:{
        type: String,
        default:0
    },
    currency:{
        type: String,
    },
    accountStatus:{
        type: Boolean,
        default:false
    },
    walletFeauture:{
        type: Boolean,
        default:false
    },
    fcmToken:{
        type: String
    }
})

const NotificationSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    topic: {
        type: String,
    },
    date: {
        type: Date,
        default: Date()
    },
    text: {
        type: String,
    },
    actionText: {
        type: String
    },
    notification: {
        type: String
    },
    image: {
        type: String

    },
    icon: {
        type: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    price: {
        type: String,

    },
    id: {
        type: String,

    },
    showStatus: {
        type: Boolean,
        default:false
    }


})
const TokenSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:5000, 
    }
})
const TransactionSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    action:{
        type: String,
    },    
    currency: {
        type: String,
    },
    date: {
        type: Date,
        default: Date()
    },
    amount: {
        type: String,
    },
    recipientAddress: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
})
const AdminSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {
        type: String,
    },
    password: {
        type: String
    },
    walletAddress: {
        type: String
    },
    bitcoinwalletaddress: {
        type: String
    },
    zellewalletaddress: {
        type: String
    },
    etheriumwalletaddress: {
        type: String
    },
    cashappwalletaddress: {
        type: String
    },
    gcashname: {
        type: String
    },
    gcashphonenumber: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    name: {
        type: String
    },

})
const depositSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
   
    status: {
        type: String
    },
    depositId: {
        type: String
    },
    amount: {
        type: String
    },
    type: {
        type: String
    },
    date: {
        type: String
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
})

const TradeSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    tradeId: {
        type: String
    },
    date: {
        type: String
    },
    pair: {
        type: String
    },
    profit: {
        type: String
    },
    loss: {
        type: String
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
})

const withdrawSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    status: {
        type: String
    },
    bitcoin_address: {
        type: String
    },
    zelle_address: {
        type: String
    },
    etherium_address: {
        type: String
    },
    cashapp_address: {
        type: String
    },
    withdrawId: {
        type: String
    },
    amount: {
        type: String
    },
    method: {
        type: String
    },
    date: {
        type: String
    },
    swift: {
        type: String
    },
    bank_name: {
        type: String
    },
    account_number: {
        type: String
    },
    account_name: {
        type: String
    },
    phone: {
        type: String
    },
    name:{
        type: String
    },

    user: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
})

module.exports.User = mongoose.model("User", UserSchema)

module.exports.Admin = mongoose.model("Admin", AdminSchema)

module.exports.Token = mongoose.model("Token", TokenSchema)

module.exports.Notification = mongoose.model("Notification", NotificationSchema)

module.exports.Transaction = mongoose.model("Transaction", TransactionSchema)

module.exports.Deposit = new mongoose.model("Deposit", depositSchema)
module.exports.Withdraw = new mongoose.model("Withdraw", withdrawSchema)
module.exports.Trade = new mongoose.model("Trade", TradeSchema)

