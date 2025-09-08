const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema(
  {
    itemId: { type: Number, required: true },
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

module.exports = mongoose.model("Item", ItemSchema);
