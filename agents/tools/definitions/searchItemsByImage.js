module.exports = {
  "type": "function",
  "name": "searchItemsByImage",
  "description": "Search store items by image similarity for a specific store",
  "parameters": {
    "type": "object",
    "properties": {
      "storeId": {
        "type": "string",
        "description": "The store ID to search within"
      },
      "imageURL": {
        "type": "string",
        "description": "The URL of the image to find the closest matching item"
      }
    },
    "required": ["storeId", "imageURL"],
    "additionalProperties": false
  }
};