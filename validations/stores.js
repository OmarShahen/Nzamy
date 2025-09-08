const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");
const utils = require("../utils/utils");
const config = require("../config/config");

// Custom ObjectId validator
const objectIdSchema = z.string().refine((val) => isObjectId(val), {
  message: "Invalid ObjectId format",
});

// Assistance schema
const assistanceSchema = z.object({
  name: z.string().min(1, "Assistance name is required").optional(),
  persona: z
    .enum(config.PERSONA_VALUES, {
      errorMap: () => ({ message: "Invalid persona value" }),
    })
    .optional(),
  languages: z
    .array(
      z.enum(config.LANGUAGES, {
        errorMap: () => ({ message: "Invalid language" }),
      })
    )
    .min(1, "At least one language is required")
    .default(["ARABIC", "ENGLISH"]),
  instructions: z.string().min(1, "Instructions are required").optional(),
});

// Add store schema
const addStoreSchema = z.object({
  userId: objectIdSchema,
  facebookId: z.number().positive("Facebook ID must be positive").optional(),
  instagramId: z.number().positive("Instagram ID must be positive").optional(),
  whatsappId: z.number().positive("WhatsApp ID must be positive").optional(),
  name: z.string().min(1, "Store name is required"),
  category: z.enum(config.STORE_CATEGORY_VALUES, {
    errorMap: () => ({ message: "Invalid store category" }),
  }),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email format"),
  description: z.string().min(1, "Description is required"),
  notes: z.string().optional(),
  paymentMethods: z
    .array(
      z.enum(config.PAYMENT_METHODS, {
        errorMap: () => ({ message: "Invalid payment method" }),
      })
    )
    .optional()
    .default([]),
  currency: z
    .string()
    .refine((val) => utils.validateCurrency(val), {
      message: "Invalid currency format",
    })
    .optional(),
  assistance: assistanceSchema.optional(),
});

// Update store schema
const updateStoreSchema = z.object({
  facebookId: z.number().positive("Facebook ID must be positive").optional(),
  instagramId: z.number().positive("Instagram ID must be positive").optional(),
  whatsappId: z.number().positive("WhatsApp ID must be positive").optional(),
  name: z.string().min(1, "Store name is required").optional(),
  category: z
    .enum(config.STORE_CATEGORY_VALUES, {
      errorMap: () => ({ message: "Invalid store category" }),
    })
    .optional(),
  phone: z.string().min(1, "Phone number is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  description: z.string().min(1, "Description is required").optional(),
  notes: z.string().optional(),
  paymentMethods: z
    .array(
      z.enum(config.PAYMENT_METHODS, {
        errorMap: () => ({ message: "Invalid payment method" }),
      })
    )
    .optional(),
  currency: z
    .string()
    .refine((val) => utils.validateCurrency(val), {
      message: "Invalid currency format",
    })
    .optional(),
  assistance: assistanceSchema.optional(),
  shippingPolicyId: objectIdSchema.optional(),
  returnPolicyId: objectIdSchema.optional(),
});

module.exports = {
  addStoreSchema,
  updateStoreSchema,
};
