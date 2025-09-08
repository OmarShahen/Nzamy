const CartModel = require("../models/CartModel");
const CustomerModel = require("../models/CustomerModel");
const StoreModel = require("../models/StoreModel");
const UserModel = require("../models/UserModel");
const ItemModel = require("../models/ItemModel");
const { addCartSchema, updateCartSchema, addItemToCartSchema, updateCartItemSchema } = require("../validations/carts");
const { AppError } = require("../middlewares/errorHandler");
const mongoose = require("mongoose");
const config = require("../config/config");

const getCarts = async (request, response, next) => {
  try {
    let { userId, storeId, customerId, status, limit, page } = request.query;

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

    if (status) {
      searchQuery.status = status;
    }

    const carts = await CartModel.aggregate([
      {
        $match: searchQuery,
      },
      {
        $sort: {
          lastUpdated: -1,
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

    carts.forEach((cart) => {
      cart.store = cart.store[0];
      cart.user = cart.user[0];
      cart.customer = cart.customer[0];
    });

    const total = await CartModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      carts,
    });
  } catch (error) {
    next(error);
  }
};

const getCartById = async (request, response, next) => {
  try {
    const { cartId } = request.params;

    const cart = await CartModel.findById(cartId);

    return response.status(200).json({
      accepted: true,
      cart,
    });
  } catch (error) {
    next(error);
  }
};

const getActiveCart = async (request, response, next) => {
  try {
    const { customerId, storeId } = request.query;

    if (!customerId || !storeId) {
      throw new AppError("Customer ID and Store ID are required", 400);
    }

    const cart = await CartModel.findOne({
      customerId: mongoose.Types.ObjectId(customerId),
      storeId: mongoose.Types.ObjectId(storeId),
      status: "active"
    });

    return response.status(200).json({
      accepted: true,
      cart,
    });
  } catch (error) {
    next(error);
  }
};

const addCart = async (request, response, next) => {
  try {
    const validatedData = addCartSchema.parse(request.body);

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

    // Check if customer has an active cart for this store
    const existingCart = await CartModel.findOne({
      customerId: validatedData.customerId,
      storeId: validatedData.storeId,
      status: "active"
    });

    if (existingCart) {
      throw new AppError("Customer already has an active cart for this store", 400);
    }

    // Validate all items exist
    for (const item of validatedData.items) {
      const itemExists = await ItemModel.findById(item.itemId);
      if (!itemExists) {
        throw new AppError(`Item with ID ${item.itemId} not found`, 404);
      }
    }

    const cartObj = new CartModel(validatedData);
    const newCart = await cartObj.save();

    return response.status(201).json({
      accepted: true,
      message: "Cart created successfully!",
      cart: newCart,
    });
  } catch (error) {
    next(error);
  }
};

const addItemToCart = async (request, response, next) => {
  try {
    const { cartId } = request.params;
    const validatedData = addItemToCartSchema.parse(request.body);

    const cart = await CartModel.findById(cartId);

    // Validate item exists
    const item = await ItemModel.findById(validatedData.itemId);
    if (!item) {
      throw new AppError("Item not found", 404);
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.itemId.toString() === validatedData.itemId
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += validatedData.quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        itemId: validatedData.itemId,
        quantity: validatedData.quantity,
        price: validatedData.price,
        addedAt: new Date()
      });
    }

    const updatedCart = await cart.save();

    return response.status(200).json({
      accepted: true,
      message: "Item added to cart successfully!",
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (request, response, next) => {
  try {
    const { cartId, itemId } = request.params;
    const validatedData = updateCartItemSchema.parse(request.body);

    const cart = await CartModel.findById(cartId);

    const itemIndex = cart.items.findIndex(item => item.itemId.toString() === itemId);
    if (itemIndex === -1) {
      throw new AppError("Item not found in cart", 404);
    }

    cart.items[itemIndex].quantity = validatedData.quantity;
    const updatedCart = await cart.save();

    return response.status(200).json({
      accepted: true,
      message: "Cart item updated successfully!",
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

const removeItemFromCart = async (request, response, next) => {
  try {
    const { cartId, itemId } = request.params;

    const cart = await CartModel.findById(cartId);

    cart.items = cart.items.filter(item => item.itemId.toString() !== itemId);
    const updatedCart = await cart.save();

    return response.status(200).json({
      accepted: true,
      message: "Item removed from cart successfully!",
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (request, response, next) => {
  try {
    const { cartId } = request.params;

    const cart = await CartModel.findById(cartId);
    cart.items = [];
    const updatedCart = await cart.save();

    return response.status(200).json({
      accepted: true,
      message: "Cart cleared successfully!",
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

const updateCart = async (request, response, next) => {
  try {
    const { cartId } = request.params;
    const validatedData = updateCartSchema.parse(request.body);

    // If updating items, validate all items exist
    if (validatedData.items) {
      for (const item of validatedData.items) {
        const itemExists = await ItemModel.findById(item.itemId);
        if (!itemExists) {
          throw new AppError(`Item with ID ${item.itemId} not found`, 404);
        }
      }
    }

    const updatedCart = await CartModel.findByIdAndUpdate(
      cartId,
      validatedData,
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "Cart updated successfully!",
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCart = async (request, response, next) => {
  try {
    const { cartId } = request.params;

    const deletedCart = await CartModel.findByIdAndDelete(cartId);

    return response.status(200).json({
      accepted: true,
      message: "Cart deleted successfully!",
      cart: deletedCart,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCarts,
  getCartById,
  getActiveCart,
  addCart,
  addItemToCart,
  updateCartItem,
  removeItemFromCart,
  clearCart,
  updateCart,
  deleteCart,
};