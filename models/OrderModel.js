const mongoose = require("mongoose");
const config = require("../config/config");
const CounterModel = require("./CounterModel");

const OrderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Types.ObjectId, required: true },
  name: { type: String, required: true }, // snapshot of item name
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // snapshot price when ordered
});

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: Number },
    userId: { type: mongoose.Types.ObjectId, required: true },
    storeId: { type: mongoose.Types.ObjectId, required: true },
    customerId: { type: mongoose.Types.ObjectId, required: true },
    
    items: [OrderItemSchema],
    
    // Pricing breakdown
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    
    // Applied offers
    appliedOffers: [mongoose.Types.ObjectId],
    
    // Order status and tracking
    status: { type: String, default: "pending", enum: config.ORDER_STATUS },
    trackingNumber: { type: String },
    estimatedDelivery: { type: Date },
    
    // Payment info
    paymentMethod: {
      type: String,
      default: "cod",
      enum: config.PAYMENT_METHODS,
    },
    paymentStatus: { type: String, default: "PENDING", enum: config.PAYMENT_STATUS },
    refundDate: { type: Date },
    
    // Shipping address (can reference CustomerAddressModel or embed)
    customerAddressId: { type: mongoose.Types.ObjectId },
    shipping: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String },
      country: { type: String, required: true },
    },
    
    // Additional info
    notes: { type: String },
    specialInstructions: { type: String },
  },
  { timestamps: true }
);

// Pre-save middleware for auto-incrementing orderId and calculations
OrderSchema.pre('save', async function(next) {
  // Generate orderId for new orders
  if (this.isNew) {
    try {
      const counter = await CounterModel.findOneAndUpdate(
        { name: `order-${this.storeId}` },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      this.orderId = counter.value;
    } catch (error) {
      return next(error);
    }
  }

  // Calculate totals if items changed
  if (this.isModified('items') || this.isModified('taxAmount') || this.isModified('shippingCost') || this.isModified('discountAmount')) {
    this.subtotal = this.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    this.totalPrice = this.subtotal + this.taxAmount + this.shippingCost - this.discountAmount;
  }
  
  next();
});

// Indexes for better query performance
OrderSchema.index({ customerId: 1, storeId: 1 });
OrderSchema.index({ storeId: 1, status: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Order", OrderSchema);
