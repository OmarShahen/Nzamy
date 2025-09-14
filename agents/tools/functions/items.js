const ItemModel = require("../../../models/ItemModel");
const mongoose = require("mongoose");
const {
  searchImageByDescriptionService,
} = require("../../../services/embeddings");
const { scoreItems } = require("../../../utils/score-items");

const searchItems = async ({ storeId, categoryId, nameQuery }) => {
  const searchQuery = {
    storeId: new mongoose.Types.ObjectId(storeId),
    name: { $regex: nameQuery, $options: "i" },
  };

  if (categoryId) {
    searchQuery.categoryId = mongoose.Types.ObjectId(categoryId);
  }

  const items = await ItemModel.aggregate([
    {
      $match: searchQuery,
    },
    {
      $limit: 10,
    },
  ]);

  return { items };
};

const searchItemsByImage = async ({ storeId, imageURL }) => {
  const { vector: queryVector } = await searchImageByDescriptionService(
    imageURL
  );

  const items = await ItemModel.find({ storeId });

  const nearestItems = await scoreItems(items, queryVector);

  return { items: nearestItems };
};

module.exports = { searchItems, searchItemsByImage };
