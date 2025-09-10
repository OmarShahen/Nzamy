const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");

const createPaymentURLSchema = z.object({
  userId: z.string().refine(isObjectId, "User Id format is invalid"),
  planId: z.string().refine(isObjectId, "Plan Id format is invalid"),
});

module.exports = {
  createPaymentURLSchema,
};
