const router = require("express").Router();
const storesController = require("../controllers/stores");
const authorization = require("../middlewares/verify-permission");
const { verifyStoreId } = require("../middlewares/verify-routes-params");

router.get("/v1/stores", authorization.verifyToken, storesController.getStores);

router.get(
  "/v1/stores/:storeId",
  authorization.verifyToken,
  verifyStoreId,
  storesController.getStoreById
);

router.post("/v1/stores", authorization.verifyToken, storesController.addStore);

router.put(
  "/v1/stores/:storeId",
  authorization.verifyToken,
  verifyStoreId,
  storesController.updateStore
);

router.delete(
  "/v1/stores/:storeId",
  authorization.verifyToken,
  verifyStoreId,
  storesController.deleteStore
);

module.exports = router;
