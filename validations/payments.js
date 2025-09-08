const utils = require("../utils/utils");

const createPaymentURL = (paymentData) => {
  const { userId, planId } = paymentData;

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

  return { isAccepted: true, message: "data is valid", data: paymentData };
};

module.exports = {
  createPaymentURL,
};
