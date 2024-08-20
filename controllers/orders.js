const OrderModel = require('../models/OrderModel')
const UserModel = require('../models/UserModel')
const ItemModel = require('../models/ItemModel')
const OrderItemModel = require('../models/OrderItemModel')
const CounterModel = require('../models/CounterModel')
const orderValidation = require('../validations/orders')
const utils = require('../utils/utils')
const mongoose = require('mongoose')
const StockRecordModel = require('../models/StockRecordModel')
const config = require('../config/config')


const calculateTotalPriceOfItems = (items) => {

    let totalPrice = 0

    for(let i=0;i<items.length;i++) {
        const item = items[i]
        totalPrice += item.price * item.quantity
    }

    return totalPrice
}

const isItemsStockAvailable = (orderItems, items) => {

    for(let i=0;i<orderItems.length;i++) {
        const orderItem = orderItems[i]
        for(let j=0;j<items.length;j++) {
            const item = items[j]
            if(orderItem.itemId == item._id) {
                const newStock = item.stock - orderItem.quantity
                if(newStock < 0) {
                    return { isAccepted: false, message: `لا يوجد كمية كافية من ${item.name}` }
                }
            }
        }
    }

    return { isAccepted: true }
}

const createStockRecords = async (items, cashierId) => {

    const stockRecords = []

    for(let i=0;i<items.length;i++) {
        const item = items[i]

        const counter = await CounterModel.findOneAndUpdate(
            { name: 'stockRecord' },
            { $inc: { value: 1 } },
            { new: true, upsert: true }
        )

        const stockRecordData = {
            stockRecordId: counter.value,
            itemId: item.itemId,
            userId: cashierId,
            type: 'SALE',
            effect: 'WIN',
            quantity: -item.quantity,
            totalPrice: item.price * item.quantity
        }

        stockRecords.push(stockRecordData)

    }

    return stockRecords
}

const generateStockRecords = async (items, options) => {

    const { cashierId, effect, type } = options

    const stockRecords = []

    for(let i=0;i<items.length;i++) {
        const item = items[i]

        const counter = await CounterModel.findOneAndUpdate(
            { name: 'stockRecord' },
            { $inc: { value: 1 } },
            { new: true, upsert: true }
        )

        const stockRecordData = {
            stockRecordId: counter.value,
            itemId: item.itemId,
            userId: cashierId,
            type,
            effect,
            quantity: effect == 'WIN' ? -item.quantity : item.quantity,
            totalPrice: item.price * item.quantity
        }

        stockRecords.push(stockRecordData)

    }

    return stockRecords
}

const updateItemsWithNewStock = async (items, effect='WIN') => {

    for(let i=0;i<items.length;i++) {
        const item = items[i]
        const newStock = effect == 'WIN' ? -item.quantity : item.quantity
        await ItemModel.findByIdAndUpdate(item.itemId, { $inc: { stock: newStock } }, { new: true })
    }
}

