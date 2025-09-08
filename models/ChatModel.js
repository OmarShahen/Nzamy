const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    chatId: { type: Number, required: true },
    userId: { type: mongoose.Types.ObjectId, required: true },
    storeId: { type: mongoose.Types.ObjectId, required: true },
    threadId: { type: String, required: true },
    platform: {
      type: String,
      required: true,
      enum: ["facebook", "instagram", "whatsapp", "web"],
    },
    channelUserId: { type: String },
    channelPageId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);
