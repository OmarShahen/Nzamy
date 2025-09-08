const utils = require("../utils/utils");

const addCategory = (categoryData) => {
  const { userId, storeId, name } = categoryData;

  if (!userId || !utils.isObjectId(userId))
    return {
      isAccepted: false,
      message: "Invalid user ID format",
      field: "userId",
    };

  if (!storeId || !utils.isObjectId(storeId))
    return {
      isAccepted: false,
      message: "Invalid store ID format",
      field: "storeId",
    };

  if (!name || typeof name != "string")
    return {
      isAccepted: false,
      message: "name is required",
      field: "name",
    };

  return { isAccepted: true, message: "data is valid", data: categoryData };
};

const updateCategory = (categoryData) => {
  const { name } = categoryData;

  if (name && typeof name != "string")
    return {
      isAccepted: false,
      message: "name is required",
      field: "name",
    };

  return { isAccepted: true, message: "data is valid", data: categoryData };
};

module.exports = { addCategory, updateCategory };
