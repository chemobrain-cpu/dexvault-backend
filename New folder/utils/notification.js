
const admin = require('firebase-admin');
const { User, Notification } = require('../database/database');
const mongoose = require('mongoose');
const path = require('path');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('../service.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

/**
 * Send a notification to a specific user via their FCM token
 * @param {string} token - The FCM token to send the notification to
 * @param {object} notification - The notification payload { title, body, imageUrl }
 * @param {object} data - Optional data payload to send with the notification
 * @returns {Promise} - A promise that resolves with the messaging response
 */
const sendNotification = async (token, notification, data = {}) => {
  try {
    if (!token) {
      throw new Error('FCM token is required');
    }

    const message = {
      notification: {
        title: notification.title || 'Dexvault',
        body: notification.body || '',
      },
      data: data,
      token: token
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send a welcome notification to a user
 * @param {string} token - The user's FCM token
 * @param {string} name - The user's name or email
 * @returns {Promise} - A promise with the notification result
 */
const sendWelcomeNotification = async (token, name) => {
  return await sendNotification(token, {
    title: 'Welcome to Dexvault!',
    body: `Hello ${name}. Thank you for logging in. Enjoy secure access to your digital assets and crypto services.`
  });
};

/**
 * Send a transaction notification
 * @param {string} token - The user's FCM token
 * @param {string} type - Transaction type (sent, received, deposit, withdraw)
 * @param {string} amount - The transaction amount
 * @param {string} currency - The currency code or name
 * @returns {Promise} - A promise with the notification result
 */
const sendTransactionNotification = async (token, type, amount, currency) => {
  let title, body;

  switch (type.toLowerCase()) {
    case 'sent':
      title = 'Transaction Sent';
      body = `You've successfully sent ${amount} ${currency}.`;
      break;
    case 'received':
      title = 'Funds Received';
      body = `You've received ${amount} ${currency}.`;
      break;
    case 'deposit':
      title = 'Deposit Initiated';
      body = `Your deposit of ${amount} ${currency} has been initiated.`;
      break;
    case 'deposit_confirmed':
      title = 'Deposit Confirmed';
      body = `Your deposit of ${amount} ${currency} has been confirmed.`;
      break;
    case 'withdraw':
      title = 'Withdrawal Requested';
      body = `Your withdrawal request for ${amount} ${currency} has been submitted.`;
      break;
    case 'withdraw_processed':
      title = 'Withdrawal Processed';
      body = `Your withdrawal of ${amount} ${currency} has been processed.`;
      break;
    default:
      title = 'Transaction Update';
      body = `Your ${type} transaction of ${amount} ${currency} has been updated.`;
  }

  return await sendNotification(token, { title, body });
};

/**
 * Send a security notification
 * @param {string} token - The user's FCM token
 * @param {string} type - Security event type (login, password_change, etc.)
 * @param {object} details - Additional details
 * @returns {Promise} - A promise with the notification result
 */
const sendSecurityNotification = async (token, type, details = {}) => {
  let title, body;

  switch (type.toLowerCase()) {
    case 'login':
      title = 'New Login Detected';
      body = `A new login to your account was detected from ${details.device || 'a new device'}.`;
      break;
    case 'password_change':
      title = 'Password Changed';
      body = 'Your password has been successfully changed.';
      break;
    case 'profile_update':
      title = 'Profile Updated';
      body = 'Your profile information has been updated.';
      break;
    default:
      title = 'Security Alert';
      body = `A security event has occurred on your account: ${type}`;
  }

  return await sendNotification(token, { title, body });
};

/**
 * Store a notification in the database
 * @param {string} userId - The user's ID
 * @param {string} title - Notification title
 * @param {string} text - Notification text/body
 * @param {string} topic - Category of notification
 * @returns {Promise} - The saved notification document
 */
const storeNotification = async (userId, title, text, topic = 'general') => {
  try {
    // Create notification in database
    const newNotification = new Notification({
      _id: new mongoose.Types.ObjectId(),
      topic: topic,
      text: text,
      notification: title,
      user: userId,
      date: new Date()
    });

    return await newNotification.save();
  } catch (error) {
    console.error('Error storing notification:', error);
    return null;
  }
};

/**
 * Send a notification to user and store in database
 * @param {Object} user - User object with _id and fcmToken fields
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {string} topic - Category of notification
 * @param {Object} data - Additional data for the notification
 * @returns {Promise} - Result object with success status
 */
const notifyUser = async (user, title, body, topic = 'general', data = {}) => {
  try {
    if (!user) {
      throw new Error('User object is required');
    }

    const results = { fcm: null, db: null };

    // Send FCM notification if token exists
    if (user.fcmToken) {
      results.fcm = await sendNotification(user.fcmToken, { title, body }, data);
    }

    // Store in database regardless of FCM result
    results.db = await storeNotification(
      user._id,
      title,
      body,
      topic
    );

    return {
      success: true,
      message: 'Notification processed',
      results
    };
  } catch (error) {
    console.error('Failed to notify user:', error);
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

// Export functions
module.exports = {
  sendNotification,
  sendWelcomeNotification,
  sendTransactionNotification,
  sendSecurityNotification,
  storeNotification,
  notifyUser
};

