const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");
const config = require("../config/config");

const addLoyaltyTransactionSchema = z.object({
  userId: z.string().refine(isObjectId, "User Id format is invalid"),
  storeId: z.string().refine(isObjectId, "Store Id format is invalid"),
  customerId: z.string().refine(isObjectId, "Customer Id format is invalid"),
  type: z.enum(config.LOYALTY_TRANSACTION_TYPES, {
    errorMap: () => ({ message: `Type must be one of: ${config.LOYALTY_TRANSACTION_TYPES.join(", ")}` })
  }),
  orderId: z.string().refine(isObjectId, "Order Id format is invalid").optional(),
  points: z.number().int("Points must be an integer"),
  reason: z.enum(config.LOYALTY_TRANSACTION_REASONS, {
    errorMap: () => ({ message: `Reason must be one of: ${config.LOYALTY_TRANSACTION_REASONS.join(", ")}` })
  }),
});

const updateLoyaltyTransactionSchema = z.object({
  type: z.enum(config.LOYALTY_TRANSACTION_TYPES, {
    errorMap: () => ({ message: `Type must be one of: ${config.LOYALTY_TRANSACTION_TYPES.join(", ")}` })
  }).optional(),
  orderId: z.string().refine(isObjectId, "Order Id format is invalid").optional(),
  points: z.number().int("Points must be an integer").optional(),
  reason: z.enum(config.LOYALTY_TRANSACTION_REASONS, {
    errorMap: () => ({ message: `Reason must be one of: ${config.LOYALTY_TRANSACTION_REASONS.join(", ")}` })
  }).optional(),
});

module.exports = {
  addLoyaltyTransactionSchema,
  updateLoyaltyTransactionSchema,
};