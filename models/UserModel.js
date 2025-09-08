const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, unique: true },
    firstName: { type: String },
    email: { type: String, required: true },
    phone: { type: String },
    password: { type: String },
    imageURL: { type: String },

    isGoogle: { type: Boolean, default: false },
    isFacebook: { type: Boolean, default: false },

    googleId: { type: Number },
    facebookId: { type: Number },

    roles: [],

    isVerified: { type: Boolean, required: true, default: false },
    isBlocked: { type: Boolean, default: false },
    isDeactivated: { type: Boolean, default: false },
    lastLoginDate: { type: Date },

    resetPassword: {
      verificationCode: { type: Number },
      expirationDate: { type: Date },
    },
    deleteAccount: {
      verificationCode: { type: Number },
      expirationDate: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
