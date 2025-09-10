const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");

const askAssistantSchema = z.object({
  message: z.string().min(1, "Message is required"),
  threadId: z.string().optional(),
  storeId: z.string().refine(isObjectId, "Store Id format is invalid"),
});

module.exports = {
  askAssistantSchema,
};
