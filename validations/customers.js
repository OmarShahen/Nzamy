const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");
const config = require("../config/config");

const addCustomerSchema = z.object({
  userId: z.string().refine(isObjectId, "User Id format is invalid"),
  storeId: z.string().refine(isObjectId, "Store Id format is invalid"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  gender: z.string().optional(),
  birthDate: z.string().datetime().optional().or(z.date().optional()),
  source: z.enum(config.SOURCES, { required_error: "source value is invalid" }),
  socialMediaId: z.string().min(1, "Social media ID is required"),
  preferredLanguage: z.string().optional(),
  tags: z
    .array(z.string().refine(isObjectId, "Tag Id format is invalid"))
    .optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  gender: z.string().optional(),
  birthDate: z.string().datetime().optional().or(z.date().optional()),
  preferredLanguage: z.string().optional(),
  tags: z
    .array(z.string().refine(isObjectId, "Tag Id format is invalid"))
    .optional(),
});

module.exports = {
  addCustomerSchema,
  updateCustomerSchema,
};
