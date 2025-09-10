const mongoose = require("mongoose");
const config = require("../config/config");
const CounterModel = require("./CounterModel");

const CartItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Types.ObjectId, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // snapshot price when added
  addedAt: { type: Date, default: Date.now },
});

const CartSchema = new mongoose.Schema(
  {
    cartId: { type: Number },
    userId: { type: mongoose.Types.ObjectId, required: true },
    storeId: { type: mongoose.Types.ObjectId, required: true },
    customerId: { type: mongoose.Types.ObjectId, required: true },
    items: [CartItemSchema],
    totalPrice: { type: Number, default: 0 },
    status: {
      type: String,
      default: "active",
      enum: config.CART_STATUS,
    },
    lastUpdated: { type: Date, default: Date.now },
    abandonedAt: { type: Date },
    convertedAt: { type: Date },
  },
  { timestamps: true }
);

// Pre-save middleware for auto-incrementing cartId and calculations
CartSchema.pre("save", async function (next) {
  // Generate cartId for new carts
  if (this.isNew) {
    try {
      const counter = await CounterModel.findOneAndUpdate(
        { name: `cart-${this.storeId}` },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      this.cartId = counter.value;
    } catch (error) {
      return next(error);
    }
  }

  // Update lastUpdated
  this.lastUpdated = new Date();

  // Calculate total price
  this.totalPrice = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  next();
});

// Index for finding active carts by customer and store
CartSchema.index({ customerId: 1, storeId: 1, status: 1 });

module.exports = mongoose.model("Cart", CartSchema);
