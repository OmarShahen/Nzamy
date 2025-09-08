const MessageModel = require("../models/MessageModel");
const mongoose = require("mongoose");
const config = require("../config/config");

const getMessages = async (request, response) => {
  try {
    let { userId, storeId, chatId, role, limit, page } = request.query;

    let searchQuery = {};

    limit = limit ? Number.parseInt(limit) : config.PAGINATION_LIMIT;
    page = page ? Number.parseInt(page) : 1;

    const skip = (page - 1) * limit;

    if (userId) {
      searchQuery.userId = mongoose.Types.ObjectId(userId);
    }

    if (storeId) {
      searchQuery.storeId = mongoose.Types.ObjectId(storeId);
    }

    if (chatId) {
      searchQuery.chatId = mongoose.Types.ObjectId(chatId);
    }

    if (role) {
      searchQuery.role = role;
    }

    const messages = await MessageModel.aggregate([
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
          from: "chats",
          localField: "chatId",
          foreignField: "_id",
          as: "chat",
        },
      },
      {
        $project: {
          "user.password": 0,
        },
      },
    ]);

    messages.forEach((message) => {
      message.user = message.user[0];
      message.store = message.store[0];
      message.chat = message.chat[0];
    });

    const total = await MessageModel.countDocuments(searchQuery);

    return response.status(200).json({
      accepted: true,
      total,
      messages,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

const deleteMessage = async (request, response) => {
  try {
    const { messageId } = request.params;

    const deletedMessage = await MessageModel.findByIdAndDelete(messageId);

    return response.status(200).json({
      accepted: true,
      message: "Message is deleted successfully!",
      chatMessage: deletedMessage,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      accepted: false,
      message: "internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getMessages,
  deleteMessage,
};
