const utils = require("../utils/utils");

function isValidImageUrls(urls) {
  if (!Array.isArray(urls)) return false;

  return urls.every((url) => {
    try {
      const parsedUrl = new URL(url);

      // Must start with Firebase Storage domain
      const isFirebase =
        parsedUrl.hostname.includes("firebasestorage.googleapis.com") ||
        parsedUrl.hostname.includes("firebasestorage.app");

      // Must contain "alt=media" param (ensures direct file access)
      const hasAltMedia = parsedUrl.searchParams.get("alt") === "media";

      // Must end with a valid image extension
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(parsedUrl.pathname);

      return isFirebase && hasAltMedia && isImage;
    } catch (err) {
      return false;
    }
  });
}

const addItem = (itemData) => {
  const {
    userId,
    storeId,
    categoryId,
    name,
    description,
    price,
    stock,
    imageURL,
    isTrackInventory,
  } = itemData;

  if (!userId || !utils.isObjectId(userId))
    return {
      isAccepted: false,
      message: "User Id format is invalid",
      field: "userId",
    };

  if (!storeId || !utils.isObjectId(storeId))
    return {
      isAccepted: false,
      message: "Store Id format is invalid",
      field: "storeId",
    };

  if (!categoryId || !utils.isObjectId(categoryId))
    return {
      isAccepted: false,
      message: "Category Id format is invalid",
      field: "categoryId",
    };

  if (!name || typeof name != "string")
    return {
      isAccepted: false,
      message: "Name format is invalid",
      field: "name",
    };

  if (!description || typeof description != "string")
    return {
      isAccepted: false,
      message: "Description format is invalid",
      field: "description",
    };

  if (price && typeof price != "number")
    return {
      isAccepted: false,
      message: "Price format is invalid",
      field: "price",
    };

  if (imageURL && !utils.isValidURL(imageURL))
    return {
      isAccepted: false,
      message: "Image URL format is invalid",
      field: "imageURL",
    };

  if (typeof isTrackInventory != "boolean")
    return {
      isAccepted: false,
      message: "isTrackInventory format is invalid",
      field: "isTrackInventory",
    };

  if (isTrackInventory && typeof stock != "number")
    return {
      isAccepted: false,
      message: "Stock format is invalid",
      field: "stock",
    };

  return { isAccepted: true, message: "data is valid", data: itemData };
};

const updateItem = (itemData) => {
  const {
    categoryId,
    name,
    description,
    imageURL,
    price,
    stock,
    isTrackInventory,
  } = itemData;

  if (categoryId && !utils.isObjectId(categoryId))
    return {
      isAccepted: false,
      message: "Category Id format is invalid",
      field: "categoryId",
    };

  if (name && typeof name != "string")
    return {
      isAccepted: false,
      message: "Name format is invalid",
      field: "name",
    };

  if (description && typeof description != "string")
    return {
      isAccepted: false,
      message: "Description format is invalid",
      field: "description",
    };

  if (imageURL && !utils.isValidURL(imageURL))
    return {
      isAccepted: false,
      message: "Image URL format is invalid",
      field: "imageURL",
    };

  if (price && typeof price != "number")
    return {
      isAccepted: false,
      message: "Price format is invalid",
      field: "price",
    };

  if (stock && typeof stock != "number")
    return {
      isAccepted: false,
      message: "Stock format is invalid",
      field: "stock",
    };

  if (typeof isTrackInventory != "boolean")
    return {
      isAccepted: false,
      message: "isTrackInventory format is invalid",
      field: "isTrackInventory",
    };

  return { isAccepted: true, message: "data is valid", data: itemData };
};

const updateItemImagesVectors = (itemData) => {
  const { images } = itemData;

  if (!images)
    return {
      isAccepted: false,
      message: "images is required",
      field: "images",
    };

  if (!Array.isArray(images))
    return {
      isAccepted: false,
      message: "images must be a list",
      field: "images",
    };

  if (images.length == 0)
    return {
      isAccepted: false,
      message: "images list is empty",
      field: "images",
    };

  if (!isValidImageUrls(images))
    return {
      isAccepted: false,
      message: "images URLs is invalid",
      field: "images",
    };

  return { isAccepted: true, message: "data is valid", data: itemData };
};

const searchItemsByImage = (itemData) => {
  const { imageURL } = itemData;

  if (!imageURL)
    return {
      isAccepted: false,
      message: "imageURL is required",
      field: "imageURL",
    };

  if (!utils.isValidURL(imageURL))
    return {
      isAccepted: false,
      message: "image URL is invalid",
      field: "imageURL",
    };

  return { isAccepted: true, message: "data is valid", data: itemData };
};

module.exports = {
  addItem,
  updateItem,
  updateItemImagesVectors,
  searchItemsByImage,
};
