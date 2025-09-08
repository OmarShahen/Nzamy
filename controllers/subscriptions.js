const CounterModel = require("../models/CounterModel");
const subscriptionValidation = require("../validations/subscriptions");
const mongoose = require("mongoose");
const config = require("../config/config");
const UserModel = require("../models/UserModel");
const PlanModel = require("../models/PlanModel");
const SubscriptionModel = require("../models/SubscriptionModel");
const utils = require("../utils/utils");

const getSubscriptions = async (request, response) => {
  try {
    let { userId, planId, paymentId, status, limit, page } = request.query;

    let searchQuery = {};

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    if (userId) {
      searchQuery.userId = mongoose.Types.ObjectId(userId);
    }

    if (planId) {
      searchQuery.planId = mongoose.Types.ObjectId(planId);
    }

    if (paymentId) {
      searchQuery.paymentId = mongoose.Types.ObjectId(paymentId);
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const getUserActiveSubscription = async (request, response) => {
  try {
    let { userId } = request.params;

    const todayDate = new Date();

    const subscription = await SubscriptionModel.findOne({
      userId,
      status: "PAID",
      endDate: { $gte: todayDate },
      $expr: { $lt: ["$tokensUsed", "$tokensLimit"] },
    });

    return response.status(200).json({
      accepted: true,
      subscription,
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

const addSubscription = async (request, response) => {
  try {
    const dataValidation = subscriptionValidation.addSubscription(request.body);
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { userId, planId } = request.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return response.status(400).json({
        accepted: false,
        message: "User ID does not exist",
        field: "userId",
      });
    }

    const plan = await PlanModel.findById(planId);
    if (!plan) {
      return response.status(400).json({
        accepted: false,
        message: "Plan ID does not exist",
        field: "planId",
      });
    }

    const todayDate = new Date();

    const activeSubscription = await SubscriptionModel.findOne({
      userId,
      status: "PAID",
      endDate: { $gte: todayDate },
      $expr: { $lt: ["$tokensUsed", "$tokensLimit"] },
    });

    if (activeSubscription) {
      return response.status(400).json({
        accepted: false,
        message: "You already have active subscription",
        field: "endDate",
      });
    }

    const counter = await CounterModel.findOneAndUpdate(
      { name: `subscription` },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const startDate = new Date();
    const endDate = utils.addDays(startDate, plan.duration);

    const subscriptionData = {
      subscriptionId: counter.value,
      userId,
      planId,
      status: "PAID",
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const updateSubscription = async (request, response) => {
  try {
    const dataValidation = subscriptionValidation.updateSubscription(
      request.body
    );
    if (!dataValidation.isAccepted) {
      return response.status(400).json({
        accepted: dataValidation.isAccepted,
        message: dataValidation.message,
        field: dataValidation.field,
      });
    }

    const { subscriptionId } = request.params;
    const { status } = request.body;

    const subscription = await SubscriptionModel.findById(subscriptionId);

    const todayDate = new Date();

    if (new Date(subscription.endDate) < todayDate) {
      return response.status(400).json({
        accepted: false,
        message: "Subscription is already expired",
        field: "status",
      });
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const deleteSubscription = async (request, response) => {
  try {
    const { subscriptionId } = request.params;

    const subscription = await SubscriptionModel.findById(subscriptionId);

    const todayDate = new Date();

    if (new Date(subscription.endDate) < todayDate) {
      return response.status(400).json({
        accepted: false,
        message: "Subscription is already expired",
        field: "status",
      });
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const getUserActiveTokens = async (request, response) => {
  try {
    const { userId } = request.params;

    const matchQuery = {
      userId: new mongoose.Types.ObjectId(userId),
      status: "PAID",
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
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
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
