const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    duration: { type: Number, required: true },
    tokensLimit: { type: Number, required: true },
    features: [{ type: String, required: true }],
    isActive: { type: Boolean, required: true, default: true },
    isPopular: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", PlanSchema);
