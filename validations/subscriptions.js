const utils = require("../utils/utils");
const config = require("../config/config");

const addSubscription = (subscriptionData) => {
  const { userId, planId } = subscriptionData;

  if (!userId || !utils.isObjectId(userId))
    return {
      isAccepted: false,
      message: "User Id format is invalid",
      field: "userId",
    };

  if (!planId || !utils.isObjectId(planId))
    return {
      isAccepted: false,
      message: "Plan Id format is invalid",
      field: "planId",
    };

  return { isAccepted: true, message: "data is valid", data: subscriptionData };
};

const updateSubscription = (subscriptionData) => {
  const { status } = subscriptionData;

  if (!status)
    return {
      isAccepted: false,
      message: "Status is required",
      field: "status",
    };

  if (!config.SUBSCRIPTION_STATUS.includes(status))
    return {
      isAccepted: false,
      message: "Status value is invalid",
      field: "status",
    };

  return { isAccepted: true, message: "data is valid", data: subscriptionData };
};

module.exports = {
  addSubscription,
  updateSubscription,
};
