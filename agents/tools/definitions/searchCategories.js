module.exports = {
  "type": "function",
  "name": "searchCategories",
  "description": "Search store categories by name for a specific store, or get all categories if no category name is provided",
  "parameters": {
    "type": "object",
    "properties": {
      "storeId": {
        "type": "string",
        "description": "The store ID to search categories within"
      },
      "categoryName": {
        "type": ["string", "null"],
        "description": "The category name to search for (optional). Send null to get all categories"
      }
    },
    "required": ["storeId", "categoryName"],
    "additionalProperties": false
  }
};