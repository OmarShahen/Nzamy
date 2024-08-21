const config = require('../config/config')
const utils = require('../utils/utils')


const addStockRecord = (stockRecordData) => {

    const { itemId, userId, type, effect, quantity, totalPrice } = stockRecordData

    if(!itemId) return { isAccepted: false, message: 'Item ID is required', field: 'itemId' }

    if(!utils.isObjectId(itemId)) return { isAccepted: false, message: 'Invalid item ID format', field: 'itemId' }

    if(!userId) return { isAccepted: false, message: 'User ID is required', field: 'userId' }

    if(!utils.isObjectId(userId)) return { isAccepted: false, message: 'Invalid user ID format', field: 'userId' }

    if(!type) return { isAccepted: false, message: 'Type ID is required', field: 'type' }

    if(!effect) return { isAccepted: false, message: 'Effect is required', field: 'effect' }

    if(!['WIN', 'LOSS'].includes(effect)) return { isAccepted: false, message: 'Invalid effect value', field: 'effect' }

    if(!config.TRANSACTION_TYPE.includes(type)) return { isAccepted: false, message: 'Invalid type value', field: 'type' }

    if(typeof quantity != 'number') return { isAccepted: false, message: 'Invalid quantity format', field: 'quantity' }

    if(typeof totalPrice != 'number') return { isAccepted: false, message: 'Invalid total price format', field: 'totalPrice' }


    return { isAccepted: true, message: 'data is valid', data: stockRecordData }
}

const updateStockRecordPrice = (stockRecordData) => {

    const { totalPrice } = stockRecordData

    if(typeof totalPrice != 'number') return { isAccepted: false, message: 'Invalid total price format', field: 'totalPrice' }

    return { isAccepted: true, message: 'data is valid', data: stockRecordData }
}

module.exports = { addStockRecord, updateStockRecordPrice }