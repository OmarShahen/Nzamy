const CategoryModel = require("../../../models/CategoryModel");
const mongoose = require("mongoose");

const searchCategories = async ({ storeId, categoryName = "" }) => {
  const searchQuery = {
    storeId: new mongoose.Types.ObjectId(storeId),
  };

  if (categoryName) {
    searchQuery.name = { $regex: categoryName, $options: "i" };
  }

  const categories = await CategoryModel.aggregate([
    {
      $match: searchQuery,
    },
    {
      $limit: 10,
    },
  ]);

  return { categories };
};

module.exports = { searchCategories };
