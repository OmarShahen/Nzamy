const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");

const addCustomerAddressSchema = z.object({
  userId: z.string().refine(isObjectId, "User Id format is invalid"),
  storeId: z.string().refine(isObjectId, "Store Id format is invalid"),
  customerId: z.string().refine(isObjectId, "Customer Id format is invalid"),
  addressLine: z.string().min(1, "Address line is required"),
  postalCode: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  isDefault: z.boolean().optional(),
});

const updateCustomerAddressSchema = z.object({
  addressLine: z.string().min(1, "Address line is required").optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1, "Country is required").optional(),
  city: z.string().min(1, "City is required").optional(),
  isDefault: z.boolean().optional(),
});

module.exports = {
  addCustomerAddressSchema,
  updateCustomerAddressSchema,
};