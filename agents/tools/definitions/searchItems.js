module.exports = {
    "type": "function",
    "name": "searchItems",
    "description": "Search store items by name for a specific store",
    "parameters": {
      "type": "object",
      "properties": {
        "storeId": {
          "type": "string",
          "description": "The store ID to search within"
        },
        "nameQuery": {
          "type": "string",
          "description": "The keyword to search items by name"
        },
        "categoryId": {
          "type": ["string", "null"],
          "description": "The category ID to filter by (optional). Send null if no category filter is needed"
        }
      },
      "required": ["storeId", "nameQuery", "categoryId"],
      "additionalProperties": false
    }
};