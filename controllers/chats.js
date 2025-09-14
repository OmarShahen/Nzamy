const mongoose = require("mongoose");
const config = require("../config/config");
const ChatModel = require("../models/ChatModel");

const getChats = async (request, response, next) => {
  try {
    let { userId, storeId, channelUserId, platform, limit, page } =
      request.query;

    let searchQuery = {};

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    if (userId) {
      searchQuery.userId = new mongoose.Types.ObjectId(userId);
    }

    if (storeId) {
      searchQuery.storeId = new mongoose.Types.ObjectId(storeId);
    }

    if (channelUserId) {
      searchQuery.channelUserId = channelUserId;
    }

    if (platform) {
      searchQuery.platform = platform;
    }

    const chats = await ChatModel.aggregate([
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
        $lookup: {
          from: "stores",
          localField: "storeId",
          foreignField: "_id",
          as: "store",
        },
      },
      {
        $lookup: {
          from: "channels",
          localField: "channelPageId",
          foreignField: "pageId",
          as: "channel",
        },
      },
      {
        $project: {
          "user.password": 0,
        },
      },
    ]);

    chats.forEach((chat) => {
      chat.user = chat.user[0];
      chat.store = chat.store[0];
      chat.channel = chat.channel[0];
    });

    const total = await ChatModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      chats,
    });
  } catch (error) {
    next(error)
  }
};

const deleteChat = async (request, response, next) => {
  try {
    const { chatId } = request.params;

    const deletedChat = await ChatModel.findByIdAndDelete(chatId);

    return response.status(200).json({
      accepted: true,
      message: "Chat is deleted successfully!",
      chat: deletedChat,
    });
  } catch (error) {
    next(error)
  }
};

module.exports = {
  getChats,
  deleteChat,
};
