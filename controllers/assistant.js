const assistantValidation = require("../validations/assistant");
const config = require("../config/config");
const assistantService = require("../services/assistant");
const ChannelModel = require("../models/ChannelModel");
const ChatModel = require("../models/ChatModel");
const StoreModel = require("../models/StoreModel");
const CounterModel = require("../models/CounterModel");
const SubscriptionModel = require("../models/SubscriptionModel");
const axios = require("axios");
const { openai } = require("../lib/openai");
const MessageModel = require("../models/MessageModel");
const { formatResponseForMessenger } = require("../utils/format-string");
const subscriptionsUtils = require("../utils/subscriptions");
const { uploadFacebookImageToFirebase } = require("../utils/image-converter");
const { sendImageWithText } = require("../utils/send-facebook-image");
const { AppError } = require("../middlewares/errorHandler");


// Message deduplication cache
const processedMessages = new Map();

function cleanupProcessedMessages() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000; // 1 hour ago
  for (const [key, timestamp] of processedMessages.entries()) {
    if (timestamp < oneHourAgo) {
      processedMessages.delete(key);
    }
  }
}

function isMessageProcessed(messageId, senderId) {
  const key = `${messageId}-${senderId}`;
  return processedMessages.has(key);
}

function markMessageAsProcessed(messageId, senderId) {
  const key = `${messageId}-${senderId}`;
  processedMessages.set(key, Date.now());

  // Clean up old messages occasionally
  if (processedMessages.size % 100 === 0) {
    cleanupProcessedMessages();
  }
}

function extractAttachmentsFromEvent(event) {
  const attachments = [];

  if (event.message && event.message.attachments) {
    event.message.attachments.forEach((att) => {
      if (att.payload && att.payload.url) {
        attachments.push({
          type: att.type,
          url: att.payload.url,
          title: att.title || null,
        });
      }
    });
  }

  return attachments;
}

function formatImageUrl(url) {
  // Return Facebook URL as-is without any modifications
  return String(url);
}

async function formatMessageWithAttachments(
  textMessage,
  attachments,
  accessToken = null
) {
  let message = textMessage || "";

  if (attachments.length > 0) {
    const images = attachments.filter((att) => att.type === "image");
    const otherAttachments = attachments.filter((att) => att.type !== "image");

    // Handle images with special message and URL replacement
    if (images.length > 0) {
      const processedImageUrls = [];

      // Process each image URL
      for (const img of images) {
        try {
          // Check if it's a Facebook CDN URL that needs conversion
          if (img.url.includes("fbcdn.net") && accessToken) {
            const firebaseUrl = await uploadFacebookImageToFirebase(
              img.url,
              accessToken
            );
            processedImageUrls.push(firebaseUrl);
          } else {
            // Firebase or other URLs - use as is
            processedImageUrls.push(formatImageUrl(img.url));
          }
        } catch (error) {
          console.error("Failed to process image for OpenAI:", error);
          // Use original URL if conversion fails
          processedImageUrls.push(formatImageUrl(img.url));
        }
      }

      const imageMessage = `Do you have items that look like this?\n${processedImageUrls.join(
        "\n"
      )}`;

      if (message) {
        message += "\n" + imageMessage;
      } else {
        message = imageMessage;
      }
    }

    // Handle other attachments normally
    if (otherAttachments.length > 0) {
      const otherDescriptions = otherAttachments.map((att) => {
        switch (att.type) {
          case "video":
            return `[Video: ${formatImageUrl(att.url)}]`;
          case "audio":
            return `[Audio: ${formatImageUrl(att.url)}]`;
          case "file":
            return `[File: ${att.title || "Document"} - ${formatImageUrl(
              att.url
            )}]`;
          default:
            return `[Attachment: ${formatImageUrl(att.url)}]`;
        }
      });

      if (message) {
        message += "\n" + otherDescriptions.join("\n");
      } else {
        message = otherDescriptions.join("\n");
      }
    }
  }

  return message;
}

