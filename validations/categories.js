const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");

const addCategorySchema = z.object({
  userId: z.string().refine(isObjectId, "Invalid user ID format"),
  storeId: z.string().refine(isObjectId, "Invalid store ID format"),
  name: z.string().min(1, "Name is required"),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
});

module.exports = {
  addCategorySchema,
  updateCategorySchema,
};
