const router = require("express").Router();
const loyaltyTransactionsController = require("../controllers/loyaltyTransactions");
const authorization = require("../middlewares/verify-permission");
const { verifyLoyaltyTransactionId } = require("../middlewares/verify-routes-params");

router.get("/v1/loyalty-transactions", authorization.verifyToken, loyaltyTransactionsController.getLoyaltyTransactions);

router.get(
  "/v1/loyalty-transactions/:loyaltyTransactionId",
  authorization.verifyToken,
  verifyLoyaltyTransactionId,
  loyaltyTransactionsController.getLoyaltyTransactionById
);

router.post("/v1/loyalty-transactions", authorization.verifyToken, loyaltyTransactionsController.addLoyaltyTransaction);

router.delete(
  "/v1/loyalty-transactions/:loyaltyTransactionId",
  authorization.verifyToken,
  verifyLoyaltyTransactionId,
  loyaltyTransactionsController.deleteLoyaltyTransaction
);

module.exports = router;