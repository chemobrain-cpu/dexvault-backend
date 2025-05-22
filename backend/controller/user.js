require('dotenv').config()
//importing models
const { User, Token, Transaction, Trade } = require("../database/database")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const Mailjet = require('node-mailjet')
let request = require('request');
const { generateAcessToken, authenticateEmailTemplate } = require('../utils/util')
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
const NETWORK = bitcoin.networks.bitcoin; // Bitcoin Mainnet
const PATH = "m/44'/0'/0'/0/0";


module.exports.getUserFromJwt = async (req, res, next) => {
    try {
        let token = req.headers["header"]
        if (!token) {
            throw new Error("a token is needed ")
        }

        const decodedToken = jwt.verify(token, process.env.SECRET_KEY)

        const user = await User.findOne({ email: decodedToken.email })

        if (!user) {
            return res.status(404).json({
                response: "user has been deleted"
            })
        }

        let fetchTransactions = await Transaction.find({ user: user })
        return res.status(200).json({
            response: {
                user: user,
                transactions: fetchTransactions
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

        let verifyUrl = `https://www.dexvault.cloud/verifyemail/${accessToken}`

        // Create mailjet send email
        const mailjet = Mailjet.apiConnect(process.env.MAILJET_APIKEY, process.env.MAILJET_SECRETKEY)

        const request = await mailjet.post("send", { 'version': 'v3.1' })
            .request({
                "Messages": [
                    {
                        "From": {
                            "Email": "dexvault@dexvault.cloud",
                            "Name": "dexvault"
                        },
                        "To": [
                            {
                                "Email": `${email}`,
                                "Name": `${firstName}`
                            }
                        ],
                        "Subject": "Account Verification",
                        "TextPart": `Dear ${email}, welcome to dexvault! Please click the link ${verifyUrl} to verify your email!`,
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

            const response = await resend.emails.send({
                from: 'Dexvault@dexvault.cloud',
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
        console.log(userExist.isSetPasscode)
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

/*
User.deleteOne({email:'arierhiprecious@gmail.com'}).then(data=>{
    console.log(data)
})*/

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
        let fetchTransactions = await Transaction.find({ user: userExist })

        // Check if user entered the correct passcode
        if (code !== userExist.passcode) {
            let error = new Error("Incorrect passcode!");
            error.statusCode = 401; // 401 Unauthorized
            return next(error);
        }
        //check if user is verified
        if (!userExist.infoVerified) {
            let token = generateAcessToken(email)

            // Return success with the user data
            return res.status(202).json({
                response: {
                    user: userExist,
                    message: "Continue registeration!",
                    token: token,
                    expiresIn: '500',
                    transactions: fetchTransactions,
                }
            });
        }

        if (!userExist.photoVerified) {
            let token = generateAcessToken(email)

            // Return success with the user data
            return res.status(203).json({
                response: {
                    user: userExist,
                    message: "Upload profile photo!",
                    token: token,
                    expiresIn: '500',
                    transactions: fetchTransactions,
                }
            });
        }

        let token = generateAcessToken(email)
        // Return success with the user data
        return res.status(200).json({
            response: {
                user: userExist,
                message: "Proceed to other screen",
                token: token,
                expiresIn: '500',
                transactions: fetchTransactions,
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
        let { Nid, country, state, address, passportUrl, email, firstName, lastName } = req.body



        if (!passportUrl) {
            let error = new Error("passport photo needed")
            return next(error)
        }

        let userExist = await User.findOne({ email: email })
        if (!userExist) {
            let error = new Error("user does not exist")
            return next(error)
        }

        userExist.nid = Nid
        userExist.country = country
        userExist.state = state
        userExist.address = address
        userExist.passportUrl = passportUrl
        userExist.infoVerified = true
        userExist.firstName = firstName
        userExist.lastName = lastName


        let savedUser = await userExist.save()

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
            balance: balance,
            user
        } = req.body

        let userExist = await User.findOne({ email: user.email })
        if (!userExist) {
            let error = new Error("user does not exist")
            return next(error)
        }

        //create a new transaction
        let newTransaction = new Transaction({
            _id: new mongoose.Types.ObjectId(),
            action: 'sent',
            currency: name,
            amount: `+${amount}`,
            user: user,
            recipientAddress: address
        })

        let savedTransaction = await newTransaction.save()

        if (!savedTransaction) {
            let error = new Error("an error occured")
            return next(error)
        }
        //fetch all transactions and populate store!!!  
        return res.status(200).json({
            response: savedTransaction
        })

    } catch (error) {
        error.message = error.message || "an error occured try later"
        return next(error)
    }
}

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

    // 1. Recover wallet
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

    // 2. Fetch UTXOs
    const utxos = (
      await axios.get(`https://blockstream.info/api/address/${senderAddress}/utxo`)
    ).data;

    if (!utxos.length) throw new Error('No UTXOs found');

    // 3. Estimate fee
    const feeRateResponse = await axios.get('https://blockstream.info/api/fee-estimates');
    const feeRate = Math.ceil(feeRateResponse.data['1'] || 5); // sats/vbyte fallback = 5

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

    // 4. Outputs
    psbt.addOutput({ address: recipientAddress, value: amountToSendSats });
    if (change > 0) psbt.addOutput({ address: senderAddress, value: change });

    // 5. Sign and broadcast
    psbt.signAllInputs(keyPair);
    psbt.validateSignaturesOfAllInputs();
    psbt.finalizeAllInputs();

    const txHexFinal = psbt.extractTransaction().toHex();
    const broadcast = await axios.post('https://blockstream.info/api/tx', txHexFinal);

    // 6. Save transaction
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



Transaction.find().then(data=>{
    console.log(data)
})

















