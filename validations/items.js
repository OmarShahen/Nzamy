const { z } = require("zod");
const { isObjectId } = require("../utils/validateObjectId");

// Custom validators using existing utils
const isValidURL = (url) => require("../utils/validateURL").isValidURL(url);

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

const addItemSchema = z.object({
  userId: z.string().refine(isObjectId, "User Id format is invalid"),
  storeId: z.string().refine(isObjectId, "Store Id format is invalid"),
  categoryId: z.string().refine(isObjectId, "Category Id format is invalid"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number("Price format is invalid").min(0).optional(),
  stock: z.number("Stock format is invalid").min(0).optional(),
  imageURL: z.string().refine(isValidURL, "Image URL format is invalid").optional(),
  isTrackInventory: z.boolean("isTrackInventory format is invalid"),
}).refine(
  (data) => !data.isTrackInventory || typeof data.stock === "number",
  {
    message: "Stock is required when isTrackInventory is true",
    path: ["stock"],
  }
);

const updateItemSchema = z.object({
  categoryId: z.string().refine(isObjectId, "Category Id format is invalid").optional(),
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  imageURL: z.string().refine(isValidURL, "Image URL format is invalid").optional(),
  price: z.number("Price format is invalid").min(0).optional(),
  stock: z.number("Stock format is invalid").min(0).optional(),
  isTrackInventory: z.boolean("isTrackInventory format is invalid").optional(),
});

const updateItemImagesVectorsSchema = z.object({
  images: z.array(z.string())
    .min(1, "Images list cannot be empty")
    .refine(isValidImageUrls, "Invalid image URLs"),
});

const searchItemsByImageSchema = z.object({
  imageURL: z.string().min(1, "imageURL is required").refine(isValidURL, "Image URL is invalid"),
});

module.exports = {
  addItemSchema,
  updateItemSchema,
  updateItemImagesVectorsSchema,
  searchItemsByImageSchema,
};
