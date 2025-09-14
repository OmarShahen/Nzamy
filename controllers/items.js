const ItemModel = require("../models/ItemModel");
const CounterModel = require("../models/CounterModel");
const StoreModel = require("../models/StoreModel");
const itemValidation = require("../validations/items");
const mongoose = require("mongoose");
const config = require("../config/config");
const CategoryModel = require("../models/CategoryModel");
const UserModel = require("../models/UserModel");
const {
  generateImageEmbeddingsService,
  searchImageByDescriptionService,
} = require("../services/embeddings");
const { scoreItems } = require("../utils/score-items");
const { AppError } = require("../middlewares/errorHandler");

const getItems = async (request, response, next) => {
  try {
    let { userId, storeId, categoryId, name, limit, page } = request.query;

    let searchQuery = {};

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    if (userId) {
      searchQuery.userId = new mongoose.Types.ObjectId(userId);
    }

    if (storeId) {
      searchQuery.storeId = new mongoose.Types.ObjectId(storeId);
    }

    if (categoryId) {
      searchQuery.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    if (name) {
      searchQuery.name = { $regex: name, $options: "i" };
    }

    const items = await ItemModel.aggregate([
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
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
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
          "images.vector": 0,
        },
      },
    ]);

    items.forEach((item) => {
      item.store = item.store[0];
      item.category = item.category[0];
    });

    const total = await ItemModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      items,
    });
  } catch (error) {
    next(error)
  }
};

const getItem = async (request, response, next) => {
  try {
    const { itemId } = request.params;

    const item = await ItemModel.findById(itemId).select({
      "images.vector": 0,
    });

    return response.status(200).json({
      accepted: true,
      item,
    });
  } catch (error) {
    next(error)
  }
};

const searchItemsByImage = async (request, response, next) => {
  try {
    const validatedData = itemValidation.searchItemsByImageSchema.parse(request.body);

    const { storeId } = request.params;
    const { imageURL } = validatedData;

    const { description, vector: queryVector } =
      await searchImageByDescriptionService(imageURL);

    const items = await ItemModel.find({ storeId });

    const nearestItems = await scoreItems(items, queryVector);

    return response.status(200).json({
      accepted: true,
      searchDescription: description,
      items: nearestItems,
    });
  } catch (error) {
    next(error)
  }
};

const addItem = async (request, response, next) => {
  try {
    const validatedData = itemValidation.addItemSchema.parse(request.body);

    const { userId, storeId, categoryId, name } = validatedData;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User ID does not exist", 400)
    }

    const store = await StoreModel.findById(storeId);
    if (!store) {
      throw new AppError("Store ID does not exist", 400)
    }

    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      throw new AppError("Category ID does not exist", 400)
    }

    const totalNames = await ItemModel.countDocuments({ storeId, name });
    if (totalNames != 0) {
      throw new AppError("Item name is already registered", 400)
    }

    const itemObj = new ItemModel(validatedData);
    const newItem = await itemObj.save();

    return response.status(200).json({
      accepted: true,
      message: "Item is added successfully!",
      item: newItem,
    });
  } catch (error) {
    next(error)
  }
};

const updateItem = async (request, response, next) => {
  try {
    const validatedData = itemValidation.updateItemSchema.parse(request.body);

    const { itemId } = request.params;
    const { categoryId, name } = validatedData;

    if (categoryId) {
      const category = await CategoryModel.findById(categoryId);
      if (!category) {
        throw new AppError("Category ID does not exist", 400)
      }
    }

    const item = await ItemModel.findById(itemId);

    if (item.name != name) {
      const totalNames = await ItemModel.countDocuments({
        name,
        storeId: item.storeId,
      });
      if (totalNames != 0) {
        throw new AppError("Item name is already registered", 400)
      }
    }

    const updatedItem = await ItemModel.findByIdAndUpdate(
      itemId,
      validatedData,
      { new: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "Item is updated successfully!",
      item: updatedItem,
    });
  } catch (error) {
    next(error)
  }
};

const updateItemImagesVectors = async (request, response, next) => {
  try {
    const validatedData = itemValidation.updateItemImagesVectorsSchema.parse(request.body);

    const { itemId } = request.params;
    const { images } = validatedData;

    const newImages = await generateImageEmbeddingsService(images);

    const updatedItem = await ItemModel.findByIdAndUpdate(
      itemId,
      { images: newImages },
      { new: true }
    );

    updatedItem.images.forEach((image) => (image.vector = undefined));

    return response.status(200).json({
      accepted: true,
      message: "Item images is updated successfully!",
      item: updatedItem,
    });
  } catch (error) {
    next(error)
  }
};

const deleteItem = async (request, response, next) => {
  try {
    const { itemId } = request.params;

    const deletedItem = await ItemModel.findByIdAndDelete(itemId);

    return response.status(200).json({
      accepted: true,
      message: "Item is deleted successfully!",
      item: deletedItem,
    });
  } catch (error) {
    next(error)
  }
};

const getItemsGrowthStats = async (request, response, next) => {
  try {
    const { groupBy } = request.query;

    let format = "%Y-%m-%d";

    if (groupBy == "MONTH") {
      format = "%Y-%m";
    } else if (groupBy == "YEAR") {
      format = "%Y";
    }

    const itemsGrowth = await ItemModel.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: format,
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return response.status(200).json({
      accepted: true,
      itemsGrowth,
    });
  } catch (error) {
    next(error)
  }
};

module.exports = {
  getItems,
  getItem,
  addItem,
  deleteItem,
  updateItem,
  updateItemImagesVectors,
  getItemsGrowthStats,
  searchItemsByImage,
};
