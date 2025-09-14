const { searchCategories } = require("./functions/categories");
const { searchItems, searchItemsByImage } = require("./functions/items");
const { sendOrderByEmail } = require("./functions/orders");
const {
  getStoreShippingPolicy,
  getStoreRefundPolicy,
  getStorePaymentOptions,
} = require("./functions/stores");
const {
  sendImageToFacebookUser,
  sendGalleryToFacebookUser,
} = require("./functions/facebook");

const runToolsFunction = async (toolCall) => {
  try {
    const { name, arguments: argsString } = toolCall.function;

    const args = JSON.parse(argsString);

    if (name === "searchItems") {
      const result = await searchItems(args);
      return JSON.stringify(result);
    }

    if (name === "searchCategories") {
      const result = await searchCategories(args);
      return JSON.stringify(result);
    }

    if (name === "sendOrderByEmail") {
      const result = await sendOrderByEmail(args);
      return JSON.stringify(result);
    }

    if (name === "getStoreShippingPolicy") {
      const result = await getStoreShippingPolicy(args);
      return JSON.stringify(result);
    }

    if (name === "getStoreRefundPolicy") {
      const result = await getStoreRefundPolicy(args);
      return JSON.stringify(result);
    }

    if (name === "getStorePaymentOptions") {
      const result = await getStorePaymentOptions(args);
      return JSON.stringify(result);
    }

    if (name === "searchItemsByImage") {
      const result = await searchItemsByImage(args);
      return JSON.stringify(result);
    }

    if (name === "sendImageToFacebookUser") {
      const result = await sendImageToFacebookUser(args);
      return JSON.stringify(result);
    }

    if (name === "sendGalleryToFacebookUser") {
      const result = await sendGalleryToFacebookUser(args);
      return JSON.stringify(result);
    }

    return JSON.stringify({ message: "Unknown tool name" });
  } catch (error) {
    console.error(error);
    return JSON.stringify({ message: "Error happened", error: error.message });
  }
};

module.exports = runToolsFunction;
