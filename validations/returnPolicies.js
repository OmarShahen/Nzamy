const { z } = require('zod');
const { isObjectId } = require('../utils/validateObjectId');

// Custom ObjectId validator
const objectIdSchema = z.string().refine((val) => isObjectId(val), {
  message: "Invalid ObjectId format"
});

// Return Condition Schema
const returnConditionSchema = z.object({
  condition: z.enum([
    'UNOPENED_PACKAGING',
    'ORIGINAL_CONDITION', 
    'WITH_TAGS',
    'WITH_RECEIPT',
    'UNDAMAGED',
    'COMPLETE_SET',
    'HYGIENE_SEALED'
  ], {
    errorMap: () => ({ message: "Invalid return condition" })
  }),
  description: z.string().min(1, "Description is required"),
  isRequired: z.boolean().default(true)
});

// Return Reason Schema
const returnReasonSchema = z.object({
  reason: z.enum([
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
  ], {
    errorMap: () => ({ message: "Invalid return reason" })
  }),
  allowedDays: z.number().min(0, "Allowed days must be positive"),
  refundPercentage: z.number().min(0, "Refund percentage must be positive").max(100, "Refund percentage cannot exceed 100").default(100),
  isActive: z.boolean().default(true)
});

// Return Method Schema
const returnMethodSchema = z.object({
  method: z.enum(['PICKUP', 'DROP_OFF', 'MAIL', 'STORE_RETURN'], {
    errorMap: () => ({ message: "Invalid return method" })
  }),
  cost: z.number().min(0, "Cost must be positive"),
  whoPaysCost: z.enum(['CUSTOMER', 'STORE', 'SHARED'], {
    errorMap: () => ({ message: "Invalid cost payer" })
  }),
  estimatedDays: z.number().min(1, "Estimated days must be at least 1"),
  isActive: z.boolean().default(true)
});

// Refund Method Schema
const refundMethodSchema = z.object({
  method: z.enum([
    'ORIGINAL_PAYMENT',
    'STORE_CREDIT',
    'BANK_TRANSFER',
    'CASH',
    'EXCHANGE_ONLY',
    'PARTIAL_REFUND'
  ], {
    errorMap: () => ({ message: "Invalid refund method" })
  }),
  processingDays: z.number().min(1, "Processing days must be at least 1"),
  fee: z.number().min(0, "Fee must be positive").default(0),
  minimumAmount: z.number().min(0, "Minimum amount must be positive").default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

// Category Rule Schema
const categoryRuleSchema = z.object({
  categoryName: z.string().min(1, "Category name is required"),
  returnAllowed: z.boolean().default(true),
  returnDays: z.number().min(0, "Return days must be positive").optional(),
  specialConditions: z.array(z.string()).default([]),
  refundPercentage: z.number().min(0, "Refund percentage must be positive").max(100, "Refund percentage cannot exceed 100").default(100),
  exchangeOnly: z.boolean().default(false)
});

// Exchange Policy Schema
const exchangePolicySchema = z.object({
  enabled: z.boolean().default(true),
  allowSizeExchange: z.boolean().default(true),
  allowColorExchange: z.boolean().default(true),
  allowModelExchange: z.boolean().default(false),
  priceDifferencePolicy: z.enum(['CUSTOMER_PAYS', 'STORE_REFUNDS', 'NOT_ALLOWED'], {
    errorMap: () => ({ message: "Invalid price difference policy" })
  }).default('CUSTOMER_PAYS')
});

// Restocking Policy Schema
const restockingPolicySchema = z.object({
  enabled: z.boolean().default(false),
  fee: z.number().min(0, "Fee must be positive").default(0),
  feeType: z.enum(['FIXED', 'PERCENTAGE'], {
    errorMap: () => ({ message: "Fee type must be either FIXED or PERCENTAGE" })
  }).default('PERCENTAGE'),
  exemptReasons: z.array(z.string()).default([])
});

// Final Sale Schema
const finalSaleSchema = z.object({
  categories: z.array(z.string()).default([]),
  conditions: z.array(z.string()).default([]),
  clearanceItems: z.boolean().default(true)
});

// Process Schema
const processSchema = z.object({
  requireRMA: z.boolean().default(true),
  requireOriginalPackaging: z.boolean().default(false),
  requirePhotos: z.boolean().default(false),
  autoApproval: z.object({
    enabled: z.boolean().default(false),
    maxAmount: z.number().min(0, "Max amount must be positive").default(0)
  })
});

// Inspection Schema
const inspectionSchema = z.object({
  required: z.boolean().default(true),
  timeframe: z.number().min(1, "Timeframe must be at least 1 day").default(2),
  rejectionReasons: z.array(z.string()).default([]),
  partialRefundReasons: z.array(z.object({
    reason: z.string().min(1, "Reason is required"),
    refundPercentage: z.number().min(0, "Refund percentage must be positive").max(100, "Refund percentage cannot exceed 100")
  })).default([])
});

// Special Policies Schema
const specialPoliciesSchema = z.object({
  perishableGoods: z.object({
    returnable: z.boolean().default(false),
    conditions: z.array(z.string()).default([])
  }),
  customOrders: z.object({
    returnable: z.boolean().default(false),
    conditions: z.array(z.string()).default([])
  }),
  giftItems: z.object({
    returnable: z.boolean().default(true),
    requireGiftReceipt: z.boolean().default(false)
  })
});

// Blackout Period Schema
const blackoutPeriodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().datetime("Invalid start date format"),
  endDate: z.string().datetime("Invalid end date format"),
  noReturns: z.boolean().default(false),
  extendedProcessing: z.number().min(0, "Extended processing must be positive").default(0)
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"]
});

