const router = require("express").Router();
const offersController = require("../controllers/offers");
const authorization = require("../middlewares/verify-permission");
const { verifyOfferId } = require("../middlewares/verify-routes-params");

router.get("/v1/offers", authorization.verifyToken, offersController.getOffers);

router.get(
  "/v1/offers/:offerId",
  authorization.verifyToken,
  verifyOfferId,
  offersController.getOfferById
);

router.post("/v1/offers", authorization.verifyToken, offersController.addOffer);

router.put(
  "/v1/offers/:offerId",
  authorization.verifyToken,
  verifyOfferId,
  offersController.updateOffer
);

router.delete(
  "/v1/offers/:offerId",
  authorization.verifyToken,
  verifyOfferId,
  offersController.deleteOffer
);

module.exports = router;