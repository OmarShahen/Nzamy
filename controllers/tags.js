const TagModel = require("../models/TagModel");
const StoreModel = require("../models/StoreModel");
const UserModel = require("../models/UserModel");
const { addTagSchema, updateTagSchema } = require("../validations/tags");
const { AppError } = require("../middlewares/errorHandler");
const mongoose = require("mongoose");
const config = require("../config/config");

const getTags = async (request, response, next) => {
  try {
    let { userId, storeId, name, limit, page } = request.query;

    let searchQuery = {};

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    if (userId) {
      searchQuery.userId = mongoose.Types.ObjectId(userId);
    }

    if (storeId) {
      searchQuery.storeId = mongoose.Types.ObjectId(storeId);
    }

    if (name) {
      searchQuery.name = { $regex: name, $options: "i" };
    }

    const tags = await TagModel.aggregate([
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
          from: "stores",
          localField: "storeId",
          foreignField: "_id",
          as: "store",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
    ]);

    tags.forEach((tag) => {
      tag.store = tag.store[0];
      tag.user = tag.user[0];
    });

    const total = await TagModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      tags,
    });
  } catch (error) {
    next(error);
  }
};

const getTagById = async (request, response, next) => {
  try {
    const { tagId } = request.params;

    const tag = await TagModel.findById(tagId);
    if (!tag) {
      throw new AppError("Tag not found", 404);
    }

    return response.status(200).json({
      accepted: true,
      tag,
    });
  } catch (error) {
    next(error);
  }
};

const addTag = async (request, response, next) => {
  try {
    const validatedData = addTagSchema.parse(request.body);

    const user = await UserModel.findById(validatedData.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const store = await StoreModel.findById(validatedData.storeId);
    if (!store) {
      throw new AppError("Store not found", 404);
    }

    const tagCount = await TagModel.countDocuments({
      storeId: validatedData.storeId,
      name: validatedData.name,
    });
    if (tagCount > 0) {
      throw new AppError("Tag name is already registered", 400);
    }

    const tagObj = new TagModel(validatedData);
    const newTag = await tagObj.save();

    return response.status(201).json({
      accepted: true,
      message: "Tag created successfully!",
      tag: newTag,
    });
  } catch (error) {
    next(error);
  }
};

const updateTag = async (request, response, next) => {
  try {
    const { tagId } = request.params;
    const validatedData = updateTagSchema.parse(request.body);

    const tag = await TagModel.findById(tagId);
    if (!tag) {
      throw new AppError("Tag not found", 404);
    }

    if (validatedData.name && tag.name !== validatedData.name) {
      const totalNames = await TagModel.countDocuments({
        storeId: tag.storeId,
        name: validatedData.name,
      });
      if (totalNames > 0) {
        throw new AppError("Tag name is already registered", 400);
      }
    }

    const updatedTag = await TagModel.findByIdAndUpdate(
      tagId,
      validatedData,
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "Tag updated successfully!",
      tag: updatedTag,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTag = async (request, response, next) => {
  try {
    const { tagId } = request.params;

    const deletedTag = await TagModel.findByIdAndDelete(tagId);
    if (!deletedTag) {
      throw new AppError("Tag not found", 404);
    }

    return response.status(200).json({
      accepted: true,
      message: "Tag deleted successfully!",
      tag: deletedTag,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getTags,
  getTagById,
  addTag,
  updateTag,
  deleteTag,
};