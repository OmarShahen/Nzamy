const OrderModel = require("../models/OrderModel");
const UserModel = require("../models/UserModel");
const ItemModel = require("../models/ItemModel");
const CounterModel = require("../models/CounterModel");
const orderValidation = require("../validations/orders");
const utils = require("../utils/utils");
const mongoose = require("mongoose");
const config = require("../config/config");
const StoreModel = require("../models/StoreModel");

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

const getOrders = async (request, response) => {
  try {
    let { userId, storeId, status, itemId, paymentMethod, limit, page } =
      request.query;

    let { searchQuery } = utils.statsQueryGenerator("none", 0, request.query);

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    if (userId) {
      searchQuery.userId = mongoose.Types.ObjectId(userId);
    }

    if (storeId) {
      searchQuery.storeId = mongoose.Types.ObjectId(storeId);
    }

    if (status) {
      searchQuery.status = status;
    }

    if (paymentMethod) {
      searchQuery.paymentMethod = paymentMethod;
    }

    if (itemId) {
      searchQuery["items.itemId"] = itemId;
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
        $project: {
          "user.password": 0,
        },
      },
    ]);

    orders.forEach((order) => {
      order.user = order.user[0];
      order.store = order.store[0];
    });

    const total = await OrderModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      orders,
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

const addOrder = async (request, response) => {
  try {
    const dataValidation = orderValidation.addOrder(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const {
      userId,
      storeId,
      paymentMethod,
      items,
      shippingName,
      shippingPhone,
      shippingAddress,
      shippingCity,
    } = request.body;

    let itemsIdsList = items.map((item) => item.itemId);
    const itemsIdsSet = new Set(itemsIdsList);
    const uniqueItemsIdsList = [...itemsIdsSet];

    if (uniqueItemsIdsList.length != itemsIdsList.length) {
      return response.status(400).json({
        accepted: false,
        message: "There is duplicate items in items",
        field: "items",
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return response.status(400).json({
        accepted: false,
        message: "User ID is not registered",
        field: "userId",
      });
    }

    const store = await StoreModel.findById(storeId);
    if (!store) {
      return response.status(400).json({
        accepted: false,
        message: "Store ID is not registered",
        field: "storeId",
      });
    }

    const itemsList = await ItemModel.find({
      _id: { $in: itemsIdsList },
      userId,
      storeId,
    });

    if (itemsList.length != itemsIdsList.length) {
      return response.status(400).json({
        accepted: false,
        message: "Item IDs is not registered",
        field: "items",
      });
    }

    const itemStockValidation = isItemsStockAvailable(items, itemsList);
    if (!itemStockValidation.isAccepted) {
      return response.status(400).json({
        accepted: itemStockValidation.isAccepted,
        message: itemStockValidation.message,
        field: "items",
      });
    }

    const TOTAL_PRICE = calculateTotalPriceOfItems(items);

    const counter = await CounterModel.findOneAndUpdate(
      { name: `order-${storeId}` },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const orderData = {
      orderId: counter.value,
      userId,
      storeId,
      paymentMethod,
      totalPrice: TOTAL_PRICE,
      items,
      shipping: {
        name: shippingName,
        phone: shippingPhone,
        address: shippingAddress,
        city: shippingCity,
      },
    };
    const orderObj = new OrderModel(orderData);
    const newOrder = await orderObj.save();

    /*const stockRecords = await createStockRecords(items, cashierId);
    const newStockRecords = await StockRecordModel.insertMany(stockRecords);*/

    await updateItemsWithNewStock(items);

    return response.status(200).json({
      accepted: true,
      message: "تم اضافة الطلب بنجاح",
      order: newOrder,
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

const deleteOrder = async (request, response) => {
  try {
    const { orderId } = request.params;

    const deletedOrder = await OrderModel.findByIdAndDelete(orderId);

    return response.status(200).json({
      accepted: true,
      message: "تم مسح الطلب بنجاح",
      order: deletedOrder,
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

const updateOrder = async (request, response) => {
  try {
    const dataValidation = orderValidation.updateOrder(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { orderId } = request.params;
    const { status } = request.body;

    const order = await OrderModel.findById(orderId);

    let isUpdateStock = false;

    if (status && status != order.status) {
      if (order.status != "PAID" && status != "PAID") {
        return response.status(400).json({
          accepted: false,
          message: "الطلب غير مدفوع ليتم الارتجاع",
          field: "status",
        });
      }

      const WIN_LIST = ["PENDING", "PAID"];
      const LOSS_LIST = ["REFUNDED", "FAILED", "CANCELLED"];

      isUpdateStock =
        (WIN_LIST.includes(order.status) && WIN_LIST.includes(status)) ||
        (LOSS_LIST.includes(order.status) && LOSS_LIST.includes(status))
          ? false
          : true;
    }

    const updateOrderData = {
      status,
      shipping: {
        name: request.body.shippingName,
        phone: request.body.shippingPhone,
        city: request.body.shippingCity,
        address: request.body.shippingAddress,
      },
    };

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      updateOrderData,
      { new: true }
    );

    if (isUpdateStock) {
      const updateStatus = WIN_LIST.includes(status) ? "WIN" : "LOSS";
      await updateItemsWithNewStock(order.items, updateStatus);
    }

    return response.status(200).json({
      accepted: true,
      message: "تم تحديث الطلب بنجاح!",
      order: updatedOrder,
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

const getOrdersGrowthStats = async (request, response) => {
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const getOrdersStats = async (request, response) => {
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const getOrdersItemsQuantityStats = async (request, response) => {
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getOrders,
  addOrder,
  deleteOrder,
  updateOrder,
  getOrdersGrowthStats,
  getOrdersStats,
  getOrdersItemsQuantityStats,
};
