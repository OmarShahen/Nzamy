const mongoose = require("mongoose");
const config = require("../config/config");

const LoyaltyTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, required: true },
    storeId: { type: mongoose.Types.ObjectId, required: true },
    customerId: { type: mongoose.Types.ObjectId, required: true },
    type: { 
      type: String, 
      required: true, 
      enum: config.LOYALTY_TRANSACTION_TYPES 
    },
    orderId: { type: mongoose.Types.ObjectId },
    points: { type: Number, required: true },
    reason: { 
      type: String, 
      required: true, 
      enum: config.LOYALTY_TRANSACTION_REASONS 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoyaltyTransaction", LoyaltyTransactionSchema);