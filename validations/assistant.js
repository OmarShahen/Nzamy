const utils = require("../utils/utils");

const askAssistant = (askData) => {
  const { message, threadId, storeId } = askData;

  if (!message)
    return {
      isAccepted: false,
      message: "message is required",
      field: "message",
    };

  if (typeof message != "string")
    return {
      isAccepted: false,
      message: "message format is invalid",
      field: "message",
    };

  if (threadId && typeof threadId != "string") {
    return {
      isAccepted: false,
      message: "threadId format is invalid",
      field: "threadId",
    };
  }

  if (!storeId)
    return {
      isAccepted: false,
      message: "store Id is required",
      field: "storeId",
    };

  if (!utils.isObjectId(storeId))
    return {
      isAccepted: false,
      message: "store Id format is invalid",
      field: "storeId",
    };

  return { isAccepted: true, message: "data is valid", data: askData };
};

module.exports = { askAssistant };
