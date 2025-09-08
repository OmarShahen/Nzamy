const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, required: true },
    storeId: { type: mongoose.Types.ObjectId, required: true },
    chatId: { type: mongoose.Types.ObjectId, required: true },
    channelUserId: { type: String },
    role: { type: String, required: true, enum: ["user", "assistant"] },
    content: { type: String, required: true },
    tokens: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
