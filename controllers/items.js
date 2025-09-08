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

const getItems = async (request, response) => {
  try {
    let { userId, storeId, categoryId, name, limit, page } = request.query;

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

    if (categoryId) {
      searchQuery.categoryId = mongoose.Types.ObjectId(categoryId);
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const getItem = async (request, response) => {
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const searchItemsByImage = async (request, response) => {
  try {
    const dataValidation = itemValidation.searchItemsByImage(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { storeId } = request.params;
    const { imageURL } = request.body;

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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const addItem = async (request, response) => {
  try {
    const dataValidation = itemValidation.addItem(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { userId, storeId, categoryId, name } = request.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return response.status(400).json({
        accepted: false,
        message: "User ID does not exist",
        field: "userId",
      });
    }

    const store = await StoreModel.findById(storeId);
    if (!store) {
      return response.status(400).json({
        accepted: false,
        message: "Store ID does not exist",
        field: "storeId",
      });
    }

    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      return response.status(400).json({
        accepted: false,
        message: "Category ID does not exist",
        field: "categoryId",
      });
    }

    const totalNames = await ItemModel.countDocuments({ storeId, name });
    if (totalNames != 0) {
      return response.status(400).json({
        accepted: false,
        message: "Item name is already registered",
        field: "name",
      });
    }

    const counter = await CounterModel.findOneAndUpdate(
      { name: `item-${storeId}` },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const itemData = { itemId: counter.value, ...request.body };
    const itemObj = new ItemModel(itemData);
    const newItem = await itemObj.save();

    return response.status(200).json({
      accepted: true,
      message: "Item is added successfully!",
      item: newItem,
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

const updateItem = async (request, response) => {
  try {
    const dataValidation = itemValidation.updateItem(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { itemId } = request.params;
    const { categoryId, name } = request.body;

    if (categoryId) {
      const category = await CategoryModel.findById(categoryId);
      if (!category) {
        return response.status(400).json({
          accepted: false,
          message: "Category ID does not exist",
          field: "categoryId",
        });
      }
    }

    const item = await ItemModel.findById(itemId);

    if (item.name != name) {
      const totalNames = await ItemModel.countDocuments({
        name,
        storeId: item.storeId,
      });
      if (totalNames != 0) {
        return response.status(400).json({
          accepted: false,
          message: "Item name is already registered",
          field: "name",
        });
      }
    }

    const updatedItem = await ItemModel.findByIdAndUpdate(
      itemId,
      request.body,
      { new: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "Item is updated successfully!",
      item: updatedItem,
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

const updateItemImagesVectors = async (request, response) => {
  try {
    const dataValidation = itemValidation.updateItemImagesVectors(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { itemId } = request.params;
    const { images } = request.body;

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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const deleteItem = async (request, response) => {
  try {
    const { itemId } = request.params;

    const deletedItem = await ItemModel.findByIdAndDelete(itemId);

    return response.status(200).json({
      accepted: true,
      message: "Item is deleted successfully!",
      item: deletedItem,
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

const getItemsGrowthStats = async (request, response) => {
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
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
