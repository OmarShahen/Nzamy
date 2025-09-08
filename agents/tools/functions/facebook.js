const ChannelModel = require("../../../models/ChannelModel");
const ChatModel = require("../../../models/ChatModel");
const {
  sendImageWithText,
  sendTextAndGallery,
} = require("../../../utils/send-facebook-image");

const sendImageToFacebookUser = async ({ recipientId, imageUrl, caption }) => {
  try {
    const facebookUser = await ChatModel.findOne({
      channelUserId: recipientId,
    });
    const channel = await ChannelModel.findOne({
      pageId: facebookUser.channelPageId,
      platform: "facebook",
      isSubscribed: true,
    });

    const facebookResult = await sendImageWithText(
      String(recipientId),
      imageUrl,
      caption,
      channel.accessToken
    );

    return facebookResult;
  } catch (error) {
    //console.error(error);
    return { message: "There was a problem sending the image" };
  }
};

const sendGalleryToFacebookUser = async ({ recipientId, text, images }) => {
  try {
    const facebookUser = await ChatModel.findOne({
      channelUserId: recipientId,
    });
    const channel = await ChannelModel.findOne({
      pageId: facebookUser.channelPageId,
      platform: "facebook",
      isSubscribed: true,
    });

    const facebookResult = await sendTextAndGallery(
      recipientId,
      images,
      text,
      channel.accessToken
    );

    return facebookResult;
  } catch (error) {
    //console.error(error);
    return { message: "There was a problem sending the image" };
  }
};

module.exports = { sendImageToFacebookUser, sendGalleryToFacebookUser };
