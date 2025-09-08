const { z } = require('zod');
const { isObjectId } = require('../utils/validateObjectId');

// Custom ObjectId validator
const objectIdSchema = z.string().refine((val) => isObjectId(val), {
  message: "Invalid ObjectId format"
});

// Shipping Zone Schema
const shippingZoneSchema = z.object({
  name: z.string().min(1, "Zone name is required"),
  countries: z.array(z.string().min(1, "Country name is required")).min(1, "At least one country is required"),
  cities: z.array(z.string()).optional().default([]),
  cost: z.number().min(0, "Cost must be a positive number"),
  estimatedDays: z.object({
    min: z.number().min(1, "Minimum days must be at least 1"),
    max: z.number().min(1, "Maximum days must be at least 1")
  }),
  isActive: z.boolean().optional().default(true)
}).refine(data => data.estimatedDays.max >= data.estimatedDays.min, {
  message: "Maximum days must be greater than or equal to minimum days",
  path: ["estimatedDays"]
});

// Shipping Method Schema
const shippingMethodSchema = z.object({
  name: z.string().min(1, "Method name is required"),
  type: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT', 'PICKUP', 'DIGITAL'], {
    errorMap: () => ({ message: "Invalid shipping method type" })
  }),
  provider: z.string().min(1, "Provider is required"),
  trackingEnabled: z.boolean().optional().default(true),
  zones: z.array(shippingZoneSchema).min(1, "At least one shipping zone is required"),
  isActive: z.boolean().optional().default(true)
});

// Free Shipping Schema
const freeShippingSchema = z.object({
  enabled: z.boolean().optional().default(false),
  minimumAmount: z.number().min(0, "Minimum amount must be positive").optional(),
  applicableZones: z.array(z.string()).optional().default([]),
  applicableMethods: z.array(z.string()).optional().default([])
});

// Processing Time Schema
const processingTimeSchema = z.object({
  min: z.number().min(1, "Minimum processing time must be at least 1").default(1),
  max: z.number().min(1, "Maximum processing time must be at least 1").default(3),
  unit: z.enum(['HOURS', 'DAYS'], {
    errorMap: () => ({ message: "Unit must be either HOURS or DAYS" })
  }).default('DAYS')
}).refine(data => data.max >= data.min, {
  message: "Maximum processing time must be greater than or equal to minimum",
  path: ["max"]
});

// Dimensions Schema
const dimensionsSchema = z.object({
  length: z.number().positive("Length must be positive").optional(),
  width: z.number().positive("Width must be positive").optional(),
  height: z.number().positive("Height must be positive").optional(),
  unit: z.enum(['CM', 'INCH'], {
    errorMap: () => ({ message: "Unit must be either CM or INCH" })
  }).default('CM')
});

// Restrictions Schema
const restrictionsSchema = z.object({
  maxWeight: z.number().positive("Max weight must be positive").optional(),
  maxDimensions: dimensionsSchema.optional(),
  restrictedCountries: z.array(z.string()).optional().default([]),
  restrictedItems: z.array(z.string()).optional().default([])
});

// Special Handling Schema
const specialHandlingSchema = z.object({
  fragileItems: z.object({
    enabled: z.boolean().default(false),
    additionalCost: z.number().min(0, "Additional cost must be positive").default(0)
  }).optional(),
  hazardousItems: z.object({
    enabled: z.boolean().default(false),
    additionalCost: z.number().min(0, "Additional cost must be positive").default(0)
  }).optional(),
  coldStorage: z.object({
    enabled: z.boolean().default(false),
    additionalCost: z.number().min(0, "Additional cost must be positive").default(0)
  }).optional()
});

// Insurance Schema
const insuranceSchema = z.object({
  available: z.boolean().default(false),
  cost: z.number().min(0, "Insurance cost must be positive").default(0),
  maxCoverage: z.number().positive("Max coverage must be positive").optional()
});

// Tracking Schema
const trackingSchema = z.object({
  enabled: z.boolean().default(true),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false)
});

// Main Shipping Policy Schemas
const addShippingPolicySchema = z.object({
  storeId: objectIdSchema,
  isShippingEnabled: z.boolean().default(true),
  freeShipping: freeShippingSchema.optional(),
  methods: z.array(shippingMethodSchema).min(1, "At least one shipping method is required"),
  processingTime: processingTimeSchema.optional(),
  restrictions: restrictionsSchema.optional(),
  specialHandling: specialHandlingSchema.optional(),
  insurance: insuranceSchema.optional(),
  tracking: trackingSchema.optional(),
  isActive: z.boolean().default(true)
});

const updateShippingPolicySchema = z.object({
  isShippingEnabled: z.boolean().optional(),
  freeShipping: freeShippingSchema.optional(),
  methods: z.array(shippingMethodSchema).optional(),
  processingTime: processingTimeSchema.optional(),
  restrictions: restrictionsSchema.optional(),
  specialHandling: specialHandlingSchema.optional(),
  insurance: insuranceSchema.optional(),
  tracking: trackingSchema.optional(),
  isActive: z.boolean().optional()
});

// Params validation
const shippingPolicyParamsSchema = z.object({
  policyId: objectIdSchema
});

const storeParamsSchema = z.object({
  storeId: objectIdSchema
});

module.exports = {
  addShippingPolicySchema,
  updateShippingPolicySchema,
  shippingPolicyParamsSchema,
  storeParamsSchema,
  shippingZoneSchema,
  shippingMethodSchema
};