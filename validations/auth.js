const validator = require("../utils/utils");
const config = require("../config/config");

const seekerGoogleSignup = (userData) => {
  const {
    firstName,
    email,
    password,
    countryCode,
    phone,
    gender,
    dateOfBirth,
    timeZone,
    profileImageURL,
  } = userData;

  if (!firstName)
    return {
      isAccepted: false,
      message: "Name is required",
      field: "firstName",
    };

  if (!validator.isNameValid(firstName))
    return {
      isAccepted: false,
      message: "Invalid name formate",
      field: "firstName",
    };

  if (!email)
    return { isAccepted: false, message: "Email is required", field: "email" };

  if (!validator.isEmailValid(email))
    return {
      isAccepted: false,
      message: "Email formate is invalid",
      field: "email",
    };

  if (!password)
    return {
      isAccepted: false,
      message: "Password is required",
      field: "password",
    };

  if (typeof password != "string")
    return {
      isAccepted: false,
      message: "Passowrd format is invalid",
      field: "password",
    };

  const validatedPassword = validator.isPasswordStrong(password);

  if (!validatedPassword.isAccepted)
    return {
      isAccepted: false,
      message: validatedPassword.message,
      field: "password",
    };

  if (!countryCode)
    return {
      isAccepted: false,
      message: "Country code is required",
      field: "countryCode",
    };

  if (typeof countryCode != "number")
    return {
      isAccepted: false,
      message: "Country code format is invalid",
      field: "countryCode",
    };

  if (!phone)
    return { isAccepted: false, message: "Phone is required", field: "phone" };

  if (typeof phone != "number")
    return {
      isAccepted: false,
      message: "Phone format is invalid",
      field: "phone",
    };

  if (!gender)
    return {
      isAccepted: false,
      message: "Gender is required",
      field: "gender",
    };

  if (!config.GENDER.includes(gender))
    return { isAccepted: false, message: "Invalid gender", field: "gender" };

  if (!dateOfBirth)
    return {
      isAccepted: false,
      message: "Date of birth",
      field: "dateOfBirth",
    };

  if (timeZone && typeof timeZone != "string")
    return {
      isAccepted: false,
      message: "time zone format is invalid",
      field: "timeZone",
    };

  if (!validator.isDateTimeValid(dateOfBirth))
    return {
      isAccepted: false,
      message: "Date of birth format is invalid",
      field: "dateOfBirth",
    };

  if (profileImageURL && !validator.isValidURL(profileImageURL))
    return {
      isAccepted: false,
      message: "Profile image URL is invalid",
      field: "profileImageURL",
    };

  return { isAccepted: true, message: "data is valid", data: userData };
};

const signup = (userData) => {
  const { email, password } = userData;

  if (!email)
    return { isAccepted: false, message: "Email is required", field: "email" };

  if (!validator.isEmailValid(email))
    return {
      isAccepted: false,
      message: "Email formate is invalid",
      field: "email",
    };

  if (!password)
    return {
      isAccepted: false,
      message: "Password is required",
      field: "password",
    };

  const validatedPassword = validator.isPasswordStrong(password);

  if (!validatedPassword.isAccepted)
    return {
      isAccepted: false,
      message: validatedPassword.message,
      field: "password",
    };

  return { isAccepted: true, message: "data is valid", data: userData };
};

const login = (userData) => {
  const { email, password } = userData;

  if (!email)
    return { isAccepted: false, message: "Email is required", field: "email" };

  if (!validator.isEmailValid(email))
    return {
      isAccepted: false,
      message: "Invalid email formate",
      field: "email",
    };

  if (!password)
    return {
      isAccepted: false,
      message: "Password is required",
      field: "password",
    };

  return { isAccepted: true, message: "data is valid", data: userData };
};

const forgotPassword = (emailData) => {
  const { email } = emailData;

  if (!email)
    return { isAccepted: false, message: "Email is required", field: "email" };

  if (!validator.isEmailValid(email))
    return {
      isAccepted: false,
      message: "Invalid email format",
      field: "email",
    };

  return { isAccepted: true, message: "data is valid", data: emailData };
};

const resetPassword = (resetData) => {
  const { email, verificationCode, password } = resetData;

  if (!email)
    return { isAccepted: false, message: "Email is required", field: "email" };

  if (!validator.isEmailValid(email))
    return {
      isAccepted: false,
      message: "Invalid email format",
      field: "email",
    };

  if (!verificationCode)
    return {
      isAccepted: false,
      message: "Verification code is required",
      field: "verificationCode",
    };

  if (typeof verificationCode != "number")
    return {
      isAccepted: false,
      message: "Invalid verification code format",
      field: "verificationCode",
    };

  if (!password)
    return {
      isAccepted: false,
      message: "Password is required",
      field: "password",
    };

  if (typeof password != "string")
    return {
      isAccepted: false,
      message: "Invalid password format",
      field: "password",
    };

  const validatedPassword = validator.isPasswordStrong(password);

  if (!validatedPassword.isAccepted)
    return {
      isAccepted: false,
      message: validatedPassword.message,
      field: "password",
    };

  return { isAccepted: true, message: "data is valid", data: resetData };
};

