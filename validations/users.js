const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");
const config = require("../config/config");

// Custom validators using existing utils
const isNameValid = (name) => require("../utils/validateUsername").isNameValid(name);
const isEmailValid = (email) => require("../utils/validateEmail").isEmailValid(email);
const isDateValid = (date) => require("../utils/validateDate").isDateValid(date);
const isValidURL = (url) => require("../utils/validateURL").isValidURL(url);

const updateUserMainDataSchema = z.object({
  firstName: z.string().refine(isNameValid, "Invalid name format").optional(),
  phone: z.number("Invalid phone format").optional(),
  gender: z.enum(config.GENDER, "Invalid gender").optional(),
  dateOfBirth: z.string().refine(isDateValid, "Date of birth format is invalid").optional(),
});

const updateUserProfileImageSchema = z.object({
  profileImageURL: z.string().min(1, "Image URL is required").refine(isValidURL, "Image URL format is invalid"),
});

const updateUserVisibilitySchema = z.object({
  isShow: z.boolean("Invalid isShow format"),
});

const updateUserBlockedSchema = z.object({
  isBlocked: z.boolean("Invalid isBlocked format"),
});

const updateUserActivationSchema = z.object({
  isDeactivated: z.boolean("Invalid isDeactivated format"),
});

const updateUserSpecialitySchema = z.object({
  speciality: z.array(z.string().refine(isObjectId, "Invalid speciality format"))
    .min(1, "Speciality must be at least one"),
});

const updateUserEmailSchema = z.object({
  email: z.string().min(1, "Email is required").refine(isEmailValid, "Invalid email format"),
});

const updateUserLanguageSchema = z.object({
  lang: z.enum(config.LANGUAGES, "Invalid language format"),
});

const updateUserPasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const verifyAndUpdateUserPasswordSchema = z.object({
  newPassword: z.string().min(1, "New password is required"),
  currentPassword: z.string().min(1, "Current password is required"),
});

const addEmployeeUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").refine(isNameValid, "Invalid name format"),
  lastName: z.string().min(1, "Last name is required").refine(isNameValid, "Invalid name format"),
  email: z.string().min(1, "Email is required").refine(isEmailValid, "Email format is invalid"),
  password: z.string().min(1, "Password is required"),
  countryCode: z.number("Country code format is invalid"),
  phone: z.number("Phone format is invalid"),
  gender: z.enum(config.GENDER, "Invalid gender"),
});

module.exports = {
  updateUserMainDataSchema,
  updateUserProfileImageSchema,
  updateUserEmailSchema,
  updateUserPasswordSchema,
  updateUserLanguageSchema,
  verifyAndUpdateUserPasswordSchema,
  updateUserSpecialitySchema,
  addEmployeeUserSchema,
  updateUserActivationSchema,
  updateUserVisibilitySchema,
  updateUserBlockedSchema,
};
