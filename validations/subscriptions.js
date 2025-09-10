const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");
const config = require("../config/config");

const addSubscriptionSchema = z.object({
  userId: z.string().refine(isObjectId, "User Id format is invalid"),
  planId: z.string().refine(isObjectId, "Plan Id format is invalid"),
});

const updateSubscriptionSchema = z.object({
  status: z.enum(config.SUBSCRIPTION_STATUS, "Status value is invalid"),
});

module.exports = {
  addSubscriptionSchema,
  updateSubscriptionSchema,
};
