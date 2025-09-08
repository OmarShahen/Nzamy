const config = require("../config/config");
const UserModel = require("../models/UserModel");
const CounterModel = require("../models/CounterModel");
const userValidation = require("../validations/users");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const translations = require("../i18n/index");

const getUser = async (request, response) => {
  try {
    const { userId } = request.params;

    const user = await UserModel.findById(userId);

    return response.status(200).json({
      accepted: true,
      user,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const getExpertUser = async (request, response) => {
  try {
    const { userId } = request.params;

    const userList = await UserModel.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(userId), type: "EXPERT" },
      },
      {
        $lookup: {
          from: "specialities",
          localField: "speciality",
          foreignField: "_id",
          as: "speciality",
        },
      },
      {
        $lookup: {
          from: "specialities",
          localField: "subSpeciality",
          foreignField: "_id",
          as: "subSpeciality",
        },
      },
    ]);

    return response.status(200).json({
      accepted: true,
      user: userList[0],
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const getAppUsers = async (request, response) => {
  try {
    const users = await UserModel.find({
      roles: { $nin: ["EMPLOYEE"] },
      isVerified: true,
    })
      .select({ password: 0 })
      .sort({ lastLoginDate: -1, createdAt: -1 });

    return response.status(200).json({
      accepted: true,
      users,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const getUserSpeciality = async (request, response) => {
  try {
    const { userId } = request.params;

    const user = await UserModel.findById(userId).select({ password: 0 });

    const { speciality } = user;

    const specialities = await SpecialityModel.find({
      _id: { $in: speciality },
    });

    user.speciality = specialities;

    return response.status(200).json({
      accepted: true,
      user,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const updateUserMainData = async (request, response) => {
  try {
    const { userId } = request.params;

    const dataValidation = userValidation.updateUserMainData(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      request.body,
      { new: true }
    );

    updatedUser.password = undefined;

    return response.status(200).json({
      accepted: true,
      message: "User is updated successfuly!",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const updateUserProfileImage = async (request, response) => {
  try {
    const { userId } = request.params;

    const dataValidation = userValidation.updateUserProfileImage(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { profileImageURL } = request.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { profileImageURL },
      { new: true }
    );

    updatedUser.password = undefined;

    return response.status(200).json({
      accepted: true,
      message: "Updated user profile image successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const updateUserSpeciality = async (request, response) => {
  try {
    const { userId } = request.params;

    const dataValidation = userValidation.updateUserSpeciality(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { speciality } = request.body;

    const specialities = await SpecialityModel.find({
      _id: { $in: speciality },
    });

    if (specialities.length != speciality.length) {
      return response.status(400).json({
        accepted: false,
        message: "speciality Id is not registered",
        field: "speciality",
      });
    }

    const newUserData = {
      speciality: specialities.map((special) => special._id),
    };

    const updatedUser = await UserModel.findByIdAndUpdate(userId, newUserData, {
      new: true,
    });

    updatedUser.password = undefined;

    return response.status(200).json({
      accepted: true,
      message: translations[request.query.lang]["Updated user successfully!"],
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const updateUserEmail = async (request, response) => {
  try {
    const { userId } = request.params;

    const dataValidation = userValidation.updateUserEmail(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { email } = request.body;

    const emailList = await UserModel.find({ email });
    if (emailList.length != 0 && !emailList[0]._id.equals(userId)) {
      return response.status(400).json({
        accepted: false,
        message: "email is already registered",
        field: "email",
      });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { email },
      { new: true }
    );

    updatedUser.password = undefined;

    return response.status(200).json({
      accepted: true,
      message: "updated user email successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const updateUserLanguage = async (request, response) => {
  try {
    const { userId } = request.params;
    const { lang } = request.body;

    const dataValidation = userValidation.updateUserLanguage(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { lang },
      { new: true }
    );

    return response.status(200).json({
      accepted: true,
      message:
        translations[request.query.lang]["Updated language successfully!"],
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const updateUserPassword = async (request, response) => {
  try {
    const { userId } = request.params;

    const dataValidation = userValidation.updateUserPassword(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { password } = request.body;

    const user = await UserModel.findById(userId);

    if (bcrypt.compareSync(password, user.password)) {
      return response.status(400).json({
        accepted: false,
        message:
          translations[request.query.lang][
            "New password must be diffrent from old password"
          ],
        field: "password",
      });
    }

    const newPassword = bcrypt.hashSync(password, config.SALT_ROUNDS);

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { password: newPassword },
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const verifyAndUpdateUserPassword = async (request, response) => {
  try {
    const { userId } = request.params;

    const dataValidation = userValidation.verifyAndUpdateUserPassword(
      request.body
    );
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { newPassword, currentPassword } = request.body;

    if (newPassword == currentPassword) {
      return response.status(400).json({
        accepted: false,
        message:
          translations[request.query.lang][
            "New password must be diffrent from old password"
          ],
        field: "newPassword",
      });
    }

    const user = await UserModel.findById(userId);

    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return response.status(400).json({
        accepted: false,
        message:
          translations[request.query.lang]["Current password is invalid"],
        field: "currentPassword",
      });
    }

    if (bcrypt.compareSync(newPassword, user.password)) {
      return response.status(400).json({
        accepted: false,
        message:
          translations[request.query.lang][
            "Current password entered is already used"
          ],
        field: "newPassword",
      });
    }

    const newUserPassword = bcrypt.hashSync(newPassword, config.SALT_ROUNDS);

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { password: newUserPassword },
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const deleteUser = async (request, response) => {
  try {
    const { userId } = request.params;

    const user = await UserModel.findById(userId);

    if (user.roles.includes("DOCTOR") || user.roles.includes("OWNER")) {
      return response.status(400).json({
        accepted: false,
        message: `This user type cannot be deleted`,
        field: "userId",
      });
    }

    const deleteUser = await UserModel.findByIdAndDelete(userId);

    return response.status(200).json({
      accepted: true,
      message: "user deleted successfully!",
      user: deleteUser,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const addEmployeeUser = async (request, response) => {
  try {
    const dataValidation = userValidation.addEmployeeUser(request.body);
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

    const userPassword = bcrypt.hashSync(password, config.SALT_ROUNDS);

    const counter = await CounterModel.findOneAndUpdate(
      { name: "user" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const userData = {
      userId: counter.value,
      isEmployee: true,
      isVerified: true,
      ...request.body,
      password: userPassword,
      roles: ["EMPLOYEE"],
    };
    const userObj = new UserModel(userData);
    const newUser = await userObj.save();

    return response.status(200).json({
      accepted: true,
      message: "User with employee roles is added successfully!",
      user: newUser,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const updateUserVisibility = async (request, response) => {
  try {
    const { userId } = request.params;

    const dataValidation = userValidation.updateUserVisibility(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { isShow } = request.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { isShow },
      { new: true }
    );

    updatedUser.password = undefined;

    return response.status(200).json({
      accepted: true,
      message: "Updated user visibility successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const updateUserBlocked = async (request, response) => {
  try {
    const { userId } = request.params;

    const dataValidation = userValidation.updateUserBlocked(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { isBlocked } = request.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { isBlocked },
      { new: true }
    );

    updatedUser.password = undefined;

    return response.status(200).json({
      accepted: true,
      message: "Updated user blocked successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const updateUserActivation = async (request, response) => {
  try {
    const { userId } = request.params;

    const dataValidation = userValidation.updateUserActivation(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { isDeactivated } = request.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { isDeactivated },
      { new: true }
    );

    updatedUser.password = undefined;

    return response.status(200).json({
      accepted: true,
      message: "Updated user activation successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getUser,
  getExpertUser,
  getAppUsers,
  getUserSpeciality,
  updateUserMainData,
  updateUserSpeciality,
  updateUserEmail,
  updateUserLanguage,
  updateUserPassword,
  updateUserProfileImage,
  verifyAndUpdateUserPassword,
  deleteUser,
  addEmployeeUser,
  updateUserVisibility,
  updateUserBlocked,
  updateUserActivation,
};
