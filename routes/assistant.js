const router = require("express").Router();
const assistantController = require("../controllers/assistant");
const authorization = require("../middlewares/verify-permission");

router.post(
  "/v1/assistant/ask",
  authorization.verifyToken,
  assistantController.askAssistant
);

router.get(
  "/v1/assistant/messenger/webhook",
  assistantController.verifyMessenger
);

router.post(
  "/v1/assistant/messenger/webhook",
  assistantController.askAssistantThroughMessenger
);

router.get("/v1/facebook/callback", assistantController.facebookCallback);

router.post(
  "/v1/assistant/test-facebook-upload",
  assistantController.testFacebookImageUpload
);

router.post(
  "/v1/assistant/test-send-facebook-image",
  assistantController.testSendFacebookImage
);

module.exports = router;
