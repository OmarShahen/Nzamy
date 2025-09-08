const router = require("express").Router();
const customersController = require("../controllers/customers");
const authorization = require("../middlewares/verify-permission");
const { verifyCustomerId } = require("../middlewares/verify-routes-params");

router.get("/v1/customers", authorization.verifyToken, customersController.getCustomers);

router.get(
  "/v1/customers/:customerId",
  authorization.verifyToken,
  verifyCustomerId,
  customersController.getCustomerById
);

router.post("/v1/customers", authorization.verifyToken, customersController.addCustomer);

router.put(
  "/v1/customers/:customerId",
  authorization.verifyToken,
  verifyCustomerId,
  customersController.updateCustomer
);

router.delete(
  "/v1/customers/:customerId",
  authorization.verifyToken,
  verifyCustomerId,
  customersController.deleteCustomer
);

module.exports = router;