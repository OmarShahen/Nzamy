const OrderModel = require("../models/OrderModel");
const UserModel = require("../models/UserModel");
const ItemModel = require("../models/ItemModel");
const CustomerModel = require("../models/CustomerModel");
const CustomerAddressModel = require("../models/CustomerAddressModel");
const OfferModel = require("../models/OfferModel");
const StoreModel = require("../models/StoreModel");
const { addOrderSchema, updateOrderSchema } = require("../validations/orders");
const { AppError } = require("../middlewares/errorHandler");
const utils = require("../utils/utils");
const mongoose = require("mongoose");
const config = require("../config/config");

const calculateTotalPriceOfItems = (items) => {
  let totalPrice = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    totalPrice += item.price * item.quantity;
  }

  return totalPrice;
};

const isItemsStockAvailable = (orderItems, items) => {
  for (let i = 0; i < orderItems.length; i++) {
    const orderItem = orderItems[i];
    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      if (orderItem.itemId == item._id && item.isTrackInventory) {
        const newStock = item.stock - orderItem.quantity;
        if (newStock < 0) {
          return {
            isAccepted: false,
            message: `لا يوجد كمية كافية من ${item.name}`,
          };
        }
      }
    }
  }

  return { isAccepted: true };
};

const createStockRecords = async (items, cashierId) => {
  const stockRecords = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item.isTrackInventory) {
      continue;
    }

    const counter = await CounterModel.findOneAndUpdate(
      { name: "stockRecord" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const stockRecordData = {
      stockRecordId: counter.value,
      itemId: item.itemId,
      userId: cashierId,
      type: "SALE",
      effect: "WIN",
      quantity: -item.quantity,
      totalPrice: item.price * item.quantity,
    };

    stockRecords.push(stockRecordData);
  }

  return stockRecords;
};

const generateStockRecords = async (items, options) => {
  const { cashierId, effect, type } = options;

  const stockRecords = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item.isTrackInventory) {
      continue;
    }

    const counter = await CounterModel.findOneAndUpdate(
      { name: "stockRecord" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const stockRecordData = {
      stockRecordId: counter.value,
      itemId: item.itemId,
      userId: cashierId,
      type,
      effect,
      quantity: effect == "WIN" ? -item.quantity : item.quantity,
      totalPrice: item.price * item.quantity,
    };

    stockRecords.push(stockRecordData);
  }

  return stockRecords;
};

const updateItemsWithNewStock = async (items, effect = "WIN") => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.isTrackInventory) {
      continue;
    }
    const newStock = effect == "WIN" ? -item.quantity : item.quantity;
    await ItemModel.findByIdAndUpdate(
      item.itemId,
      { $inc: { stock: newStock } },
      { new: true }
    );
  }
};

