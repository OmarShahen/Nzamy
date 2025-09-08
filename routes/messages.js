const router = require("express").Router();
const messagesController = require("../controllers/messages");
const authorization = require("../middlewares/verify-permission");
const { verifyMessageId } = require("../middlewares/verify-routes-params");

router.get(
  "/v1/messages",
  authorization.verifyToken,
  messagesController.getMessages
);

router.delete(
  "/v1/messages/:messageId",
  authorization.verifyToken,
  verifyMessageId,
  messagesController.deleteMessage
);

module.exports = router;
