const router = require("express").Router();
const chatsController = require("../controllers/chats");
const authorization = require("../middlewares/verify-permission");
const { verifyChatId } = require("../middlewares/verify-routes-params");

router.get("/v1/chats", authorization.verifyToken, chatsController.getChats);

router.delete(
  "/v1/chats/:chatId",
  authorization.verifyToken,
  verifyChatId,
  chatsController.deleteChat
);

module.exports = router;
