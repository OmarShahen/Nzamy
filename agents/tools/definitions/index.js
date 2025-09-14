const searchItems = require('./searchItems');
const sendOrderByEmail = require('./sendOrderByEmail');
const getStoreShippingPolicy = require('./getStoreShippingPolicy');
const getStoreRefundPolicy = require('./getStoreRefundPolicy');
const getStorePaymentOptions = require('./getStorePaymentOptions');
const searchCategories = require('./searchCategories');
const searchItemsByImage = require('./searchItemsByImage');
const sendImageToFacebookUser = require('./sendImageToFacebookUser');

module.exports = [
  searchItems,
  sendOrderByEmail,
  getStoreShippingPolicy,
  getStoreRefundPolicy,
  getStorePaymentOptions,
  searchCategories,
  searchItemsByImage,
  sendImageToFacebookUser
];