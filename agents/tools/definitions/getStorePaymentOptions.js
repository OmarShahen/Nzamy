module.exports = {
  "type": "function",
  "name": "getStorePaymentOptions",
  "description": "Retrieve available payment options for a specific store (e.g., credit card, cash on delivery, PayPal, etc.)",
  "parameters": {
    "type": "object",
    "properties": {
      "storeId": {
        "type": "string",
        "description": "The store ID to get payment options for"
      }
    },
    "required": ["storeId"],
    "additionalProperties": false
  }
};