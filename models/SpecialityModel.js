const mongoose = require('mongoose')
const config = require('../config/config')

const SpecialitySchema = new mongoose.Schema({

    specialityId: { type: Number, required: true, unique: true },
    mainSpecialityId: { type: mongoose.Types.ObjectId },
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: config.SPECIALITIES_TYPES },
    isShow: { type: Boolean, default: true },
    imageURL: { type: String }

}, { timestamps: true })


module.exports = mongoose.model('Speciality', SpecialitySchema)