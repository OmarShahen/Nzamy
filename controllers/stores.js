const config = require("../config/config");
const StoreModel = require("../models/StoreModel");
const UserModel = require("../models/UserModel");
const ChannelModel = require("../models/ChannelModel");
const { addStoreSchema, updateStoreSchema } = require("../validations/stores");
const { AppError } = require("../middlewares/errorHandler");
const mongoose = require("mongoose");

const getStores = async (request, response, next) => {
  try {
    let { userId, name, email, phone, limit, page } = request.query;

    let searchQuery = {};

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    if (userId) {
      searchQuery.userId = mongoose.Types.ObjectId(userId);
    }

    if (name) {
      searchQuery.name = { $regex: name, $options: "i" };
    }

    if (email) {
      searchQuery.email = { $regex: email, $options: "i" };
    }

    if (phone) {
      searchQuery.phone = { $regex: phone, $options: "i" };
    }

    const stores = await StoreModel.aggregate([
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
        $project: {
          "user.password": 0,
        },
      },
    ]);

    stores.forEach((store) => {
      store.user = store.user[0];
    });

    const total = await StoreModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      stores,
    });
  } catch (error) {
    next(error);
  }
};

const getStoreById = async (request, response, next) => {
  try {
    const { storeId } = request.params;

    const store = await StoreModel.findById(storeId);
    if (!store) {
      throw new AppError("Store not found", 404);
    }

    return response.status(200).json({
      accepted: true,
      store,
    });
  } catch (error) {
    next(error);
  }
};

const addStore = async (request, response, next) => {
  try {
    const validatedData = addStoreSchema.parse(request.body);

    const user = await UserModel.findById(validatedData.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const storeCount = await StoreModel.countDocuments({
      userId: validatedData.userId,
      name: validatedData.name,
    });
    if (storeCount > 0) {
      throw new AppError("Store name is already registered", 400);
    }

    const storeObj = new StoreModel(validatedData);
    const newStore = await storeObj.save();

    return response.status(201).json({
      accepted: true,
      message: "Store created successfully!",
      store: newStore,
    });
  } catch (error) {
    next(error);
  }
};

const updateStore = async (request, response, next) => {
  try {
    const { storeId } = request.params;
    const validatedData = updateStoreSchema.parse(request.body);

    const store = await StoreModel.findById(storeId);
    if (!store) {
      throw new AppError("Store not found", 404);
    }

    // Check if Facebook page exists
    if (validatedData.facebookId) {
      const channelCount = await ChannelModel.countDocuments({
        pageId: validatedData.facebookId,
      });
      if (channelCount === 0) {
        throw new AppError("Facebook page not found", 400);
      }
    }

    // Check if Instagram page exists
    if (validatedData.instagramId) {
      const channelCount = await ChannelModel.countDocuments({
        pageId: validatedData.instagramId,
      });
      if (channelCount === 0) {
        throw new AppError("Instagram page not found", 400);
      }
    }

    // Check if WhatsApp page exists
    if (validatedData.whatsappId) {
      const channelCount = await ChannelModel.countDocuments({
        pageId: validatedData.whatsappId,
      });
      if (channelCount === 0) {
        throw new AppError("WhatsApp page not found", 400);
      }
    }

    // Check if store name is unique for this user
    if (validatedData.name && store.name !== validatedData.name) {
      const totalNames = await StoreModel.countDocuments({
        userId: store.userId,
        name: validatedData.name,
      });
      if (totalNames > 0) {
        throw new AppError("Store name is already registered", 400);
      }
    }

    const updatedStore = await StoreModel.findByIdAndUpdate(
      storeId,
      validatedData,
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "Store updated successfully!",
      store: updatedStore,
    });
  } catch (error) {
    next(error);
  }
};

const deleteStore = async (request, response, next) => {
  try {
    const { storeId } = request.params;

    const deletedStore = await StoreModel.findByIdAndDelete(storeId);
    if (!deletedStore) {
      throw new AppError("Store not found", 404);
    }

    return response.status(200).json({
      accepted: true,
      message: "Store deleted successfully!",
      store: deletedStore,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStores,
  getStoreById,
  addStore,
  updateStore,
  deleteStore,
};
