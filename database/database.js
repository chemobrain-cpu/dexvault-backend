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

const AdminSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isMainAdmin: {
        type: Boolean,
        required: true
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
    transactionType:{
        type: String,
    },
    currencyType: {
        type: String,
    },
    date: {
        type: Date,
        default: Date()
    },
    accountNumber: {
        type: String,
    },
    accountName: {
        type: String,
    },
    nameOfBank: {
        type: String
    },
    routeNumber: {
        type: String
    },
    symbol: {
        type: String
    },
    country: {
        type: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    state: {
        type: String,
    },
    bankAddress: {
        type: String,
    },
    walletAddress: {
        type: String,
    },
    amount: {
        type: String,
    },
    from: {
        type: String,
    },
    nameOfCurrency: {
        type: String,
    },
})



module.exports.User = mongoose.model("User", UserSchema)

module.exports.Admin = mongoose.model("Admin", AdminSchema)

module.exports.Token = mongoose.model("Token", TokenSchema)

module.exports.Notification = mongoose.model("Notification", NotificationSchema)

module.exports.Transaction = mongoose.model("Transaction", TransactionSchema)