const config = require("../config/config");
const utils = require("../utils/utils");

const checkSpeciality = (specialities) => {
  for (let i = 0; i < specialities.length; i++) {
    if (!utils.isObjectId(specialities[i])) {
      return false;
    }
  }

  return true;
};

const updateUserMainData = (userData) => {
  const { firstName, phone, gender, dateOfBirth } = userData;

  if (firstName && !utils.isNameValid(firstName))
    return {
      isAccepted: false,
      message: "Invalid name formate",
      field: "firstName",
    };

  if (phone && typeof phone != "number")
    return {
      isAccepted: false,
      message: "Invalid phone format",
      field: "phone",
    };

  if (gender && !config.GENDER.includes(gender))
    return { isAccepted: false, message: "Invalid gender", field: "gender" };

  if (dateOfBirth && !utils.isDateValid(dateOfBirth))
    return {
      isAccepted: false,
      message: "Date of birth format is invalid",
      field: "dateOfBirth",
    };

  return { isAccepted: true, message: "data is valid", data: userData };
};

const updateUserProfileImage = (userData) => {
  const { profileImageURL } = userData;

  if (!profileImageURL)
    return {
      isAccepted: false,
      message: "Image URL is required",
      field: "profileImageURL",
    };

  if (!utils.isValidURL(profileImageURL))
    return {
      isAccepted: false,
      message: "Image URL format is invalid",
      field: "profileImageURL",
    };

  return { isAccepted: true, message: "data is valid", data: userData };
};

const updateUserVisibility = (userData) => {
  const { isShow } = userData;

  if (typeof isShow != "boolean")
    return {
      isAccepted: false,
      message: "Invalid isShow format",
      field: "isShow",
    };

  return { isAccepted: true, message: "data is valid", data: userData };
};

const updateUserBlocked = (userData) => {
  const { isBlocked } = userData;

  if (typeof isBlocked != "boolean")
    return {
      isAccepted: false,
      message: "Invalid isBlocked format",
      field: "isBlocked",
    };

  return { isAccepted: true, message: "data is valid", data: userData };
};

const updateUserActivation = (userData) => {
  const { isDeactivated } = userData;

  if (typeof isDeactivated != "boolean")
    return {
      isAccepted: false,
      message: "Invalid isDeactivated format",
      field: "isDeactivated",
    };

  return { isAccepted: true, message: "data is valid", data: userData };
};

const updateUserSpeciality = (userData) => {
  const { speciality } = userData;

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

  return { isAccepted: true, message: "data is valid", data: userData };
};

const updateUserEmail = (userData) => {
  const { email } = userData;

  if (!email)
    return { isAccepted: false, message: "email is required", field: "email" };

  if (!utils.isEmailValid(email))
    return {
      isAccepted: false,
      message: "invalid email formate",
      field: "email",
    };

  return { isAccepted: true, message: "data is valid", data: userData };
};

const updateUserLanguage = (userData) => {
  const { lang } = userData;

  if (!lang)
    return {
      isAccepted: false,
      message: "language is required",
      field: "lang",
    };

  if (!config.LANGUAGES.includes(lang))
    return { isAccepted: false, message: "invalid lang format", field: "lang" };

  return { isAccepted: true, message: "data is valid", data: userData };
};

const updateUserPassword = (userData) => {
  const { password } = userData;

  if (!password)
    return {
      isAccepted: false,
      message: "password is required",
      field: "password",
    };

  if (typeof password != "string")
    return {
      isAccepted: false,
      message: "invalid password formate",
      field: "password",
    };

  return { isAccepted: true, message: "data is valid", data: userData };
};

const verifyAndUpdateUserPassword = (userData) => {
  const { newPassword, currentPassword } = userData;

  if (!newPassword)
    return {
      isAccepted: false,
      message: "new password is required",
      field: "newPassword",
    };

  if (typeof newPassword != "string")
    return {
      isAccepted: false,
      message: "invalid new password format",
      field: "newPassword",
    };

  if (!currentPassword)
    return {
      isAccepted: false,
      message: "current password is required",
      field: "currentPassword",
    };

  if (typeof currentPassword != "string")
    return {
      isAccepted: false,
      message: "invalid current password format",
      field: "currentPassword",
    };

  return { isAccepted: true, message: "data is valid", data: userData };
};

const addEmployeeUser = (userData) => {
  const { firstName, lastName, email, password, countryCode, phone, gender } =
    userData;

  if (!firstName)
    return {
      isAccepted: false,
      message: "First name is required",
      field: "firstName",
    };

  if (!utils.isNameValid(firstName))
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

  if (!utils.isNameValid(lastName))
    return {
      isAccepted: false,
      message: "Invalid name formate",
      field: "lastName",
    };

  if (!email)
    return { isAccepted: false, message: "Email is required", field: "email" };

  if (!utils.isEmailValid(email))
    return {
      isAccepted: false,
      message: "Email formate is invalid",
      field: "email",
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

  if (!password)
    return {
      isAccepted: false,
      message: "Password is required",
      field: "password",
    };

  if (!gender)
    return {
      isAccepted: false,
      message: "Gender is required",
      field: "gender",
    };

  if (!config.GENDER.includes(gender))
    return { isAccepted: false, message: "Invalid gender", field: "gender" };

  return { isAccepted: true, message: "data is valid", data: userData };
};

module.exports = {
  updateUserMainData,
  updateUserProfileImage,
  updateUserEmail,
  updateUserPassword,
  updateUserLanguage,
  verifyAndUpdateUserPassword,
  updateUserSpeciality,
  addEmployeeUser,
  updateUserActivation,
  updateUserVisibility,
  updateUserBlocked,
};
