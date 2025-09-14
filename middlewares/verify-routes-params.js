const utils = require("../utils/utils");
const { AppError } = require("../middlewares/errorHandler");
const UserModel = require("../models/UserModel");
const ItemModel = require("../models/ItemModel");
const OrderModel = require("../models/OrderModel");
const StoreModel = require("../models/StoreModel");
const CategoryModel = require("../models/CategoryModel");
const ChannelModel = require("../models/ChannelModel");
const ChatModel = require("../models/ChatModel");
const MessageModel = require("../models/MessageModel");
const PlanModel = require("../models/PlanModel");
const SubscriptionModel = require("../models/SubscriptionModel");
const PaymentModel = require("../models/PaymentModel");
const TagModel = require("../models/TagModel");
const CustomerAddressModel = require("../models/CustomerAddressModel");
const CustomerModel = require("../models/CustomerModel");
const LoyaltyTransactionModel = require("../models/LoyaltyTransactionModel");
const LoyaltyRuleModel = require("../models/LoyaltyRuleModel");
const CartModel = require("../models/CartModel");
const OfferModel = require("../models/OfferModel");

const verifyUserId = async (request, response, next) => {
  try {
    const { userId } = request.params;

    if (!utils.isObjectId(userId)) {
      throw new AppError("Invalid user ID format", 400);
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifyItemId = async (request, response, next) => {
  try {
    const { itemId } = request.params;

    if (!utils.isObjectId(itemId)) {
      throw new AppError("Invalid item ID format", 400);
    }

    const item = await ItemModel.findById(itemId);
    if (!item) {
      throw new AppError("Item ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifyOrderId = async (request, response, next) => {
  try {
    const { orderId } = request.params;

    if (!utils.isObjectId(orderId)) {
      throw new AppError("Invalid order ID format", 400);
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new AppError("Order ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};


const verifyStoreId = async (request, response, next) => {
  try {
    const { storeId } = request.params;

    if (!utils.isObjectId(storeId)) {
      throw new AppError("Invalid store ID format", 400);
    }

    const store = await StoreModel.findById(storeId);
    if (!store) {
      throw new AppError("Store ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifyCategoryId = async (request, response, next) => {
  try {
    const { categoryId } = request.params;

    if (!utils.isObjectId(categoryId)) {
      throw new AppError("Invalid category ID format", 400);
    }

    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      throw new AppError("Category ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifyChannelId = async (request, response, next) => {
  try {
    const { channelId } = request.params;

    if (!utils.isObjectId(channelId)) {
      throw new AppError("Invalid channel ID format", 400);
    }

    const channel = await ChannelModel.findById(channelId);
    if (!channel) {
      throw new AppError("Channel ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifyChatId = async (request, response, next) => {
  try {
    const { chatId } = request.params;

    if (!utils.isObjectId(chatId)) {
      throw new AppError("Invalid chat ID format", 400);
    }

    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      throw new AppError("Chat ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifyMessageId = async (request, response, next) => {
  try {
    const { messageId } = request.params;

    if (!utils.isObjectId(messageId)) {
      throw new AppError("Invalid message ID format", 400);
    }

    const message = await MessageModel.findById(messageId);
    if (!message) {
      throw new AppError("Message ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifyPlanId = async (request, response, next) => {
  try {
    const { planId } = request.params;

    if (!utils.isObjectId(planId)) {
      throw new AppError("Invalid plan ID format", 400);
    }

    const plan = await PlanModel.findById(planId);
    if (!plan) {
      throw new AppError("Plan ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifySubscriptionId = async (request, response, next) => {
  try {
    const { subscriptionId } = request.params;

    if (!utils.isObjectId(subscriptionId)) {
      throw new AppError("Invalid subscription ID format", 400);
    }

    const subscription = await SubscriptionModel.findById(subscriptionId);
    if (!subscription) {
      throw new AppError("Subscription ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifyPaymentId = async (request, response, next) => {
  try {
    const { paymentId } = request.params;

    if (!utils.isObjectId(paymentId)) {
      throw new AppError("Invalid payment ID format", 400);
    }

    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      throw new AppError("Payment ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifyTagId = async (request, response, next) => {
  try {
    const { tagId } = request.params;

    if (!utils.isObjectId(tagId)) {
      throw new AppError("Invalid tag ID format", 400);
    }

    const tag = await TagModel.findById(tagId);
    if (!tag) {
      throw new AppError("Tag ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifyCustomerAddressId = async (request, response, next) => {
  try {
    const { customerAddressId } = request.params;

    if (!utils.isObjectId(customerAddressId)) {
      throw new AppError("Invalid customer address ID format", 400);
    }

    const customerAddress = await CustomerAddressModel.findById(customerAddressId);
    if (!customerAddress) {
      throw new AppError("Customer address ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifyCustomerId = async (request, response, next) => {
  try {
    const { customerId } = request.params;

    if (!utils.isObjectId(customerId)) {
      throw new AppError("Invalid customer ID format", 400);
    }

    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      throw new AppError("Customer ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifyLoyaltyTransactionId = async (request, response, next) => {
  try {
    const { loyaltyTransactionId } = request.params;

    if (!utils.isObjectId(loyaltyTransactionId)) {
      throw new AppError("Invalid loyalty transaction ID format", 400);
    }

    const loyaltyTransaction = await LoyaltyTransactionModel.findById(loyaltyTransactionId);
    if (!loyaltyTransaction) {
      throw new AppError("Loyalty transaction ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifyLoyaltyRuleId = async (request, response, next) => {
  try {
    const { loyaltyRuleId } = request.params;

    if (!utils.isObjectId(loyaltyRuleId)) {
      throw new AppError("Invalid loyalty rule ID format", 400);
    }

    const loyaltyRule = await LoyaltyRuleModel.findById(loyaltyRuleId);
    if (!loyaltyRule) {
      throw new AppError("Loyalty rule ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifyCartId = async (request, response, next) => {
  try {
    const { cartId } = request.params;

    if (!utils.isObjectId(cartId)) {
      throw new AppError("Invalid cart ID format", 400);
    }

    const cart = await CartModel.findById(cartId);
    if (!cart) {
      throw new AppError("Cart ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

const verifyOfferId = async (request, response, next) => {
  try {
    const { offerId } = request.params;

    if (!utils.isObjectId(offerId)) {
      throw new AppError("Invalid offer ID format", 400);
    }

    const offer = await OfferModel.findById(offerId);
    if (!offer) {
      throw new AppError("Offer ID does not exist", 404);
    }

    return next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyUserId,
  verifyItemId,
  verifyOrderId,
  verifyStoreId,
  verifyCategoryId,
  verifyChannelId,
  verifyChatId,
  verifyMessageId,
  verifyPlanId,
  verifySubscriptionId,
  verifyPaymentId,
  verifyTagId,
  verifyCustomerAddressId,
  verifyCustomerId,
  verifyLoyaltyTransactionId,
  verifyLoyaltyRuleId,
  verifyCartId,
  verifyOfferId,
};
