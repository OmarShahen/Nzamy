const router = require("express").Router();
const channelsController = require("../controllers/channels");
const authorization = require("../middlewares/verify-permission");
const { verifyChannelId } = require("../middlewares/verify-routes-params");

router.get(
  "/v1/channels",
  authorization.verifyToken,
  channelsController.getChannels
);

router.delete(
  "/v1/channels/:channelId",
  authorization.verifyToken,
  verifyChannelId,
  channelsController.deleteChannel
);

router.post(
  "/v1/channels/:channelId/subscribe",
  authorization.verifyToken,
  verifyChannelId,
  channelsController.subscribeFacebookPage
);

router.delete(
  "/v1/channels/:channelId/subscribe",
  authorization.verifyToken,
  verifyChannelId,
  channelsController.unsubscribeFacebookPage
);

module.exports = router;
