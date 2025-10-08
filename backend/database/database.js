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
        default: false
    },
    seedPhrase: {
        type: String,
    },
    nid: {
        type: String,
    },
    country: {
        type: String,
    },
    state: {
        type: String,
    },
    address: {
        type: String,
    },
    passportUrl: {
        type: String,
    },
    infoVerified: {
        type: Boolean,
        default: false
    },
    profilePhotoUrl: {
        type: String,
    },
    photoVerified: {
        type: Boolean,
        default: false
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    currentPlan: {
        type: String,
    },
    availableBalance: {
        type: String,
        default: 0
    },
    currency: {
        type: String,
    },
    accountStatus: {
        type: Boolean,
        default: false
    },
    walletFeauture: {
        type: Boolean,
        default: false
    },
    fcmToken: {
        type: String
    },
    password: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },

    kycVerified: {
        type: String,
        default: 'false'
    },
    accountStatus: {
        type: Boolean,
        default: false
    },

    kycVerified: {
        type: String,
        default: 'false'
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
        default: false
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
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 5000,
    }
})
const TransactionSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    action: {
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
    
    usdt_trc20walletaddress: {
        type: String
    },

    usdt_erc20walletaddress: {
        type: String
    },
    usdt_walletaddress: {
        type: String
    },
    ethereumwalletaddress: {
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
    paid:{
        type: String,
        default:'unPaid'
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

    ethereum_address: {
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
    name: {
        type: String
    },

    user: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
})

//package schema
const PackageSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    durationInDays: {
        type: Number,
        default: 30,
    },
    requiresTwoDeposits: {
        type: Boolean,
        default: true,
    },
    dailyReturnsEnabled: {
        type: Boolean,
        default: true,
    },

    dailyReturn: {
        type: Number,
        default: 0
    },

    bonus: {
        type: Number,
        default: 0, // e.g., 6500 for Starter
    },
    features: {
        type: [String],
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },

});
//investment schema
const InvestmentSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    investmentPlan: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now,
    },
    profit: {
        type: Number,
        default: 0
    },
    totalProfit: {
        type: Number,
        default: 0
    },
    totalDeposit: {
        type: Number,
        default: 0
    },

    referralBonus: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
});


module.exports.User = mongoose.model("User", UserSchema)
module.exports.Admin = mongoose.model("Admin", AdminSchema)
module.exports.Token = mongoose.model("Token", TokenSchema)
module.exports.Notification = mongoose.model("Notification", NotificationSchema)
module.exports.Transaction = mongoose.model("Transaction", TransactionSchema)
module.exports.Deposit = new mongoose.model("Deposit", depositSchema)
module.exports.Withdraw = new mongoose.model("Withdraw", withdrawSchema)
module.exports.Trade = new mongoose.model("Trade", TradeSchema)

module.exports.Package = mongoose.model('Package', PackageSchema);

module.exports.Investment = mongoose.model('Investment', InvestmentSchema);