async function refreshFacebookToken(channel) {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${channel.pageId}?fields=access_token&access_token=${channel.accessToken}`
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();

    if (data.error) {
      throw new Error(`Facebook API error: ${data.error.message}`);
    }

    if (data.access_token) {
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 60);

      await ChannelModel.findByIdAndUpdate(channel._id, {
        accessToken: data.access_token,
        tokenExpiresAt,
      });

      return data.access_token;
    }

    throw new Error("No access token in response");
  } catch (error) {
    console.error(
      `Failed to refresh token for channel ${channel.pageId}:`,
      error
    );
    return null;
  }
}

async function getValidAccessToken(channel) {
  const now = new Date();
  const expiryBuffer = 24 * 60 * 60 * 1000; // 24 hours buffer

  if (
    !channel.tokenExpiresAt ||
    now.getTime() + expiryBuffer >= channel.tokenExpiresAt.getTime()
  ) {
    console.log(
      `Token for channel ${channel.pageId} is expired or expiring soon, refreshing...`
    );
    const newToken = await refreshFacebookToken(channel);
    if (newToken) {
      return newToken;
    }
    console.warn(
      `Failed to refresh token for channel ${channel.pageId}, using existing token`
    );
  }

  return channel.accessToken;
}

async function syncChannels(newChannels) {
  for (const newChannel of newChannels) {
    await ChannelModel.findOneAndUpdate(
      { pageId: newChannel.pageId, platform: newChannel.platform },
      newChannel,
      {
        upsert: true,
        new: true,
      }
    );
  }
}

async function formatChannelsFromPages(pages, userId) {
  const channels = await Promise.all(
    pages.data.map(async (page) => {
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 60);

      const basePage = {
        pageId: page.id,
        userId,
        isSubscribed: false,
        name: page.name,
        accessToken: page.access_token,
        tokenExpiresAt,
        category: page.category,
        imageURL: page.picture?.data?.url || null,
        platform: "facebook",
        meta: {
          fan_count: page.fan_count,
          followers_count: page.followers_count,
          link: page.link,
          about: page.about,
          phone: page.phone,
          website: page.website,
          verification_status: page.verification_status,
        },
      };

      const channelDocs = [basePage]; // always include the FB page

      try {
        // check if page has Instagram account linked
        const igRes = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
        );
        const igData = await igRes.json();

        if (igData.instagram_business_account) {
          const igId = igData.instagram_business_account.id;

          // fetch Instagram account details
          const igInfoRes = await fetch(
            `https://graph.facebook.com/v18.0/${igId}?fields=id,username,name,profile_picture_url&access_token=${page.access_token}`
          );
          const igInfo = await igInfoRes.json();

          const igPage = {
            pageId: igInfo.id,
            userId,
            isSubscribed: false,
            name: igInfo.name || igInfo.username,
            accessToken: page.access_token, // same token works for IG
            tokenExpiresAt,
            category: page.category, // IG often doesn't expose category
            imageURL: igInfo.profile_picture_url || null,
            platform: "instagram",
            meta: {
              username: igInfo.username,
              linked_facebook_page: page.id,
            },
          };

          channelDocs.push(igPage);
        }
      } catch (err) {
        console.error(`Error fetching IG account for page ${page.id}:`, err);
      }

      return channelDocs;
    })
  );

  return channels.flat(); // flatten (fb + ig per page)
}

async function formatChannelsFromWhatsapp(accessToken, userId) {
  const channels = [];
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 60);

  try {
    // 1. Get all businesses the user has access to
    const bizRes = await fetch(
      `https://graph.facebook.com/v18.0/me/businesses?fields=id,name&access_token=${accessToken}`
    );
    const bizData = await bizRes.json();

    if (bizData.error) {
      console.error("❌ Error fetching businesses:", bizData.error);
      return channels;
    }

    if (!bizData.data || bizData.data.length === 0) {
      console.log("ℹ️ No businesses found for this user");
      return channels;
    }

    // 2. Loop through businesses → fetch owned WABAs
    for (const biz of bizData.data) {
      const wabaRes = await fetch(
        `https://graph.facebook.com/v18.0/${biz.id}/owned_whatsapp_business_accounts?fields=id,name&access_token=${accessToken}`
      );
      const wabaData = await wabaRes.json();

      if (wabaData.error) {
        console.error(
          `❌ Error fetching WABAs for business ${biz.id}:`,
          wabaData.error
        );
        continue;
      }

      if (!wabaData.data || wabaData.data.length === 0) {
        console.log(`ℹ️ No WABAs found for business ${biz.id}`);
        continue;
      }

      // 3. Loop through WABAs → fetch phone numbers
      for (const waba of wabaData.data) {
        const phoneRes = await fetch(
          `https://graph.facebook.com/v18.0/${waba.id}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,new_number_status&access_token=${accessToken}`
        );
        const phoneData = await phoneRes.json();

        if (phoneData.error) {
          console.error(
            `❌ Error fetching phone numbers for WABA ${waba.id}:`,
            phoneData.error
          );
          continue;
        }

        if (phoneData.data && phoneData.data.length > 0) {
          for (const phone of phoneData.data) {
            const whatsappChannel = {
              pageId: phone.id, // phone_number_id
              userId,
              isSubscribed: false,
              name: phone.verified_name || phone.display_phone_number,
              accessToken, // keep for sending messages
              tokenExpiresAt,
              category: "WhatsApp Business",
              imageURL: null, // WhatsApp doesn't provide images
              platform: "whatsapp",
              meta: {
                businessId: biz.id,
                businessName: biz.name,
                wabaId: waba.id,
                wabaName: waba.name,
                displayPhoneNumber: phone.display_phone_number,
                verifiedName: phone.verified_name,
                qualityRating: phone.quality_rating,
                codeVerificationStatus: phone.code_verification_status,
                newNumberStatus: phone.new_number_status,
              },
            };

            channels.push(whatsappChannel);
          }
        }
      }
    }
  } catch (err) {
    console.error("❌ Unexpected error fetching WhatsApp channels:", err);
  }

  return channels;
}

