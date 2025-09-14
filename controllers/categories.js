const CategoryModel = require("../models/CategoryModel");
const UserModel = require("../models/UserModel");
const StoreModel = require("../models/StoreModel");
const config = require("../config/config");
const categoryValidation = require("../validations/categories");
const mongoose = require("mongoose");
const { AppError } = require("../middlewares/errorHandler");

const getCategories = async (request, response, next) => {
  try {
    let { userId, storeId, name, limit, page } = request.query;

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    let searchQuery = {};

    if (userId) {
      searchQuery.userId = new mongoose.Types.ObjectId(userId);
    }

    if (storeId) {
      searchQuery.storeId = new mongoose.Types.ObjectId(storeId);
    }

    if (name) {
      searchQuery.name = { $regex: name, $options: "i" };
    }

    const categories = await CategoryModel.aggregate([
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
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "stores",
          localField: "storeId",
          foreignField: "_id",
          as: "store",
        },
      },
      {
        $project: {
          "user.password": 0,
        },
      },
    ]);

    categories.forEach((category) => {
      category.user = category.user[0];
      category.store = category.store[0];
    });

    const total = await CategoryModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      categories,
    });
  } catch (error) {
    next(error)
  }
};

const addCategory = async (request, response, next) => {
  try {
    const validatedData = categoryValidation.addCategorySchema.parse(request.body);

    const { userId, storeId, name } = validatedData;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("user Id is not registered", 400)
    }

    const store = await StoreModel.findById(storeId);
    if (!store) {
      throw new AppError("store Id is not registered", 400)
    }

    const categoryCount = await CategoryModel.count({ userId, storeId, name });
    if (categoryCount != 0) {
      throw new AppError("category name is already registered", 400)
    }

    const categoryObj = new CategoryModel(validatedData);
    const newCategory = await categoryObj.save();

    return response.status(200).json({
      accepted: true,
      message: "category is added successfully!",
      category: newCategory,
    });
  } catch (error) {
    next(error)
  }
};

const updateCategory = async (request, response, next) => {
  try {
    const validatedData = categoryValidation.updateCategorySchema.parse(request.body);

    const { categoryId } = request.params;
    const { name } = validatedData;

    const category = await CategoryModel.findById(categoryId);
    if (category.name != name) {
      const totalNames = await CategoryModel.countDocuments({
        userId: category.userId,
        storeId: category.storeId,
        name,
      });
      if (totalNames != 0) {
        throw new AppError("category name is already registered", 400)
      }
    }

    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      categoryId,
      request.body,
      { new: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "category is updated successfully!",
      category: updatedCategory,
    });
  } catch (error) {
    next(error)
  }
};

const deleteCategory = async (request, response, next) => {
  try {
    const { categoryId } = request.params;

    const deletedCategory = await CategoryModel.findByIdAndDelete(categoryId);

    return response.status(200).json({
      accepted: true,
      message: "deleted category successfully!",
      category: deletedCategory,
    });
  } catch (error) {
    next(error)
  }
};

module.exports = { getCategories, addCategory, updateCategory, deleteCategory };
