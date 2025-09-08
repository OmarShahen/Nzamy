const router = require("express").Router();
const categoriesController = require("../controllers/categories");
const authorization = require("../middlewares/verify-permission");
const { verifyCategoryId } = require("../middlewares/verify-routes-params");

router.get(
  "/v1/categories",
  authorization.verifyToken,
  categoriesController.getCategories
);

router.post(
  "/v1/categories",
  authorization.verifyToken,
  categoriesController.addCategory
);

router.put(
  "/v1/categories/:categoryId",
  authorization.verifyToken,
  verifyCategoryId,
  categoriesController.updateCategory
);

router.delete(
  "/v1/categories/:categoryId",
  authorization.verifyToken,
  verifyCategoryId,
  categoriesController.deleteCategory
);

module.exports = router;