const askAssistant = async (request, response, next) => {
  try {
    const validatedData = assistantValidation.askAssistantSchema.parse(request.body)

    let { threadId, storeId, message } = validatedData;

    const store = await StoreModel.findById(storeId);
    if (!store) {
      throw new AppError('store not found', 400)
    }

    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
    }

    const activeSubscription =
      await subscriptionsUtils.getUserActiveSubscription(store.userId);

    if (!activeSubscription) {
      throw new AppError("Your subscription has expired. Please renew to continue enjoying all features", 400)
    }

    let chat = await ChatModel.findOne({ threadId });
    if (!chat) {
      const chatData = {
        userId: store.userId,
        storeId: store._id,
        threadId,
        platform: "web",
      };
      const chatObj = new ChatModel(chatData);
      chat = await chatObj.save();
    }

    const messageResponse = await assistantService.askService({ message, threadId, storeId });

    const { userTokens, botTokens, totalTokens } = messageResponse.usage;

    const messagesData = [
      {
        userId: chat.userId,
        storeId: chat.storeId,
        chatId: chat._id,
        role: "user",
        content: message,
        tokens: userTokens,
        createdAt: new Date()
      },
      {
        userId: chat.userId,
        storeId: chat.storeId,
        chatId: chat._id,
        role: "assistant",
        content: messageResponse.message,
        tokens: botTokens,
        createdAt: new Date()
      },
    ];

    const [messages, updatedSubscription] = await Promise.all([
      MessageModel.insertMany(messagesData),
      SubscriptionModel.findByIdAndUpdate(activeSubscription._id, {
        $inc: { tokensUsed: totalTokens },
      }),
    ]);

    return response.status(200).json({
      accepted: true,
      usage: messageResponse.usage,
      message: messageResponse.message,
      threadId,
      subscription: updatedSubscription,
      messages,
    });
  } catch (error) {
    next(error)
};
}

const verifyMessenger = (request, response, next) => {
  try {
    const mode = request.query["hub.mode"];
    const token = request.query["hub.verify_token"];
    const challenge = request.query["hub.challenge"];

    if (mode !== "subscribe" || token !== config.FACEBOOK.VERIFY_TOKEN) {
      return response.sendStatus(403);
    }

    return response.status(200).send(challenge);
  } catch (error) {
    next(error)
  }
};

