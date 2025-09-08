const router = require("express").Router();
const analyticsController = require("../controllers/analytics");
const authorization = require("../middlewares/verify-permission");

router.get(
  "/v1/stats/engagement",
  authorization.verifyToken,
  analyticsController.getEngagementStats
);

router.get(
  "/v1/stats/tokens",
  authorization.verifyToken,
  analyticsController.getTokensStats
);

router.get(
  "/v1/stats/messages/growth",
  authorization.verifyToken,
  analyticsController.getMessagesGrowthStats
);

router.get(
  "/v1/stats/chats/growth",
  authorization.verifyToken,
  analyticsController.getChatsGrowthStats
);

router.get(
  "/v1/stats/chats/channels/growth",
  authorization.verifyToken,
  analyticsController.getChatsChannelsGrowthStats
);

router.get(
  "/v1/stats/tokens/growth",
  authorization.verifyToken,
  analyticsController.getTokensGrowthStats
);

module.exports = router;