const verifyResetPasswordVerificationCode = (resetData) => {
  const { email, verificationCode } = resetData;

  if (!email)
    return { isAccepted: false, message: "Email is required", field: "email" };

  if (!validator.isEmailValid(email))
    return {
      isAccepted: false,
      message: "Invalid email format",
      field: "email",
    };

  if (!verificationCode)
    return {
      isAccepted: false,
      message: "Verification code is required",
      field: "verificationCode",
    };

  if (typeof verificationCode != "number")
    return {
      isAccepted: false,
      message: "Invalid verification code format",
      field: "verificationCode",
    };

  return { isAccepted: true, message: "data is valid", data: resetData };
};

const verifyDeleteAccountVerificationCode = (verificationData) => {
  const { verificationCode } = verificationData;

  console.log(verificationData);

  if (!verificationCode)
    return {
      isAccepted: false,
      message: "Verification code is required",
      field: "verificationCode",
    };

  if (typeof verificationCode != "number")
    return {
      isAccepted: false,
      message: "Invalid verification code format",
      field: "verificationCode",
    };

  return { isAccepted: true, message: "data is valid", data: verificationData };
};

const verifyPersonalInfo = (verifyData) => {
  const { firstName, lastName } = verifyData;

  if (!firstName)
    return {
      isAccepted: false,
      message: "First name is required",
      field: "firstName",
    };

  if (!validator.isNameValid(firstName))
    return {
      isAccepted: false,
      message: "Invalid name formate",
      field: "firstName",
    };

  if (!lastName)
    return {
      isAccepted: false,
      message: "Last name is required",
      field: "lastName",
    };

  if (!validator.isNameValid(lastName))
    return {
      isAccepted: false,
      message: "Invalid name formate",
      field: "lastName",
    };

  return { isAccepted: true, message: "data is valid", data: verifyData };
};

const verifyDemographicInfo = (verifyData) => {
  const { gender, dateOfBirth } = verifyData;

  if (!gender)
    return {
      isAccepted: false,
      message: "Gender is required",
      field: "gender",
    };

  if (!config.GENDER.includes(gender))
    return { isAccepted: false, message: "Invalid gender", field: "gender" };

  if (!dateOfBirth)
    return {
      isAccepted: false,
      message: "Date of birth",
      field: "dateOfBirth",
    };

  if (!validator.isDateValid(dateOfBirth))
    return {
      isAccepted: false,
      message: "Date of birth format is invalid",
      field: "dateOfBirth",
    };

  return { isAccepted: true, message: "data is valid", data: verifyData };
};

const verifySpecialityInfo = (verifyData) => {
  const { speciality } = verifyData;

  if (!speciality)
    return {
      isAccepted: false,
      message: "Speciality is required",
      field: "speciality",
    };

  if (!Array.isArray(speciality))
    return {
      isAccepted: false,
      message: "Speciality must be a list",
      field: "speciality",
    };

  if (speciality.length == 0)
    return {
      isAccepted: false,
      message: "Speciality must be atleast one",
      field: "speciality",
    };

  if (!checkSpeciality(speciality))
    return {
      isAccepted: false,
      message: "Invalid speciality format",
      field: "speciality",
    };

  return { isAccepted: true, message: "data is valid", data: verifyData };
};

const addUserEmailVerificationCode = (userVerificationData) => {
  const { userId, email } = userVerificationData;

  if (!userId)
    return {
      isAccepted: false,
      message: "User Id is required",
      field: "userId",
    };

  if (!validator.isObjectId(userId))
    return {
      isAccepted: false,
      message: "User Id format is invalid",
      field: "userId",
    };

  if (!email)
    return { isAccepted: false, message: "Email is required", field: "email" };

  if (!validator.isEmailValid(email))
    return {
      isAccepted: false,
      message: "Email format is invalid",
      field: "email",
    };

  return {
    isAccepted: true,
    message: "data is valid",
    data: userVerificationData,
  };
};

module.exports = {
  signup,
  seekerGoogleSignup,
  login,
  verifyPersonalInfo,
  verifyDemographicInfo,
  verifySpecialityInfo,
  addUserEmailVerificationCode,
  forgotPassword,
  resetPassword,
  verifyResetPasswordVerificationCode,
  verifyDeleteAccountVerificationCode,
};
