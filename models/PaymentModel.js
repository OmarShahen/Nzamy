const mongoose = require("mongoose");
const config = require("../config/config");

const PaymentSchema = new mongoose.Schema(
  {
    paymentId: { type: Number, required: true },
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

module.exports = mongoose.model("Payment", PaymentSchema);
