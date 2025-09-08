const mongoose = require("mongoose");
const config = require("../config/config");
const CounterModel = require("./CounterModel");

const CustomerSchema = new mongoose.Schema(
  {
    customerId: { type: Number, required: true },
    userId: { type: mongoose.Types.ObjectId, required: true },
    storeId: { type: mongoose.Types.ObjectId, required: true },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    gender: { type: String, enum: config.GENDER },
    birthDate: { type: Date },

    source: { type: String, required: true, enum: config.SOURCES },
    socialMediaId: { type: String, required: true },

    preferredLanguage: { type: String },

    tags: [mongoose.Types.ObjectId],

    loyaltyPoints: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    avgOrderValue: { type: Number, default: 0 },
    lifeTimeValue: { type: Number, default: 0 },
    cartAbandonRate: { type: Number, default: 0 },

    lastInteractionDate: { type: Date },
    lastCartDate: { type: Date },
    lastOrderDate: { type: Date },
  },
  { timestamps: true }
);

CustomerSchema.pre('save', async function(next) {
  if (this.isNew && !this.customerId) {
    try {
      const counter = await CounterModel.findOneAndUpdate(
        { name: `customer-${this.storeId}` },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      this.customerId = counter.value;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model("Customer", CustomerSchema);
