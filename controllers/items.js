const ItemModel = require('../models/ItemModel')
const SpecialityModel = require('../models/SpecialityModel')
const CounterModel = require('../models/CounterModel')
const itemValidation = require('../validations/items')
const utils = require('../utils/utils')
const mongoose = require('mongoose')


const getItems = async (request, response) => {

    try {

        const { searchQuery } = utils.statsQueryGenerator('none', 0, request.query)

        const items = await ItemModel.aggregate([
            {
                $match: searchQuery
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $limit: 20
            },
            {
                $lookup: {
                    from: 'specialities',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            },
        ])

        items.forEach(item => {
            item.category = item.category[0]
        })

        const totalItems = await ItemModel.countDocuments(searchQuery)

        return response.status(200).json({
            accepted: true,
            items,
            totalItems
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

const getAllItems = async (request, response) => {

    try {

        const items = await ItemModel.find()

        return response.status(200).json({
            accepted: true,
            totalItems: items.length,
            items,
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

const getItem = async (request, response) => {

    try {

        const { itemId } = request.params

        const itemList = await ItemModel.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(itemId) }
            },
            {
                $lookup: {
                    from: 'specialities',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            },
        ])

        itemList.forEach(item => {
            item.category = item.category[0]
        })

        const item = itemList[0]

        return response.status(200).json({
            accepted: true,
            item,
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

const getItemByNumericId = async (request, response) => {

    try {

        const { itemId } = request.params

        const items = await ItemModel.aggregate([
            {
                $match: { itemId: Number.parseInt(itemId) }
            },
            {
                $lookup: {
                    from: 'specialities',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            }
        ])

        items.forEach(item => {
            item.category = item.category[0]
        })

        return response.status(200).json({
            accepted: true,
            items
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

const getItemByBarcode = async (request, response) => {

    try {

        const { barcode } = request.params

        const items = await ItemModel.aggregate([
            {
                $match: { barcode }
            },
            {
                $lookup: {
                    from: 'specialities',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            }
        ])

        items.forEach(item => {
            item.category = item.category[0]
        })

        return response.status(200).json({
            accepted: true,
            items
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

const searchItemsByCategory = async (request, response) => {

    try {

        const { specialityId } = request.params
        let { page, limit } = request.query

        page = page ? page : 1
        limit = limit ? limit : 10

        const skip = (page - 1) * limit

        const matchQuery = { 
            categoryId: mongoose.Types.ObjectId(specialityId) 
        }

        /*if(sortBy == 'HIGH-RATING') {
            sortQuery.rating = -1
        } else if(sortBy == 'HIGH-PRICE') {
            sortQuery['pricing.price'] = -1
        } else if(sortBy == 'LOW-PRICE') {
            sortQuery['pricing.price'] = 1
        }*/

        let sortQuery = { createdAt: -1 }

        const items = await ItemModel.aggregate([
            {
                $match: matchQuery
            },
            {
                $sort: sortQuery
            },
            {
                $skip: skip
            },
            {
                $limit: Number.parseInt(limit)
            },
            {
                $lookup: {
                    from: 'specialities',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            }
        ])

        items.forEach(item => {
            item.category = item.category[0]
        })

        let totalItems = await ItemModel.countDocuments(matchQuery)

        return response.status(200).json({
            accepted: true,
            totalItems,
            items
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

const addItem = async (request, response) => {

    try {

        const dataValidation = itemValidation.addItem(request.body)
        if(!dataValidation.isAccepted) {
            return response.status(400).json({
                accepted: dataValidation.isAccepted,
                message: dataValidation.message,
                field: dataValidation.field
            })
        }

        const { categoryId, name, barcode } = request.body

        if(categoryId) {
            const category = await SpecialityModel.findById(categoryId)
            if(!category) {
                return response.status(400).json({
                    accepted: false,
                    message: 'Category ID does not exist',
                    field: 'categoryId'
                })
            }
        }

        const totalNames = await ItemModel.countDocuments({ name })
        if(totalNames != 0) {
            return response.status(400).json({
                accepted: false,
                message: 'اسم الصنف مسجل بالفعل',
                field: 'name'
            })
        }

        if(barcode) {
            const totalBarcodes = await ItemModel.countDocuments({ barcode })
            if(totalBarcodes != 0) {
                return response.status(400).json({
                    accepted: false,
                    message: 'باركود الصنف مسجل بالفعل',
                    field: 'barcode'
                })
            }
        }

        const counter = await CounterModel.findOneAndUpdate(
            { name: 'item' },
            { $inc: { value: 1 } },
            { new: true, upsert: true }
        )

        const itemData = { itemId: counter.value, ...request.body }
        const itemObj = new ItemModel(itemData)
        const newItem = await itemObj.save()

        return response.status(200).json({
            accepted: true,
            message: 'تم اضافة المنتج بنجاح',
            item: newItem,
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

const searchItemsByNameAndCategory = async (request, response) => {

    try {

        let { name, categoryId } = request.query

        name = name ? name : ''

        const searchQuery = {
            name: { $regex: name, $options: 'i' }
        }

        if(categoryId) {
            searchQuery.categoryId = mongoose.Types.ObjectId(categoryId)
        }

        const items = await ItemModel.aggregate([
            {
                $match: searchQuery
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $limit: 20
            },
            {
                $lookup: {
                    from: 'specialities',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            }
        ])

        items.forEach(item => {
            item.category = item.category[0]
        })

        const totalItems = await ItemModel.countDocuments(searchQuery)

        return response.status(200).json({
            accepted: true,
            totalItems,
            items
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

const searchItemsByBarcode = async (request, response) => {

    try {

        let { barcode } = request.query

        barcode = barcode ? barcode : ''

        const items = await ItemModel.aggregate([
            {
                $match: {
                    barcode: { $regex: barcode, $options: 'i' }
                }
            },
            {
                $limit: 20
            },
            {
                $lookup: {
                    from: 'specialities',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            }
        ])

        items.forEach(item => {
            item.category = item.category[0]
        })

        return response.status(200).json({
            accepted: true,
            items
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

const updateItem = async (request, response) => {

    try {

        const dataValidation = itemValidation.updateItem(request.body)
        if(!dataValidation.isAccepted) {
            return response.status(400).json({
                accepted: dataValidation.isAccepted,
                message: dataValidation.message,
                field: dataValidation.field
            })
        }

        const { itemId } = request.params
        const { categoryId, name, barcode } = request.body

        if(categoryId) {
            const category = await SpecialityModel.findById(categoryId)
            if(!category) {
                return response.status(400).json({
                    accepted: false,
                    message: 'Category ID does not exist',
                    field: 'categoryId'
                })
            }
        }

        const item = await ItemModel.findById(itemId)

        if(item.name != name) {
            const totalNames = await ItemModel.countDocuments({ name })
            if(totalNames != 0) {
                return response.status(400).json({
                    accepted: false,
                    message: 'اسم الصنف مسجل بالفعل',
                    field: 'name'
                })
            } 
        }

        if(barcode && item.barcode != barcode) {
            const totalBarcodes = await ItemModel.countDocuments({ barcode })
            if(totalBarcodes != 0) {
                return response.status(400).json({
                    accepted: false,
                    message: 'باركود الصنف مسجل بالفعل',
                    field: 'barcode'
                })
            }
        }

        const updatedItem = await ItemModel
        .findByIdAndUpdate(itemId, request.body, { new: true })

        return response.status(200).json({
            accepted: true,
            message: 'تم تحديث المنتج بنجاح',
            item: updatedItem,
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

const deleteItem = async (request, response) => {

    try {

        const { itemId } = request.params

        const deletedItem = await ItemModel.findByIdAndDelete(itemId)

        return response.status(200).json({
            accepted: true,
            message: 'تم مسح المنتج بنجاح',
            item: deletedItem
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

const updateItemImageURL = async (request, response) => {

    try {

        const dataValidation = itemValidation.updateItemImageURL(request.body)
        if(!dataValidation.isAccepted) {
            return response.status(400).json({
                accepted: dataValidation.isAccepted,
                message: dataValidation.message,
                field: dataValidation.field
            })
        }

        const { itemId } = request.params
        const { imageURL } = request.body

        const updatedItem = await ItemModel
        .findByIdAndUpdate(itemId, { imageURL }, { new: true })

        return response.status(200).json({
            accepted: true,
            message: 'Updated item image successfully!',
            item: updatedItem,
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

const getItemsGrowthStats = async (request, response) => {

    try {

        const { groupBy } = request.query

        let format = '%Y-%m-%d'

        if(groupBy == 'MONTH') {
            format = '%Y-%m'
        } else if(groupBy == 'YEAR') {
            format = '%Y'
        }

        const itemsGrowth = await ItemModel.aggregate([
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
            itemsGrowth
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
    getItems, 
    getAllItems,
    getItem,
    getItemByNumericId,
    getItemByBarcode,
    searchItemsByNameAndCategory,
    searchItemsByBarcode,
    addItem, 
    deleteItem, 
    updateItem, 
    searchItemsByCategory,
    updateItemImageURL,
    getItemsGrowthStats
}