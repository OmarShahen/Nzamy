const { z } = require("zod");

// Custom validators using existing utils
const isNameValid = (name) => require("../utils/validateUsername").isNameValid(name);

const updateUserMainDataSchema = z.object({
  firstName: z.string().refine(isNameValid, "Invalid name format").optional(),
  phone: z.number("Invalid phone format").optional(),
  imageURL: z.string().url('Invalid image URL format').optional(),
  isBlocked: z.boolean().optional(),
  isDeactivated: z.boolean().optional()
});

const updateUserPasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const verifyAndUpdateUserPasswordSchema = z.object({
  newPassword: z.string().min(1, "New password is required"),
  currentPassword: z.string().min(1, "Current password is required"),
});

module.exports = {
  updateUserMainDataSchema,
  updateUserPasswordSchema,
  verifyAndUpdateUserPasswordSchema,
};
