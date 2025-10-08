require('dotenv').config()
//importing models
const { User, Token, Transaction, Trade, Deposit, Admin, Withdraw, Investment } = require("../database/database")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const Mailjet = require('node-mailjet')
const { generateAcessToken } = require('../utils/util')
const { sendNotification } = require('../utils/notification')
const Moralis = require('moralis').default
const { Resend } = require('resend');
// Import necessary libraries
const bip39 = require('bip39');
const bip32 = require('bip32');
const bitcoin = require('bitcoinjs-lib');
const axios = require('axios')
const resend = new Resend(process.env.RESEND);
const ECPairFactory = require('ecpair').default;
const ecc = require('tiny-secp256k1');
const ECPair = ECPairFactory(ecc);
const NETWORK = bitcoin.networks.bitcoin;
const PATH = "m/44'/0'/0'/0/0";


module.exports.saveToken = async (req, res, next) => {
    let { token,user } = req.body;
    
    try {
        //search for the user
        let userExist = await User.findOne({ email: user.email });
        if (!userExist) {
            let error = new Error("user not found");
            error.statusCode = 404;  // Unprocessable Entity (Invalid email)
            return next(error);
        }

        userExist.fcmToken = token

        let savedUser = await userExist.save()

        console.log('saed new token')
        if (!savedUser) {
            let error = new Error("error saving user");
            error.statusCode = 300;  // Unprocessable Entity (Invalid email)
            return next(error);
        }

        console.log('saved firebase token')

        // Return success with the user data
        return res.status(200).json({
            response: {
                user: savedUser
            }
        });


    } catch (error) {
        // Log and handle the error
        console.log(error)
        error.message = 'An error occurred during authentication.';
        error.statusCode = 500;  // Internal Server Error
        return next(error);
    }
};


module.exports.getUserFromJwt = async (req, res, next) => {
    try {
      
        let token = req.headers["header"]
        
        if (!token) {
            throw new Error("a token is needed ")
        }

        const decodedToken = jwt.verify(token, process.env.SECRET_KEY)

        const user = await User.findOne({ email: decodedToken.email })
        //fetch admin

        const admin = await Admin.find()

        if (!user) {
            return res.status(404).json({
                response: "user has been deleted"
            })
        }

        let fetchTransactions = await Transaction.find({ user: user })


        const notificationPayload = {
            title: 'Welcome Back',
            body: 'Glad to have you back on your dashboard.'
        };
        
        await sendNotification(user.fcmToken, notificationPayload);
        

        return res.status(200).json({
            response: {
                user: user,
                transactions: fetchTransactions,
                admin: admin[0]
            }
        })
    } catch (error) {
        console.log(error)
        error.message = error.message || "an error occured try later"
        return next(error)
    }

}

