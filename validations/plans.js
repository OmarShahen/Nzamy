const { z } = require('zod');

const addPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be a positive number"),
  duration: z.number().positive("Duration must be a positive number"),
  tokensLimit: z.number().min(0, "Tokens limit must be a positive number"),
  features: z.array(z.string()).min(1, "At least one feature is required"),
  isActive: z.boolean(),
  isPopular: z.boolean(),
});

const updatePlanSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  price: z.number().min(0, "Price must be a positive number").optional(),
  duration: z.number().positive("Duration must be a positive number").optional(),
  tokensLimit: z.number().min(0, "Tokens limit must be a positive number").optional(),
  features: z.array(z.string()).min(1, "At least one feature is required").optional(),
  isActive: z.boolean().optional(),
  isPopular: z.boolean().optional(),
});

module.exports = {
  addPlanSchema,
  updatePlanSchema,
};
