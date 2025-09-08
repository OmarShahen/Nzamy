const mongoose = require("mongoose");
const config = require("../config/config");

const SubscriptionSchema = new mongoose.Schema(
  {
    subscriptionId: { type: Number, required: true },
    userId: { type: mongoose.Types.ObjectId, required: true },
    planId: { type: mongoose.Types.ObjectId, required: true },
    paymentId: { type: mongoose.Types.ObjectId },
    status: { type: String, required: true, enum: config.SUBSCRIPTION_STATUS },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    tokensLimit: { type: Number, required: true, default: 0 },
    tokensUsed: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", SubscriptionSchema);
