const mongoose = require("mongoose");
const config = require("../config/config");
const CounterModel = require("./CounterModel");

const PaymentSchema = new mongoose.Schema(
  {
    paymentId: { type: Number },
    userId: { type: mongoose.Types.ObjectId, required: true },
    transactionId: { type: String, required: true },
    status: { type: String, required: true, enum: config.PAYMENT_STATUS },
    gateway: { type: String, required: true },
    method: { type: String },
    orderId: { type: Number },
    amountCents: { type: Number, required: true },
    currency: { type: String, default: "EGP" },
    refundDate: { type: Date },
  },
  { timestamps: true }
);

PaymentSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await CounterModel.findOneAndUpdate(
        { name: `payment` },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      this.paymentId = counter.value;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model("Payment", PaymentSchema);
