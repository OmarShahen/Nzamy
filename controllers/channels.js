const ChannelModel = require("../models/ChannelModel");
const mongoose = require("mongoose");
const config = require("../config/config");
const axios = require("axios");
const { AppError } = require("../middlewares/errorHandler");

const getChannels = async (request, response, next) => {
  try {
    let { userId, name, platform, category, limit, page } = request.query;

    let searchQuery = {};

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    if (userId) {
      searchQuery.userId = new mongoose.Types.ObjectId(userId);
    }

    if (name) {
      searchQuery.name = { $regex: name, $options: "i" };
    }

    if (category) {
      searchQuery.category = category;
    }

    if (platform) {
      searchQuery.platform = platform;
    }

    const channels = await ChannelModel.aggregate([
      {
        $match: searchQuery,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          "user.password": 0,
        },
      },
    ]);

    channels.forEach((channel) => {
      channel.user = channel.user[0];
    });

    const total = await ChannelModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      channels,
    });
  } catch (error) {
    next(error)
  }
};

const deleteChannel = async (request, response, next) => {
  try {
    const { channelId } = request.params;

    const deletedChannel = await ChannelModel.findByIdAndDelete(channelId);

    return response.status(200).json({
      accepted: true,
      message: "Channel is deleted successfully!",
      channel: deletedChannel,
    });
  } catch (error) {
    next(error)
  }
};

const subscribeFacebookPage = async (request, response, next) => {
  try {
    const { channelId } = request.params;

    const channel = await ChannelModel.findById(channelId);
    if (!channel) {
      throw new AppError("Channel not found", 400)
    }

    const facebookURL = `https://graph.facebook.com/v18.0/${
      channel.platform == `instagram`
        ? channel.meta?.linked_facebook_page
        : channel.pageId
    }/subscribed_apps`;
    const facebookParams = {
      params: {
        access_token: channel.accessToken,
        subscribed_fields: "messages,messaging_postbacks,messaging_optins",
      },
    };

    await axios.post(facebookURL, null, facebookParams);

    const updatedChannel = await ChannelModel.findByIdAndUpdate(
      channel._id,
      { isSubscribed: true },
      { new: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "Channel is successfully subscribed to the webhook",
      channel: updatedChannel,
    });
  } catch (error) {
    next(error)
  }
};

const unsubscribeFacebookPage = async (request, response, next) => {
  try {
    const { channelId } = request.params;

    const channel = await ChannelModel.findById(channelId);
    if (!channel) {
      throw new AppError("Channel not found", 400)
    }

    const facebookURL = `https://graph.facebook.com/v18.0/${
      channel.platform == `instagram`
        ? channel.meta?.linked_facebook_page
        : channel.pageId
    }/subscribed_apps`;
    const facebookParams = {
      params: {
        access_token: channel.accessToken,
        subscribed_fields: "messages,messaging_postbacks,messaging_optins",
      },
    };

    await axios.delete(facebookURL, facebookParams);

    const updatedChannel = await ChannelModel.findByIdAndUpdate(
      channel._id,
      { isSubscribed: false },
      { new: true }
    );

    return response.status(200).json({
      accepted: true,
      message: "Channel is successfully unsubscribed from the webhook",
      channel: updatedChannel,
    });
  } catch (error) {
    next(error)
  }
};

module.exports = {
  getChannels,
  deleteChannel,
  subscribeFacebookPage,
  unsubscribeFacebookPage,
};
