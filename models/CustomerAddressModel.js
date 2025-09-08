const mongoose = require("mongoose");

const CustomerAddressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, required: true },
    storeId: { type: mongoose.Types.ObjectId, required: true },
    customerId: { type: mongoose.Types.ObjectId, required: true },

    addressLine: { type: String, required: true },
    postalCode: { type: String },
    country: { type: String, required: true },
    city: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomerAddress", CustomerAddressSchema);
