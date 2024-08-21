const utils = require('../utils/utils')
const UserModel = require('../models/UserModel')
const SpecialityModel = require('../models/SpecialityModel')
const ItemModel = require('../models/ItemModel')
const OrderModel = require('../models/OrderModel')
const SupplierModel = require('../models/SupplierModel')
const StockRecordModel = require('../models/StockRecordModel')
const TableModel = require('../models/TableModel')


const verifyUserId = async (request, response, next) => {

    try {

        const { userId } = request.params

        if(!utils.isObjectId(userId)) {
            return response.status(400).json({
                accepted: false,
                message: 'invalid user Id formate',
                field: 'userId'
            })
        }

        const user = await UserModel.findById(userId)
        if(!user) {
            return response.status(404).json({
                accepted: false,
                message: 'user Id does not exist',
                field: 'userId'
            })
        }

        return next()

    } catch(error) {
        console.error(error)
        return response.status(500).json({
            message: 'internal server error',
            error: error.message
        })
    }
}

const verifySpecialityId = async (request, response, next) => {

    try {

        const { specialityId } = request.params

        if(!utils.isObjectId(specialityId)) {
            return response.status(400).json({
                accepted: false,
                message: 'invalid speciality Id formate',
                field: 'specialityId'
            })
        }

        const speciality = await SpecialityModel.findById(specialityId)
        if(!speciality) {
            return response.status(404).json({
                accepted: false,
                message: 'speciality Id does not exist',
                field: 'specialityId'
            })
        }

        return next()

    } catch(error) {
        console.error(error)
        return response.status(500).json({
            message: 'internal server error',
            error: error.message
        })
    }
}

const verifyItemId = async (request, response, next) => {

    try {

        const { itemId } = request.params

        if(!utils.isObjectId(itemId)) {
            return response.status(400).json({
                accepted: false,
                message: 'Invalid item ID format',
                field: 'itemId'
            })
        }

        const item = await ItemModel.findById(itemId)
        if(!item) {
            return response.status(404).json({
                accepted: false,
                message: 'Item ID does not exist',
                field: 'itemId'
            })
        }

        return next()

    } catch(error) {
        console.error(error)
        return response.status(500).json({
            accepted: false,
            message: 'internal server error',
            error: error.message
        })
    }
}

const verifyOrderId = async (request, response, next) => {

    try {

        const { orderId } = request.params

        if(!utils.isObjectId(orderId)) {
            return response.status(400).json({
                accepted: false,
                message: 'Invalid order ID format',
                field: 'orderId'
            })
        }

        const order = await OrderModel.findById(orderId)
        if(!order) {
            return response.status(404).json({
                accepted: false,
                message: 'Order ID does not exist',
                field: 'orderId'
            })
        }

        return next()

    } catch(error) {
        console.error(error)
        return response.status(500).json({
            accepted: false,
            message: 'internal server error',
            error: error.message
        })
    }
}

const verifySupplierId = async (request, response, next) => {

    try {

        const { supplierId } = request.params

        if(!utils.isObjectId(supplierId)) {
            return response.status(400).json({
                accepted: false,
                message: 'Invalid supplier ID format',
                field: 'supplierId'
            })
        }

        const supplier = await SupplierModel.findById(supplierId)
        if(!supplier) {
            return response.status(404).json({
                accepted: false,
                message: 'Supplier ID does not exist',
                field: 'supplierId'
            })
        }

        return next()

    } catch(error) {
        console.error(error)
        return response.status(500).json({
            accepted: false,
            message: 'internal server error',
            error: error.message
        })
    }
}

const verifyStockRecordId = async (request, response, next) => {

    try {

        const { stockRecordId } = request.params

        if(!utils.isObjectId(stockRecordId)) {
            return response.status(400).json({
                accepted: false,
                message: 'Invalid stock record ID format',
                field: 'stockRecordId'
            })
        }

        const stockRecord = await StockRecordModel.findById(stockRecordId)
        if(!stockRecord) {
            return response.status(404).json({
                accepted: false,
                message: 'Stock record ID does not exist',
                field: 'stockRecordId'
            })
        }

        return next()

    } catch(error) {
        console.error(error)
        return response.status(500).json({
            accepted: false,
            message: 'internal server error',
            error: error.message
        })
    }
}

const verifyTableId = async (request, response, next) => {

    try {

        const { tableId } = request.params

        if(!utils.isObjectId(tableId)) {
            return response.status(400).json({
                accepted: false,
                message: 'Invalid table ID format',
                field: 'tableId'
            })
        }

        const table = await TableModel.findById(tableId)
        if(!table) {
            return response.status(404).json({
                accepted: false,
                message: 'Table ID does not exist',
                field: 'tableId'
            })
        }

        return next()

    } catch(error) {
        console.error(error)
        return response.status(500).json({
            accepted: false,
            message: 'internal server error',
            error: error.message
        })
    }
}


module.exports = { 
    verifyUserId,
    verifySpecialityId,
    verifyItemId,
    verifyOrderId,
    verifySupplierId,
    verifyStockRecordId,
    verifyTableId
}