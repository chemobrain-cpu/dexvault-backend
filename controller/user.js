require('dotenv').config()
const express = require('express')
//importing models
const { User, Token } = require("../database/database")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const Mailjet = require('node-mailjet')
let request = require('request');
const { generateAcessToken, authenticateEmailTemplate } = require('../utils/util')

/*User.deleteMany().then(data=>{
    console.log(data)
})*/


module.exports.getUserFromJwt = async (req, res, next) => {
    try {
       
        let token = req.headers["header"]
        if (!token) {
            throw new Error("a token is needed ")
        }

        const decodedToken = jwt.verify(token, process.env.SECRET_KEY)

        const user = await User.findOne({ email: decodedToken.email  })

        if (!user) {
            return res.status(404).json({
                response: "user has been deleted"
            })
        }
        return res.status(200).json({
            response: {
                user: user,
            }
        })
    } catch (error) {
        console.log(error)
        error.message = error.message || "an error occured try later"
        return next(error)
    }

}

module.exports.login = async (req, res, next) => {
    let { email, password } = req.body
    try {
        let userExist = await User.findOne({ email: email })

        if (!userExist) {
            //get all attorneys
            let error = new Error("user is already registered")
            error.statusCode = 301
            return next(error)
        }

        //if password is incorrect
        if (userExist.password != password) {
            //get all attorneys
            let error = new Error("password does not match")
            error.statusCode = 301
            return next(error)
        }

        let token = generateAcessToken(userEmail)

        return res.status(200).json({
            response: {
                user: userExist,
                token: token,
                adminExpiresIn: '500',
            }
        })

    } catch (error) {
        console.log(error)
        return res.status(200).render('loginerror', { msg: 'an error occured' })
    }
}

module.exports.signup = async (req, res, next) => {
    try {
        // Destructure request body
        let { firstName, lastName, password, email } = req.body

        // Check if the email already exists
        let userExist = await User.findOne({ email: email })
        if (userExist) {
            let error = new Error("User is already registered")
            error.statusCode = 409  // Conflict
            return next(error)
        }

        // Create the JWT token
        const accessToken = generateAcessToken(email)

        if (!accessToken) {
            let error = new Error("Could not generate token")
            error.statusCode = 400  // Bad Request
            return next(error)
        }

        let verifyUrl = `https://www.capchain.cloud/verifyemail/${accessToken}`

        // Create mailjet send email
        const mailjet = Mailjet.apiConnect(process.env.MAILJET_APIKEY, process.env.MAILJET_SECRETKEY)

        const request = await mailjet.post("send", { 'version': 'v3.1' })
            .request({
                "Messages": [
                    {
                        "From": {
                            "Email": "capchain@capchain.cloud",
                            "Name": "capchain"
                        },
                        "To": [
                            {
                                "Email": `${email}`,
                                "Name": `${firstName}`
                            }
                        ],
                        "Subject": "Account Verification",
                        "TextPart": `Dear ${email}, welcome to capchain! Please click the link ${verifyUrl} to verify your email!`,
                        "HTMLPart": verifyEmailTemplate(verifyUrl, email)
                    }
                ]
            })

        if (!request) {
            let error = new Error("Please use a valid email")
            error.statusCode = 400  // Bad Request
            return next(error)
        }

        // Create token model and save it
        let newToken = new Token({
            _id: new mongoose.Types.ObjectId(),
            email: email,
            token: accessToken
        })

        let savedToken = await newToken.save()

        if (!savedToken) {
            let error = new Error("Failed to save token")
            error.statusCode = 500  // Internal Server Error
            return next(error)
        }

        // Create user model and save it
        let newUser = new User({
            _id: new mongoose.Types.ObjectId(),
            firstName: firstName,
            lastName: lastName,
            email: email,
            emailVerified: false,
            password: password
        })
        let savedUser = await newUser.save()

        if (!savedUser) {
            let error = new Error("User could not be saved")
            error.statusCode = 500  // Internal Server Error
            return next(error)
        }

        // Return success response
        return res.status(200).json({
            response: 'User has been saved'
        })

    } catch (error) {
        // Handle unexpected errors and return appropriate status code
        error.message = error.message || "An error occurred. Please try again later"
        error.statusCode = 500  // Internal Server Error
        return next(error)
    }
}

