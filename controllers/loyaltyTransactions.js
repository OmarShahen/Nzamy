const LoyaltyTransactionModel = require("../models/LoyaltyTransactionModel");
const CustomerModel = require("../models/CustomerModel");
const StoreModel = require("../models/StoreModel");
const UserModel = require("../models/UserModel");
const OrderModel = require("../models/OrderModel");
const { addLoyaltyTransactionSchema } = require("../validations/loyaltyTransactions");
const { AppError } = require("../middlewares/errorHandler");
const mongoose = require("mongoose");
const config = require("../config/config");

const getLoyaltyTransactions = async (request, response, next) => {
  try {
    let { userId, storeId, customerId, type, reason, limit, page } = request.query;

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

    if (customerId) {
      searchQuery.customerId = mongoose.Types.ObjectId(customerId);
    }

    if (type) {
      searchQuery.type = type;
    }

    if (reason) {
      searchQuery.reason = reason;
    }

    const loyaltyTransactions = await LoyaltyTransactionModel.aggregate([
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
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },
    ]);

    loyaltyTransactions.forEach((transaction) => {
      transaction.store = transaction.store[0];
      transaction.user = transaction.user[0];
      transaction.customer = transaction.customer[0];
      transaction.order = transaction.order[0] || null;
    });

    const total = await LoyaltyTransactionModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      loyaltyTransactions,
    });
  } catch (error) {
    next(error);
  }
};

const getLoyaltyTransactionById = async (request, response, next) => {
  try {
    const { loyaltyTransactionId } = request.params;

    const loyaltyTransaction = await LoyaltyTransactionModel.findById(loyaltyTransactionId);

    return response.status(200).json({
      accepted: true,
      loyaltyTransaction,
    });
  } catch (error) {
    next(error);
  }
};

const addLoyaltyTransaction = async (request, response, next) => {
  try {
    const validatedData = addLoyaltyTransactionSchema.parse(request.body);

    const user = await UserModel.findById(validatedData.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const store = await StoreModel.findById(validatedData.storeId);
    if (!store) {
      throw new AppError("Store not found", 404);
    }

    const customer = await CustomerModel.findById(validatedData.customerId);
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    if (validatedData.orderId) {
      const order = await OrderModel.findById(validatedData.orderId);
      if (!order) {
        throw new AppError("Order not found", 404);
      }
    }

    const loyaltyTransactionObj = new LoyaltyTransactionModel(validatedData);
    const newLoyaltyTransaction = await loyaltyTransactionObj.save();

    // Update customer loyalty points
    const pointChange = validatedData.type === 'redeem' ? -Math.abs(validatedData.points) : Math.abs(validatedData.points);
    await CustomerModel.findByIdAndUpdate(
      validatedData.customerId,
      { $inc: { loyaltyPoints: pointChange } }
    );

    return response.status(201).json({
      accepted: true,
      message: "Loyalty transaction created successfully!",
      loyaltyTransaction: newLoyaltyTransaction,
    });
  } catch (error) {
    next(error);
  }
};

const deleteLoyaltyTransaction = async (request, response, next) => {
  try {
    const { loyaltyTransactionId } = request.params;

    const deletedLoyaltyTransaction = await LoyaltyTransactionModel.findByIdAndDelete(loyaltyTransactionId);

    return response.status(200).json({
      accepted: true,
      message: "Loyalty transaction deleted successfully!",
      loyaltyTransaction: deletedLoyaltyTransaction,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLoyaltyTransactions,
  getLoyaltyTransactionById,
  addLoyaltyTransaction,
  deleteLoyaltyTransaction,
};