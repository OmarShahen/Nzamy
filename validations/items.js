const utils = require('../utils/utils')


const addItem = (itemData) => {

    const { categoryId, name, description, price, barcode, isTrackInventory } = itemData

    if(categoryId && !utils.isObjectId(categoryId)) return { isAccepted: false, message: 'Category Id format is invalid', field: 'categoryId' }

    if(!name) return { isAccepted: false, message: 'Name is required', field: 'name' }

    if(typeof name != 'string') return { isAccepted: false, message: 'Name format is invalid', field: 'name' }

    if(description && typeof description != 'string') return { isAccepted: false, message: 'Description format is invalid', field: 'description' }

    if(price && typeof price != 'number') return { isAccepted: false, message: 'Price format is invalid', field: 'price' }

    if(barcode && typeof barcode != 'string') return { isAccepted: false, message: 'Barcode format is invalid', field: 'barcode' }

    if(typeof isTrackInventory != 'boolean') return { isAccepted: false, message: 'isTrackInventory format is invalid', field: 'isTrackInventory' }

    return { isAccepted: true, message: 'data is valid', data: itemData }
}

const updateItem = (itemData) => {

    const { categoryId, name, description, price, barcode, isTrackInventory } = itemData

    if(categoryId && !utils.isObjectId(categoryId)) return { isAccepted: false, message: 'Category Id format is invalid', field: 'categoryId' }

    if(!name) return { isAccepted: false, message: 'Name is required', field: 'name' }

    if(typeof name != 'string') return { isAccepted: false, message: 'Name format is invalid', field: 'name' }

    if(description && typeof description != 'string') return { isAccepted: false, message: 'Description format is invalid', field: 'description' }

    if(price && typeof price != 'number') return { isAccepted: false, message: 'Price format is invalid', field: 'price' }

    if(barcode && typeof barcode != 'string') return { isAccepted: false, message: 'Barcode format is invalid', field: 'barcode' }

    if(typeof isTrackInventory != 'boolean') return { isAccepted: false, message: 'isTrackInventory format is invalid', field: 'isTrackInventory' }


    return { isAccepted: true, message: 'data is valid', data: itemData }
}

const updateItemImageURL = (itemData) => {

    const { imageURL } = itemData

    if(!imageURL) return { isAccepted: false, message: 'Image URL is required', field: 'imageURL' }

    if(!utils.isValidURL(imageURL)) return { isAccepted: false, message: 'Image URL format is invalid', field: 'imageURL' }

    return { isAccepted: true, message: 'data is valid', data: itemData }
}

const addItemImages = (itemData) => {

    const { images } = itemData

    if(!images) return { isAccepted: false, message: 'Images is required', field: 'images' }

    if(!Array.isArray(images)) return { isAccepted: false, message: 'Images format is invalid', field: 'images' }

    for(let i=0;i<images.length;i++) {
        const imageURL = images[i]

        if(typeof imageURL != 'string') return { isAccepted: false, message: 'Image URL format is invalid', field: 'images' } 

        if(!utils.isValidURL(imageURL)) return { isAccepted: false, message: 'Image URL format is invalid', field: 'images' } 
    }

    return { isAccepted: true, message: 'data is valid', data: itemData }
}

const removeItemImage = (itemData) => {

    const { imageURL } = itemData

    if(!imageURL) return { isAccepted: false, message: 'Image URL is required', field: 'imageURL' }

    if(!utils.isValidURL(imageURL)) return { isAccepted: false, message: 'Image URL format is invalid', field: 'imageURL' }


    return { isAccepted: true, message: 'data is valid', data: itemData }
}


module.exports = { addItem, updateItem, updateItemImageURL, addItemImages, removeItemImage }