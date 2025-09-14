module.exports = {
  "type": "function",
  "name": "getStoreShippingPolicy",
  "description": "Get the shipping policy for a specific store",
  "parameters": {
    "type": "object",
    "properties": {
      "storeId": {
        "type": "string",
        "description": "The store ID to retrieve the shipping policy for"
      }
    },
    "required": ["storeId"],
    "additionalProperties": false
  }
};