const askAssistantThroughMessenger = async (request, response, next) => {
  // IMMEDIATELY respond with 200 to prevent Facebook retries
  response.sendStatus(200);

  try {
    if (request.body.object === "page" || request.body.object === "instagram") {
      for (const entry of request.body.entry) {
        const platform =
          request.body.object === "page" ? "facebook" : "instagram";
        const webhookEvent = entry.messaging[0];
        const senderId = webhookEvent.sender.id;
        const pageId = webhookEvent.recipient.id;
        const userMessage = webhookEvent.message?.text;
        const isEcho = webhookEvent.message?.is_echo;
        const messageId = webhookEvent.message?.mid;
        const attachments = extractAttachmentsFromEvent(webhookEvent);

        if (isEcho) {
          continue;
        }

        // Skip if no message text and no attachments
        if (!userMessage && attachments.length === 0) {
          continue;
        }

        // Check for duplicate messages using Facebook's message ID
        if (messageId && isMessageProcessed(messageId, senderId)) {
          console.log(
            `Skipping duplicate message ${messageId} from ${senderId}`
          );
          continue;
        }

        // Mark message as processed
        if (messageId) {
          markMessageAsProcessed(messageId, senderId);
        }

        const channel = await ChannelModel.findOne({
          pageId,
          platform,
          isSubscribed: true,
        });
        if (!channel) {
          continue;
        }

        const todayDate = new Date();

        const activeSubscription = await SubscriptionModel.findOne({
          userId: channel.userId,
          status: "PAID",
          endDate: { $gte: todayDate },
          $expr: { $lt: ["$tokensUsed", "$tokensLimit"] },
        });

        if (!activeSubscription) {
          continue;
        }

        const store = await StoreModel.findOne({
          $or: [{ facebookId: pageId }, { instagramId: pageId }],
        });
        if (!store) {
          continue;
        }

        let chat = await ChatModel.findOne({
          channelPageId: pageId,
          channelUserId: senderId,
        });

        if (!chat) {
          const thread = await openai.beta.threads.create();
          const counter = await CounterModel.findOneAndUpdate(
            { name: `chat-${store._id}` },
            { $inc: { value: 1 } },
            { new: true, upsert: true }
          );
          const chatData = {
            chatId: counter.value,
            userId: store.userId,
            storeId: store._id,
            channelPageId: pageId,
            channelUserId: senderId,
            threadId: thread.id,
            platform,
          };
          const chatObj = new ChatModel(chatData);
          chat = await chatObj.save();
        }

        // Get valid token once for both typing and response
        const validToken = await getValidAccessToken(channel);

        // Format message with attachments using the valid token
        const completeMessage = await formatMessageWithAttachments(
          userMessage,
          attachments,
          validToken
        );

        if (!completeMessage || completeMessage.trim() === "") {
          continue;
        }
        if (!validToken) {
          console.error(`Cannot get valid token for channel ${channel.pageId}`);
          continue;
        }

        if (platform === "facebook") {
          const typingMessageParams = {
            params: { access_token: validToken },
          };

          const typingMessageData = {
            recipient: { id: webhookEvent.sender.id },
            sender_action: "typing_on",
          };
          await axios.post(
            `https://graph.facebook.com/v18.0/me/messages`,
            typingMessageData,
            typingMessageParams
          );
        }

        const askMessageData = {
          storeId: store._id,
          threadId: chat.threadId,
          message: completeMessage,
          senderId: webhookEvent.sender.id,
        };

        const messageResponse = await assistantService.askService(
          askMessageData
        );
        messageResponse.message = formatResponseForMessenger(
          messageResponse.message
        );

        const responseMessageParams = {
          params: { access_token: validToken },
        };

        const responseMessageData = {
          recipient: { id: webhookEvent.sender.id },
          message: { text: messageResponse.message },
        };

        try {
          await axios.post(
            `https://graph.facebook.com/v18.0/me/messages`,
            responseMessageData,
            responseMessageParams
          );
        } catch (apiError) {
          if (apiError.response?.data?.error?.code === 190) {
            console.error(
              `Token expired for channel ${channel.pageId}, attempting refresh...`
            );
            const refreshedToken = await refreshFacebookToken(channel);
            if (refreshedToken) {
              responseMessageParams.params.access_token = refreshedToken;
              await axios.post(
                `https://graph.facebook.com/v18.0/me/messages`,
                responseMessageData,
                responseMessageParams
              );
            } else {
              console.error(
                `Failed to refresh token and send message for channel ${channel.pageId}`
              );
              continue;
            }
          } else {
            throw apiError;
          }
        }

        const userMessageData = {
          userId: chat.userId,
          storeId: chat.storeId,
          channelUserId: chat.channelUserId,
          chatId: chat._id,
          role: "user",
          content: completeMessage,
          tokens: messageResponse.usage.userTokens,
        };
        const userMessageObj = new MessageModel(userMessageData);

        const assistantMessageData = {
          userId: chat.userId,
          storeId: chat.storeId,
          channelUserId: chat.channelUserId,
          chatId: chat._id,
          role: "assistant",
          content: messageResponse.message,
          tokens: messageResponse.usage.botTokens,
        };
        const assistantMessageObj = new MessageModel(assistantMessageData);

        await Promise.all([
          userMessageObj.save(),
          assistantMessageObj.save(),
          SubscriptionModel.findByIdAndUpdate(activeSubscription._id, {
            $inc: { tokensUsed: messageResponse.usage.totalTokens },
          }),
        ]);
      }
    }
  } catch (error) {
    console.error(error?.response || error);
    // Already responded with 200, just log the error
  }
};

