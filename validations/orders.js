const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");
const config = require("../config/config");

const orderItemSchema = z.object({
  itemId: z.string().refine(isObjectId, "Item Id format is invalid"),
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be non-negative"),
});

const addOrderSchema = z.object({
  userId: z.string().refine(isObjectId, "User Id format is invalid"),
  storeId: z.string().refine(isObjectId, "Store Id format is invalid"),
  customerId: z.string().refine(isObjectId, "Customer Id format is invalid"),
  
  items: z.array(orderItemSchema).min(1, "Items array cannot be empty"),
  
  // Pricing (subtotal and totalPrice are calculated automatically)
  taxAmount: z.number().min(0).optional(),
  shippingCost: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  
  // Applied offers
  appliedOffers: z.array(z.string().refine(isObjectId, "Offer Id format is invalid")).optional(),
  
  // Payment info
  paymentMethod: z.enum(config.PAYMENT_METHODS, "Invalid payment method"),
  
  // Shipping address - can reference existing address or provide new one
  customerAddressId: z.string().refine(isObjectId, "Customer address Id format is invalid").optional(),
  shipping: z.object({
    name: z.string().min(1, "Shipping name is required"),
    phone: z.string().min(1, "Shipping phone is required"),
    addressLine: z.string().min(1, "Address line is required"),
    city: z.string().min(1, "City is required"),
    postalCode: z.string().optional(),
    country: z.string().min(1, "Country is required"),
  }),
  
  // Additional info
  notes: z.string().optional(),
  specialInstructions: z.string().optional(),
  
  // Tracking info (usually added after order creation)
  trackingNumber: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional().or(z.date().optional()),
});

const updateOrderSchema = z.object({
  status: z.enum(config.ORDER_STATUS, "Invalid order status").optional(),
  paymentStatus: z.enum(config.PAYMENT_STATUS, "Invalid payment status").optional(),
  
  // Pricing updates
  taxAmount: z.number().min(0).optional(),
  shippingCost: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  
  // Shipping updates
  shipping: z.object({
    name: z.string().min(1, "Shipping name is required").optional(),
    phone: z.string().min(1, "Shipping phone is required").optional(),
    addressLine: z.string().min(1, "Address line is required").optional(),
    city: z.string().min(1, "City is required").optional(),
    postalCode: z.string().optional(),
    country: z.string().min(1, "Country is required").optional(),
  }).optional(),
  
  // Tracking updates
  trackingNumber: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional().or(z.date().optional()),
  refundDate: z.string().datetime().optional().or(z.date().optional()),
  
  // Additional info updates
  notes: z.string().optional(),
  specialInstructions: z.string().optional(),
});

module.exports = {
  addOrderSchema,
  updateOrderSchema,
};
