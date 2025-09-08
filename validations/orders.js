const utils = require("../utils/utils");
const config = require("../config/config");

const addOrder = (orderData) => {
  const {
    userId,
    storeId,
    paymentMethod,
    items,
    shippingName,
    shippingPhone,
    shippingAddress,
    shippingCity,
  } = orderData;

  if (!userId)
    return {
      isAccepted: false,
      message: "User ID is required",
      field: "userId",
    };

  if (!utils.isObjectId(userId))
    return {
      isAccepted: false,
      message: "User ID format is invalid",
      field: "userId",
    };

  if (!storeId)
    return {
      isAccepted: false,
      message: "Store ID is required",
      field: "storeId",
    };

  if (!utils.isObjectId(storeId))
    return {
      isAccepted: false,
      message: "Store ID format is invalid",
      field: "storeId",
    };

  if (!paymentMethod)
    return {
      isAccepted: false,
      message: "Payment method is required",
      field: "paymentMethod",
    };

  if (!config.PAYMENT_METHODS.includes(paymentMethod))
    return {
      isAccepted: false,
      message: "Payment method value is not registered",
      field: "paymentMethod",
    };

  if (!shippingName)
    return {
      isAccepted: false,
      message: "Shipping name is required",
      field: "shippingName",
    };

  if (typeof shippingName != "string")
    return {
      isAccepted: false,
      message: "Shipping name format is invalid",
      field: "shippingName",
    };

  if (!shippingPhone)
    return {
      isAccepted: false,
      message: "Shipping phone is required",
      field: "shippingPhone",
    };

  if (typeof shippingPhone != "string")
    return {
      isAccepted: false,
      message: "Shipping phone format is invalid",
      field: "shippingPhone",
    };

  if (!shippingAddress)
    return {
      isAccepted: false,
      message: "Shipping address is required",
      field: "shippingAddress",
    };

  if (typeof shippingAddress != "string")
    return {
      isAccepted: false,
      message: "Shipping address format is invalid",
      field: "shippingAddress",
    };

  if (!shippingCity)
    return {
      isAccepted: false,
      message: "Shipping city is required",
      field: "shippingCity",
    };

  if (typeof shippingCity != "string")
    return {
      isAccepted: false,
      message: "Shipping city format is invalid",
      field: "shippingCity",
    };

  if (!items)
    return { isAccepted: false, message: "Items is required", field: "items" };

  if (!Array.isArray(items))
    return {
      isAccepted: false,
      message: "Items must be a list",
      field: "items",
    };

  if (items.length == 0)
    return {
      isAccepted: false,
      message: "Items must not be empty",
      field: "items",
    };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item.numericId)
      return {
        isAccepted: false,
        message: "item numeric ID is required",
        field: "items",
      };

    if (typeof item.numericId != "number")
      return {
        isAccepted: false,
        message: "item numeric ID format is invalid",
        field: "items",
      };

    if (!item.name)
      return {
        isAccepted: false,
        message: "item name is required",
        field: "items",
      };

    if (typeof item.name != "string")
      return {
        isAccepted: false,
        message: "item name format is invalid",
        field: "items",
      };

    if (typeof item.quantity != "number")
      return {
        isAccepted: false,
        message: "item quantity format is invalid",
        field: "items",
      };

    if (typeof item.price != "number")
      return {
        isAccepted: false,
        message: "item price format is invalid",
        field: "items",
      };

    if (!item.itemId)
      return {
        isAccepted: false,
        message: "item id is required",
        field: "items",
      };

    if (!utils.isObjectId(item.itemId))
      return {
        isAccepted: false,
        message: "item id format is invalid",
        field: "items",
      };
  }

  return { isAccepted: true, message: "data is valid", data: orderData };
};

const updateOrder = (orderData) => {
  const { status, shippingName, shippingPhone, shippingAddress, shippingCity } =
    orderData;

  if (status && !config.STATUS_VALUES.includes(status))
    return {
      isAccepted: false,
      message: "Status value is not registered",
      field: "status",
    };

  if (shippingName && typeof shippingName != "string")
    return {
      isAccepted: false,
      message: "Shipping name format is invalid",
      field: "shippingName",
    };

  if (shippingPhone && typeof shippingPhone != "string")
    return {
      isAccepted: false,
      message: "Shipping phone format is invalid",
      field: "shippingPhone",
    };

  if (shippingAddress && typeof shippingAddress != "string")
    return {
      isAccepted: false,
      message: "Shipping address format is invalid",
      field: "shippingAddress",
    };

  if (shippingCity && typeof shippingCity != "string")
    return {
      isAccepted: false,
      message: "Shipping city format is invalid",
      field: "shippingCity",
    };

  return { isAccepted: true, message: "data is valid", data: orderData };
};

module.exports = { addOrder, updateOrder };
