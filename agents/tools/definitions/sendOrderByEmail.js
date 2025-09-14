module.exports = {
  "type": "function",
  "name": "sendOrderByEmail",
  "description": "Sends a customer's order via email, including contact info, delivery address, and list of items.",
  "parameters": {
    "type": "object",
    "properties": {
      "storeId": {
        "type": "string",
        "description": "The store ID to register order with"
      },
      "customerName": {
        "type": "string",
        "description": "Full name of the customer placing the order"
      },
      "customerPhone": {
        "type": "string",
        "description": "Customer's phone number for contact or delivery"
      },
      "deliveryAddress": {
        "type": "string",
        "description": "Full delivery address for the order"
      }
    },
    "required": ["storeId", "customerName", "customerPhone", "deliveryAddress"],
    "additionalProperties": false
  }
};