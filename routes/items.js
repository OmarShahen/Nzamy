const router = require("express").Router();
const itemsController = require("../controllers/items");
const authorization = require("../middlewares/verify-permission");
const {
  verifyItemId,
  verifyStoreId,
} = require("../middlewares/verify-routes-params");

router.get("/v1/items", authorization.verifyToken, itemsController.getItems);

router.get(
  "/v1/items/:itemId",
  authorization.verifyToken,
  verifyItemId,
  itemsController.getItem
);

router.post("/v1/items", authorization.verifyToken, itemsController.addItem);

router.put(
  "/v1/items/:itemId",
  authorization.verifyToken,
  verifyItemId,
  itemsController.updateItem
);

router.post(
  "/v1/items/:itemId/images",
  authorization.verifyToken,
  verifyItemId,
  itemsController.updateItemImagesVectors
);

router.post(
  "/v1/items/stores/:storeId/images/similarity",
  authorization.verifyToken,
  verifyStoreId,
  itemsController.searchItemsByImage
);

router.delete(
  "/v1/items/:itemId",
  authorization.verifyToken,
  verifyItemId,
  itemsController.deleteItem
);

router.get(
  "/v1/analytics/items/growth",
  authorization.verifyToken,
  itemsController.getItemsGrowthStats
);

module.exports = router;
