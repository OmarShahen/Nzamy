const StockRecordModel = require('../models/StockRecordModel')
const ItemModel = require('../models/ItemModel')
const UserModel = require('../models/UserModel')
const CounterModel = require('../models/CounterModel')
const stockRecordValidation = require('../validations/stock-records')
const utils = require('../utils/utils')
const mongoose = require('mongoose')


const getInventoryTotalValue = (items) => {

    let totalValue = 0

    for(let i=0;i<items.length;i++) {
        const item = items[i]
        totalValue += item.stock * item.price
    }

    return totalValue
}

const getStockRecords = async (request, response) => {

    try {

        const { type, userId, itemId } = request.query

        const { searchQuery } = utils.statsQueryGenerator('none', 0, request.query)
        
        if(type) {
            searchQuery.type = type
        }

        if(userId) {
            searchQuery.userId = mongoose.Types.ObjectId(userId)
        }

        if(itemId) {
            searchQuery.itemId = mongoose.Types.ObjectId(itemId)
        }

        const stockRecords = await StockRecordModel.aggregate([
            {
                $match: searchQuery
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $limit: 25
            },
            {
                $lookup: {
                    from: 'items',
                    localField: 'itemId',
                    foreignField: '_id',
                    as: 'item'
                }   
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }   
            },
            {
                $project: { 'user.password': 0 }
            }
        ])

        stockRecords.forEach(stockRecord => {
            stockRecord.item = stockRecord.item[0]
            stockRecord.user = stockRecord.user[0]
        })

        const totalStockRecords = await StockRecordModel.countDocuments(searchQuery)

        return response.status(200).json({
            accepted: true,
            totalStockRecords,
            stockRecords
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

const addStockRecord = async (request, response) => {

    try {

        const dataValidation = stockRecordValidation.addStockRecord(request.body)
        if(!dataValidation.isAccepted) {
            return response.status(400).json({
                accepted: dataValidation.isAccepted,
                message: dataValidation.message,
                field: dataValidation.field
            })
        }

        const { itemId, userId, type, effect, quantity, totalPrice } = request.body

        const item = await ItemModel.findById(itemId)
        if(!item) {
            return response.status(400).json({
                accepted: false,
                message: 'Item ID is not registered',
                field: 'itemId'
            })
        }

        const user = await UserModel.findById(userId)
        if(!user) {
            return response.status(400).json({
                accepted: false,
                message: 'User ID is not registered',
                field: 'userId'
            })
        }

        const quantityChange = effect == 'LOSS' ? quantity : -quantity

        const newItemStock = item.stock + quantityChange

        if(newItemStock < 0) {
            return response.status(400).json({
                accepted: false,
                message: 'لا يوجد كمية كافية من المنتج',
                field: 'stock'
            })
        }

        const counter = await CounterModel.findOneAndUpdate(
            { name: 'stockRecord' },
            { $inc: { value: 1 } },
            { new: true, upsert: true }
        )

        const stockRecordData = {
            stockRecordId: counter.value,
            itemId,
            userId,
            type,
            effect,
            quantity: quantityChange,
            totalPrice
        }

        const stockRecordObj = new StockRecordModel(stockRecordData)
        const newStockRecord = await stockRecordObj.save()

        const updatedItem = await ItemModel
        .findByIdAndUpdate(itemId, { $inc: { stock: quantityChange } }, { new: true })

        return response.status(200).json({
            accepted: true,
            message: 'تم تسجيل معاملة المخزن بنجاح',
            stockRecord: newStockRecord,
            item: updatedItem
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

const deleteStockRecord = async (request, response) => {

    try {

        const { stockRecordId } = request.params

        const deletedStockRecord = await StockRecordModel.findByIdAndDelete(stockRecordId)

        return response.status(200).json({
            accepted: true,
            message: 'تم مسح معاملة المخزن بنجاح',
            stockRecord: deletedStockRecord
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

const getStockRecordsStats = async (request, response) => {

    try {

        const { searchQuery } = utils.statsQueryGenerator('none', 0, request.query)

        const totalStockRecords = await StockRecordModel.countDocuments(searchQuery)

        const totalRevenueRecords = await StockRecordModel.countDocuments({ ...searchQuery, effect: 'WIN' })

        const totalExpensesRecords = await StockRecordModel.countDocuments({ ...searchQuery, effect: 'LOSS' })

        const totalRevenueList = await StockRecordModel.aggregate([
            {
                $match: { ...searchQuery, effect: 'WIN' }
            },
            {
                $group: {
                    _id: null,
                    totalPaid: { $sum: '$totalPrice' }
                }
            }
        ])

        const totalExpensesList = await StockRecordModel.aggregate([
            {
                $match: { ...searchQuery, effect: 'LOSS' }
            },
            {
                $group: {
                    _id: null,
                    totalPaid: { $sum: '$totalPrice' }
                }
            }
        ])

        const itemsList = await ItemModel.find()
        const totalInventoryValue = getInventoryTotalValue(itemsList)

        const totalRevenue = totalRevenueList.length > 0 ? totalRevenueList[0].totalPaid : 0

        const totalExpenses = totalExpensesList.length > 0 ? totalExpensesList[0].totalPaid : 0

        const netProfit = totalRevenue - totalExpenses

        return response.status(200).json({
            accepted: true,
            totalStockRecords,
            totalRevenueRecords,
            totalExpensesRecords,
            totalRevenue,
            totalExpenses,
            netProfit,
            totalInventoryValue
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

const updateStockRecordPrice = async (request, response) => {

    try {

        const dataValidation = stockRecordValidation.updateStockRecordPrice(request.body)
        if(!dataValidation.isAccepted) {
            return response.status(400).json({
                accepted: dataValidation.isAccepted,
                message: dataValidation.message,
                field: dataValidation.field
            })
        }

        const { stockRecordId } = request.params
        const { totalPrice } = request.body

        const updatedStockRecord = await StockRecordModel
        .findByIdAndUpdate(stockRecordId, { totalPrice }, { new: true })

        return response.status(200).json({
            accepted: true,
            message: 'تم تعديل سعر معاملة المخزن بنجاح',
            stockRecord: updatedStockRecord
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

module.exports = { getStockRecords, addStockRecord, deleteStockRecord, getStockRecordsStats, updateStockRecordPrice }