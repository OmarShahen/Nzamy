function generateBasicInfoInstructions(store) {
  return `
Store ID: ${store._id}
Store Name: ${store.name}
Category: ${store.category || "Not specified"}
Phone: ${store.phone || "Not specified"}
Email: ${store.email || "Not specified"}
Description: ${store.description || "Not provided"}
Notes: ${store.notes || "Not provided"}
Currency: ${store.currency || "EGP"}
Facebook User Recipient ID: ${store.senderId || null}
  `.trim();
}

function getMessengerPlainTextInstructions() {
  return (
    "Respond only in plain text. " +
    "Do not use Markdown, HTML, code blocks, or special formatting symbols. " +
    "Write as if sending a normal message to a person in a chat app. " +
    "Keep line breaks for readability. " +
    "Avoid numbered lists unless necessary. " +
    "Avoid special characters unless they are part of natural language. " +
    "You may use emojis. " +
    "Do not output any formatting syntax."
  );
}

function generateCategoriesInstructions(categories = []) {
  if (!categories.length) return `This store has no categories specified.`;

  const formatted = categories
    .map((cat) => `${cat.name} (ID: ${cat._id})`)
    .join("\n- ");

  return `
Store Categories:
- ${formatted}
  `.trim();
}

function generateAssistantProfileInstructions(store) {
  const assistant = store.assistance || {};
  const name = assistant.name || "Assistant";
  const persona = assistant.persona || "a helpful and friendly assistant";
  const langs = assistant.languages?.join(", ") || "English";
  const extraInstructions = assistant.instructions || "";

  let baseInstructions = `
You are ${name}, ${persona}.
You can speak the following languages: ${langs}.
Only respond in the language the customer uses.
If asked about store details, use the provided information.

As a sales-focused assistant:
- Be friendly, engaging, and make the customer feel welcome.
- Actively recommend products that match their needs or related items.
- Mention current promotions, discounts, or bundles if relevant.
- Highlight product benefits and unique selling points.
- Offer upsells or complementary products where appropriate.
- Always confirm if the customer would like to proceed with a purchase.
- Keep responses concise but persuasive.
- Use positive language that builds excitement about the products.

Image Display Instructions:
- When a customer wants to see item images, use the sendImageToFacebookUser tool function to send images directly to the user.
- Do NOT show image links or URLs in your text responses.
- Always send the actual image using the tool instead of displaying links.
- If you have multiple images for a product, use the sendGalleryToFacebookUser tool function to send them as a gallery instead of sending them one by one.
  `.trim();

  if (extraInstructions) {
    baseInstructions += `\n\nAdditional Instructions:\n${extraInstructions}`;
  }

  return baseInstructions;
}

function generateStorePaymentInstructions(store) {
  if (!store.paymentMethods.length) {
    return `This store does not offer payment options.`;
  }

  return `Payment Methods Accepted: ${
    store.paymentMethods?.join(", ")?.toLowerCase() || "Not specified"
  }`.trim();
}

function generateShippingPolicyInstructions(store) {
  const shipping = store.shippingPolicy || {};
  if (!shipping.isShipping)
    return `This store does not offer shipping services.`;

  return `
Shipping Policy:
- Ships to: ${shipping.shippingCountries?.join(", ") || "Not specified"}
- Available cities: ${shipping.shippingCities?.join(", ") || "Not specified"}
- Estimated delivery time: ${shipping.shippingDays || "N/A"} days
- Shipping cost: ${shipping.shippingCost ?? "N/A"} ${store.currency || "EGP"}
- Free shipping for orders above: ${shipping.freeShippingOver ?? "N/A"} ${
    store.currency || "EGP"
  }
- Delivery provider: ${shipping.deliveryProvider || "N/A"}
  `.trim();
}

function generateReturnPolicyInstructions(store) {
  const policy = store.returnPolicy || {};
  if (!policy.isReturnable) return `This store does not accept returns.`;

  return `
Return & Refund Policy:
- Return allowed within: ${policy.returnDays || "N/A"} days
- Return conditions: ${policy.returnConditions?.join(", ") || "Not specified"}
- Return shipping paid by: ${policy.returnShippingPayer || "N/A"}
- Refund types: ${policy.refundTypes?.join(", ") || "Not specified"}
  `.trim();
}

function generateStoreInstructions(store, categories) {
  const sections = [
    generateAssistantProfileInstructions(store),
    generateBasicInfoInstructions(store),
    //generateCategoriesInstructions(categories),
    // generateShippingPolicyInstructions(store),
    // generateReturnPolicyInstructions(store),
    //getMessengerPlainTextInstructions(),
  ];

  return sections.filter(Boolean).join("\n\n");
}

// Export it if needed
module.exports = {
  generateStoreInstructions,
  generateAssistantProfileInstructions,
  generateBasicInfoInstructions,
  generateCategoriesInstructions,
  generateShippingPolicyInstructions,
  generateReturnPolicyInstructions,
  getMessengerPlainTextInstructions,
  generateStorePaymentInstructions,
};
