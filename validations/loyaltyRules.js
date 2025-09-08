const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");
const config = require("../config/config");

const addLoyaltyRuleSchema = z.object({
  userId: z.string().refine(isObjectId, "User Id format is invalid"),
  storeId: z.string().refine(isObjectId, "Store Id format is invalid"),
  name: z.string().min(1, "Name is required"),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  isActive: z.boolean().optional(),
  multiplier: z.number().min(0, "Multiplier must be non-negative").optional(),
  pointsAwarded: z.number().int("Points awarded must be an integer").min(0, "Points awarded must be non-negative"),
  actionType: z.enum(config.LOYALTY_RULE_ACTION_TYPES, {
    errorMap: () => ({ message: `Action type must be one of: ${config.LOYALTY_RULE_ACTION_TYPES.join(", ")}` })
  }),
});

const updateLoyaltyRuleSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  isActive: z.boolean().optional(),
  multiplier: z.number().min(0, "Multiplier must be non-negative").optional(),
  pointsAwarded: z.number().int("Points awarded must be an integer").min(0, "Points awarded must be non-negative").optional(),
  actionType: z.enum(config.LOYALTY_RULE_ACTION_TYPES, {
    errorMap: () => ({ message: `Action type must be one of: ${config.LOYALTY_RULE_ACTION_TYPES.join(", ")}` })
  }).optional(),
});

module.exports = {
  addLoyaltyRuleSchema,
  updateLoyaltyRuleSchema,
};