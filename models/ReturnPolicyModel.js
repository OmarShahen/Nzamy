const mongoose = require("mongoose");

const ReturnConditionSchema = new mongoose.Schema({
  condition: { 
    type: String, 
    required: true,
    enum: [
      'UNOPENED_PACKAGING',
      'ORIGINAL_CONDITION', 
      'WITH_TAGS',
      'WITH_RECEIPT',
      'UNDAMAGED',
      'COMPLETE_SET',
      'HYGIENE_SEALED'
    ]
  },
  description: { type: String, required: true },
  isRequired: { type: Boolean, default: true }
});

const ReturnReasonSchema = new mongoose.Schema({
  reason: {
    type: String,
    required: true,
    enum: [
      'DEFECTIVE',
      'DAMAGED_IN_SHIPPING',
      'WRONG_ITEM',
      'NOT_AS_DESCRIBED',
      'SIZE_ISSUE',
      'COLOR_DIFFERENCE',
      'CHANGE_OF_MIND',
      'QUALITY_ISSUE',
      'LATE_DELIVERY',
      'OTHER'
    ]
  },
  allowedDays: { type: Number, required: true, min: 0 },
  refundPercentage: { type: Number, required: true, min: 0, max: 100, default: 100 },
  isActive: { type: Boolean, default: true }
});

const ReturnMethodSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
    enum: ['PICKUP', 'DROP_OFF', 'MAIL', 'STORE_RETURN']
  },
  cost: { type: Number, required: true, min: 0 },
  whoPaysCost: {
    type: String,
    required: true,
    enum: ['CUSTOMER', 'STORE', 'SHARED']
  },
  estimatedDays: { type: Number, required: true, min: 1 },
  isActive: { type: Boolean, default: true }
});

const RefundMethodSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
    enum: [
      'ORIGINAL_PAYMENT',
      'STORE_CREDIT',
      'BANK_TRANSFER',
      'CASH',
      'EXCHANGE_ONLY',
      'PARTIAL_REFUND'
    ]
  },
  processingDays: { type: Number, required: true, min: 1 },
  fee: { type: Number, default: 0, min: 0 },
  minimumAmount: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
});

const CategoryRuleSchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
  returnAllowed: { type: Boolean, default: true },
  returnDays: { type: Number, min: 0 },
  specialConditions: [{ type: String }],
  refundPercentage: { type: Number, min: 0, max: 100, default: 100 },
  exchangeOnly: { type: Boolean, default: false }
});

const ReturnPolicySchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Types.ObjectId, required: true, ref: "Store", unique: true },
    
    // Basic return settings
    isReturnEnabled: { type: Boolean, default: true },
    defaultReturnDays: { type: Number, required: true, default: 30, min: 0 },
    
    // Return reasons and their specific rules
    returnReasons: [ReturnReasonSchema],
    
    // Return conditions that items must meet
    returnConditions: [ReturnConditionSchema],
    
    // Return methods available
    returnMethods: [ReturnMethodSchema],
    
    // Refund methods available
    refundMethods: [RefundMethodSchema],
    
    // Category-specific rules
    categoryRules: [CategoryRuleSchema],
    
    // Exchange policy
    exchange: {
      enabled: { type: Boolean, default: true },
      allowSizeExchange: { type: Boolean, default: true },
      allowColorExchange: { type: Boolean, default: true },
      allowModelExchange: { type: Boolean, default: false },
      priceDifferencePolicy: {
        type: String,
        enum: ['CUSTOMER_PAYS', 'STORE_REFUNDS', 'NOT_ALLOWED'],
        default: 'CUSTOMER_PAYS'
      }
    },
    
    // Restocking policy
    restocking: {
      enabled: { type: Boolean, default: false },
      fee: { type: Number, default: 0, min: 0 },
      feeType: { type: String, enum: ['FIXED', 'PERCENTAGE'], default: 'PERCENTAGE' },
      exemptReasons: [{ type: String }] // Reasons that don't incur restocking fee
    },
    
    // Final sale items
    finalSale: {
      categories: [{ type: String }],
      conditions: [{ type: String }],
      clearanceItems: { type: Boolean, default: true }
    },
    
    // Return process requirements
    process: {
      requireRMA: { type: Boolean, default: true }, // Return Merchandise Authorization
      requireOriginalPackaging: { type: Boolean, default: false },
      requirePhotos: { type: Boolean, default: false },
      autoApproval: {
        enabled: { type: Boolean, default: false },
        maxAmount: { type: Number, default: 0 }
      }
    },
    
    // Inspection settings
    inspection: {
      required: { type: Boolean, default: true },
      timeframe: { type: Number, default: 2 }, // days to inspect
      rejectionReasons: [{ type: String }],
      partialRefundReasons: [{ 
        reason: String,
        refundPercentage: { type: Number, min: 0, max: 100 }
      }]
    },
    
    // Special policies
    special: {
      perishableGoods: {
        returnable: { type: Boolean, default: false },
        conditions: [{ type: String }]
      },
      customOrders: {
        returnable: { type: Boolean, default: false },
        conditions: [{ type: String }]
      },
      giftItems: {
        returnable: { type: Boolean, default: true },
        requireGiftReceipt: { type: Boolean, default: false }
      }
    },
    
    // Holidays and blackout periods
    blackoutPeriods: [{
      name: { type: String, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      noReturns: { type: Boolean, default: false },
      extendedProcessing: { type: Number, default: 0 } // additional days
    }],
    
    isActive: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Indexes for better performance
ReturnPolicySchema.index({ storeId: 1 });
ReturnPolicySchema.index({ isActive: 1 });
ReturnPolicySchema.index({ "categoryRules.categoryName": 1 });

// Pre-save middleware to update lastUpdated
ReturnPolicySchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model("ReturnPolicy", ReturnPolicySchema);