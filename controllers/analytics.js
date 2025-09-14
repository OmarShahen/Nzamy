const MessageModel = require("../models/MessageModel");
const ChatModel = require("../models/ChatModel");
const buildDateRangeFilter = require("../utils/date-range-filter");
const mongoose = require("mongoose");

const getAverageResponseTime = async (filter = {}) => {
  const pipeline = [
    { $match: filter },
    { $sort: { chatId: 1, _id: 1 } }, // ensure chronological order within chats
    {
      $group: {
        _id: "$chatId",
        messages: { $push: "$$ROOT" },
      },
    },
    {
      $project: {
        responseTimes: {
          $reduce: {
            input: { $range: [0, { $size: "$messages" }, 1] },
            initialValue: [],
            in: {
              $concatArrays: [
                "$$value",
                {
                  $cond: [
                    {
                      $and: [
                        {
                          $lt: [
                            "$$this",
                            { $subtract: [{ $size: "$messages" }, 1] },
                          ],
                        },
                        {
                          $eq: [
                            { $arrayElemAt: ["$messages.role", "$$this"] },
                            "user",
                          ],
                        },
                        {
                          $eq: [
                            {
                              $arrayElemAt: [
                                "$messages.role",
                                { $add: ["$$this", 1] },
                              ],
                            },
                            "assistant",
                          ],
                        },
                      ],
                    },
                    [
                      {
                        $divide: [
                          {
                            $subtract: [
                              {
                                $toDate: {
                                  $arrayElemAt: [
                                    "$messages._id",
                                    { $add: ["$$this", 1] },
                                  ],
                                },
                              },
                              {
                                $toDate: {
                                  $arrayElemAt: ["$messages._id", "$$this"],
                                },
                              },
                            ],
                          },
                          1000, // convert ms to seconds
                        ],
                      },
                    ],
                    [],
                  ],
                },
              ],
            },
          },
        },
      },
    },
    { $unwind: "$responseTimes" },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: "$responseTimes" },
      },
    },
  ];

  const result = await MessageModel.aggregate(pipeline);
  return result.length > 0 ? result[0].avgResponseTime : null;
};

const getEngagementStats = async (request, response, next) => {
  try {
    let { userId, storeId } = request.query;

    const { current, previous, days } = buildDateRangeFilter(request.query);

    if (userId) {
      userId = new mongoose.Types.ObjectId(userId);
    }

    if (storeId) {
      storeId = new mongoose.Types.ObjectId(storeId);
    }

    const [currentTotalReceivedMessages, prevTotalReceivedMessages] =
      await Promise.all([
        MessageModel.count({
          ...current,
          userId,
          storeId,
          role: "user",
        }),
        MessageModel.count({
          ...previous,
          userId,
          storeId,
          role: "user",
        }),
      ]);

    const [currentTotalBotMessages, prevTotalBotMessages] = await Promise.all([
      MessageModel.count({
        ...current,
        userId,
        storeId,
        role: "assistant",
      }),
      MessageModel.count({
        ...previous,
        userId,
        storeId,
        role: "assistant",
      }),
    ]);

    const [currentTotalChats, prevTotalChats] = await Promise.all([
      ChatModel.count({ ...current, userId, storeId }),
      ChatModel.count({ ...previous, userId, storeId }),
    ]);

    const [currentAverageResponseTime, prevAverageResponseTime] =
      await Promise.all([
        getAverageResponseTime({ ...current, userId, storeId }),
        getAverageResponseTime({ ...previous, userId, storeId }),
      ]);

    const stats = {
      range: days,
      currentTotalReceivedMessages,
      prevTotalReceivedMessages,
      currentTotalBotMessages,
      prevTotalBotMessages,
      currentTotalChats,
      prevTotalChats,
      currentAverageResponseTime,
      prevAverageResponseTime,
    };

    return response.status(200).json({
      accepted: true,
      stats,
    });
  } catch (error) {
    next(error)
  }
};

