const router = require("express").Router();
const usersController = require("../controllers/users");
const { verifyUserId } = require("../middlewares/verify-routes-params");
const authorization = require("../middlewares/verify-permission");

router.get(
  "/v1/users/:userId",
  authorization.verifyToken,
  verifyUserId,
  usersController.getUser
);

router.get(
  "/v1/users",
  authorization.verifyToken,
  usersController.getUsers  
);

router.put(
  "/v1/users/:userId",
  authorization.verifyToken,
  verifyUserId,
  usersController.updateUserMainData
);

router.patch(
  "/v1/users/:userId/password",
  authorization.verifyToken,
  verifyUserId,
  usersController.updateUserPassword
);

router.patch(
  "/v1/users/:userId/password/verify",
  authorization.verifyToken,
  verifyUserId,
  usersController.verifyAndUpdateUserPassword
);

module.exports = router;
