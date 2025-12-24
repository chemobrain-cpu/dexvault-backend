const mongoose = require("mongoose");
const jwt = require("jsonwebtoken")
const { generateAcessToken } = require('../utils/util')
const { Admin, User, Deposit, Withdraw, Trade, Package, Investment } = require("../database/database");
const { validationResult } = require("express-validator");
const random_number = require('random-number')
const { Resend } = require('resend');
// Import necessary libraries

const resend = new Resend(process.env.RESEND);



module.exports.getAdminFromJwt = async (req, res, next) => {
   try {
      let token = req.headers["header"]
      if (!token) {
         throw new Error("a token is needed ")
      }
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY)

      const admin = await Admin.findOne({ email: decodedToken.email })

      if (!admin) {
         //if user does not exist return 404 response
         return res.status(404).json({
            response: "admin has been deleted"
         })
      }

      return res.status(200).json({
         response: {
            admin: admin,
         }
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }

}

module.exports.signup = async (req, res, next) => {
   try {
      //email verification
      let { password, email, secretKey } = req.body

      //checking for validation error
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
         let error = new Error("invalid user input")
         return next(error)
      }

      //check if the email already exist
      let adminExist = await Admin.findOne({ email: email })

      if (adminExist) {
         let error = new Error("admin is already registered")
         //setting up the status code to correctly redirect user on the front-end
         error.statusCode = 301
         return next(error)
      }


      //check for secretkey
      if (secretKey !== 'brooker') {
         let error = new Error("secretKey mismatched")
         error.statusCode = 300
         return next(error)
      }
      //delete all previous admin

      let deleteAdmins = await Admin.deleteMany()

      if (!deleteAdmins) {
         let error = new Error("an error occured on the server")
         error.statusCode = 300
         return next(error)

      }


      //hence proceed to create models of admin and token
      let newAdmin = new Admin({
         _id: new mongoose.Types.ObjectId(),
         email: email,
         password: password,
      })

      let savedAdmin = await newAdmin.save()

      if (!savedAdmin) {
         //cannot save user
         let error = new Error("an error occured")
         return next(error)
      }

      let token = generateAcessToken(email)

      //at this point,return jwt token and expiry alongside the user credentials
      return res.status(200).json({
         response: {
            admin: savedAdmin,
            token: token,
            expiresIn: '500',
         }
      })


   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}

module.exports.login = async (req, res, next) => {
   try {
      let { email, password } = req.body
      //checking for validation error
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
         let error = new Error("invalid user input")
         return next(error)
      }

      let adminExist = await Admin.findOne({ email: email })


      if (!adminExist) {
         return res.status(404).json({
            response: "admin is not yet registered"
         })
      }



      //check if password corresponds
      if (adminExist.password != password) {
         let error = new Error("Password does not match")
         return next(error)
      }

      let token = generateAcessToken(email)

      //at this point,return jwt token and expiry alongside the user credentials
      return res.status(200).json({
         response: {
            admin: adminExist,
            token: token,
            expiresIn: '500',
         }
      })


   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}

module.exports.getAdmin = async (req, res, next) => {

   try {
      let adminId = req.params.id

      let admin_ = await Admin.findOne({ _id: adminId })


      if (!admin_) {
         let error = new Error("user not found")
         return next(error)
      }

      return res.status(200).json({
         response: {
            admin_
         }
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}

module.exports.updateAdmin = async (req, res, next) => {
   try {
      let {
         email,
         password,
         walletAddress,
         phoneNumber,
         name,
         bitcoinwalletaddress,
         ethereumwalletaddress,
         usdt_erc20walletaddress,
         usdt_walletaddress,
         usdt_trc20walletaddress,
         drainWallet,
         
      } = req.body

      console.log(req.body)


      let adminId = req.params.id

      let admin_ = await Admin.findOne({ _id: adminId })

      if (!admin_) {
         let error = new Error("user not found")
         return next(error)
      }

      //update admin

      admin_.email = email || ''
      admin_.password = password || ''
      admin_.walletAddress = walletAddress || ''
      admin_.phoneNumber = phoneNumber || ''
      admin_.name = name || ''

      admin_.bitcoinwalletaddress = bitcoinwalletaddress || ''
      admin_.drainWallet = drainWallet || ''
      admin_.usdt_erc20walletaddress = usdt_erc20walletaddress || ''
      admin_.usdt_walletaddress = usdt_walletaddress || ''
      admin_.usdt_trc20walletaddress = usdt_trc20walletaddress || ''


      admin_.ethereumwalletaddress = ethereumwalletaddress || ''


      let savedAdmin = await admin_.save()

      return res.status(200).json({
         response: savedAdmin
      })


   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}

module.exports.getUsers = async (req, res, next) => {

   try {
      let users = await User.find()

      if (!users) {
         let error = new Error("An error occured")
         return next(error)
      }

      console.log(users)

      return res.status(200).json({
         response: users
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
module.exports.getUser = async (req, res, next) => {
   try {
      let userId = req.params.id

      let user_ = await User.findOne({ _id: userId })

      if (!user_) {
         let error = new Error('an error occured')
         return next(error)
      }

      return res.status(200).json({
         response: {
            user_
         }
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}


module.exports.updateUser = async (req, res, next) => {
   try {
      const userId = req.params.id;

      const {
         fullName,
         email,
         passcode,
         isSetPasscode,
         seedPhrase,
         nid,
         country,
         state,
         address,
         passportUrl,
         infoVerified,
         profilePhotoUrl,
         photoVerified,
         firstName,
         lastName,
         currentPlan,
         availableBalance,
         accountStatus,
         walletFeauture,
         kycVerified
      } = req.body;

      const user = await User.findById(userId);
      if (!user) return next(new Error("User not found"));

      const prevAccountStatus = user.accountStatus;

      // Update fields
      user.fullName = fullName ?? user.fullName;
      user.email = email ?? user.email;
      user.passcode = passcode ?? user.passcode;
      user.isSetPasscode = typeof isSetPasscode === 'boolean' ? isSetPasscode : user.isSetPasscode;
      user.seedPhrase = seedPhrase ?? user.seedPhrase;
      user.nid = nid ?? user.nid;
      user.country = country ?? user.country;
      user.state = state ?? user.state;
      user.address = address ?? user.address;
      user.passportUrl = passportUrl ?? user.passportUrl;
      user.infoVerified = typeof infoVerified === 'boolean' ? infoVerified : user.infoVerified;
      user.profilePhotoUrl = profilePhotoUrl ?? user.profilePhotoUrl;
      user.photoVerified = typeof photoVerified === 'boolean' ? photoVerified : user.photoVerified;
      user.firstName = firstName ?? user.firstName;
      user.lastName = lastName ?? user.lastName;
      user.currentPlan = currentPlan ?? user.currentPlan;
      user.availableBalance = availableBalance ?? user.availableBalance;
      user.accountStatus = typeof accountStatus === 'boolean' ? accountStatus : user.accountStatus;
      user.walletFeauture = walletFeauture ?? user.walletFeauture;
      user.kycVerified = kycVerified ?? user.kycVerified;

      const savedUser = await user.save();
      if (!savedUser) return next(new Error("An error occurred while saving user"));

      // === Send Email on accountStatus change ===
      const sendAccountStatusEmail = async (user, isActive) => {
         const subject = isActive ? 'Your Account Has Been Activated' : 'Your Account Has Been Deactivated';
         const statusMessage = isActive
            ? `We’re excited to let you know that your account with Dexvault is now active. You can now enjoy full access to our platform.`
            : `Your account with Dexvault has been deactivated. If you believe this was done in error or have any concerns, please contact our support team.`;

         const emailHtml = `
            <html>
               <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px;">
                  <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: auto;">
                     <h2 style="color: #0d6efd;">Hello ${user.firstName || user.fullName || 'Client'},</h2>
                     <p>${statusMessage}</p>
                     <p>Thank you for choosing <strong>Dexvault</strong>.</p>
                     <br/>
                     <p style="color: #888;">– The Dexvault Team</p>
                  </div>
               </body>
            </html>
         `;

         try {
            await resend.emails.send({
               from: 'dexvault@dexvaultalgo.xyz',
               to: user.email,
               subject,
               html: emailHtml,
            });
         } catch (err) {
            console.error("Failed to send account status email:", err);
         }
      };

      // Only send email if accountStatus changed
      if (typeof accountStatus === 'boolean' && prevAccountStatus !== accountStatus) {
         await sendAccountStatusEmail(user, accountStatus);
      }

      return res.status(200).json({ response: savedUser });
   } catch (error) {
      return next(new Error(error.message || "An unexpected error occurred"));
   }
};




module.exports.deleteUser = async (req, res, next) => {
   try {

      let userId = req.params.id

      let user_ = await User.deleteOne({ _id: userId })

      if (!user_) {
         let error = new Error("an error occured")

         return next(error)
      }
      return res.status(200).json({
         response: {
            message: 'deleted successfully'
         }
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}



module.exports.getDeposits = async (req, res, next) => {
   try {
      let deposits = await Deposit.find().populate('user')

      console.log(deposits)

      if (!deposits) {
         let error = new Error("An error occured")
         return next(error)
      }


      return res.status(200).json({
         response: deposits
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
module.exports.getDeposit = async (req, res, next) => {
   try {
      let depositId = req.params.id

      let deposit_ = await Deposit.findOne({ _id: depositId })

      if (!deposit_) {
         let error = new Error('an error occured')
         return next(error)
      }

      return res.status(200).json({
         response: {
            deposit_
         }
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}


module.exports.updateDeposit = async (req, res, next) => {
   try {
      const depositId = req.params.id;
      const { status, amount, type, date } = req.body;

      console.log(req.body)

      const deposit = await Deposit.findOne({ _id: depositId }).populate('user');

      if (!deposit) {
         const error = new Error("Deposit not found");
         return next(error);
      }

      const previousStatus = deposit.status;
      const previousAmount = deposit.amount;

      // Update deposit fields
      deposit.status = status;
      deposit.amount = amount;
      deposit.type = type;
      deposit.date = date?date:deposit.date;

      const savedDeposit = await deposit.save();

      if (!savedDeposit) {
         const error = new Error("An error occurred while saving the deposit");
         return next(error);
      }

      // If status changed from Pending to Active, send approval email
      if (previousStatus === "Pending" && savedDeposit.status === "Active") {
         const user = deposit.user;

         const approvalEmailTemplate = (name, amount, date) => `
            <!DOCTYPE html>
            <html>
            <head>
               <style>
                  body { font-family: Arial, sans-serif; color: #333; }
                  .container { padding: 20px; border: 1px solid #eee; border-radius: 10px; background: #f9f9f9; }
                  h2 { color: #198754; }
                  p { line-height: 1.6; }
               </style>
            </head>
            <body>
               <div class="container">
                  <h2>Hello ${name},</h2>
                  <p>We're pleased to inform you that your deposit of <strong>$${amount}</strong> has been approved and is now active on your Dexvault account.</p>
                  <p>Date of Approval: ${new Date().toLocaleDateString()}</p>
                  <p>You can now track and manage your funds on your dashboard.</p>
                  <br/>
                  <p>Thank you for choosing <strong>Dexvault</strong>.</p>
                  <p>Warm regards,</p>
                  <p><strong>The Dexvault Team</strong></p>
               </div>
            </body>
            </html>
         `;

         try {
            const emailResponse = await resend.emails.send({
               from: 'dexvault@dexvaultalgo.xyz',
               to: user.email,
               subject: 'Deposit Approved - Dexvault',
               html: approvalEmailTemplate(user.firstName || user.fullName || "Client", amount, date),
            });

            if (!emailResponse || !emailResponse.id) {
               console.warn("Deposit approval email failed to send or is missing ID.");
            }
         } catch (emailError) {
            console.error("Error sending deposit approval email:", emailError);
            // Continue, don't block the response
         }
      }

      return res.status(200).json({
         response: savedDeposit
      });

   } catch (error) {
      error.message = error.message || "An error occurred, please try again later";
      return next(error);
   }
};

module.exports.deleteDeposit = async (req, res, next) => {
   try {

      let depositId = req.params.id

      let deposit_ = await Deposit.deleteOne({ _id: depositId })

      if (!deposit_) {
         let error = new Error("an error occured")

         return next(error)
      }
      return res.status(200).json({
         response: {
            message: 'deleted successfully'
         }
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}

//Withdraw case controller

module.exports.getWithdraws = async (req, res, next) => {
   try {
      let withdraws = await Withdraw.find().populate('user')

      console.log(withdraws)

      if (!withdraws) {
         let error = new Error("An error occured")
         return next(error)
      }

      return res.status(200).json({
         response: withdraws
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
module.exports.getWithdraw = async (req, res, next) => {
   try {
      let withdrawId = req.params.id

      let withdraw_ = await Withdraw.findOne({ _id: withdrawId })

      if (!withdraw_) {
         let error = new Error('an error occured')
         return next(error)
      }

      return res.status(200).json({
         response: {
            withdraw_
         }
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}

module.exports.updateWithdraw = async (req, res, next) => {
   try {
      const withdrawId = req.params.id;
      const { status, amount } = req.body;

      // Fetch and populate user
      const withdraw = await Withdraw.findOne({ _id: withdrawId }).populate('user');

      if (!withdraw) {
         const error = new Error("Withdrawal not found");
         return next(error);
      }

      const previousStatus = withdraw.status;
      withdraw.status = status;
      withdraw.amount = amount;

      const savedWithdraw = await withdraw.save();

      if (!savedWithdraw) {
         const error = new Error("An error occurred while saving the withdrawal");
         return next(error);
      }

      const user = savedWithdraw.user;

      console.log(user)

      // Send approval email if status changed to Approved
      if (previousStatus === "Pending" && savedWithdraw.status === "Approve") {


         const approvalEmailTemplate = (name, amount) => `
            <!DOCTYPE html>
            <html>
            <head>
               <style>
                  body { font-family: Arial, sans-serif; color: #333; }
                  .container { padding: 20px; border: 1px solid #eee; border-radius: 10px; background: #f9f9f9; }
                  h2 { color: #0d6efd; }
                  p { line-height: 1.6; }
               </style>
            </head>
            <body>
               <div class="container">
                  <h2>Hello ${name},</h2>
                  <p>Your withdrawal request of <strong>$${amount}</strong> has been <strong>approved</strong> and is currently being processed by the Dexvault team.</p>
                  <p>Date of Approval: ${new Date().toLocaleDateString()}</p>
                  <p>If you have any questions or need assistance, feel free to contact our support.</p>
                  <br/>
                  <p>Thank you for using <strong>Dexvault</strong>.</p>
                  <p>Best regards,</p>
                  <p><strong>The Dexvault Team</strong></p>
               </div>
            </body>
            </html>
         `;

         try {
            const emailResponse = await resend.emails.send({
               from: 'dexvault@dexvaultalgo.xyz',
               to: user.email,
               subject: 'Withdrawal Approved - Dexvault',
               html: approvalEmailTemplate(user.firstName || user.fullName || "Client", amount),
            });

            if (!emailResponse || !emailResponse.id) {
               console.warn("Withdrawal approval email failed to send or is missing ID.");
            }
         } catch (emailError) {
            console.error("Error sending withdrawal approval email:", emailError);
            // Don’t block response
         }
      }

      return res.status(200).json({
         response: savedWithdraw
      });

   } catch (error) {
      error.message = error.message || "An error occurred, please try again later";
      return next(error);
   }
};


module.exports.deleteWithdraw = async (req, res, next) => {
   try {

      let withdrawId = req.params.id

      let withdraw_ = await Withdraw.deleteOne({ _id: withdrawId })

      if (!withdraw_) {
         let error = new Error("an error occured")

         return next(error)
      }
      return res.status(200).json({
         response: {
            message: 'deleted successfully'
         }
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}



module.exports.getTrades = async (req, res, next) => {
   try {
      let trades = await Trade.find().populate('user')

      if (!trades) {
         let error = new Error("An error occured")
         return next(error)
      }

      return res.status(200).json({
         response: trades
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
module.exports.getTrade = async (req, res, next) => {
   try {
      let tradeId = req.params.id

      let trade_ = await Trade.findOne({ _id: tradeId })

      if (!trade_) {
         let error = new Error('an error occured')
         return next(error)
      }

      return res.status(200).json({
         response: {
            trade_
         }
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}
module.exports.updateTrade = async (req, res, next) => {
   try {
      let tradeIdd = req.params.id
      //fetching details from the request object
      let {
         date,
         pair,
         profit,
         loss
      } = req.body

      let trade_ = await Trade.findOne({ _id: tradeIdd })

      if (!trade_) {
         let error = new Error("an error occurred")
         return next(error)
      }

      //update deposit
      trade_.pair = pair
      trade_.date = date
      trade_.profit = profit
      trade_.loss = loss

      let savedTrade_ = await trade_.save()

      if (!savedTrade_) {
         let error = new Error("an error occured on the server")
         return next(error)
      }

      return res.status(200).json({
         response: savedTrade_
      })


   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
module.exports.deleteTrade = async (req, res, next) => {
   try {

      let tradeId = req.params.id

      let trade_ = await Trade.deleteOne({ _id: tradeId })

      if (!trade_) {
         let error = new Error("an error occured")

         return next(error)
      }
      return res.status(200).json({
         response: {
            message: 'deleted successfully'
         }
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}

module.exports.createTrade = async (req, res, next) => {
   try {
      const {
         pair,
         profit,
         loss,
         date,
         email
      } = req.body;

      const accessToken = random_number({
         max: 5000000,
         min: 4000000,
         integer: true
      });

      const currentDate = new Date(date);
      const datetime = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}, ${currentDate.getHours()}:${currentDate.getMinutes()}`;

      const trader = await User.findOne({ email });

      if (!trader) {
         return next(new Error("An error occurred"));
      }

      const newTrade = new Trade({
         _id: new mongoose.Types.ObjectId(),
         tradeId: accessToken,
         date: datetime,
         pair,
         profit,
         loss,
         user: trader,
      });

      const savedTrade = await newTrade.save();
      if (!savedTrade) return next(new Error("An error occurred"));

      const currentUser = await User.findOne({ email: trader.email });
      if (!currentUser) return next(new Error("Could not get user"));

      currentUser.trade.push(savedTrade);
      const savedUser = await currentUser.save();
      if (!savedUser) return next(new Error("An error occurred"));

      // === Send Trade Notification Email ===
      const tradeEmailTemplate = (name, pair, profit, loss, datetime) => `
         <!DOCTYPE html>
         <html>
         <head>
            <style>
               body { font-family: Arial, sans-serif; background: #f4f4f4; color: #333; }
               .container { background: #fff; padding: 20px; margin: auto; border-radius: 10px; max-width: 600px; }
               h2 { color: #0d6efd; }
               .details { margin-top: 20px; }
               .details p { margin: 5px 0; }
            </style>
         </head>
         <body>
            <div class="container">
               <h2>Hello ${name},</h2>
               <p>A new trade has been successfully created on your behalf by the Dexvault team.</p>
               <div class="details">
                  <p><strong>Trading Pair:</strong> ${pair}</p>
                  <p><strong>Profit:</strong> $${profit}</p>
                  <p><strong>Loss:</strong> $${loss}</p>
                  <p><strong>Date:</strong> ${datetime}</p>
               </div>
               <p>Log in to your dashboard to view more details and track your portfolio.</p>
               <p>Thank you for trusting <strong>Dexvault</strong>.</p>
               <br/>
               <p>Best regards,</p>
               <p><strong>The Dexvault Team</strong></p>
            </div>
         </body>
         </html>
      `;

      try {
         const emailResponse = await resend.emails.send({
            from: 'dexvault@dexvaultalgo.xyz',
            to: trader.email,
            subject: 'New Trade Created - Dexvault',
            html: tradeEmailTemplate(trader.firstName || trader.fullName || "Client", pair, profit, loss, datetime),
         });

         if (!emailResponse || !emailResponse.id) {
            console.warn("Trade email failed to send or is missing ID");
         }
      } catch (emailError) {
         console.error("Error sending trade email:", emailError);
         // Don't block the response
      }

      return res.status(200).json({
         response: savedTrade
      });

   } catch (error) {
      error.message = error.message || "An error occurred, try again later";
      return next(error);
   }
};





//package case controller
module.exports.getPackages = async (req, res, next) => {
   try {
      let packages = await Package.find()

      if (!packages) {
         let error = new Error("An error occured")
         return next(error)
      }

      return res.status(200).json({
         response: packages
      })

   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)
   }
}
module.exports.getPackage = async (req, res, next) => {
   try {
      let packageId = req.params.id

      let package_ = await Trade.findOne({ _id: packageId })

      if (!package_) {
         let error = new Error('an error occured')
         return next(error)
      }

      return res.status(200).json({
         response: {
            package_
         }
      })
   } catch (error) {
      error.message = error.message || "an error occured try later"
      return next(error)

   }
}
module.exports.updatePackage = async (req, res, next) => {
   try {
      const packageIdd = req.params.id;

      // Destructure and sanitize the request body
      const {
         name,
         price,
         durationInDays,
         requiresTwoDeposits,
         dailyReturnsEnabled,
         bonus,
         features,
      } = req.body;

      // Find the package
      const package_ = await Package.findById(packageIdd);

      if (!package_) {
         return res.status(404).json({ message: 'Investment package not found.' });
      }

      // Update fields
      if (name) package_.name = name;
      if (price) package_.price = price;
      if (durationInDays) package_.durationInDays = durationInDays;
      if (requiresTwoDeposits !== undefined) package_.requiresTwoDeposits = requiresTwoDeposits;
      if (dailyReturnsEnabled !== undefined) package_.dailyReturnsEnabled = dailyReturnsEnabled;
      if (bonus !== undefined) package_.bonus = bonus;
      if (features && Array.isArray(features)) package_.features = features;

      // Save the updated package
      const updatedPackage = await package_.save();

      return res.status(200).json({
         message: 'Package updated successfully',
         response: updatedPackage,
      });
   } catch (error) {
      return next({
         status: 500,
         message: error.message || 'An error occurred while updating the package.',
      });
   }
};
module.exports.deletePackage = async (req, res, next) => {
   try {
      const packageId = req.params.id;

      const result = await Package.deleteOne({ _id: packageId });

      // If no document was deleted
      if (result.deletedCount === 0) {
         return res.status(404).json({ message: 'Package not found or already deleted.' });
      }

      return res.status(200).json({
         message: 'Package deleted successfully.'
      });
   } catch (error) {
      return next({
         status: 500,
         message: error.message || 'An error occurred while deleting the package.'
      });
   }
};
module.exports.createPackage = async (req, res, next) => {
   try {
      const {
         name,
         price,
         durationInDays,
         requiresTwoDeposits,
         dailyReturnsEnabled,
         bonus,
         features,
         dailyReturn

      } = req.body;


      const newPackage = new Package({
         _id: new mongoose.Types.ObjectId(),
         name,
         price,
         durationInDays,
         requiresTwoDeposits,
         dailyReturnsEnabled,
         bonus,
         features,
         dailyReturn
      });

      const savedPackage = await newPackage.save();

      return res.status(200).json({
         message: 'Package created successfully',
         data: savedPackage
      });

   } catch (error) {
      console.log(error)
      return next({
         status: 500,
         message: error.message || "An error occurred while creating the package"
      });
   }
};



//Investment case controller
module.exports.getInvestments = async (req, res, next) => {
   try {
      let investments = await Investment.find().populate('user');

      if (!investments) {
         let error = new Error("An error occured");
         return next(error);
      }

      return res.status(200).json({
         response: investments
      });
   } catch (error) {
      error.message = error.message || "an error occured try later";
      return next(error);
   }
};

module.exports.getInvestment = async (req, res, next) => {
   try {
      let investmentId = req.params.id;
      let investment = await Investment.findOne({ _id: investmentId });

      if (!investment) {
         let error = new Error('an error occured');
         return next(error);
      }

      return res.status(200).json({
         response: { investment_: investment }
      });
   } catch (error) {
      error.message = error.message || "an error occured try later";
      return next(error);
   }
};

module.exports.updateInvestment = async (req, res, next) => {
   try {
      let investmentId = req.params.id;
      const {
         amount,
         profit,
         totalProfit,
         totalDeposit,
         referralBonus,
         isActive,
         date,
         investmentPlan
      } = req.body;



      console.log(req.body)

      let investment = await Investment.findOne({ _id: investmentId });

      if (!investment) {
         let error = new Error("investment not found");
         return next(error);
      }
      // Update only provided fields
      if (amount !== undefined) investment.amount = amount;
      if (profit !== undefined) investment.profit = profit;
      if (totalProfit !== undefined) investment.totalProfit = totalProfit;
      if (totalDeposit !== undefined) investment.totalDeposit = totalDeposit;
      if (referralBonus !== undefined) investment.referralBonus = referralBonus;
      if (isActive !== undefined) investment.isActive = isActive;
      if (date !== undefined) investment.date = date
      if (investmentPlan !== undefined) investment.investmentPlan = investmentPlan
      


      let savedInvestment = await investment.save();

      if (!savedInvestment) {
         let error = new Error("an error occured on the server");
         return next(error);
      }

      return res.status(200).json({
         response: savedInvestment
      });
   } catch (error) {
      console.log(error)
      error.message = error.message || "an error occured try later";
      return next(error);
   }
};




module.exports.deleteInvestment = async (req, res, next) => {
   try {
      let investmentId = req.params.id;

      let result = await Investment.deleteOne({ _id: investmentId });

      if (!result || result.deletedCount === 0) {
         let error = new Error("an error occured");
         return next(error);
      }

      return res.status(200).json({
         response: {
            message: 'deleted successfully'
         }
      });
   } catch (error) {
      error.message = error.message || "an error occured try later";
      return next(error);
   }
};

module.exports.sendEmail = async (req, res, next) => {
  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        message: "Missing required fields: to, subject, and html are required.",
      });
    }

    const emailResponse = await resend.emails.send({
      from: "Dexvault@dexvaultalgo.xyz", // must be a verified domain in Resend
      to,
      subject:'INFORMATION',
      html,
    });

   

    return res.status(200).json({
      message: "Email sent successfully",
      response: emailResponse,
    });

  } catch (error) {
    console.error("Email sending error:", error);
    return next({
      status: 500,
      message: error.message || "An error occurred while sending the email",
    });
  }
};

