const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");
const config = require("../config/config");

const cartItemSchema = z.object({
  itemId: z.string().refine(isObjectId, "Item Id format is invalid"),
  quantity: z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be non-negative"),
});

const addCartSchema = z.object({
  userId: z.string().refine(isObjectId, "User Id format is invalid"),
  storeId: z.string().refine(isObjectId, "Store Id format is invalid"),
  customerId: z.string().refine(isObjectId, "Customer Id format is invalid"),
  items: z.array(cartItemSchema).min(1, "Cart must have at least one item"),
});

const updateCartSchema = z.object({
  items: z.array(cartItemSchema).optional(),
  status: z.enum(config.CART_STATUS, {
    errorMap: () => ({ message: `Status must be one of: ${config.CART_STATUS.join(", ")}` })
  }).optional(),
});

const addItemToCartSchema = z.object({
  itemId: z.string().refine(isObjectId, "Item Id format is invalid"),
  quantity: z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be non-negative"),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
});

module.exports = {
  addCartSchema,
  updateCartSchema,
  addItemToCartSchema,
  updateCartItemSchema,
};