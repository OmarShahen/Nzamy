const router = require("express").Router();
const loyaltyRulesController = require("../controllers/loyaltyRules");
const authorization = require("../middlewares/verify-permission");
const { verifyLoyaltyRuleId } = require("../middlewares/verify-routes-params");

router.get("/v1/loyalty-rules", authorization.verifyToken, loyaltyRulesController.getLoyaltyRules);

router.get(
  "/v1/loyalty-rules/:loyaltyRuleId",
  authorization.verifyToken,
  verifyLoyaltyRuleId,
  loyaltyRulesController.getLoyaltyRuleById
);

router.post("/v1/loyalty-rules", authorization.verifyToken, loyaltyRulesController.addLoyaltyRule);

router.put(
  "/v1/loyalty-rules/:loyaltyRuleId",
  authorization.verifyToken,
  verifyLoyaltyRuleId,
  loyaltyRulesController.updateLoyaltyRule
);

router.delete(
  "/v1/loyalty-rules/:loyaltyRuleId",
  authorization.verifyToken,
  verifyLoyaltyRuleId,
  loyaltyRulesController.deleteLoyaltyRule
);

module.exports = router;