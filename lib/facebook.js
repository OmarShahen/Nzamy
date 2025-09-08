const axios = require("axios");
const config = require("../config/config");

const facebookRequest = axios.create({
  baseURL: "https://graph.facebook.com/v18.0/me/messages",
  params: {
    access_token: config.FACEBOOK.PAGE_ACCESS_TOKEN,
  },
  headers: {
    "Content-Type": "application/json",
  },
});

module.exports = { facebookRequest };
