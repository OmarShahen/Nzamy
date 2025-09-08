const router = require("express").Router();
const plansController = require("../controllers/plans");
const authorization = require("../middlewares/verify-permission");
const { verifyPlanId } = require("../middlewares/verify-routes-params");

router.get("/v1/plans", plansController.getPlans);

router.post("/v1/plans", authorization.verifyToken, plansController.addPlan);

router.put(
  "/v1/plans/:planId",
  authorization.verifyToken,
  verifyPlanId,
  plansController.updatePlan
);

router.delete(
  "/v1/plans/:planId",
  authorization.verifyToken,
  verifyPlanId,
  plansController.deletePlan
);

module.exports = router;
