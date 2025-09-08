const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");

const addCustomerSchema = z.object({
  userId: z.string().refine(isObjectId, "User Id format is invalid"),
  storeId: z.string().refine(isObjectId, "Store Id format is invalid"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  gender: z.string().optional(),
  birthDate: z.string().datetime().optional().or(z.date().optional()),
  source: z.string().min(1, "Source is required"),
  socialMediaId: z.string().min(1, "Social media ID is required"),
  preferredLanguage: z.string().optional(),
  tags: z.array(z.string().refine(isObjectId, "Tag Id format is invalid")).optional(),
  loyaltyPoints: z.number().min(0).optional(),
  totalOrders: z.number().min(0).optional(),
  totalSpent: z.number().min(0).optional(),
  avgOrderValue: z.number().min(0).optional(),
  lifeTimeValue: z.number().min(0).optional(),
  cartAbandonRate: z.number().min(0).max(100).optional(),
  lastInteractionDate: z.string().datetime().optional().or(z.date().optional()),
  lastCartDate: z.string().datetime().optional().or(z.date().optional()),
  lastOrderDate: z.string().datetime().optional().or(z.date().optional()),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  gender: z.string().optional(),
  birthDate: z.string().datetime().optional().or(z.date().optional()),
  preferredLanguage: z.string().optional(),
  tags: z.array(z.string().refine(isObjectId, "Tag Id format is invalid")).optional(),
  loyaltyPoints: z.number().min(0).optional(),
  totalOrders: z.number().min(0).optional(),
  totalSpent: z.number().min(0).optional(),
  avgOrderValue: z.number().min(0).optional(),
  lifeTimeValue: z.number().min(0).optional(),
  cartAbandonRate: z.number().min(0).max(100).optional(),
  lastInteractionDate: z.string().datetime().optional().or(z.date().optional()),
  lastCartDate: z.string().datetime().optional().or(z.date().optional()),
  lastOrderDate: z.string().datetime().optional().or(z.date().optional()),
});

module.exports = {
  addCustomerSchema,
  updateCustomerSchema,
};