const facebookCallback = async (request, response) => {
  const { code, error, state: userId } = request.query;

  if (error) {
    console.error("Facebook OAuth error:", error);
    return response.redirect(config.FACEBOOK.ERROR_URL);
  }

  if (!code) {
    console.error("No authorization code received from Facebook");
    return response.redirect(config.FACEBOOK.ERROR_URL);
  }

  // Validate and sanitize userId
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    console.error("Invalid or missing userId in callback");
    return response.redirect(config.FACEBOOK.ERROR_URL);
  }

  const sanitizedUserId = userId.trim().replace(/[^a-zA-Z0-9]/g, "");
  if (!sanitizedUserId) {
    console.error("UserId contains invalid characters");
    return response.redirect(config.FACEBOOK.ERROR_URL);
  }

  try {
    const redirectURL = config.FACEBOOK.REDIRECT_URL;
    const clientId = config.FACEBOOK.CLIENT_ID;
    const clientSecret = config.FACEBOOK.CLIENT_SECRET;

    // Validate config parameters
    if (!redirectURL || !clientId || !clientSecret) {
      console.error("Missing Facebook configuration parameters");
      return response.redirect(config.FACEBOOK.ERROR_URL);
    }

    const res = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectURL
      )}&client_secret=${clientSecret}&code=${encodeURIComponent(code)}`,
      {
        method: "GET",
      }
    );

    if (!res.ok) {
      console.error(
        "Facebook OAuth request failed:",
        res.status,
        res.statusText
      );
      return response.redirect(config.FACEBOOK.ERROR_URL);
    }

    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      console.error("Failed to parse Facebook OAuth response:", jsonError);
      return response.redirect(config.FACEBOOK.ERROR_URL);
    }

    if (data.error) {
      console.error("Facebook OAuth error:", data.error);
      return response.redirect(config.FACEBOOK.ERROR_URL);
    }

    if (!data.access_token) {
      console.error("No access token received from Facebook");
      return response.redirect(config.FACEBOOK.ERROR_URL);
    }

    const accessToken = data.access_token;

    if (typeof accessToken !== "string" || accessToken.trim() === "") {
      console.error("Invalid access token format");
      return response.redirect(config.FACEBOOK.ERROR_URL);
    }

    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,picture,about,emails,phone,website,fan_count,followers_count,link,location,is_published,cover,verification_status,tasks&access_token=${accessToken}`
    );

    if (!pagesRes.ok) {
      console.error(
        "Failed to fetch Facebook pages:",
        pagesRes.status,
        pagesRes.statusText
      );
      return response.redirect(config.FACEBOOK.ERROR_URL);
    }

    const pages = await pagesRes.json();

    if (pages.error) {
      console.error("Facebook API error when fetching pages:", pages.error);
      return response.redirect(config.FACEBOOK.ERROR_URL);
    }

    if (!pages.data || !Array.isArray(pages.data)) {
      console.error("Invalid pages data structure from Facebook API");
      return response.redirect(config.FACEBOOK.ERROR_URL);
    }

    const [newChannels, whatsappChannels] = await Promise.all([
      formatChannelsFromPages(pages, userId),
      formatChannelsFromWhatsapp(accessToken, userId),
    ]);

    if (!Array.isArray(newChannels) || !Array.isArray(whatsappChannels)) {
      console.error("Failed to format channels from Facebook/WhatsApp data");
      return response.redirect(config.FACEBOOK.ERROR_URL);
    }

    await syncChannels([...whatsappChannels, ...newChannels]);

    return response.redirect(config.FACEBOOK.SUCCESS_URL);
  } catch (error) {
    console.error(error);
    return response.redirect(config.FACEBOOK.ERROR_URL);
  }
};

const testFacebookImageUpload = async (request, response, next) => {
  try {
    const { facebookUrl, accessToken } = request.body;

    if (!facebookUrl || !accessToken) {
      throw new AppError("Facebook URL and access token are required", 400)
    }

    // Test the upload function
    const firebaseUrl = await uploadFacebookImageToFirebase(
      facebookUrl,
      accessToken
    );

    return response.status(200).json({
      accepted: true,
      message: "Image uploaded successfully",
      data: {
        originalFacebookUrl: facebookUrl,
        firebaseUrl: firebaseUrl,
      },
    });
  } catch (error) {
    next(error)
  }
};

const testSendFacebookImage = async (request, response, next) => {
  try {
    const { recipientId, imageUrl, accessToken, text } = request.body;

    if (!recipientId || !imageUrl || !accessToken) {
      throw new AppError("recipientId, imageUrl, and accessToken are required", 400)
    }

    const result = await sendImageWithText(
      recipientId,
      imageUrl,
      text || "Test image",
      accessToken
    );

    return response.status(200).json({
      accepted: true,
      message: "Image sent successfully",
      data: result,
    });
  } catch (error) {
    next(error)
  }
};

module.exports = {
  askAssistant,
  verifyMessenger,
  askAssistantThroughMessenger,
  facebookCallback,
  testFacebookImageUpload,
  testSendFacebookImage
}
