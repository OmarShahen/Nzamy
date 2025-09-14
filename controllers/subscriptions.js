const CounterModel = require("../models/CounterModel");
const subscriptionValidation = require("../validations/subscriptions");
const mongoose = require("mongoose");
const config = require("../config/config");
const UserModel = require("../models/UserModel");
const PlanModel = require("../models/PlanModel");
const SubscriptionModel = require("../models/SubscriptionModel");
const utils = require("../utils/utils");
const { AppError } = require("../middlewares/errorHandler");

const getSubscriptions = async (request, response, next) => {
  try {
    let { userId, planId, paymentId, status, limit, page } = request.query;

    let searchQuery = {};

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    if (userId) {
      searchQuery.userId = new mongoose.Types.ObjectId(userId);
    }

    if (planId) {
      searchQuery.planId = new mongoose.Types.ObjectId(planId);
    }

    if (paymentId) {
      searchQuery.paymentId = new mongoose.Types.ObjectId(paymentId);
    }

    if (status) {
      searchQuery.status = status;
    }

    const subscriptions = await SubscriptionModel.aggregate([
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
          from: "plans",
          localField: "planId",
          foreignField: "_id",
          as: "plan",
        },
      },
      {
        $lookup: {
          from: "payments",
          localField: "paymentId",
          foreignField: "_id",
          as: "payment",
        },
      },
    ]);

    subscriptions.forEach((subscription) => {
      subscription.plan = subscription.plan[0];
      subscription.payment = subscription.payment[0];
    });

    const total = await SubscriptionModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      subscriptions,
    });
  } catch (error) {
    next(error)
  }
};

const getUserActiveSubscription = async (request, response, next) => {
  try {
    let { userId } = request.params;

    const todayDate = new Date();

    const subscription = await SubscriptionModel.findOne({
      userId,
      status: "paid",
      endDate: { $gte: todayDate },
      $expr: { $lt: ["$tokensUsed", "$tokensLimit"] },
    });

    return response.status(200).json({
      accepted: true,
      subscription,
    });
  } catch (error) {
    next(error)
  }
};

const addSubscription = async (request, response, next) => {
  try {
    const validatedData = subscriptionValidation.addSubscriptionSchema.parse(request.body);

    const { userId, planId } = validatedData;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User ID does not exist", 400)
    }

    const plan = await PlanModel.findById(planId);
    if (!plan) {
      throw new AppError("Plan ID does not exist", 400)
    }

    const todayDate = new Date();

    const activeSubscription = await SubscriptionModel.findOne({
      userId,
      status: "paid",
      endDate: { $gte: todayDate },
      $expr: { $lt: ["$tokensUsed", "$tokensLimit"] },
    });

    if (activeSubscription) {
      throw new AppError("You already have active subscription", 400)
    }

    const startDate = new Date();
    const endDate = utils.addDays(startDate, plan.duration);

    const subscriptionData = {
      userId,
      planId,
      status: "paid",
      startDate,
      endDate,
      tokensLimit: plan.tokensLimit,
    };
    const subscriptionObj = new SubscriptionModel(subscriptionData);
    const newSubscription = await subscriptionObj.save();

    return response.status(200).json({
      accepted: true,
      message: "Subscription is added successfully!",
      subscription: newSubscription,
    });
  } catch (error) {
    next(error)
  }
};

const updateSubscription = async (request, response, next) => {
  try {
    const validatedData = subscriptionValidation.updateSubscriptionSchema.parse(
      request.body
    );

    const { subscriptionId } = request.params;
    const { status } = validatedData;

    const subscription = await SubscriptionModel.findById(subscriptionId);

    const todayDate = new Date();

    if (new Date(subscription.endDate) < todayDate) {
      throw new AppError("Subscription is already expired", 400)
    }

    const updatedSubscription = await SubscriptionModel.findByIdAndUpdate(
      subscriptionId,
      { status },
      { new: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "Subscription is updated successfully!",
      subscription: updatedSubscription,
    });
  } catch (error) {
    next(error)
  }
};

const deleteSubscription = async (request, response, next) => {
  try {
    const { subscriptionId } = request.params;

    const subscription = await SubscriptionModel.findById(subscriptionId);

    const todayDate = new Date();

    if (new Date(subscription.endDate) < todayDate) {
      throw new AppError("Subscription is already expired", 400)
    }

    const deletedSubscription = await SubscriptionModel.findByIdAndDelete(
      subscriptionId
    );

    return response.status(200).json({
      accepted: true,
      message: "Subscription is deleted successfully!",
      subscription: deletedSubscription,
    });
  } catch (error) {
    next(error)
  }
};

const getUserActiveTokens = async (request, response, next) => {
  try {
    const { userId } = request.params;

    const matchQuery = {
      userId: new mongoose.Types.ObjectId(userId),
      status: "paid",
      endDate: { $gte: new Date() },
    };

    const totalActiveTokens = await SubscriptionModel.aggregate([
      {
        $match: matchQuery,
      },
      {
        $group: {
          _id: null,
          totalTokensLimit: { $sum: "$tokensLimit" },
          totalTokensUsed: { $sum: "$tokensUsed" },
        },
      },
    ]);

    const totalTokensLimit = totalActiveTokens[0]?.totalTokensLimit || 0;
    const totalTokensUsed = totalActiveTokens[0]?.totalTokensUsed || 0;

    return response.status(200).json({
      accepted: true,
      totalTokensLimit,
      totalTokensUsed,
    });
  } catch (error) {
    next(error)
  }
};

module.exports = {
  getSubscriptions,
  getUserActiveSubscription,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  getUserActiveTokens,
};
