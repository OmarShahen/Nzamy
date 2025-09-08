const router = require("express").Router();
const customerAddressesController = require("../controllers/customerAddresses");
const authorization = require("../middlewares/verify-permission");
const { verifyCustomerAddressId } = require("../middlewares/verify-routes-params");

router.get("/v1/customer-addresses", authorization.verifyToken, customerAddressesController.getCustomerAddresses);

router.get(
  "/v1/customer-addresses/:customerAddressId",
  authorization.verifyToken,
  verifyCustomerAddressId,
  customerAddressesController.getCustomerAddressById
);

router.post("/v1/customer-addresses", authorization.verifyToken, customerAddressesController.addCustomerAddress);

router.put(
  "/v1/customer-addresses/:customerAddressId",
  authorization.verifyToken,
  verifyCustomerAddressId,
  customerAddressesController.updateCustomerAddress
);

router.delete(
  "/v1/customer-addresses/:customerAddressId",
  authorization.verifyToken,
  verifyCustomerAddressId,
  customerAddressesController.deleteCustomerAddress
);

module.exports = router;