const getMessagesGrowthStats = async (request, response, next) => {
  try {
    const { groupBy, userId, storeId } = request.query;

    const { current } = buildDateRangeFilter(request.query);

    const searchQuery = { ...current };

    if (userId) {
      searchQuery.userId = mongoose.Types.ObjectId(userId);
    }

    if (storeId) {
      searchQuery.storeId = mongoose.Types.ObjectId(storeId);
    }

    let format = "%Y-%m-%d";

    if (groupBy == "month") {
      format = "%Y-%m";
    } else if (groupBy == "year") {
      format = "%Y";
    }

    const messagesGrowth = await MessageModel.aggregate([
      {
        $match: { ...searchQuery, role: "user" },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: format,
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return response.status(200).json({
      accepted: true,
      messagesGrowth,
    });
  } catch (error) {
    next(error)
  }
};

const getChatsGrowthStats = async (request, response, next) => {
  try {
    const { groupBy, userId, storeId } = request.query;

    const { current } = buildDateRangeFilter(request.query);

    const searchQuery = { ...current };

    if (userId) {
      searchQuery.userId = mongoose.Types.ObjectId(userId);
    }

    if (storeId) {
      searchQuery.storeId = mongoose.Types.ObjectId(storeId);
    }

    let format = "%Y-%m-%d";

    if (groupBy == "month") {
      format = "%Y-%m";
    } else if (groupBy == "year") {
      format = "%Y";
    }

    const chatsGrowth = await ChatModel.aggregate([
      {
        $match: searchQuery,
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: format,
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return response.status(200).json({
      accepted: true,
      chatsGrowth,
    });
  } catch (error) {
    next(error)
  }
};

const getChatsChannelsGrowthStats = async (request, response, next) => {
  try {
    const { userId, storeId } = request.query;

    const { current } = buildDateRangeFilter(request.query);

    const searchQuery = { ...current };

    if (userId) {
      searchQuery.userId = mongoose.Types.ObjectId(userId);
    }

    if (storeId) {
      searchQuery.storeId = mongoose.Types.ObjectId(storeId);
    }

    const chatChannelsGrowth = await ChatModel.aggregate([
      {
        $match: searchQuery,
      },
      {
        $group: {
          _id: "$platform",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return response.status(200).json({
      accepted: true,
      chatChannelsGrowth,
    });
  } catch (error) {
    next(error)
  }
};

const getTokensStats = async (request, response, next) => {
  try {
    let { userId, storeId } = request.query;

    const { current, previous, days } = buildDateRangeFilter(request.query);

    const searchQuery = {};

    if (userId) {
      searchQuery.userId = new mongoose.Types.ObjectId(userId);
    }

    if (storeId) {
      searchQuery.storeId = new mongoose.Types.ObjectId(storeId);
    }

    const [currentTotalMessages, prevTotalMessages] = await Promise.all([
      MessageModel.count({
        ...current,
        ...searchQuery,
      }),
      MessageModel.count({
        ...previous,
        ...searchQuery,
      }),
    ]);

    const [currentSummary, prevSummary] = await Promise.all([
      MessageModel.aggregate([
        {
          $match: { ...searchQuery, ...current },
        },
        {
          $group: {
            _id: "$role",
            totalTokens: { $sum: "$tokens" },
          },
        },
      ]),
      MessageModel.aggregate([
        {
          $match: { ...searchQuery, ...previous },
        },
        {
          $group: {
            _id: "$role",
            totalTokens: { $sum: "$tokens" },
          },
        },
      ]),
    ]);

    const currentResult = { user: 0, assistant: 0 };
    currentSummary.forEach((s) => {
      currentResult[s._id] = s.totalTokens;
    });

    const prevResult = { user: 0, assistant: 0 };
    prevSummary.forEach((s) => {
      prevResult[s._id] = s.totalTokens;
    });

    const totalCurrentUserTokens = currentResult.user;
    const totalCurrentBotTokens = currentResult.assistant;

    const totalPrevUserTokens = prevResult.user;
    const totalPrevBotTokens = prevResult.assistant;

    return response.status(200).json({
      accepted: true,
      stats: {
        range: days,
        totalCurrentUserTokens,
        totalCurrentBotTokens,
        totalPrevUserTokens,
        totalPrevBotTokens,
        currentTotalMessages,
        prevTotalMessages,
      },
    });
  } catch (error) {
    next(error)
  }
};

const getTokensGrowthStats = async (request, response, next) => {
  try {
    const { groupBy, userId, storeId } = request.query;

    const { current } = buildDateRangeFilter(request.query);

    const searchQuery = { ...current };

    if (userId) searchQuery.userId = mongoose.Types.ObjectId(userId);
    if (storeId) searchQuery.storeId = mongoose.Types.ObjectId(storeId);

    let format = "%Y-%m-%d";
    if (groupBy === "month") format = "%Y-%m";
    else if (groupBy === "year") format = "%Y";

    const tokensGrowth = await MessageModel.aggregate([
      { $match: searchQuery },
      {
        $group: {
          _id: {
            $dateToString: {
              format: format,
              date: "$createdAt",
            },
          },
          total: { $sum: "$tokens" },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return response.status(200).json({
      accepted: true,
      tokensGrowth,
    });
  } catch (error) {
    next(error)
  }
};

module.exports = {
  getEngagementStats,
  getMessagesGrowthStats,
  getChatsGrowthStats,
  getChatsChannelsGrowthStats,
  getTokensStats,
  getTokensGrowthStats,
};
