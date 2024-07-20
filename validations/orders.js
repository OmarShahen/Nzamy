const utils = require('../utils/utils')
const config = require('../config/config')

const addOrder = (orderData) => {

    const { cashierId, paymentMethod, isPaid, items } = orderData

    if(!cashierId) return { isAccepted: false, message: 'Cashier ID is required', field: 'cashierId' }

    if(!utils.isObjectId(cashierId)) return { isAccepted: false, message: 'Cashier ID format is invalid', field: 'cashierId' }

    if(!paymentMethod) return { isAccepted: false, message: 'Payment method is required', field: 'paymentMethod' }

    if(!config.PAYMENT_METHODS.includes(paymentMethod)) return { isAccepted: false, message: 'Payment method value is not registered', field: 'paymentMethod' }

    if(typeof isPaid != 'boolean') return { isAccepted: false, message: 'Is paid format is invalid', field: 'isPaid' }

    if(!items) return { isAccepted: false, message: 'Items is required', field: 'items' }

    if(!Array.isArray(items)) return { isAccepted: false, message: 'Items must be a list', field: 'items' }

    if(items.length == 0) return { isAccepted: false, message: 'Items must not be empty', field: 'items' }

    for(let i=0;i<items.length;i++) {
        const item = items[i]

        if(!item.numericId) return { isAccepted: false, message: 'item numeric ID is required', field: 'items' }

        if(typeof item.numericId != 'number') return { isAccepted: false, message: 'item numeric ID format is invalid', field: 'items' }

        if(!item.name) return { isAccepted: false, message: 'item name is required', field: 'items' }

        if(typeof item.name != 'string') return { isAccepted: false, message: 'item name format is invalid', field: 'items' }

        if(typeof item.quantity != 'number') return { isAccepted: false, message: 'item quantity format is invalid', field: 'items' }

        if(typeof item.price != 'number') return { isAccepted: false, message: 'item price format is invalid', field: 'items' }

        if(!item.itemId) return { isAccepted: false, message: 'item id is required', field: 'items' }

        if(!utils.isObjectId(item.itemId)) return { isAccepted: false, message: 'item id format is invalid', field: 'items' }
    }

    return { isAccepted: true, message: 'data is valid', data: orderData }
} 



const updateOrderRefunding = (orderData) => {

    const { isRefunded, refunderId } = orderData

    if(typeof isRefunded != 'boolean') return { isAccepted: false, message: 'isRefunded format is invalid', field: 'isRefunded' }

    if(isRefunded) {

        if(!refunderId) return { isAccepted: false, message: 'Refunder ID is required', field: 'refunderId' }

        if(!utils.isObjectId(refunderId)) return { isAccepted: false, message: 'Refunder ID format is invalid', field: 'refunderId' }
    
    }

    return { isAccepted: true, message: 'data is valid', data: orderData }
} 


module.exports = { addOrder, updateOrderRefunding }