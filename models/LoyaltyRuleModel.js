const mongoose = require("mongoose");
const config = require("../config/config");

const LoyaltyRuleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, required: true },
    storeId: { type: mongoose.Types.ObjectId, required: true },
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    multiplier: { type: Number, default: 1 },
    pointsAwarded: { type: Number, required: true },
    actionType: { 
      type: String, 
      required: true, 
      enum: config.LOYALTY_RULE_ACTION_TYPES 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoyaltyRule", LoyaltyRuleSchema);