// Main Return Policy Schemas
const addReturnPolicySchema = z.object({
  storeId: objectIdSchema,
  isReturnEnabled: z.boolean().default(true),
  defaultReturnDays: z.number().min(0, "Default return days must be positive").default(30),
  returnReasons: z.array(returnReasonSchema).optional().default([]),
  returnConditions: z.array(returnConditionSchema).optional().default([]),
  returnMethods: z.array(returnMethodSchema).min(1, "At least one return method is required"),
  refundMethods: z.array(refundMethodSchema).min(1, "At least one refund method is required"),
  categoryRules: z.array(categoryRuleSchema).optional().default([]),
  exchange: exchangePolicySchema.optional(),
  restocking: restockingPolicySchema.optional(),
  finalSale: finalSaleSchema.optional(),
  process: processSchema.optional(),
  inspection: inspectionSchema.optional(),
  special: specialPoliciesSchema.optional(),
  blackoutPeriods: z.array(blackoutPeriodSchema).optional().default([]),
  isActive: z.boolean().default(true)
});

const updateReturnPolicySchema = z.object({
  isReturnEnabled: z.boolean().optional(),
  defaultReturnDays: z.number().min(0, "Default return days must be positive").optional(),
  returnReasons: z.array(returnReasonSchema).optional(),
  returnConditions: z.array(returnConditionSchema).optional(),
  returnMethods: z.array(returnMethodSchema).optional(),
  refundMethods: z.array(refundMethodSchema).optional(),
  categoryRules: z.array(categoryRuleSchema).optional(),
  exchange: exchangePolicySchema.optional(),
  restocking: restockingPolicySchema.optional(),
  finalSale: finalSaleSchema.optional(),
  process: processSchema.optional(),
  inspection: inspectionSchema.optional(),
  special: specialPoliciesSchema.optional(),
  blackoutPeriods: z.array(blackoutPeriodSchema).optional(),
  isActive: z.boolean().optional()
});

// Params validation
const returnPolicyParamsSchema = z.object({
  policyId: objectIdSchema
});

const storeParamsSchema = z.object({
  storeId: objectIdSchema
});

module.exports = {
  addReturnPolicySchema,
  updateReturnPolicySchema,
  returnPolicyParamsSchema,
  storeParamsSchema,
  returnConditionSchema,
  returnReasonSchema,
  returnMethodSchema,
  refundMethodSchema
};