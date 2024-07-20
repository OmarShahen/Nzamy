const mongoose = require('mongoose')

const ShiftSchema = new mongoose.Schema({

    shiftId: { type: Number, required: true, unique: true },
    cashierId: { type: mongoose.Types.ObjectId, required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    openingBalance: { type: Number, default: 0 },
    closingBalance: { type: Number, default: 0 },
    isDone: { type: Boolean, default: false }

}, { timestamps: true })


module.exports = mongoose.model('Shift', ShiftSchema)