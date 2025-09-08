const mongoose = require("mongoose");
const config = require("../config/config");
const CounterModel = require("./CounterModel");

const StoreSchema = new mongoose.Schema(
  {
    storeId: { type: Number, required: true },
    userId: { type: mongoose.Types.ObjectId, required: true },
    facebookId: { type: Number },
    instagramId: { type: Number },
    whatsappId: { type: Number },
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: config.STORE_CATEGORY_VALUES,
    },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    description: { type: String, required: true },
    notes: { type: String },
    paymentMethods: [],
    currency: { type: String },

    assistance: {
      name: { type: String },
      persona: { type: String },
      languages: ["ARABIC", "ENGLISH"],
      instructions: { type: String },
    },

    // References to separate policy models
    shippingPolicyId: { type: mongoose.Types.ObjectId, ref: "ShippingPolicy" },
    returnPolicyId: { type: mongoose.Types.ObjectId, ref: "ReturnPolicy" },
  },
  { timestamps: true }
);

// Pre-save middleware to auto-generate storeId
StoreSchema.pre("save", async function (next) {
  if (this.isNew && !this.storeId) {
    try {
      const counter = await CounterModel.findOneAndUpdate(
        { name: "store" },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      this.storeId = counter.value;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model("Store", StoreSchema);
