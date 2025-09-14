const config = require("../config/config");
const UserModel = require("../models/UserModel");
const userValidation = require("../validations/users");
const bcrypt = require("bcrypt");
const { AppError } = require('../middlewares/errorHandler')

const getUser = async (request, response, next) => {
  try {
    const { userId } = request.params;

    const user = await UserModel.findById(userId);

    return response.status(200).json({
      accepted: true,
      user,
    });
  } catch (error) {
    next(error)
  }
};


const getUsers = async (request, response) => {
  try {
    let { name, email, phone, isVerified='true', isBlocked, isDeactivated, limit, page } = request.query;

    let searchQuery = {};

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    if (name) {
      searchQuery.firstName = { $regex: name, $options: "i" };
    }

    if (email) {
      searchQuery.email = { $regex: email, $options: "i" };
    }

    if (phone) {
      searchQuery.phone = { $regex: phone, $options: "i" };
    }

    if (isVerified == 'true') {
      searchQuery.isVerified = true
    } else if(isVerified == 'false') {
      searchQuery.isVerified = false
    }

    if (isBlocked == 'true') {
      searchQuery.isBlocked = true
    } else if(isBlocked == 'false') {
      searchQuery.isBlocked = false
    }

    if (isDeactivated == 'true') {
      searchQuery.isDeactivated = true
    } else if(isDeactivated == 'false') {
      searchQuery.isDeactivated = false
    }

    const users = await UserModel.aggregate([
      {
        $match: searchQuery,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          password: 0
        },
      },
    ]);

    const total = await UserModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
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


const updateUserMainData = async (request, response, next) => {
  try {
    const { userId } = request.params;

    const validatedData = userValidation.updateUserMainDataSchema.parse(request.body);
    
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      validatedData,
      { new: true }
    );

    updatedUser.password = undefined;

    return response.status(200).json({
      accepted: true,
      message: "User is updated successfuly!",
      user: updatedUser,
    });
  } catch (error) {
    next(error)
  }
};


const updateUserPassword = async (request, response, next) => {
  try {
    const { userId } = request.params;

    const validatedData = userValidation.updateUserPasswordSchema.parse(request.body);

    const { password } = validatedData;

    const user = await UserModel.findById(userId);

    if (bcrypt.compareSync(password, user.password)) {
      throw new AppError("New password must be diffrent from old password", 400)
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
      message: "Updated user password successfully!",
      user: updatedUser,
    });
  } catch (error) {
    next(error)
  }
};

const verifyAndUpdateUserPassword = async (request, response, next) => {
  try {
    const { userId } = request.params;

    const validatedData = userValidation.verifyAndUpdateUserPasswordSchema.parse(request.body);

    const { newPassword, currentPassword } = validatedData;

    if (newPassword == currentPassword) {
      throw new AppError("New password must be diffrent from old password", 400)
    }

    const user = await UserModel.findById(userId);

    if (!bcrypt.compareSync(currentPassword, user.password)) {
      throw new AppError("Current password is invalid", 400)
    }

    if (bcrypt.compareSync(newPassword, user.password)) {
      throw new AppError("Current password entered is already used", 400)
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
      message: "Updated user password successfully!",
      user: updatedUser,
    });
  } catch (error) {
    next(error)
  }
};

module.exports = {
  getUser,
  getUsers,
  updateUserMainData,
  updateUserPassword,
  verifyAndUpdateUserPassword,
};
