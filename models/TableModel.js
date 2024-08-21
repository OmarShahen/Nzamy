const mongoose = require('mongoose')
const config = require('../config/config')

const TableSchema = new mongoose.Schema({

    tableId: { type: Number, required: true, unique: true },
    tableNumber: { type: String, required: true },
    seatingCapacity: { type: Number, required: true },
    status: { type: String, default: 'AVAILABLE', enum: config.TABLE_STATUS },
    isActive: { type: Boolean, default: true },
    location: { type: String }

}, { timestamps: true })


module.exports = mongoose.model('Table', TableSchema)