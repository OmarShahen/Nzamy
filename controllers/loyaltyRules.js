const LoyaltyRuleModel = require("../models/LoyaltyRuleModel");
const StoreModel = require("../models/StoreModel");
const UserModel = require("../models/UserModel");
const { addLoyaltyRuleSchema, updateLoyaltyRuleSchema } = require("../validations/loyaltyRules");
const { AppError } = require("../middlewares/errorHandler");
const mongoose = require("mongoose");
const config = require("../config/config");

const getLoyaltyRules = async (request, response, next) => {
  try {
    let { userId, storeId, actionType, isActive, limit, page } = request.query;

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

    if (actionType) {
      searchQuery.actionType = actionType;
    }

    if (isActive !== undefined) {
      searchQuery.isActive = isActive === 'true';
    }

    const loyaltyRules = await LoyaltyRuleModel.aggregate([
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

    loyaltyRules.forEach((rule) => {
      rule.store = rule.store[0];
      rule.user = rule.user[0];
    });

    const total = await LoyaltyRuleModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      loyaltyRules,
    });
  } catch (error) {
    next(error);
  }
};

const getLoyaltyRuleById = async (request, response, next) => {
  try {
    const { loyaltyRuleId } = request.params;

    const loyaltyRule = await LoyaltyRuleModel.findById(loyaltyRuleId);

    return response.status(200).json({
      accepted: true,
      loyaltyRule,
    });
  } catch (error) {
    next(error);
  }
};

const addLoyaltyRule = async (request, response, next) => {
  try {
    const validatedData = addLoyaltyRuleSchema.parse(request.body);

    const user = await UserModel.findById(validatedData.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const store = await StoreModel.findById(validatedData.storeId);
    if (!store) {
      throw new AppError("Store not found", 404);
    }

    // Check if rule name is unique for the store
    const ruleCount = await LoyaltyRuleModel.countDocuments({
      storeId: validatedData.storeId,
      name: validatedData.name
    });
    if (ruleCount > 0) {
      throw new AppError("Loyalty rule name already exists for this store", 400);
    }

    // Validate date range
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    if (startDate >= endDate) {
      throw new AppError("End date must be after start date", 400);
    }

    const loyaltyRuleObj = new LoyaltyRuleModel(validatedData);
    const newLoyaltyRule = await loyaltyRuleObj.save();

    return response.status(201).json({
      accepted: true,
      message: "Loyalty rule created successfully!",
      loyaltyRule: newLoyaltyRule,
    });
  } catch (error) {
    next(error);
  }
};

const updateLoyaltyRule = async (request, response, next) => {
  try {
    const { loyaltyRuleId } = request.params;
    const validatedData = updateLoyaltyRuleSchema.parse(request.body);

    const loyaltyRule = await LoyaltyRuleModel.findById(loyaltyRuleId);

    // Check if rule name is unique for the store (if name is being updated)
    if (validatedData.name && loyaltyRule.name !== validatedData.name) {
      const ruleCount = await LoyaltyRuleModel.countDocuments({
        storeId: loyaltyRule.storeId,
        name: validatedData.name
      });
      if (ruleCount > 0) {
        throw new AppError("Loyalty rule name already exists for this store", 400);
      }
    }

    // Validate date range if dates are being updated
    if (validatedData.startDate || validatedData.endDate) {
      const startDate = new Date(validatedData.startDate || loyaltyRule.startDate);
      const endDate = new Date(validatedData.endDate || loyaltyRule.endDate);
      if (startDate >= endDate) {
        throw new AppError("End date must be after start date", 400);
      }
    }

    const updatedLoyaltyRule = await LoyaltyRuleModel.findByIdAndUpdate(
      loyaltyRuleId,
      validatedData,
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "Loyalty rule updated successfully!",
      loyaltyRule: updatedLoyaltyRule,
    });
  } catch (error) {
    next(error);
  }
};

const deleteLoyaltyRule = async (request, response, next) => {
  try {
    const { loyaltyRuleId } = request.params;

    const deletedLoyaltyRule = await LoyaltyRuleModel.findByIdAndDelete(loyaltyRuleId);

    return response.status(200).json({
      accepted: true,
      message: "Loyalty rule deleted successfully!",
      loyaltyRule: deletedLoyaltyRule,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLoyaltyRules,
  getLoyaltyRuleById,
  addLoyaltyRule,
  updateLoyaltyRule,
  deleteLoyaltyRule,
};