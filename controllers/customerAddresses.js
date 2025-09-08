const CustomerAddressModel = require("../models/CustomerAddressModel");
const StoreModel = require("../models/StoreModel");
const UserModel = require("../models/UserModel");
const CustomerModel = require("../models/CustomerModel");
const { addCustomerAddressSchema, updateCustomerAddressSchema } = require("../validations/customerAddresses");
const { AppError } = require("../middlewares/errorHandler");
const mongoose = require("mongoose");
const config = require("../config/config");

const getCustomerAddresses = async (request, response, next) => {
  try {
    let { userId, storeId, customerId, limit, page } = request.query;

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

    const customerAddresses = await CustomerAddressModel.aggregate([
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
    ]);

    customerAddresses.forEach((address) => {
      address.store = address.store[0];
      address.user = address.user[0];
      address.customer = address.customer[0];
    });

    const total = await CustomerAddressModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      customerAddresses,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerAddressById = async (request, response, next) => {
  try {
    const { customerAddressId } = request.params;

    const customerAddress = await CustomerAddressModel.findById(customerAddressId);

    return response.status(200).json({
      accepted: true,
      customerAddress,
    });
  } catch (error) {
    next(error);
  }
};

const addCustomerAddress = async (request, response, next) => {
  try {
    const validatedData = addCustomerAddressSchema.parse(request.body);

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

    if (validatedData.isDefault) {
      await CustomerAddressModel.updateMany(
        { customerId: validatedData.customerId },
        { isDefault: false }
      );
    }

    const customerAddressObj = new CustomerAddressModel(validatedData);
    const newCustomerAddress = await customerAddressObj.save();

    return response.status(201).json({
      accepted: true,
      message: "Customer address created successfully!",
      customerAddress: newCustomerAddress,
    });
  } catch (error) {
    next(error);
  }
};

const updateCustomerAddress = async (request, response, next) => {
  try {
    const { customerAddressId } = request.params;
    const validatedData = updateCustomerAddressSchema.parse(request.body);

    const customerAddress = await CustomerAddressModel.findById(customerAddressId);

    if (validatedData.isDefault) {
      await CustomerAddressModel.updateMany(
        { 
          customerId: customerAddress.customerId,
          _id: { $ne: customerAddressId }
        },
        { isDefault: false }
      );
    }

    const updatedCustomerAddress = await CustomerAddressModel.findByIdAndUpdate(
      customerAddressId,
      validatedData,
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "Customer address updated successfully!",
      customerAddress: updatedCustomerAddress,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCustomerAddress = async (request, response, next) => {
  try {
    const { customerAddressId } = request.params;

    const deletedCustomerAddress = await CustomerAddressModel.findByIdAndDelete(customerAddressId);

    return response.status(200).json({
      accepted: true,
      message: "Customer address deleted successfully!",
      customerAddress: deletedCustomerAddress,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomerAddresses,
  getCustomerAddressById,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
};