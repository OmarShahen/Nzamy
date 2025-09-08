const { z } = require("zod");

const addTagSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "User Id format is invalid"),
  storeId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Store Id format is invalid"),
  name: z.string().min(1, "Name is required"),
});

const updateTagSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
});

module.exports = {
  addTagSchema,
  updateTagSchema,
};