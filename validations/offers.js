const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");
const config = require("../config/config");

const addOfferSchema = z.object({
  userId: z.string().refine(isObjectId, "User Id format is invalid"),
  storeId: z.string().refine(isObjectId, "Store Id format is invalid"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  offerCode: z.string().min(1, "Offer code is required"),
  type: z.enum(config.OFFER_TYPES, "Invalid offer type"),
  discountValue: z.number().min(0, "Discount value must be non-negative"),
  minPurchaseAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  usageLimitTotal: z.number().min(0).optional(),
  usageLimitPerCustomer: z.number().min(0).optional(),
  customerSegment: z.array(z.string().refine(isObjectId, "Customer segment Id format is invalid")).optional(),
  excludedItems: z.array(z.string().refine(isObjectId, "Excluded item Id format is invalid")).optional(),
  isAutoApply: z.boolean().optional(),
  priority: z.number().optional(),
  startDate: z.string().datetime().optional().or(z.date().optional()),
  endDate: z.string().datetime().optional().or(z.date().optional()),
  status: z.enum(config.OFFER_STATUS, "Invalid offer status").optional(),
});

const updateOfferSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  offerCode: z.string().min(1, "Offer code is required").optional(),
  type: z.enum(config.OFFER_TYPES, "Invalid offer type").optional(),
  discountValue: z.number().min(0, "Discount value must be non-negative").optional(),
  minPurchaseAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  usageLimitTotal: z.number().min(0).optional(),
  usageLimitPerCustomer: z.number().min(0).optional(),
  customerSegment: z.array(z.string().refine(isObjectId, "Customer segment Id format is invalid")).optional(),
  excludedItems: z.array(z.string().refine(isObjectId, "Excluded item Id format is invalid")).optional(),
  isAutoApply: z.boolean().optional(),
  priority: z.number().optional(),
  startDate: z.string().datetime().optional().or(z.date().optional()),
  endDate: z.string().datetime().optional().or(z.date().optional()),
  status: z.enum(config.OFFER_STATUS, "Invalid offer status").optional(),
});

module.exports = {
  addOfferSchema,
  updateOfferSchema,
};