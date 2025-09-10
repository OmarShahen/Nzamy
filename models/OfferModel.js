const mongoose = require("mongoose");
const config = require("../config/config");
const CounterModel = require("./CounterModel");

const OfferSchema = new mongoose.Schema(
  {
    offerId: { type: Number, required: true },
    userId: { type: mongoose.Types.ObjectId, required: true },
    storeId: { type: mongoose.Types.ObjectId, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    offerCode: { type: String, required: true },
    type: { type: String, required: true, enum: config.OFFER_TYPES },
    discountValue: { type: Number, required: true, min: 0 },
    minPurchaseAmount: { type: Number, min: 0 },
    maxDiscountAmount: { type: Number, min: 0 },
    usageLimitTotal: { type: Number, min: 0 },
    usageLimitPerCustomer: { type: Number, min: 0 },
    customerSegment: [mongoose.Types.ObjectId],
    excludedItems: [mongoose.Types.ObjectId],
    isAutoApply: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, required: true, enum: config.OFFER_STATUS, default: "draft" },
  },
  { timestamps: true }
);

OfferSchema.index({ storeId: 1, offerCode: 1 }, { unique: true });

OfferSchema.pre('save', async function(next) {
  if (this.isNew && !this.offerId) {
    try {
      const counter = await CounterModel.findOneAndUpdate(
        { name: `offer-${this.storeId}` },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      this.offerId = counter.value;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model("Offer", OfferSchema);