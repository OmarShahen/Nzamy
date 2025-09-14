const mongoose = require("mongoose");
const CounterModel = require("./CounterModel");

const ItemSchema = new mongoose.Schema(
  {
    itemId: { type: Number },
    userId: { type: mongoose.Types.ObjectId, required: true },
    storeId: { type: mongoose.Types.ObjectId, required: true },
    categoryId: { type: mongoose.Types.ObjectId, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageURL: { type: String },
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
    isTrackInventory: { type: Boolean, default: false },
    images: [
      {
        url: { type: String },
        description: { type: String },
        vector: [Number],
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ItemSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await CounterModel.findOneAndUpdate(
        { name: `item-${this.storeId}` },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      this.itemId = counter.value;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model("Item", ItemSchema);
