const CategoryModel = require("../models/CategoryModel");
const UserModel = require("../models/UserModel");
const StoreModel = require("../models/StoreModel");
const config = require("../config/config");
const categoryValidation = require("../validations/categories");
const mongoose = require("mongoose");

const getCategories = async (request, response) => {
  try {
    let { userId, storeId, name, limit, page } = request.query;

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    let searchQuery = {};

    if (userId) {
      searchQuery.userId = mongoose.Types.ObjectId(userId);
    }

    if (storeId) {
      searchQuery.storeId = mongoose.Types.ObjectId(storeId);
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const addCategory = async (request, response) => {
  try {
    const dataValidation = categoryValidation.addCategory(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { userId, storeId, name } = request.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return response.status(400).json({
        accepted: false,
        message: "user Id is not registered",
        field: "userId",
      });
    }

    const store = await StoreModel.findById(storeId);
    if (!store) {
      return response.status(400).json({
        accepted: false,
        message: "store Id is not registered",
        field: "storeId",
      });
    }

    const categoryCount = await CategoryModel.count({ userId, storeId, name });
    if (categoryCount != 0) {
      return response.status(400).json({
        accepted: false,
        message: "category name is already registered",
        field: "name",
      });
    }

    const categoryData = { ...request.body };
    const categoryObj = new CategoryModel(categoryData);
    const newCategory = await categoryObj.save();

    return response.status(200).json({
      accepted: true,
      message: "category is added successfully!",
      category: newCategory,
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

const updateCategory = async (request, response) => {
  try {
    const dataValidation = categoryValidation.updateCategory(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { categoryId } = request.params;
    const { name } = request.body;

    const category = await CategoryModel.findById(categoryId);
    if (category.name != name) {
      const totalNames = await CategoryModel.countDocuments({
        userId: category.userId,
        storeId: category.storeId,
        name,
      });
      if (totalNames != 0) {
        return response.status(400).json({
          accepted: false,
          message: "category name is already registered",
          field: "name",
        });
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const deleteCategory = async (request, response) => {
  try {
    const { categoryId } = request.params;

    const deletedCategory = await CategoryModel.findByIdAndDelete(categoryId);

    return response.status(200).json({
      accepted: true,
      message: "deleted category successfully!",
      category: deletedCategory,
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

module.exports = { getCategories, addCategory, updateCategory, deleteCategory };
