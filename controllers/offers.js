const OfferModel = require("../models/OfferModel");
const StoreModel = require("../models/StoreModel");
const UserModel = require("../models/UserModel");
const TagModel = require("../models/TagModel");
const ItemModel = require("../models/ItemModel");
const { addOfferSchema, updateOfferSchema } = require("../validations/offers");
const { AppError } = require("../middlewares/errorHandler");
const mongoose = require("mongoose");
const config = require("../config/config");

const getOffers = async (request, response, next) => {
  try {
    let { userId, storeId, title, offerCode, type, status, limit, page } = request.query;

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

    if (title) {
      searchQuery.title = { $regex: title, $options: "i" };
    }

    if (offerCode) {
      searchQuery.offerCode = { $regex: offerCode, $options: "i" };
    }

    if (type) {
      searchQuery.type = type;
    }

    if (status) {
      searchQuery.status = status;
    }

    const offers = await OfferModel.aggregate([
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
      {
        $lookup: {
          from: "tags",
          localField: "customerSegment",
          foreignField: "_id",
          as: "customerSegmentDetails",
        },
      },
      {
        $lookup: {
          from: "items",
          localField: "excludedItems",
          foreignField: "_id",
          as: "excludedItemsDetails",
        },
      },
    ]);

    offers.forEach((offer) => {
      offer.store = offer.store[0];
      offer.user = offer.user[0];
    });

    const total = await OfferModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      offers,
    });
  } catch (error) {
    next(error);
  }
};

const getOfferById = async (request, response, next) => {
  try {
    const { offerId } = request.params;

    const offer = await OfferModel.findById(offerId);

    return response.status(200).json({
      accepted: true,
      offer,
    });
  } catch (error) {
    next(error);
  }
};

const addOffer = async (request, response, next) => {
  try {
    const validatedData = addOfferSchema.parse(request.body);

    const user = await UserModel.findById(validatedData.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const store = await StoreModel.findById(validatedData.storeId);
    if (!store) {
      throw new AppError("Store not found", 404);
    }

    if (validatedData.customerSegment && validatedData.customerSegment.length > 0) {
      const tagCount = await TagModel.countDocuments({
        _id: { $in: validatedData.customerSegment },
        storeId: validatedData.storeId
      });
      if (tagCount !== validatedData.customerSegment.length) {
        throw new AppError("One or more customer segments do not exist for this store", 400);
      }
    }

    if (validatedData.excludedItems && validatedData.excludedItems.length > 0) {
      const itemCount = await ItemModel.countDocuments({
        _id: { $in: validatedData.excludedItems },
        storeId: validatedData.storeId
      });
      if (itemCount !== validatedData.excludedItems.length) {
        throw new AppError("One or more excluded items do not exist for this store", 400);
      }
    }

    const offerCount = await OfferModel.countDocuments({
      storeId: validatedData.storeId,
      offerCode: validatedData.offerCode
    });
    if (offerCount > 0) {
      throw new AppError("Offer with this code already exists for this store", 400);
    }

    const offerObj = new OfferModel(validatedData);
    const newOffer = await offerObj.save();

    return response.status(201).json({
      accepted: true,
      message: "Offer created successfully!",
      offer: newOffer,
    });
  } catch (error) {
    next(error);
  }
};

const updateOffer = async (request, response, next) => {
  try {
    const { offerId } = request.params;
    const validatedData = updateOfferSchema.parse(request.body);

    const offer = await OfferModel.findById(offerId);

    if (validatedData.customerSegment && validatedData.customerSegment.length > 0) {
      const tagCount = await TagModel.countDocuments({
        _id: { $in: validatedData.customerSegment },
        storeId: offer.storeId
      });
      if (tagCount !== validatedData.customerSegment.length) {
        throw new AppError("One or more customer segments do not exist for this store", 400);
      }
    }

    if (validatedData.excludedItems && validatedData.excludedItems.length > 0) {
      const itemCount = await ItemModel.countDocuments({
        _id: { $in: validatedData.excludedItems },
        storeId: offer.storeId
      });
      if (itemCount !== validatedData.excludedItems.length) {
        throw new AppError("One or more excluded items do not exist for this store", 400);
      }
    }

    if (validatedData.offerCode) {
      const offerCount = await OfferModel.countDocuments({
        storeId: offer.storeId,
        offerCode: validatedData.offerCode,
        _id: { $ne: offerId }
      });
      if (offerCount > 0) {
        throw new AppError("Offer with this code already exists for this store", 400);
      }
    }

    const updatedOffer = await OfferModel.findByIdAndUpdate(
      offerId,
      validatedData,
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "Offer updated successfully!",
      offer: updatedOffer,
    });
  } catch (error) {
    next(error);
  }
};

const deleteOffer = async (request, response, next) => {
  try {
    const { offerId } = request.params;

    const deletedOffer = await OfferModel.findByIdAndDelete(offerId);

    return response.status(200).json({
      accepted: true,
      message: "Offer deleted successfully!",
      offer: deletedOffer,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOffers,
  getOfferById,
  addOffer,
  updateOffer,
  deleteOffer,
};