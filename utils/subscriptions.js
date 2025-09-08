const SubscriptionModel = require("../models/SubscriptionModel");

const getUserActiveSubscription = async (userId) => {
  const todayDate = new Date();

  const activeSubscription = await SubscriptionModel.findOne({
    userId,
    status: "PAID",
    endDate: { $gte: todayDate },
    $expr: { $lt: ["$tokensUsed", "$tokensLimit"] },
  });

  return activeSubscription;
};

module.exports = { getUserActiveSubscription };
