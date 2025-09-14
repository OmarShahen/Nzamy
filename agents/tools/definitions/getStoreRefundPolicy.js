module.exports = {
  "type": "function",
  "name": "getStoreRefundPolicy",
  "description": "Get the refund/return policy for a specific store",
  "parameters": {
    "type": "object",
    "properties": {
      "storeId": {
        "type": "string",
        "description": "The store ID to retrieve the refund policy for"
      }
    },
    "required": ["storeId"],
    "additionalProperties": false
  }
};