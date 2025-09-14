const config = require("../config/config");
const authValidation = require("../validations/auth");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const UserModel = require("../models/UserModel");
const EmailVerificationModel = require("../models/EmailVerificationModel");
const { generateVerificationCode } = require("../utils/random-number");
const utils = require("../utils/utils");
const {
  sendForgotPasswordVerificationCode,
} = require("../mails/forgot-password");
const { sendVerificationCode } = require("../mails/verification-code");
const axios = require("axios");
const { AppError } = require("../middlewares/errorHandler");

const signup = async (request, response, next) => {
  try {
    const validatedData = authValidation.signupSchema.parse(request.body);

    const { email, password } = validatedData;

    const emailList = await UserModel.find({ email, isVerified: true });
    if (emailList.length != 0) {
      throw new AppError("Email is already registered", 400)
    }

    const userPassword = bcrypt.hashSync(password, config.SALT_ROUNDS);
    let userData = {
      ...validatedData,
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
    const validatedData = authValidation.loginSchema.parse(request.body);

    const { email, password } = validatedData;

    const user = await UserModel.findOne({ email, isVerified: true });

    if (!user) {
      throw new AppError("Invalid email or password. Please check your credentials and try again", 400)
    }

    if (user.isGoogle) {
      throw new AppError("your account was created using a different login method", 400)
    }

    if (user.isBlocked) {
      throw new AppError("Account is blocked", 400)
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new AppError("Invalid email or password. Please check your credentials and try again", 400)
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      { lastLoginDate: new Date() },
      { new: true }
    );

    updatedUser.password = undefined;

    const accessTokenData = {
      _id: user._id,      
    }

    const token = jwt.sign(accessTokenData, config.SECRET_KEY, { expiresIn: "30d" });

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
      throw new AppError("There is no verification code registered", 400)
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
      throw new AppError("this email is not registered", 400)
    }

    if (!user.isGoogle) {
      throw new AppError("your account was created using a different login method", 400)
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
      throw new AppError("Email is already registered", 400)
    }

    const userData = {
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


const addUserEmailVerificationCode = async (request, response, next) => {
  try {
    const { userId } = request.params;

    if (!utils.isObjectId(userId)) {
      throw new AppError("user Id format is invalid", 400)
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("user Id does not exist", 400)
    }

    if (user.isVerified) {
      throw new AppError("user account is already verified", 400)
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
    const validatedData = authValidation.forgotPasswordSchema.parse(request.body);

    const { email } = validatedData;

    const emailList = await UserModel.find({ email, isVerified: true });
    if (emailList.length == 0) {
      throw new AppError("Email is not registered", 400)
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
      throw new AppError("There was a problem sending your email", 400)
    }

    return response.status(200).json({
      accepted: true,
      message: "Verification code is sent successfully!",
    });
  } catch (error) {
    next(error);
  }
};


const verifyResetPasswordVerificationCode = async (request, response, next) => {
  try {
    const validatedData = authValidation.verifyResetPasswordVerificationCodeSchema.parse(
      request.body
    );

    const { email, verificationCode } = validatedData;

    const userList = await UserModel.find({
      email,
      isVerified: true,
      "resetPassword.verificationCode": verificationCode,
      "resetPassword.expirationDate": { $gt: Date.now() },
    });

    if (userList.length == 0) {
      throw new AppError("Verification code is not registered", 400)
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
    const validatedData = authValidation.resetPasswordSchema.parse(request.body);

    const { email, verificationCode, password } = validatedData;

    const userList = await UserModel.find({
      email,
      isVerified: true,
      "resetPassword.verificationCode": verificationCode,
      "resetPassword.expirationDate": { $gt: Date.now() },
    });

    if (userList.length == 0) {
      throw new AppError("Verification code is not registered", 400)
    }

    const user = userList[0];
    const userId = user._id;

    if (bcrypt.compareSync(password, user.password)) {
      throw new AppError("Enter a new password to the current one", 400)
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
      message: "Updated user password successfully!",
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
  addUserEmailVerificationCode,
  forgotPassword,
  resetPassword,
  verifyResetPasswordVerificationCode,
  googleLogin,
  googleSignup,
};
