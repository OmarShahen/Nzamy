const router = require("express").Router();
const ordersController = require("../controllers/orders");
const { verifyOrderId } = require("../middlewares/verify-routes-params");
const authorization = require("../middlewares/verify-permission");

router.get("/v1/orders", authorization.verifyToken, ordersController.getOrders);

router.get(
  "/v1/orders/:orderId",
  authorization.verifyToken,
  verifyOrderId,
  ordersController.getOrderById
);

router.post("/v1/orders", authorization.verifyToken, ordersController.addOrder);

router.delete(
  "/v1/orders/:orderId",
  authorization.verifyToken,
  verifyOrderId,
  ordersController.deleteOrder
);

router.put(
  "/v1/orders/:orderId",
  authorization.verifyToken,
  verifyOrderId,
  ordersController.updateOrder
);

router.get(
  "/v1/analytics/orders/growth",
  authorization.verifyToken,
  ordersController.getOrdersGrowthStats
);

router.get(
  "/v1/analytics/orders/stats",
  authorization.verifyToken,
  ordersController.getOrdersStats
);

router.get(
  "/v1/analytics/orders/items/quantity/stats",
  authorization.verifyToken,
  ordersController.getOrdersItemsQuantityStats
);

module.exports = router;
