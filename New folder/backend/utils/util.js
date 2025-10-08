const jwt = require("jsonwebtoken")
require("dotenv").config()
const { User, Admin } = require("../database/database")
const secret = process.env.SECRET_KEY


module.exports.generateAcessToken = (email) => {
    let token = jwt.sign({ email: email }, secret, { expiresIn: "100d" })
    return token
}

module.exports.verifyToken = async (req, res, next) => {
    //getting token from front-end rebook

    let token = req.headers["header"]
    try {

        if (!token) {
            throw new Error("a token is needed oh")
        }

        const decodedToken = jwt.verify(token, secret)

        let user = await User.findOne({ email: decodedToken.phoneNumber })

        if (!user) {
            throw new Error('user not found')
        }
        req.user = user
        next()
    } catch (err) {
        let error = new Error("")
        error.statusCode = 302
        error.message = err.message
        return next(error)
    }
}

module.exports.verifyTransactionToken = async (token) => {
    const decodedToken = jwt.verify(token, secret)
    return decodedToken.phoneNumber
}

module.exports.verifyAdmin = async (req, res, next) => {
    try {
        console.log(req.body)
        let token = req.headers["header"]

        if (!token) {
            throw new Error("a token is needed")
        }
        const decodedToken = jwt.verify(token, secret)
        console.log(decodedToken)
        let admin = await Admin.findOne({ email: decodedToken.phoneNumber })
        console.log(admin)
        req.user = admin
        next()
    } catch (err) {
        let error = new Error("not authorize")
        error.statusCode = 301
        error.message = err.message
        return next(error)
    }
}


// Create a new Expo client
module.exports.authenticateEmailTemplate = (email, token) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dexvault Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            box-sizing: border-box;
        }
        h2 {
            text-align: center;
            color: #333;
        }
        p {
            font-size: 1rem;
            text-align: center;
            color: #555;
        }
        .content-section {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
        }
        .content-section div {
            width: 48%;
            text-align: center;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 1.1rem;
            color: #333;
        }
        @media (max-width: 600px) {
            .content-section {
                flex-direction: column;
                align-items: center;
            }
            .content-section div {
                width: 100%;
                margin-bottom: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Dexvault Verification</h2>
        <p>Dear ${email},</p>
        <p>Welcome to Dexvault!</p>
        <p>To verify your email, please use the following 4-digit verification code: <strong>${token}</strong>.</p>
        
        <div class="content-section">
            <div>
                <p><strong>Email:</strong></p>
            </div>
            <div>
                <p>${email}</p>
            </div>
        </div>

        <div class="footer">
            <p>If you did not request this verification, please ignore this message.</p>
            <p>Thank you,</p>
            
        </div>
    </div>
</body>
</html>
    `;
}


module.exports.passwordResetTemplate = (resetUrl, email) => {
    return `
<div >
    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">----------------------</h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">dexvaultalgo.com PASSWORDRESET </h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">-------------------------</h2>

    <p style=" margin-bottom: 40px; width: 100%;text-align: center;font-size:1rem">To reset the password to your dexvault account,click the RESET link below</p>

    <p style={{ margin-bottom: 40px; width: 100%; text-align:center; }}>
        <a style=" color: blue; font-size: .8rem;text-align:center" href='${resetUrl}'>
        ${resetUrl}
        </a>
    </p>

    <h2 style=" margin-bottom:30px; width: 100%; text-align: center ">For your information </h2>



    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: center">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;text-align:center">Email</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: center">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;text-align:center">${email}</p>

        </div>



    </div>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align:center; font-weight: 400 ">Happy trading !!</h2>


</div>`

}

module.exports.upgradeTemplate = (fundBalance, email) => {
    return `
<div >
    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">----------------------</h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">dexvaultalgo.com Credited </h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">-------------------------</h2>

    <p style=" margin-bottom: 40px; width: 100%;text-align: center;font-size:1rem">Your dexvault account has  been credited with $ ${fundBalance} to start trading with. Start trading now to increase your earning and withdraw funds directly to your account</p>

    

    <h2 style=" margin-bottom:30px; width: 100%; text-align: center ">For your information </h2>



    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: center">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;text-align:center">Email</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: center">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;text-align:center">${email}</p>

        </div>



    </div>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align:center; font-weight: 400 ">Happy trading !!</h2>


</div>`

}


module.exports.removeSpaces = (numStr) => {
    let res = ''
    for (let char of numStr) {
        if (char === ' ') continue
        res += char
    }
    return res
}



