const ShiftModel = require('../models/ShiftModel')


const getShifts = async (request, response) => {

    try {

        const shifts = await ShiftModel
        .find()
        .sort({ createdAt: -1 })

        return response.status(200).json({
            accepted: true,
            shifts
        })

    } catch(error) {
        console.error(error)
        return response.status(500).json({
            accepted: false,
            message: 'internal server error',
            error: error.message
        })
    }
}


module.exports = { getShifts }