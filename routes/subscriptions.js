const router = require("express").Router();
const subscriptionsController = require("../controllers/subscriptions");
const authorization = require("../middlewares/verify-permission");
const {
  verifySubscriptionId,
  verifyUserId,
} = require("../middlewares/verify-routes-params");

router.get(
  "/v1/subscriptions",
  authorization.verifyToken,
  subscriptionsController.getSubscriptions
);

router.get(
  "/v1/users/:userId/subscriptions/active",
  authorization.verifyToken,
  verifyUserId,
  subscriptionsController.getUserActiveSubscription
);

router.post(
  "/v1/subscriptions",
  authorization.verifyToken,
  subscriptionsController.addSubscription
);

router.put(
  "/v1/subscriptions/:subscriptionId",
  authorization.verifyToken,
  verifySubscriptionId,
  subscriptionsController.updateSubscription
);

router.delete(
  "/v1/subscriptions/:subscriptionId",
  authorization.verifyToken,
  verifySubscriptionId,
  subscriptionsController.deleteSubscription
);

router.get(
  "/v1/subscriptions/users/:userId/tokens-usage",
  authorization.verifyToken,
  verifyUserId,
  subscriptionsController.getUserActiveTokens
);

module.exports = router;
