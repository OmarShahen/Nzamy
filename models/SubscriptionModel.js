const mongoose = require("mongoose");
const config = require("../config/config");
const CounterModel = require("./CounterModel");

const SubscriptionSchema = new mongoose.Schema(
  {
    subscriptionId: { type: Number },
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

SubscriptionSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await CounterModel.findOneAndUpdate(
        { name: `subscription` },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      this.subscriptionId = counter.value;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);
