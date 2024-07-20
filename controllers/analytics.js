const OrderModel = require('../models/OrderModel')
const StockRecordModel = require('../models/StockRecordModel')
const ItemModel = require('../models/ItemModel')
const utils = require('../utils/utils')

const getInventoryTotalValue = (items) => {

    let totalValue = 0

    for(let i=0;i<items.length;i++) {
        const item = items[i]
        totalValue += item.stock * item.price
    }

    return totalValue
}

const getOverviewAnalytics = async (request, response) => {

    try {

        const { searchQuery } = utils.statsQueryGenerator('none', 0, request.query)

        const totalOrders = await OrderModel
        .countDocuments({ ...searchQuery, isPaid: true, isRefunded: false })

        const totalPriceList = await OrderModel.aggregate([
            {
                $match: { ...searchQuery, isPaid: true, isRefunded: false }
            },
            {
                $group: {
                    _id: null,
                    totalPaid: { $sum: '$totalPrice' }
                }
            }
        ])

        const totalQuantityList = await OrderModel.aggregate([
            {
                $match: { ...searchQuery, isPaid: true, isRefunded: false }
            },
            {
                $unwind: '$items'
            },
            {
                $group: {
                    _id: null,
                    totalQuantity: { $sum: '$items.quantity' }
                }
            }
        ])

        const totalPaid = totalPriceList.length == 0 ? 0 : totalPriceList[0].totalPaid
        const totalQuantity = totalQuantityList.length > 0 ? totalQuantityList[0].totalQuantity : 0

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
            totalQuantity,
            totalOrders,
            totalPaid,
            totalStockRecords,
            totalRevenueRecords,
            totalExpensesRecords,
            totalInventoryValue,
            totalRevenue,
            totalExpenses,
            netProfit
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

module.exports = { 
    getOverviewAnalytics, 
}