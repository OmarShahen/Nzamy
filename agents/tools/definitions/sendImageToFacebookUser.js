module.exports = {
  "type": "function",
  "name": "sendImageToFacebookUser",
  "description": "Sends an image message to a Facebook Messenger user using their PSID.",
  "parameters": {
    "type": "object",
    "properties": {
      "recipientId": {
        "type": "string",
        "description": "The Facebook Messenger PSID (Page-scoped ID) of the recipient user"
      },
      "imageUrl": {
        "type": "string",
        "description": "Direct URL of the image to send"
      },
      "caption": {
        "type": "string",
        "description": "Optional text to include along with the image"
      }
    },
    "required": ["recipientId", "imageUrl", "caption"],
    "additionalProperties": false
  }
};