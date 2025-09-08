const router = require("express").Router();
const cartsController = require("../controllers/carts");
const authorization = require("../middlewares/verify-permission");
const { verifyCartId } = require("../middlewares/verify-routes-params");

// Get all carts with filtering
router.get("/v1/carts", authorization.verifyToken, cartsController.getCarts);

// Get active cart for customer and store
router.get("/v1/carts/active", authorization.verifyToken, cartsController.getActiveCart);

// Get cart by ID
router.get(
  "/v1/carts/:cartId",
  authorization.verifyToken,
  verifyCartId,
  cartsController.getCartById
);

// Create new cart
router.post("/v1/carts", authorization.verifyToken, cartsController.addCart);

// Add item to cart
router.post(
  "/v1/carts/:cartId/items",
  authorization.verifyToken,
  verifyCartId,
  cartsController.addItemToCart
);

// Update cart item quantity
router.put(
  "/v1/carts/:cartId/items/:itemId",
  authorization.verifyToken,
  verifyCartId,
  cartsController.updateCartItem
);

// Remove item from cart
router.delete(
  "/v1/carts/:cartId/items/:itemId",
  authorization.verifyToken,
  verifyCartId,
  cartsController.removeItemFromCart
);

// Clear cart (remove all items)
router.delete(
  "/v1/carts/:cartId/clear",
  authorization.verifyToken,
  verifyCartId,
  cartsController.clearCart
);

// Update cart (status, items, etc.)
router.put(
  "/v1/carts/:cartId",
  authorization.verifyToken,
  verifyCartId,
  cartsController.updateCart
);

// Delete cart
router.delete(
  "/v1/carts/:cartId",
  authorization.verifyToken,
  verifyCartId,
  cartsController.deleteCart
);

module.exports = router;