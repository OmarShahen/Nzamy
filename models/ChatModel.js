const mongoose = require("mongoose");
const CounterModel = require("./CounterModel");

const ChatSchema = new mongoose.Schema(
  {
    chatId: { type: Number },
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

ChatSchema.pre('save', async function (next) {
  if(this.isNew) {
    try {

      const counter = await CounterModel.findOneAndUpdate(
        { name: `chat-${this.storeId}` },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      )
      this.chatId = counter.value
      next()
    } catch(error) {
      next(error)
    }
  } else {
    next()
  }
})

module.exports = mongoose.model("Chat", ChatSchema);