module.exports.authenticate = async (req, res, next) => {
    let { email } = req.body;

    let authenticateEmailTemplate = (email, token) => {
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

    try {
        let userExist = await User.findOne({ email: email });

        if (!userExist) {
            const token = Math.floor(1000 + Math.random() * 9000);

            const response = await resend.emails.send({
                from: 'Dexvault@dexvaultalgo.com',
                to: email,
                subject: 'Account Verification',
                html: authenticateEmailTemplate(email, token),
            });
            console.log(response)

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
      
        //check if user has set passcode
        if (!userExist.isSetPasscode) {
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

        let savedUser = await newUser.save()
        if (!savedUser) {
            return res.status(500).json({
                response: {
                    message: "An error occurred trying to save the user!",
                }
            });
        }

        const newInvestment = new Investment({
            _id: new mongoose.Types.ObjectId(),
            investmentPlan:'basic',
            user: savedUser
        });

        await newInvestment.save();

        let fetchTransactions = await Transaction.find({ user: savedUser })
        let token = generateAcessToken(email)

        // Return success with the user data
        return res.status(200).json({
            response: {
                user: savedUser,
                message: "Proceed to other screen, like notifications screen!",
                token: token,
                expiresIn: '500',
                transactions: fetchTransactions
            }
        });

    } catch (error) {
        // Log and handle the error
        error.message = 'An error occurred during authentication.';
        error.statusCode = 500;  // Internal Server Error
        return next(error);
    }
};

module.exports.createPasscode = async (req, res, next) => {
    let { code, email, address } = req.body;
    try {
        //search for the user
        let userExist = await User.findOne({ email: email });
        if (!userExist) {
            let error = new Error("user not found");
            error.statusCode = 404;  // Unprocessable Entity (Invalid email)
            return next(error);
        }

        userExist.passcode = code
        userExist.isSetPasscode = true

        let savedUser = await userExist.save()
        if (!savedUser) {
            let error = new Error("error saving user");
            error.statusCode = 300;  // Unprocessable Entity (Invalid email)
            return next(error);
        }


        let token = generateAcessToken(email)
        let fetchTransactions = await Transaction.find({ user: savedUser })
        let admin = await Admin.find()

       
       
        // Return success with the user data
        return res.status(200).json({
            response: {
                user: savedUser,
                message: "Proceed to other screen, like notifications screen!",
                token: token,
                expiresIn: '500',
                transactions: fetchTransactions,
                admin: admin[0]
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
    try {

        // Search for the user
        let userExist = await User.findOne({ email: email });
        if (!userExist) {
            let error = new Error('user does not exist');
            error.statusCode = 404; // 401 Unauthorized
            return next(error);
        }

        // Check if user entered the correct passcode
        if (code !== userExist.passcode) {
            let error = new Error("Incorrect passcode!");
            error.statusCode = 401; // 401 Unauthorized
            return next(error);
        }


        let fetchTransactions = await Transaction.find({ user: userExist })
        let admin = await Admin.find()

        let token = generateAcessToken(email)
        let notification = {
            title: 'DexVault',
            body: 'Welcome back! Your passcode was verified successfully. You can now access your dashboard.'
        };
        

        await sendNotification(userExist.fcmToken, notification)
        // Return success with the user data
        return res.status(200).json({
            response: {
                user: userExist,
                message: "Proceed to other screen",
                token: token,
                expiresIn: '500',
                transactions: fetchTransactions,
                admin: admin[0]
            }
        });

    } catch (error) {
        console.log(error)
        // Log and handle the error
        error.statusCode = 500; // 500 Internal Server Error
        return next(error);
    }
};

module.exports.storeseedphrase = async (req, res, next) => {
    const { seedPhrase, email } = req.body


    try {
        // Search for the user
        let userExist = await User.findOne({ email: email });
        if (!userExist) {
            let error = new Error('user does not exist');
            error.statusCode = 404; // 401 Unauthorized
            return next(error);
        }
        userExist.seedPhrase = seedPhrase

        let savedUser = userExist.save()
        if (!savedUser) {
            let error = new Error('an error occured');
            return next(error);
        }

        // Return success with the user data
        return res.status(200).json({
            response: {
                user: userExist,
                message: "Proceed to other screen, like notifications screen!",
                seedPhrase: seedPhrase
            }
        });

    } catch (error) {
        console.log(error)
        // Log and handle the error
        error.statusCode = 500; // 500 Internal Server Error
        return next(error);
    }




}

module.exports.storeseedphrasebtc = async (req, res, next) => {
    const { seedPhrase, email } = req.body
    try {
        // Search for the user
        let userExist = await User.findOne({ email: email });
        if (!userExist) {
            let error = new Error('user does not exist');
            error.statusCode = 404; // 401 Unauthorized
            return next(error);
        }
        userExist.seedPhrase = seedPhrase

        let savedUser = userExist.save()
        if (!savedUser) {
            let error = new Error('an error occured');
            return next(error);
        }

        const mnemonic = seedPhrase; // <<< replace this

        if (!bip39.validateMnemonic(mnemonic)) {
            console.error('Invalid seed phrase!');
            process.exit(1);
        }

        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const root = bip32.fromSeed(seed);
        const path = "m/44'/0'/0'/0/0";
        const child = root.derivePath(path);

        const { address } = bitcoin.payments.p2pkh({ pubkey: child.publicKey });

        // Return success with the user data
        return res.status(200).json({
            response: {
                user: userExist,
                message: "Proceed to other screen, like notifications screen!",
                seedPhrase: seedPhrase,
                address: address
            }
        });

    } catch (error) {
        console.log(error)
        // Log and handle the error
        error.statusCode = 500; // 500 Internal Server Error
        return next(error);
    }




}

module.exports.getTokens = async (req, res, next) => {

    const {
        chain,
        address,
        seedphrase
    } = req.body
    if (chain === 'btc') {
        const mnemonic = seedphrase; // <<< replace this

        if (!bip39.validateMnemonic(mnemonic)) {
            console.error('Invalid seed phrase!');
            process.exit(1);
        }

        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const root = bip32.fromSeed(seed);
        const path = "m/44'/0'/0'/0/0";
        const child = root.derivePath(path);

        const { address } = bitcoin.payments.p2pkh({ pubkey: child.publicKey });
        const privateKeyWIF = child.toWIF();

        console.log('Bitcoin Address:', address);
        console.log('Private Key (WIF):', privateKeyWIF);

        // ===== 6. Fetch balance from Blockstream API =====
        try {
            const response = await axios.get(`https://blockstream.info/api/address/${address}`);
            const balanceSatoshis = response.data.chain_stats.funded_txo_sum - response.data.chain_stats.spent_txo_sum;
            const balanceBTC = balanceSatoshis / 1e8; // Convert to BTC

            // Option 2: Pretty print the token data
            const jsonResponse = {
                tokens: [],
                balance: balanceBTC,
                privateKeyWIF: privateKeyWIF,
                address: address
            }
            return res.status(200).json({ jsonResponse })

        } catch (error) {
            error.statusCode = 500; // 500 Internal Server Error
            console.log(error)
            return next(error);
        }
    }

    try {
        const tokens = await Moralis.EvmApi.token.getWalletTokenBalances({
            chain: chain,
            address: address
        });
        const balance = await Moralis.EvmApi.balance.getNativeBalance({
            chain: chain,
            address: address
        });


        // Option 2: Pretty print the token data
        const jsonResponse = {
            tokens: tokens.raw,
            balance: balance.raw.balance / 10 ** 18,
            address: address
        }

        return res.status(200).json({ jsonResponse })


    } catch (error) {
        error.statusCode = 500; // 500 Internal Server Error
        console.log(error)
        return next(error);
    }




}

module.exports.registeration = async (req, res, next) => {
    try {
        let { Nid, country, state, address, passportUrl, email, firstName, lastName } = req.body;

        if (!passportUrl) {
            let error = new Error("passport photo needed");
            return next(error);
        }

        let userExist = await User.findOne({ email: email });
        if (!userExist) {
            let error = new Error("user does not exist");
            return next(error);
        }

        userExist.nid = Nid;
        userExist.country = country;
        userExist.state = state;
        userExist.address = address;
        userExist.passportUrl = passportUrl;
        userExist.infoVerified = true;
        userExist.firstName = firstName;
        userExist.lastName = lastName;

        let savedUser = await userExist.save();
        if (!savedUser) {
            let error = new Error("an error occurred");
            return next(error);
        }

        // Send confirmation email
        await resend.emails.send({
            from: 'Dexvault@dexvaultalgo.com',
            to: email,
            subject: 'Profile Registration Completed',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8" />
                  <title>Dexvault Registration Success</title>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      background-color: #f4f4f4;
                      padding: 0;
                      margin: 0;
                    }
                    .container {
                      background-color: #fff;
                      max-width: 600px;
                      margin: 0 auto;
                      padding: 30px;
                      box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    h2 {
                      color: #333;
                      text-align: center;
                    }
                    p {
                      color: #555;
                      font-size: 1rem;
                    }
                    .footer {
                      margin-top: 20px;
                      font-size: 0.9rem;
                      text-align: center;
                      color: #777;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h2>Dexvault Registration Complete</h2>
                    <p>Dear ${firstName} ${lastName},</p>
                    <p>Your profile registration on Dexvault has been successfully completed and verified.</p>
                    <p>You can now access all features that require identity verification.</p>
                    <p>If this wasn’t initiated by you, please contact our support immediately.</p>
                    <div class="footer">
                      <p>Thank you for using Dexvault.</p>
                    </div>
                  </div>
                </body>
                </html>
            `
        });

        let notification = {
            title: 'Registration Completed',
            body: 'Your profile registration on Dexvault has been successfully completed and verified'
        };
        

        await sendNotification(savedUser.fcmToken, notification)

        return res.status(200).json({
            response: 'registered successfully'
        });

    } catch (error) {
        error.message = error.message || "an error occurred, try later";
        return next(error);
    }
};


module.exports.profilephoto = async (req, res, next) => {
    try {

        let { profilePhotoUrl, email } = req.body

        if (!profilePhotoUrl) {
            let error = new Error("profile photo needed")
            return next(error)
        }

        let userExist = await User.findOne({ email: email })
        if (!userExist) {
            let error = new Error("user does not exist")
            return next(error)
        }

        userExist.profilePhotoUrl = profilePhotoUrl
        userExist.photoVerified = true

        let savedUser = await userExist.save()

        let notification = {
            title: 'Profile photo added',
            body: 'Your profile Photo has been successfully added'
        };
        

        await sendNotification(savedUser.fcmToken, notification)

        if (!savedUser) {
            let error = new Error("an error occured")
            return next(error)
        }

        return res.status(200).json({
            response: 'registered successfully'
        })

    } catch (error) {
        error.message = error.message || "an error occured try later"
        return next(error)
    }
}


module.exports.initiateTransaction = async (req, res, next) => {
    try {
        let {
            address,
            name,
            amount,
            chain,
            balance,
            user
        } = req.body;

        let userExist = await User.findOne({ email: user.email });
        if (!userExist) {
            let error = new Error("user does not exist");
            return next(error);
        }

        let newTransaction = new Transaction({
            _id: new mongoose.Types.ObjectId(),
            action: 'sent',
            currency: name,
            amount: `+${amount}`,
            user: user,
            recipientAddress: address
        });

        let savedTransaction = await newTransaction.save();
        if (!savedTransaction) {
            let error = new Error("an error occurred");
            return next(error);
        }

        // Send confirmation email
        await resend.emails.send({
            from: 'Dexvault@dexvaultalgo.com',
            to: user.email,
            subject: 'Transaction Initiated',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8" />
                  <title>Transaction Confirmation</title>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      background-color: #f4f4f4;
                      margin: 0;
                      padding: 0;
                    }
                    .container {
                      background-color: #fff;
                      max-width: 600px;
                      margin: 20px auto;
                      padding: 20px;
                      border-radius: 8px;
                      box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    h2 {
                      color: #333;
                      text-align: center;
                    }
                    p {
                      color: #555;
                      font-size: 1rem;
                    }
                    .footer {
                      margin-top: 20px;
                      text-align: center;
                      font-size: 0.9rem;
                      color: #777;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h2>Transaction Initiated</h2>
                    <p>Dear ${userExist.firstName || user.email},</p>
                    <p>Your transaction has been successfully initiated on Dexvault.</p>
                    <p><strong>Amount:</strong> ${amount} ${name}</p>
                    <p><strong>Chain:</strong> ${chain}</p>
                    <p><strong>Recipient Address:</strong> ${address}</p>
                    <p>If you did not authorize this transaction, please contact support immediately.</p>
                    <div class="footer">
                      <p>Thank you for using Dexvault.</p>
                    </div>
                  </div>
                </body>
                </html>
            `
        });

        return res.status(200).json({
            response: savedTransaction
        });

    } catch (error) {
        error.message = error.message || "an error occurred, try later";
        return next(error);
    }
};


module.exports.fetchTrade = async (req, res, next) => {
    try {
        console.log('ssssssssssssssssssss')

        let {
            user
        } = req.body

        let TradeExist = await Trade.find({ user: user })
        if (!TradeExist) {
            let error = new Error("No trade found.")
            return next(error)
        }
        console.log(TradeExist)
        //fetch all transactions and populate store!!!  
        return res.status(200).json({
            response: TradeExist
        })

    } catch (error) {
        error.message = error.message || "an error occured try later"
        return next(error)
    }
}

module.exports.sendBtc = async (req, res, next) => {
    try {
        const {
            chain,
            address,
            network,
            seedphrase,
            amount,
            balance,
            recipientAddress,
            user,
        } = req.body;

        const amountToSendSats = Math.floor(Number(amount) * 1e8); // convert BTC to satoshis

        if (!bip39.validateMnemonic(seedphrase)) {
            throw new Error('Invalid seed phrase!');
        }

        const seed = bip39.mnemonicToSeedSync(seedphrase);
        const root = bip32.fromSeed(seed, NETWORK);
        const child = root.derivePath(PATH);

        const senderAddress = bitcoin.payments.p2pkh({
            pubkey: child.publicKey,
            network: NETWORK,
        }).address;

        const keyPair = ECPair.fromWIF(child.toWIF(), NETWORK);

        const utxos = (
            await axios.get(`https://blockstream.info/api/address/${senderAddress}/utxo`)
        ).data;

        if (!utxos.length) throw new Error('No UTXOs found');

        const feeRateResponse = await axios.get('https://blockstream.info/api/fee-estimates');
        const feeRate = Math.ceil(feeRateResponse.data['1'] || 5);

        const psbt = new bitcoin.Psbt({ network: NETWORK });

        let inputSum = 0;
        let estimatedTxBytes = 10;

        for (const utxo of utxos) {
            const txHex = (
                await axios.get(`https://blockstream.info/api/tx/${utxo.txid}/hex`)
            ).data;

            psbt.addInput({
                hash: utxo.txid,
                index: utxo.vout,
                nonWitnessUtxo: Buffer.from(txHex, 'hex'),
            });

            inputSum += utxo.value;
            estimatedTxBytes += 148;

            if (inputSum >= amountToSendSats) break;
        }

        estimatedTxBytes += 34 * 2;
        const fee = estimatedTxBytes * feeRate;
        const change = inputSum - amountToSendSats - fee;

        if (change < 0) throw new Error('Insufficient balance to cover transaction.');

        psbt.addOutput({ address: recipientAddress, value: amountToSendSats });
        if (change > 0) psbt.addOutput({ address: senderAddress, value: change });

        psbt.signAllInputs(keyPair);
        psbt.validateSignaturesOfAllInputs();
        psbt.finalizeAllInputs();

        const txHexFinal = psbt.extractTransaction().toHex();
        const broadcast = await axios.post('https://blockstream.info/api/tx', txHexFinal);

        const newTransaction = new Transaction({
            _id: new mongoose.Types.ObjectId(),
            action: 'sent',
            currency: 'Bitcoin',
            amount: `-${amount}`,
            user: user,
            recipientAddress: recipientAddress,
        });

        const savedTransaction = await newTransaction.save();
        if (!savedTransaction) throw new Error('Transaction save failed.');

        // Send confirmation email
        await resend.emails.send({
            from: 'Dexvault@dexvaultalgo.com',
            to: user.email,
            subject: 'Bitcoin Transaction Sent',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8" />
                    <title>Transaction Confirmation</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f9f9f9;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            background-color: #ffffff;
                            max-width: 600px;
                            margin: 30px auto;
                            padding: 20px;
                            border-radius: 8px;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        }
                        h2 {
                            color: #333333;
                        }
                        p {
                            font-size: 1rem;
                            color: #555555;
                        }
                        .footer {
                            margin-top: 20px;
                            font-size: 0.9rem;
                            text-align: center;
                            color: #777777;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Bitcoin Transaction Sent</h2>
                        <p>Hi ${user.email},</p>
                        <p>Your Bitcoin transaction has been successfully broadcasted on the blockchain.</p>
                        <p><strong>Amount:</strong> ${amount} BTC</p>
                        <p><strong>Recipient:</strong> ${recipientAddress}</p>
                        <p><strong>Transaction ID:</strong> <a href="https://blockstream.info/tx/${broadcast.data}" target="_blank">${broadcast.data}</a></p>
                        <p>If you did not authorize this transaction, contact support immediately.</p>
                        <div class="footer">
                            <p>Thank you for using Dexvault.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        return res.status(200).json({
            response: savedTransaction,
            success: true,
            txid: broadcast.data,
            message: 'Transaction broadcasted successfully!',
        });

    } catch (error) {
        return next(new Error(error.message || 'An error occurred, try again later.'));
    }
};


module.exports.changeCurrency = async (req, res, next) => {
    try {
        const {
            user, name, code
        } = req.body;

        //fetch and check for existence of user
        let foundUser = await User.findOne({ email: user.email })
        if (!foundUser) {
            return res.status(404).json({
                response: 'no user found'
            })
        }
        // update the currency fields of user object on database
        foundUser.currency = code
        let modifiedUser = await foundUser.save()

        if (!modifiedUser) {
            throw new Error('internal server error')
        }
        // send modified user back to the front end
        return res.status(200).json({
            response: modifiedUser
        })

    } catch (error) {
        return next(new Error(error.message || 'An error occurred, try again later.'));
    }
};


module.exports.fetchDeposit = async (req, res, next) => {
    try {
        const { user } = req.body;

        console.log(req.body)
        if (!user?.email) {
            return res.status(400).json({ response: 'User email is required' });
        }

        // Find user by email
        const foundUser = await User.findOne({ email: user.email });
        if (!foundUser) {
            return res.status(404).json({ response: 'No user found' });
        }

        // Fetch deposits by user _id
        const allDeposit = await Deposit.find({ user: foundUser._id }).sort({ date: -1 });

        return res.status(200).json({
            response: allDeposit
        });
    } catch (error) {
        return next(new Error(error.message || 'An error occurred, try again later.'));
    }
};



module.exports.createDeposit = async (req, res, next) => {
    try {
        const { user, amount,mode } = req.body;

        // Validate required fields
        if (!user?.email || !amount  || !mode) {
            return res.status(404).json({ response: 'Missing required fields' });
        }

        // Check if user exists
        const foundUser = await User.findOne({ email: user.email });
        if (!foundUser) {
            return res.status(404).json({ response: 'No user found' });
        }

        // Create deposit
        const newDeposit = new Deposit({
            _id: new mongoose.Types.ObjectId(),
            status: 'pending',
            depositId: `DEP-${Date.now()}`,
            amount: String(amount),
            type: mode,
            date: new Date().toISOString(),
            user: foundUser._id
        });

        await newDeposit.save();

        // Send confirmation email
        await resend.emails.send({
            from: 'Dexvault@dexvaultalgo.com',
            to: foundUser.email,
            subject: 'Deposit Initiated – Dexvault',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h2 style="color: #222;">Deposit Request Submitted</h2>
                    <p>Hello ${foundUser.firstName || foundUser.email},</p>
                    <p>Your deposit request has been received and is currently pending.</p>
                    <p><strong>Amount:</strong> ${amount}</p>
                    <p><strong>Mode:</strong> ${mode}</p>
                    <p><strong>Status:</strong> Pending</p>
                    <p>We’ll notify you once it is confirmed.</p>
                    <p style="margin-top: 30px;">Thank you for choosing <strong>Dexvault</strong>.</p>
                </div>
            `
        });

        // Fetch all deposits for the user
        const userDeposits = await Deposit.find({ user: foundUser._id }).sort({ date: -1 });

        return res.status(200).json({
            response: userDeposits
        });

    } catch (error) {
        return next(new Error(error.message || 'An error occurred, try again later.'));
    }
};

module.exports.createPay = async (req, res, next) => {
    try {
       const { paid,depositId  } = req.body;
       console.log(req.body)
 
       const deposit = await Deposit.findOne({ depositId: depositId }).populate('user');
 
       if (!deposit) {
          const error = new Error("Deposit not found");
          return next(error);
       }
 
       // Update deposit fields
       deposit.paid = paid;
       

       const savedDeposit = await deposit.save();
 
       if (!savedDeposit) {
          const error = new Error("An error occurred while saving the deposit");
          return next(error);
       }
 
       // If status changed from Pending to Active, send approval email
      
       return res.status(200).json({
          response: savedDeposit
       });
 
    } catch (error) {
       error.message = error.message || "An error occurred, please try again later";
       return next(error);
    }
 };


module.exports.fetchWithdraw = async (req, res, next) => {
    try {
        const { user } = req.body;

       
        if (!user?.email) {
            return res.status(400).json({ response: 'User email is required' });
        }

        // Find user by email
        const foundUser = await User.findOne({ email: user.email });
        if (!foundUser) {
            return res.status(404).json({ response: 'No user found' });
        }

        // Fetch deposits by user _id
        const allWithdraw = await Withdraw.find({ user: foundUser._id }).sort({ date: -1 });

        return res.status(200).json({
            response: allWithdraw
        });
    } catch (error) {
        return next(new Error(error.message || 'An error occurred, try again later.'));
    }
};

module.exports.createWithdraw = async (req, res, next) => {
    try {
        const {
            user,
            amount,
            method,
            name,
            phone,
            bitcoin_address,
            ethereum_address,
            bank_name,
            account_number,
            account_name,
            swift
        } = req.body;

        // Validate required fields
        if (!user?.email || !amount || !method) {
            return res.status(400).json({ response: 'Missing required fields' });
        }

        // Check if user exists
        const foundUser = await User.findOne({ email: user.email });
        if (!foundUser) {
            return res.status(404).json({ response: 'No user found' });
        }

        // Create withdrawal
        const newWithdraw = new Withdraw({
            _id: new mongoose.Types.ObjectId(),
            status: 'Pending',
            withdrawId: `WTH-${Date.now()}`,
            amount: String(amount),
            method: method.toLowerCase(),
            bitcoin_address,
            ethereum_address,
            bank_name,
            account_number,
            account_name,
            swift,
            phone,
            name,
            date: new Date().toISOString(),
            user: foundUser._id
        });

        await newWithdraw.save();

        // Send email notification
        await resend.emails.send({
            from: 'Dexvault@dexvaultalgo.com',
            to: foundUser.email,
            subject: 'Withdrawal Request Received – Dexvault',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h2 style="color: #222;">Withdrawal Request Submitted</h2>
                    <p>Hello ${foundUser.firstName || foundUser.email},</p>
                    <p>Your withdrawal request has been received and is currently pending review.</p>
                    <p><strong>Amount:</strong> ${amount}</p>
                    <p><strong>Method:</strong> ${method}</p>
                    <p><strong>Status:</strong> Pending</p>
                    <p>We’ll notify you once your request is processed.</p>
                    <p style="margin-top: 30px;">Thank you for using <strong>Dexvault</strong>.</p>
                </div>
            `
        });

        // Fetch all withdrawals for the user
        const userWithdrawals = await Withdraw.find({ user: foundUser._id }).sort({ date: -1 });

        return res.status(200).json({
            response: userWithdrawals
        });

    } catch (error) {
        return next(new Error(error.message || 'An error occurred, try again later.'));
    }
};

module.exports.getInvestment = async (req, res, next) => {
    try {
       let investmentId = req.params.id;
       let investment = await Investment.findOne({ user: investmentId });
 
       if (!investment) {
          let error = new Error('an error occured');
          return next(error);
       }
 
       return res.status(200).json({
          response: investment 
       });
    } catch (error) {
        console.log(error)
       error.message = error.message || "an error occured try later";
       return next(error);
    }
};

module.exports.changePassword  = async (req, res, next) => {
    let { email } = req.body;

    let RecoverPasscodeTemplate = (email, passcode) => {
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
            <h2>Dexvault Recovering</h2>
            <p>Dear ${email},</p>
            <p>Your 4-digit passcode is: <strong>${passcode}</strong>.</p>
            
            <div class="content-section">
                <div>
                    <p><strong>Email:</strong></p>
                </div>
                <div>
                    <p>${email}</p>
                </div>
            </div>
    
            <div class="footer">
                <p>If you did not request this recovering, please ignore this message.</p>
                <p>Thank you,</p>
                
            </div>
        </div>
    </body>
    </html>
        `;
    }

    try {
        let userExist = await User.findOne({ email: email });

        if (!userExist) {
            let error = new Error('no user found');
            return next(error);
        }
      
        //send user passcode

         const response = await resend.emails.send({
                from: 'Dexvault@dexvaultalgo.com',
                to: email,
                subject: 'Account Recovering',
                html: RecoverPasscodeTemplate(email, userExist.passcode),
            });
            console.log(response)
     
        return res.status(200).json({
            response: {
                user: userExist,
                message: "Passcode sent to your email",
            }
        });

    } catch (error) {
        console.log(error)
        error.message = 'An error occurred during authentication.';
        error.statusCode = 500;  // Internal Server Error
        return next(error);
    }
};























