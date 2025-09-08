const router = require("express").Router();
const paymentsController = require("../controllers/payments");
const authorization = require("../middlewares/verify-permission");
const { verifyPaymentId } = require("../middlewares/verify-routes-params");

router.post(
  "/v1/payments/url",
  authorization.verifyToken,
  paymentsController.createPaymentURL
);

router.post("/v1/payments/paymob/process", paymentsController.processPayment);

router.get(
  "/v1/payments",
  authorization.verifyToken,
  paymentsController.getPayments
);

router.post(
  "/v1/payments/:paymentId/refund",
  authorization.verifyToken,
  verifyPaymentId,
  paymentsController.refundPayment
);

router.delete(
  "/v1/payments/:paymentId",
  authorization.verifyToken,
  verifyPaymentId,
  paymentsController.deletePayment
);

module.exports = router;
