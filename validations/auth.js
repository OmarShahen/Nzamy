const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");
const config = require("../config/config");

// Custom validators using existing utils
const isNameValid = (name) => require("../utils/validateUsername").isNameValid(name);
const isEmailValid = (email) => require("../utils/validateEmail").isEmailValid(email);
const isPasswordStrong = (password) => require("../utils/validatePassword").isPasswordStrong(password);
const isDateTimeValid = (date) => require("../utils/validateDate").isDateTimeValid(date);
const isDateValid = (date) => require("../utils/validateDate").isDateValid(date);
const isValidURL = (url) => require("../utils/validateURL").isValidURL(url);

const seekerGoogleSignupSchema = z.object({
  firstName: z.string().min(1, "Name is required").refine(isNameValid, "Invalid name format"),
  email: z.string().min(1, "Email is required").refine(isEmailValid, "Email format is invalid"),
  password: z.string().min(1, "Password is required").refine((password) => {
    const validation = isPasswordStrong(password);
    return validation.isAccepted;
  }, (password) => {
    const validation = isPasswordStrong(password);
    return validation.message || "Password is not strong enough";
  }),
  countryCode: z.number("Country code format is invalid"),
  phone: z.number("Phone format is invalid"),
  gender: z.enum(config.GENDER, "Invalid gender"),
  dateOfBirth: z.string().refine(isDateTimeValid, "Date of birth format is invalid"),
  timeZone: z.string().optional(),
  profileImageURL: z.string().refine(isValidURL, "Profile image URL is invalid").optional(),
});

const signupSchema = z.object({
  email: z.string().min(1, "Email is required").refine(isEmailValid, "Email format is invalid"),
  password: z.string().min(1, "Password is required").refine((password) => {
    const validation = isPasswordStrong(password);
    return validation.isAccepted;
  }, (password) => {
    const validation = isPasswordStrong(password);
    return validation.message || "Password is not strong enough";
  }),
});

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").refine(isEmailValid, "Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").refine(isEmailValid, "Invalid email format"),
});

const resetPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").refine(isEmailValid, "Invalid email format"),
  verificationCode: z.number("Invalid verification code format"),
  password: z.string().min(1, "Password is required").refine((password) => {
    const validation = isPasswordStrong(password);
    return validation.isAccepted;
  }, (password) => {
    const validation = isPasswordStrong(password);
    return validation.message || "Password is not strong enough";
  }),
});

const verifyResetPasswordVerificationCodeSchema = z.object({
  email: z.string().min(1, "Email is required").refine(isEmailValid, "Invalid email format"),
  verificationCode: z.number("Invalid verification code format"),
});

const verifyDeleteAccountVerificationCodeSchema = z.object({
  verificationCode: z.number("Invalid verification code format"),
});

const verifyPersonalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").refine(isNameValid, "Invalid name format"),
  lastName: z.string().min(1, "Last name is required").refine(isNameValid, "Invalid name format"),
});

const verifyDemographicInfoSchema = z.object({
  gender: z.enum(config.GENDER, "Invalid gender"),
  dateOfBirth: z.string().refine(isDateValid, "Date of birth format is invalid"),
});

const verifySpecialityInfoSchema = z.object({
  speciality: z.array(z.string().refine(isObjectId, "Invalid speciality format"))
    .min(1, "Speciality must be at least one"),
});

const addUserEmailVerificationCodeSchema = z.object({
  userId: z.string().min(1, "User Id is required").refine(isObjectId, "User Id format is invalid"),
  email: z.string().min(1, "Email is required").refine(isEmailValid, "Email format is invalid"),
});

module.exports = {
  seekerGoogleSignupSchema,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyResetPasswordVerificationCodeSchema,
  verifyDeleteAccountVerificationCodeSchema,
  verifyPersonalInfoSchema,
  verifyDemographicInfoSchema,
  verifySpecialityInfoSchema,
  addUserEmailVerificationCodeSchema,
};
