const mongoose = require("mongoose");

const ShippingZoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  countries: [{ type: String, required: true }],
  cities: [{ type: String }],
  cost: { type: Number, required: true, min: 0 },
  estimatedDays: { 
    min: { type: Number, required: true, min: 1 },
    max: { type: Number, required: true, min: 1 }
  },
  isActive: { type: Boolean, default: true }
});

const ShippingMethodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['STANDARD', 'EXPRESS', 'OVERNIGHT', 'PICKUP', 'DIGITAL']
  },
  provider: { type: String, required: true },
  trackingEnabled: { type: Boolean, default: true },
  zones: [ShippingZoneSchema],
  isActive: { type: Boolean, default: true }
});

const ShippingPolicySchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Types.ObjectId, required: true, ref: "Store", unique: true },
    isShippingEnabled: { type: Boolean, default: true },
    
    // Free shipping conditions
    freeShipping: {
      enabled: { type: Boolean, default: false },
      minimumAmount: { type: Number, min: 0 },
      applicableZones: [{ type: String }], // Zone names
      applicableMethods: [{ type: String }] // Method names
    },
    
    // Shipping methods and zones
    methods: [ShippingMethodSchema],
    
    // Processing time before shipping
    processingTime: {
      min: { type: Number, required: true, default: 1 },
      max: { type: Number, required: true, default: 3 },
      unit: { type: String, enum: ['HOURS', 'DAYS'], default: 'DAYS' }
    },
    
    // Restrictions
    restrictions: {
      maxWeight: { type: Number }, // in kg
      maxDimensions: {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number },
        unit: { type: String, enum: ['CM', 'INCH'], default: 'CM' }
      },
      restrictedCountries: [{ type: String }],
      restrictedItems: [{ type: String }]
    },
    
    // Special handling
    specialHandling: {
      fragileItems: { 
        enabled: { type: Boolean, default: false },
        additionalCost: { type: Number, default: 0 }
      },
      hazardousItems: {
        enabled: { type: Boolean, default: false },
        additionalCost: { type: Number, default: 0 }
      },
      coldStorage: {
        enabled: { type: Boolean, default: false },
        additionalCost: { type: Number, default: 0 }
      }
    },
    
    // Insurance options
    insurance: {
      available: { type: Boolean, default: false },
      cost: { type: Number, default: 0 },
      maxCoverage: { type: Number }
    },
    
    // Tracking settings
    tracking: {
      enabled: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false }
    },
    
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Indexes for better performance
ShippingPolicySchema.index({ storeId: 1 });
ShippingPolicySchema.index({ "methods.zones.countries": 1 });
ShippingPolicySchema.index({ isActive: 1 });

module.exports = mongoose.model("ShippingPolicy", ShippingPolicySchema);