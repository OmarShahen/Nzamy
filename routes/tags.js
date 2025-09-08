const router = require("express").Router();
const tagsController = require("../controllers/tags");
const authorization = require("../middlewares/verify-permission");
const { verifyTagId } = require("../middlewares/verify-routes-params");

router.get("/v1/tags", authorization.verifyToken, tagsController.getTags);

router.get(
  "/v1/tags/:tagId",
  authorization.verifyToken,
  verifyTagId,
  tagsController.getTagById
);

router.post("/v1/tags", authorization.verifyToken, tagsController.addTag);

router.put(
  "/v1/tags/:tagId",
  authorization.verifyToken,
  verifyTagId,
  tagsController.updateTag
);

router.delete(
  "/v1/tags/:tagId",
  authorization.verifyToken,
  verifyTagId,
  tagsController.deleteTag
);

module.exports = router;