const getOrders = async (request, response, next) => {
  try {
    let { userId, storeId, customerId, status, paymentMethod, paymentStatus, limit, page } =
      request.query;

    let { searchQuery } = utils.statsQueryGenerator("none", 0, request.query);

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    if (userId) {
      searchQuery.userId = new mongoose.Types.ObjectId(userId);
    }

    if (storeId) {
      searchQuery.storeId = new mongoose.Types.ObjectId(storeId);
    }

    if (customerId) {
      searchQuery.customerId = new mongoose.Types.ObjectId(customerId);
    }

    if (status) {
      searchQuery.status = status;
    }

    if (paymentMethod) {
      searchQuery.paymentMethod = paymentMethod;
    }

    if (paymentStatus) {
      searchQuery.paymentStatus = paymentStatus;
    }

    const orders = await OrderModel.aggregate([
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
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $lookup: {
          from: "offers",
          localField: "appliedOffers",
          foreignField: "_id",
          as: "offerDetails",
        },
      },
      {
        $project: {
          "user.password": 0,
        },
      },
    ]);

    orders.forEach((order) => {
      order.user = order.user[0];
      order.store = order.store[0];
      order.customer = order.customer[0];
    });

    const total = await OrderModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

const addOrder = async (request, response, next) => {
  try {
    const validatedData = addOrderSchema.parse(request.body);

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

    // Validate customer address if provided
    if (validatedData.customerAddressId) {
      const customerAddress = await CustomerAddressModel.findById(validatedData.customerAddressId);
      if (!customerAddress) {
        throw new AppError("Customer address not found", 404);
      }
    }

    // Validate applied offers if provided
    if (validatedData.appliedOffers && validatedData.appliedOffers.length > 0) {
      const offerCount = await OfferModel.countDocuments({
        _id: { $in: validatedData.appliedOffers },
        storeId: validatedData.storeId,
        status: "active"
      });
      if (offerCount !== validatedData.appliedOffers.length) {
        throw new AppError("One or more offers are not active or do not exist for this store", 400);
      }
    }

    // Validate items exist in store
    let itemsIdsList = validatedData.items.map((item) => item.itemId);
    const itemsIdsSet = new Set(itemsIdsList);
    const uniqueItemsIdsList = [...itemsIdsSet];

    if (uniqueItemsIdsList.length != itemsIdsList.length) {
      throw new AppError("Duplicate items found in order", 400);
    }

    const itemsList = await ItemModel.find({
      _id: { $in: itemsIdsList },
      storeId: validatedData.storeId,
    });

    if (itemsList.length != itemsIdsList.length) {
      throw new AppError("One or more items not found in store", 404);
    }

    // Check stock availability
    const itemStockValidation = isItemsStockAvailable(validatedData.items, itemsList);
    if (!itemStockValidation.isAccepted) {
      throw new AppError(itemStockValidation.message, 400);
    }

    // Order will be saved with pre-save hook calculating totals
    const orderObj = new OrderModel(validatedData);
    const newOrder = await orderObj.save();

    // Update inventory
    await updateItemsWithNewStock(validatedData.items);

    return response.status(201).json({
      accepted: true,
      message: "Order created successfully!",
      order: newOrder,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (request, response, next) => {
  try {
    const { orderId } = request.params;

    const order = await OrderModel.findById(orderId);

    return response.status(200).json({
      accepted: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

const deleteOrder = async (request, response, next) => {
  try {
    const { orderId } = request.params;

    const deletedOrder = await OrderModel.findByIdAndDelete(orderId);

    return response.status(200).json({
      accepted: true,
      message: "Order deleted successfully!",
      order: deletedOrder,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (request, response, next) => {
  try {
    const { orderId } = request.params;
    const validatedData = updateOrderSchema.parse(request.body);

    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Handle inventory updates based on status changes
    let shouldUpdateInventory = false;
    let inventoryEffect = null;

    if (validatedData.status && validatedData.status !== order.status) {
      const CONFIRMED_STATUSES = ["confirmed", "processing", "shipped", "delivered"];
      const CANCELLED_STATUSES = ["cancelled", "returned"];

      const wasConfirmed = CONFIRMED_STATUSES.includes(order.status);
      const nowConfirmed = CONFIRMED_STATUSES.includes(validatedData.status);
      const nowCancelled = CANCELLED_STATUSES.includes(validatedData.status);

      if (!wasConfirmed && nowConfirmed) {
        // Order is being confirmed - reduce inventory
        shouldUpdateInventory = true;
        inventoryEffect = "WIN";
      } else if (wasConfirmed && nowCancelled) {
        // Order is being cancelled - restore inventory  
        shouldUpdateInventory = true;
        inventoryEffect = "LOSS";
      }
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      validatedData,
      { new: true, runValidators: true }
    );

    if (shouldUpdateInventory && inventoryEffect) {
      await updateItemsWithNewStock(order.items, inventoryEffect);
    }

    return response.status(200).json({
      accepted: true,
      message: "Order updated successfully!",
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

const getOrdersGrowthStats = async (request, response, next) => {
  try {
    const { groupBy } = request.query;

    let format = "%Y-%m-%d";

    if (groupBy == "MONTH") {
      format = "%Y-%m";
    } else if (groupBy == "YEAR") {
      format = "%Y";
    }

    const ordersGrowth = await OrderModel.aggregate([
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
      ordersGrowth,
    });
  } catch (error) {
    next(error);
  }
};

const getOrdersStats = async (request, response, next) => {
  try {
    const { cashierId } = request.query;

    const { searchQuery } = cashierId
      ? utils.statsQueryGenerator("cashierId", cashierId, request.query)
      : utils.statsQueryGenerator("none", 0, request.query);

    const totalPaidOrders = await OrderModel.countDocuments({
      ...searchQuery,
      isPaid: true,
      isRefunded: false,
    });

    const totalRefundedOrders = await OrderModel.countDocuments({
      ...searchQuery,
      isPaid: true,
      isRefunded: true,
    });

    const totalPaidList = await OrderModel.aggregate([
      {
        $match: { ...searchQuery, isPaid: true, isRefunded: false },
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalQuantityList = await OrderModel.aggregate([
      {
        $match: { ...searchQuery, isPaid: true, isRefunded: false },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
    ]);

    const totalPaid = totalPaidList.length > 0 ? totalPaidList[0].totalPaid : 0;
    const totalQuantity =
      totalQuantityList.length > 0 ? totalQuantityList[0].totalQuantity : 0;

    return response.status(200).json({
      accepted: true,
      totalPaidOrders,
      totalRefundedOrders,
      totalPaid,
      totalQuantity,
    });
  } catch (error) {
    next(error);
  }
};

const getOrdersItemsQuantityStats = async (request, response, next) => {
  try {
    const { searchQuery } = utils.statsQueryGenerator("none", 0, request.query);

    const totalQuantityList = await OrderModel.aggregate([
      {
        $match: { ...searchQuery, isPaid: true, isRefunded: false },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.itemId",
          count: { $sum: "$items.quantity" },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $addFields: {
          _id: { $toObjectId: "$_id" }, // Convert _id to ObjectId
        },
      },
      {
        $lookup: {
          from: "items",
          localField: "_id",
          foreignField: "_id",
          as: "item",
        },
      },
      {
        $unwind: "$item",
      },
    ]);

    return response.status(200).json({
      accepted: true,
      totalQuantityList,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  addOrder,
  updateOrder,
  deleteOrder,
  getOrdersGrowthStats,
  getOrdersStats,
  getOrdersItemsQuantityStats,
};