module.exports.authenticate = async (req, res, next) => {
    let { email } = req.body;
    console.log(req.body)
    try {
        let userExist = await User.findOne({ email: email });

        if (!userExist) {
            const token = Math.floor(1000 + Math.random() * 9000);

            // Create mailjet send email
            const mailjet = Mailjet?.apiConnect(process.env.MAILJET_APIKEY, process.env.MAILJET_SECRETKEY);

            const request = await mailjet.post("send", { 'version': 'v3.1' })
                .request({
                    "Messages": [
                        {
                            "From": {
                                "Email": "capchain@capchain.cloud",
                                "Name": "capchain"
                            },
                            "To": [
                                {
                                    "Email": `${email}`,
                                    "Name": `${email}`
                                }
                            ],
                            "Subject": "Account Verification",
                            "TextPart": `
                            Dear ${email},
                            
                            Welcome to Dexvault! 
                            
                            To complete your account verification, please use the following 4-digit verification code: **${token}**.
                            
                            If you did not request this verification, please ignore this message.
                            
                            Thank you`,

                            "HTMLPart": authenticateEmailTemplate(email, token)
                        }
                    ]
                });

            if (!request) {
                let error = new Error("Invalid email address or email sending failed.");
                error.statusCode = 422;  // Unprocessable Entity (Invalid email)
                return next(error);
            }

            // Create token model and save it
            let newToken = new Token({
                _id: new mongoose.Types.ObjectId(),
                email: email,
                token: token
            });

            let savedToken = await newToken.save();

            if (!savedToken) {
                let error = new Error("Failed to save token");
                error.statusCode = 500;  // Internal Server Error
                return next(error);
            }

            return res.status(200).json({
                response: {
                    message: "Verification email sent successfully!",
                }
            });
        }
console.log(userExist.isSetPasscode)
        //check if user has set passcode
        if(!userExist.isSetPasscode){
            return res.status(202).json({
                response: {
                    user: userExist,
                    message: "Create passcode",
                }
            });

        }
        // User exists, return a 409 status indicating user already registered
        return res.status(201).json({
            response: {
                user: userExist,
                message: "proceed to login!",
            }
        });

    } catch (error) {
        console.log(error)
        error.message = 'An error occurred during authentication.';
        error.statusCode = 500;  // Internal Server Error
        return next(error);
    }
};



module.exports.verifyEmail = async (req, res, next) => {
    let { code, email } = req.body;
    try {
        // Check if the token exists and is valid
        let tokenExist = await Token.findOne({
            code: code,
            email: email
        });

        if (!tokenExist) {
            return res.status(400).json({
                response: {
                    message: "Token expired or invalid!",
                }
            });
        }

        // Create a new user model and save it
        let newUser = new User({
            _id: new mongoose.Types.ObjectId(),
            email: email,
        });

        let savedUser = await  newUser.save()
        if (!savedUser) {
            return res.status(500).json({
                response: {
                    message: "An error occurred trying to save the user!",
                }
            });
        }
        let token = generateAcessToken(email)

        // Return success with the user data
        return res.status(200).json({
            response: {
                user: savedUser,
                message: "Proceed to other screen, like notifications screen!",
                token:token,
                expiresIn: '500',
            }
        });

    } catch (error) {
        // Log and handle the error
        error.message = 'An error occurred during authentication.';
        error.statusCode = 500;  // Internal Server Error
        return next(error);
    }
};


module.exports.createPasscode  = async (req, res, next) => {
    let { code, email} = req.body;
    try {
        //search for the user
        let userExist = await User.findOne({ email:email  });
        if(!userExist){
            return res.status(404).json({
                response: {
                    message: "User not found!",
                }
            });
        }
        userExist.passcode = code
        userExist.isSetPasscode= true

        let savedUser = userExist.save()
        if(!savedUser){
            let error = new Error("an error occured");
            error.statusCode = 300;  // Unprocessable Entity (Invalid email)
            return next(error);
        }
    
       
        let token = generateAcessToken(email)

        // Return success with the user data
        return res.status(200).json({
            response: {
                user: savedUser,
                message: "Proceed to other screen, like notifications screen!",
                token:token,
                expiresIn: '1',
            }
        });
    } catch (error) {
        // Log and handle the error
        error.message = 'An error occurred during authentication.';
        error.statusCode = 500;  // Internal Server Error
        return next(error);
    }
};



module.exports.checkPasscode = async (req, res, next) => {
    let { code, email } = req.body;
    console.log(req.body)
    try {
        // Search for the user
        let userExist = await User.findOne({ email: email });
        if (!userExist) {
             let error = new Error('user does not exist');
             error.statusCode = 404; // 401 Unauthorized
             return next(error);
        }
        console.log(userExist.passcode)

        // Check if user entered the correct passcode
        if (code !== userExist.passcode) {
            let error = new Error("Incorrect passcode!");
            error.statusCode = 401; // 401 Unauthorized
            return next(error);
        }

        let token = generateAcessToken(email)

        // Return success with the user data
        return res.status(200).json({
            response: {
                user: userExist,
                message: "Proceed to other screen, like notifications screen!",
                token:token,
                expiresIn: '500',
            }
        });

    } catch (error) {
        console.log(error)
        // Log and handle the error
        error.statusCode = 500; // 500 Internal Server Error
        return next(error);
    }
};


User.find().then(data=>{
    console.log(data)
})










