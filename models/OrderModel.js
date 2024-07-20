const mongoose = require('mongoose')
const config = require('../config/config')

const OrderSchema = new mongoose.Schema({

    orderId: { type: Number, required: true, unique: true },
    cashierId: { type: mongoose.Types.ObjectId, required: true },
    totalPrice: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    isRefunded: { type: Boolean, default: false },
    paymentMethod: { type: String, default: 'CASH', enum: config.PAYMENT_METHODS },
    items: [],
    refunderId: { type: mongoose.Types.ObjectId },
    refundDate: { type: Date }

}, { timestamps: true })

module.exports = mongoose.model('Order', OrderSchema)