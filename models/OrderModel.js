const mongoose = require("mongoose");
const config = require("../config/config");

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: Number, required: true },
    userId: { type: mongoose.Types.ObjectId, required: true },
    storeId: { type: mongoose.Types.ObjectId, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, default: "PENDING", enum: config.STATUS_VALUES },
    refundDate: { type: Date },
    paymentMethod: {
      type: String,
      default: "CASH",
      enum: config.PAYMENT_METHODS,
    },
    items: [],
    shipping: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
