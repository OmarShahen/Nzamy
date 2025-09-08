const CustomerModel = require("../models/CustomerModel");
const StoreModel = require("../models/StoreModel");
const UserModel = require("../models/UserModel");
const TagModel = require("../models/TagModel");
const { addCustomerSchema, updateCustomerSchema } = require("../validations/customers");
const { AppError } = require("../middlewares/errorHandler");
const mongoose = require("mongoose");
const config = require("../config/config");

const getCustomers = async (request, response, next) => {
  try {
    let { userId, storeId, name, phone, email, source, limit, page } = request.query;

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

    if (phone) {
      searchQuery.phone = { $regex: phone, $options: "i" };
    }

    if (email) {
      searchQuery.email = { $regex: email, $options: "i" };
    }

    if (source) {
      searchQuery.source = source;
    }

    const customers = await CustomerModel.aggregate([
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
          localField: "tags",
          foreignField: "_id",
          as: "tagDetails",
        },
      },
    ]);

    customers.forEach((customer) => {
      customer.store = customer.store[0];
      customer.user = customer.user[0];
    });

    const total = await CustomerModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      customers,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerById = async (request, response, next) => {
  try {
    const { customerId } = request.params;

    const customer = await CustomerModel.findById(customerId);

    return response.status(200).json({
      accepted: true,
      customer,
    });
  } catch (error) {
    next(error);
  }
};

const addCustomer = async (request, response, next) => {
  try {
    const validatedData = addCustomerSchema.parse(request.body);

    const user = await UserModel.findById(validatedData.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const store = await StoreModel.findById(validatedData.storeId);
    if (!store) {
      throw new AppError("Store not found", 404);
    }

    if (validatedData.tags && validatedData.tags.length > 0) {
      const tagCount = await TagModel.countDocuments({
        _id: { $in: validatedData.tags },
        storeId: validatedData.storeId
      });
      if (tagCount !== validatedData.tags.length) {
        throw new AppError("One or more tags do not exist for this store", 400);
      }
    }

    const customerCount = await CustomerModel.countDocuments({
      storeId: validatedData.storeId,
      socialMediaId: validatedData.socialMediaId,
      source: validatedData.source
    });
    if (customerCount > 0) {
      throw new AppError("Customer with this social media ID already exists for this store", 400);
    }

    const customerObj = new CustomerModel(validatedData);
    const newCustomer = await customerObj.save();

    return response.status(201).json({
      accepted: true,
      message: "Customer created successfully!",
      customer: newCustomer,
    });
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (request, response, next) => {
  try {
    const { customerId } = request.params;
    const validatedData = updateCustomerSchema.parse(request.body);

    const customer = await CustomerModel.findById(customerId);

    if (validatedData.tags && validatedData.tags.length > 0) {
      const tagCount = await TagModel.countDocuments({
        _id: { $in: validatedData.tags },
        storeId: customer.storeId
      });
      if (tagCount !== validatedData.tags.length) {
        throw new AppError("One or more tags do not exist for this store", 400);
      }
    }

    const updatedCustomer = await CustomerModel.findByIdAndUpdate(
      customerId,
      validatedData,
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "Customer updated successfully!",
      customer: updatedCustomer,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (request, response, next) => {
  try {
    const { customerId } = request.params;

    const deletedCustomer = await CustomerModel.findByIdAndDelete(customerId);

    return response.status(200).json({
      accepted: true,
      message: "Customer deleted successfully!",
      customer: deletedCustomer,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  addCustomer,
  updateCustomer,
  deleteCustomer,
};