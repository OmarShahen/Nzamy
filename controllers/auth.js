const config = require("../config/config");
const authValidation = require("../validations/auth");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const UserModel = require("../models/UserModel");
const CounterModel = require("../models/CounterModel");
const EmailVerificationModel = require("../models/EmailVerificationModel");
const { generateVerificationCode } = require("../utils/random-number");
const utils = require("../utils/utils");
const {
  sendForgotPasswordVerificationCode,
} = require("../mails/forgot-password");
const { sendDeleteAccountCode } = require("../mails/delete-account");
const { sendVerificationCode } = require("../mails/verification-code");
const translations = require("../i18n/index");
const axios = require("axios");

const signup = async (request, response, next) => {
  try {
    const dataValidation = authValidation.signup(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { email, password } = request.body;

    const emailList = await UserModel.find({ email, isVerified: true });
    if (emailList.length != 0) {
      return response.status(400).json({
        accepted: false,
        message: "Email is already registered",
        field: "email",
      });
    }

    const counter = await CounterModel.findOneAndUpdate(
      { name: "user" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const userPassword = bcrypt.hashSync(password, config.SALT_ROUNDS);
    let userData = {
      ...request.body,
      userId: counter.value,
      password: userPassword,
    };
    userData._id = undefined;

    const userObj = new UserModel(userData);
    const newUser = await userObj.save();

    const verificationCode = generateVerificationCode();
    const emailVerificationData = {
      userId: newUser._id,
      code: verificationCode,
    };
    const emailVerificationObj = new EmailVerificationModel(
      emailVerificationData
    );

    await emailVerificationObj.save();
    await sendVerificationCode({ receiverEmail: email, verificationCode });

    newUser.password = undefined;

    return response.status(200).json({
      accepted: true,
      message: "Created account successfully!",
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (request, response, next) => {
  try {
    const data = authValidation.loginSchema.parse(request.body);

    const { email, password } = data;

    const user = await UserModel.findOne({ email, isVerified: true });

    if (!user) {
      return response.status(400).json({
        accepted: false,
        message:
          "Invalid email or password. Please check your credentials and try again",
        field: "email",
      });
    }

    if (user.isGoogle) {
      return response.status(400).json({
        accepted: false,
        message: "your account was created using a different login method",
        field: "email",
      });
    }

    if (user.isBlocked) {
      return response.status(400).json({
        accepted: false,
        message: "Account is blocked",
        field: "email",
      });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return response.status(400).json({
        accepted: false,
        message:
          "Invalid email or password. Please check your credentials and try again",
        field: "password",
      });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      { lastLoginDate: new Date() },
      { new: true }
    );

    updatedUser.password = undefined;

    const token = jwt.sign(user._doc, config.SECRET_KEY, { expiresIn: "30d" });

    return response.status(200).json({
      accepted: true,
      user: updatedUser,
      token: token,
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmailVerificationCode = async (request, response, next) => {
  try {
    const { userId, verificationCode } = request.params;

    const emailVerificationList = await EmailVerificationModel.find({
      userId,
      code: verificationCode,
    });
    if (emailVerificationList.length == 0) {
      return response.status(400).json({
        accepted: false,
        message: "There is no verification code registered",
        field: "code",
      });
    }

    const updatedUserPromise = UserModel.findByIdAndUpdate(
      userId,
      { isVerified: true },
      { new: true }
    );

    const deleteCodesPromise = EmailVerificationModel.deleteMany({ userId });

    const [updatedUser, deleteCodes] = await Promise.all([
      updatedUserPromise,
      deleteCodesPromise,
    ]);

    updatedUser.password = undefined;

    const token = jwt.sign(updatedUser._doc, config.SECRET_KEY, {
      expiresIn: "30d",
    });

    return response.status(200).json({
      accepted: true,
      message: "Account is activated successfully!",
      user: updatedUser,
      deletedCodes: deleteCodes.deletedCount,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (request, response, next) => {
  try {
    const { email } = request.params;

    if (!utils.isEmailValid(email)) {
      return response.status(400).json({
        accepted: false,
        message: "email format is invalid",
        field: "email",
      });
    }

    const emailList = await UserModel.find({ email, isVerified: true });
    if (emailList.length != 0) {
      return response.status(400).json({
        accepted: false,
        message: "email is already registered",
        field: "email",
      });
    }

    return response.status(200).json({
      accepted: true,
      email,
    });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (request, response, next) => {
  try {
    const { accessToken } = request.body;

    const googleResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const { email } = googleResponse.data;

    const user = await UserModel.findOne({
      email,
      isVerified: true,
    });

    if (!user) {
      return response.status(400).json({
        accepted: false,
        message: "this email is not registered",
        field: "email",
      });
    }

    if (!user.isGoogle) {
      return response.status(400).json({
        accepted: false,
        message: "your account was created using a different login method",
        field: "email",
      });
    }

    const token = jwt.sign(user._doc, config.SECRET_KEY, { expiresIn: "365d" });

    return response.status(200).json({
      accepted: true,
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const googleSignup = async (request, response, next) => {
  try {
    const { accessToken } = request.body;

    const googleResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const { sub, name, picture, email } = googleResponse.data;

    const userEmail = await UserModel.findOne({ email, isVerified: true });
    if (userEmail) {
      return response.status(400).json({
        accepted: false,
        message: "Email is already registered",
        field: "email",
      });
    }

    const counter = await CounterModel.findOneAndUpdate(
      { name: "user" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const userData = {
      userId: counter.value,
      firstName: name,
      email,
      imageURL: picture,
      googleId: sub,
      isGoogle: true,
      isVerified: true,
    };

    const userObj = new UserModel(userData);
    const newUser = await userObj.save();

    const token = jwt.sign(newUser._doc, config.SECRET_KEY, {
      expiresIn: "365d",
    });

    return response.status(200).json({
      accepted: true,
      user: newUser,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const setUserVerified = async (request, response, next) => {
  try {
    const { userId } = request.params;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { isVerified: true },
      { new: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "account verified successfully!",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const addUserEmailVerificationCode = async (request, response, next) => {
  try {
    const { userId } = request.params;

    if (!utils.isObjectId(userId)) {
      return response.status(400).json({
        accepted: false,
        message: "user Id format is invalid",
        field: "userId",
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return response.status(400).json({
        accepted: false,
        message: "user Id does not exist",
        field: "userId",
      });
    }

    if (user.isVerified) {
      return response.status(400).json({
        accepted: false,
        message: "user account is already verified",
        field: "userId",
      });
    }

    const verificationCode = generateVerificationCode();
    const emailVerificationData = { userId, code: verificationCode };
    const emailVerificationObj = new EmailVerificationModel(
      emailVerificationData
    );

    await emailVerificationObj.save();
    await sendVerificationCode({ receiverEmail: user.email, verificationCode });

    return response.status(200).json({
      accepted: true,
      message: "sended verification code successfully!",
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (request, response, next) => {
  try {
    const dataValidation = authValidation.forgotPassword(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { email } = request.body;

    const emailList = await UserModel.find({ email, isVerified: true });
    if (emailList.length == 0) {
      return response.status(400).json({
        accepted: false,
        message: translations[request.query.lang]["Email is not registered"],
        field: "email",
      });
    }

    const user = emailList[0];
    const verificationCode = generateVerificationCode();
    const verificationData = {
      resetPassword: {
        verificationCode: verificationCode,
        expirationDate: Date.now() + 3600000, // 1 hour
      },
    };

    const updatedUserPromise = UserModel.findByIdAndUpdate(
      user._id,
      verificationData,
      { new: true }
    );

    const forgotPasswordData = { receiverEmail: email, verificationCode };
    const sendEmailPromise =
      sendForgotPasswordVerificationCode(forgotPasswordData);

    const [updatedUser, sendEmail] = await Promise.all([
      updatedUserPromise,
      sendEmailPromise,
    ]);

    if (!sendEmail.isSent) {
      return response.status(400).json({
        accepted: false,
        message:
          translations[request.query.lang][
            "There was a problem sending your email"
          ],
        field: "isSent",
      });
    }

    return response.status(200).json({
      accepted: true,
      message: "Verification code is sent successfully!",
    });
  } catch (error) {
    next(error);
  }
};

const sendUserDeleteAccountVerificationCode = async (
  request,
  response,
  next
) => {
  try {
    const { userId } = request.params;

    const user = await UserModel.findById(userId);

    if (!user.roles.includes("STAFF")) {
      return response.status(400).json({
        accepted: false,
        message:
          translations[request.query.lang][
            "Your account is with a role that cannot be deleted"
          ],
        field: "userId",
      });
    }

    const invoices = await InvoiceModel.find({ creatorId: userId });
    if (invoices.length != 0) {
      return response.status(400).json({
        accepted: false,
        message: "Data registered with the account",
        field: "userId",
      });
    }

    const verificationCode = generateVerificationCode();
    const verificationData = {
      deleteAccount: {
        verificationCode: verificationCode,
        expirationDate: Date.now() + 3600000, // 1 hour
      },
    };

    const updatedUserPromise = UserModel.findByIdAndUpdate(
      user._id,
      verificationData,
      { new: true }
    );

    const deleteAccountData = { receiverEmail: user.email, verificationCode };
    const sendEmailPromise = sendDeleteAccountCode(deleteAccountData);

    const [updatedUser, sendEmail] = await Promise.all([
      updatedUserPromise,
      sendEmailPromise,
    ]);

    if (!sendEmail.isSent) {
      return response.status(400).json({
        accepted: false,
        message:
          translations[request.query.lang][
            "There was a problem sending your email"
          ],
        field: "isSent",
      });
    }

    return response.status(200).json({
      accepted: true,
      message: "Verification code is sent successfully!",
    });
  } catch (error) {
    next(error);
  }
};

const verifyDeleteAccountVerificationCode = async (request, response, next) => {
  try {
    const { userId, verificationCode } = request.params;

    const userList = await UserModel.find({
      _id: userId,
      isVerified: true,
      "deleteAccount.verificationCode": verificationCode,
      "deleteAccount.expirationDate": { $gt: Date.now() },
    });

    if (userList.length == 0) {
      return response.status(400).json({
        accepted: false,
        message:
          translations[request.query.lang][
            "Verification code is not registered"
          ],
        field: "verificationCode",
      });
    }

    const user = userList[0];

    if (user.roles.includes("STAFF")) {
      const deleteClinicRequests = await ClinicRequestModel.deleteMany({
        userId,
      });
    }

    const deletedUser = await UserModel.findByIdAndDelete(userId);

    return response.status(200).json({
      accepted: true,
      message: "User account is deleted successfully!",
      user: deletedUser,
    });
  } catch (error) {
    next(error);
  }
};

const verifyResetPasswordVerificationCode = async (request, response, next) => {
  try {
    const dataValidation = authValidation.verifyResetPasswordVerificationCode(
      request.body
    );
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { email, verificationCode } = request.body;

    const userList = await UserModel.find({
      email,
      isVerified: true,
      "resetPassword.verificationCode": verificationCode,
      "resetPassword.expirationDate": { $gt: Date.now() },
    });

    if (userList.length == 0) {
      return response.status(400).json({
        accepted: false,
        message:
          translations[request.query.lang][
            "Verification code is not registered"
          ],
        field: "verificationCode",
      });
    }

    return response.status(200).json({
      accepted: true,
      message: "verification code is verified!",
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (request, response, next) => {
  try {
    const dataValidation = authValidation.resetPassword(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { email, verificationCode, password } = request.body;

    const userList = await UserModel.find({
      email,
      isVerified: true,
      "resetPassword.verificationCode": verificationCode,
      "resetPassword.expirationDate": { $gt: Date.now() },
    });

    if (userList.length == 0) {
      return response.status(400).json({
        accepted: false,
        message:
          translations[request.query.lang][
            "Verification code is not registered"
          ],
        field: "verificationCode",
      });
    }

    const user = userList[0];
    const userId = user._id;

    if (bcrypt.compareSync(password, user.password)) {
      return response.status(400).json({
        accepted: false,
        message:
          translations[request.query.lang][
            "Enter a new password to the current one"
          ],
        field: "password",
      });
    }

    const newUserPassword = bcrypt.hashSync(password, config.SALT_ROUNDS);

    const updateUserData = {
      password: newUserPassword,
      resetPassword: { verificationCode: null, expirationDate: null },
    };

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      updateUserData,
      { new: true }
    );

    updatedUser.password = undefined;

    return response.status(200).json({
      accepted: true,
      message:
        translations[request.query.lang]["Updated user password successfully!"],
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  signup,
  verifyEmailVerificationCode,
  verifyEmail,
  setUserVerified,
  addUserEmailVerificationCode,
  forgotPassword,
  resetPassword,
  verifyResetPasswordVerificationCode,
  sendUserDeleteAccountVerificationCode,
  verifyDeleteAccountVerificationCode,
  googleLogin,
  googleSignup,
};
