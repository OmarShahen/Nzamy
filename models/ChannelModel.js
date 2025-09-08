const mongoose = require("mongoose");

const ChannelSchema = new mongoose.Schema(
  {
    pageId: { type: String, required: true },
    userId: { type: mongoose.Types.ObjectId, required: true },
    isSubscribed: { type: Boolean, default: false },
    name: { type: String, required: true },
    accessToken: { type: String, required: true },
    tokenExpiresAt: { type: Date },
    category: { type: String },
    imageURL: { type: String },
    platform: {
      type: String,
      required: true,
      enum: ["facebook", "instagram", "whatsapp"],
    },
    meta: {},
  },
  { timestamps: true }
);

module.exports = mongoose.model("Channel", ChannelSchema);