const getOrders = async (request, response) => {

    try {

        const { cashierId, itemId, isRefunded } = request.query

        const { searchQuery } = utils.statsQueryGenerator('none', 0, request.query)

        if(cashierId) {
            searchQuery.cashierId = mongoose.Types.ObjectId(cashierId)
        }

        if(itemId) {
            searchQuery['items.itemId'] = itemId
        }

        if(isRefunded == 'TRUE') {
            searchQuery.isRefunded = true
        } else if(isRefunded == 'FALSE') {
            searchQuery.isRefunded = false
            searchQuery.isPaid = true
        }

        const orders = await OrderModel.aggregate([
            {
                $match: searchQuery
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $limit: 25
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'cashierId',
                    foreignField: '_id',
                    as: 'cashier'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'refunderId',
                    foreignField: '_id',
                    as: 'refunder'
                }
            },
            {
                $project: {
                    'cashier.password': 0,
                    'refunder.password': 0
                }
            }
        ])

        orders.forEach(order => {
            order.cashier = order.cashier[0]
            order.refunder = order.refunder[0]
        })

        const totalOrders = await OrderModel.countDocuments(searchQuery)

        return response.status(200).json({
            accepted: true,
            totalOrders,
            orders
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

const getOrderByNumericId = async (request, response) => {

    try {

        const { orderId } = request.params

        const orders = await OrderModel.aggregate([
            {
                $match: { orderId: Number.parseInt(orderId) }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'cashierId',
                    foreignField: '_id',
                    as: 'cashier'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'refunderId',
                    foreignField: '_id',
                    as: 'refunder'
                }
            },
            {
                $project: {
                    'cashier.password': 0,
                    'refunder.password': 0
                }
            }
        ])

        orders.forEach(order => {
            order.cashier = order.cashier[0]
            order.refunder = order.refunder[0]
        })

        return response.status(200).json({
            accepted: true,
            orders
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

const getOrderById = async (request, response) => {

    try {

        const { orderId } = request.params

        const orders = await OrderModel.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(orderId) }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'cashierId',
                    foreignField: '_id',
                    as: 'cashier'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'refunderId',
                    foreignField: '_id',
                    as: 'refunder'
                }
            },
            {
                $project: {
                    'cashier.password': 0,
                    'refunder.password': 0
                }
            }
        ])

        orders.forEach(order => {
            order.cashier = order.cashier[0]
            order.refunder = order.refunder[0]
        })

        return response.status(200).json({
            accepted: true,
            orders
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

const getOrdersByCashierId = async (request, response) => {

    try {

        const { userId } = request.params
        const { searchQuery } = utils.statsQueryGenerator('cashierId', userId, request.query)

        const orders = await OrderModel.aggregate([
            {
                $match: searchQuery
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $limit: 25
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'cashierId',
                    foreignField: '_id',
                    as: 'cashier'
                }
            },
            {
                $project: {
                    'cashier.password': 0
                }
            }
        ])

        orders.forEach(order => order.cashier = order.cashier[0])

        return response.status(200).json({
            accepted: true,
            orders
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

const addOrder = async (request, response) => {

    try {

        const dataValidation = orderValidation.addOrder(request.body)
        if(!dataValidation.isAccepted) {
            return response.status(400).json({
                accepted: dataValidation.isAccepted,
                message: dataValidation.message,
                field: dataValidation.field
            })
        }

        const { cashierId, paymentMethod, isPaid, items } = request.body

        let itemsIdsList = items.map(item => item.itemId)
        const itemsIdsSet = new Set(itemsIdsList)
        const uniqueItemsIdsList = [...itemsIdsSet]

        if(uniqueItemsIdsList.length != itemsIdsList.length) {
            return response.status(400).json({
                accepted: false,
                message: 'There is duplicate items in items',
                field: 'items'
            })
        }

        const cashier = await UserModel.findById(cashierId)
        if(!cashier) {
            return response.status(400).json({
                accepted: false,
                message: 'Cashier ID is not registered',
                field: 'cashierId'
            })
        }

        const itemsList = await ItemModel.find({ _id: { $in: itemsIdsList } })

        if(itemsList.length != itemsIdsList.length) {
            return response.status(400).json({
                accepted: false,
                message: 'Item IDs is not registered',
                field: 'items'
            })
        }

        const itemStockValidation = isItemsStockAvailable(items, itemsList)
        if(!itemStockValidation.isAccepted) {
            return response.status(400).json({
                accepted: itemStockValidation.isAccepted,
                message: itemStockValidation.message,
                field: 'items'
            })
        }

        const TOTAL_PRICE = calculateTotalPriceOfItems(items)

        const counter = await CounterModel.findOneAndUpdate(
            { name: 'order' },
            { $inc: { value: 1 } },
            { new: true, upsert: true }
        )

        const orderData = {
            orderId: counter.value,
            cashierId,
            isPaid,
            paymentMethod,
            totalPrice: TOTAL_PRICE,
            items
        }

        const orderObj = new OrderModel(orderData)
        const newOrder = await orderObj.save()

        const stockRecords = await createStockRecords(items, cashierId)
        const newStockRecords = await StockRecordModel.insertMany(stockRecords)

        await updateItemsWithNewStock(items)

        return response.status(200).json({
            accepted: true,
            message: 'تم اضافة الطلب بنجاح',
            order: newOrder,
            stockRecords: newStockRecords
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

const deleteOrder = async (request, response) => {

    try {

        const { orderId } = request.params

        const deletedOrder = await OrderModel.findByIdAndDelete(orderId)

        const deletedOrderItems = await OrderItemModel.deleteMany({ orderId })

        return response.status(200).json({
            accepted: true,
            message: 'تم مسح الطلب بنجاح',
            order: deletedOrder,
            orderItems: deletedOrderItems
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


const updateOrderRefunding = async (request, response) => {

    try {

        const { orderId } = request.params
        const { isRefunded, refunderId } = request.body

        const dataValidation = orderValidation.updateOrderRefunding(request.body)
        if(!dataValidation.isAccepted) {
            return response.status(400).json({
                accepted: dataValidation.isAccepted,
                message: dataValidation.message,
                field: dataValidation.field
            })
        }

        const order = await OrderModel.findById(orderId)

        if(isRefunded && !order.isPaid) {
            return response.status(400).json({
                accepted: false,
                message: 'الطلب غير مدفوع ليتم الارتجاع',
                field: 'isRefunded'
            })
        }

        if(order.isRefunded) {
            return response.status(400).json({
                accepted: false,
                message: 'الطلب مرتجع لا يمكن التعديل',
                field: 'isRefunded'
            })
        }

        if(isRefunded) {
            const refunder = await UserModel.findById(refunderId)
            if(!refunder) {
                return response.status(400).json({
                    accepted: false,
                    message: 'Refunder ID is not registered',
                    field: 'refunderId'
                })
            }
        }

        const updateOrderData = { isRefunded }

        if(isRefunded) {
            updateOrderData.refunderId = refunderId
            updateOrderData.refundDate = new Date()
        }

        const updatedOrder = await OrderModel
        .findByIdAndUpdate(orderId, updateOrderData, { new: true })

        const stockRecordsOptions = { cashierId: refunderId, effect: 'LOSS', type: 'RETURN' }
        const stockRecords = await generateStockRecords(order.items, stockRecordsOptions)
        const newStockRecords = await StockRecordModel.insertMany(stockRecords)

        await updateItemsWithNewStock(order.items, 'LOSS')

        return response.status(200).json({
            accepted: true,
            message: 'تم تحديث حالة المرتجع بنجاح!',
            order: updatedOrder,
            stockRecords: newStockRecords
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


const getOrdersGrowthStats = async (request, response) => {

    try {

        const { groupBy } = request.query

        let format = '%Y-%m-%d'

        if(groupBy == 'MONTH') {
            format = '%Y-%m'
        } else if(groupBy == 'YEAR') {
            format = '%Y'
        }

        const ordersGrowth = await OrderModel.aggregate([
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: format,
                    date: '$createdAt',
                  },
                },
                count: { $sum: 1 },
              },
            },
            {
              $sort: {
                '_id': 1,
              },
            },
        ])

        return response.status(200).json({
            accepted: true,
            ordersGrowth
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


const getOrdersStats = async (request, response) => {

    try {

        const { cashierId } = request.query

        const { searchQuery } = cashierId ? 
        utils.statsQueryGenerator('cashierId', cashierId, request.query) 
        : 
        utils.statsQueryGenerator('none', 0, request.query)

        const totalPaidOrders = await OrderModel.countDocuments({ ...searchQuery, isPaid: true, isRefunded: false })

        const totalRefundedOrders = await OrderModel.countDocuments({ ...searchQuery, isPaid: true, isRefunded: true })

        const totalPaidList = await OrderModel.aggregate([
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

        const totalPaid = totalPaidList.length > 0 ? totalPaidList[0].totalPaid : 0
        const totalQuantity = totalQuantityList.length > 0 ? totalQuantityList[0].totalQuantity : 0

        return response.status(200).json({
            accepted: true,
            totalPaidOrders,
            totalRefundedOrders,
            totalPaid,
            totalQuantity
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

const getOrdersItemsQuantityStats = async (request, response) => {

    try {

        const { searchQuery } = utils.statsQueryGenerator('none', 0, request.query)

        const totalQuantityList = await OrderModel.aggregate([
            {
                $match: { ...searchQuery, isPaid: true, isRefunded: false }
            },
            {
                $unwind: '$items'
            },
            {
                $group: {
                    _id: '$items.itemId',
                    count: { $sum: '$items.quantity' }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $addFields: {
                    _id: { $toObjectId: '$_id' }, // Convert _id to ObjectId
                },
            },
            {
                $lookup: {
                    from: 'items',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'item'
                }
            },
            {
                $unwind: '$item'
            }
        ])

        return response.status(200).json({
            accepted: true,
            totalQuantityList
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
    getOrders, 
    getOrderByNumericId,
    getOrdersByCashierId,
    addOrder, 
    deleteOrder, 
    updateOrderRefunding,
    getOrdersGrowthStats,
    getOrdersStats,
    getOrdersItemsQuantityStats,
    getOrderById
}