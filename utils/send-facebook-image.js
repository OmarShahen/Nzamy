const axios = require("axios");

async function sendImageWithText(recipientId, imageUrl, text, pageAccessToken) {
  try {
    // 1. Send the image
    const imagePayload = {
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: "image",
          payload: {
            url: imageUrl,
            is_reusable: false,
          },
        },
      },
    };

    const imageParams = {
      params: { access_token: pageAccessToken },
    };

    const imageResponse = await axios.post(
      `https://graph.facebook.com/v18.0/me/messages`,
      imagePayload,
      imageParams
    );

    // 2. If text is provided, send it separately
    if (text) {
      const textPayload = {
        recipient: { id: recipientId },
        message: { text },
      };

      const textParams = {
        params: { access_token: pageAccessToken },
      };

      const textResponse = await axios.post(
        `https://graph.facebook.com/v18.0/me/messages`,
        textPayload,
        textParams
      );
    }

    return {
      isAccepted: true,
      message: "Image (and text if provided) sent successfully!",
    };
  } catch (error) {
    console.error(
      "Error sending image or text:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function sendTextAndGallery(recipientId, images, text, pageAccessToken) {
  try {
    // 1. If text is provided, send it first
    if (text) {
      const textPayload = {
        recipient: { id: recipientId },
        message: { text },
      };

      await axios.post(
        `https://graph.facebook.com/v18.0/me/messages`,
        textPayload,
        { params: { access_token: pageAccessToken } }
      );
    }

    // 2. Send the gallery (carousel of images)
    const galleryPayload = {
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: images.map((img) => ({
              title: img.title || "Image",
              image_url: img.url,
              subtitle: img.subtitle || "",
              buttons: img.buttons || [],
            })),
          },
        },
      },
    };

    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages`,
      galleryPayload,
      { params: { access_token: pageAccessToken } }
    );

    return {
      isAccepted: true,
      message: "Text and gallery sent successfully!",
    };
  } catch (error) {
    console.error(
      "Error sending text and gallery:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = { sendImageWithText, sendTextAndGallery };
