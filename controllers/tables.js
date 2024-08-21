const TableModel = require('../models/TableModel')
const CounterModel = require('../models/CounterModel')
const tableValidation = require('../validations/tables')
const utils = require('../utils/utils')


const getTables = async (request, response) => {

    try {

        let { page, limit, tableNumber, status, isActive } = request.query

        page = page ? page : 1
        limit = limit ? limit : 25

        const skip = (page - 1) * limit

        const { searchQuery } = utils.statsQueryGenerator('none', 0, request.query)

        const matchQuery = { ...searchQuery }

        if(tableNumber) {
            matchQuery.tableNumber = { $regex: tableNumber, $options: 'i' }
        }

        if(status) {
            matchQuery.status = status
        }

        if(isActive == 'TRUE') {
            matchQuery.isActive = true
        } else if(isActive == 'FALSE') {
            matchQuery.isActive = false
        }

        const tables = await TableModel.aggregate([
            {
                $match: matchQuery
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: Number.parseInt(limit)
            }
        ])

        const totalTables = await TableModel.countDocuments(matchQuery)

        return response.status(200).json({
            accepted: true,
            totalTables,
            tables
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

const addTable = async (request, response) => {

    try {

        const dataValidation = tableValidation.addTable(request.body)
        if(!dataValidation.isAccepted) {
            return response.status(400).json({
                accepted: dataValidation.isAccepted,
                message: dataValidation.message,
                field: dataValidation.field
            })
        }

        const { tableNumber } = request.body

        const totalTableNumber = await TableModel.countDocuments({ tableNumber })
        if(totalTableNumber != 0) {
            return response.status(400).json({
                accepted: false,
                message: 'رقم الطاولة مسجل مسبقا',
                field: 'tableNumber'
            })
        }

        const counter = await CounterModel.findOneAndUpdate(
            { name: 'table' },
            { $inc: { value: 1 } },
            { new: true, upsert: true }
        )

        const tableData = { tableId: counter.value, ...request.body }
        const tableObj = new TableModel(tableData)
        const newTable = await tableObj.save()

        return response.status(200).json({
            accepted: true,
            message: 'تم اضافة الطاولة بنجاح',
            table: newTable
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

const deleteTable = async (request, response) => {

    try {

        const { tableId } = request.params

        const deletedTable = await TableModel.findByIdAndDelete(tableId)

        return response.status(200).json({
            accepted: true,
            message: 'تم مسح الطاولة بنجاح',
            table: deletedTable
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

const updateTable = async (request, response) => {

    try {

        const dataValidation = tableValidation.updateTable(request.body)
        if(!dataValidation.isAccepted) {
            return response.status(400).json({
                accepted: dataValidation.isAccepted,
                message: dataValidation.message,
                field: dataValidation.field
            })
        }

        const { tableId } = request.params

        const table = await TableModel.findById(tableId)

        const { tableNumber } = request.body

        if(tableNumber && table.tableNumber != tableNumber) {
            const totalTableNumbers = await TableModel.countDocuments({ tableNumber })
            if(totalTableNumbers != 0) {
                return response.status(400).json({
                    accepted: false,
                    message: 'رقم الطاولة مسجل مسبقا',
                    field: 'tableNumber'
                })
            }
        }

        const updatedTable = await TableModel
        .findByIdAndUpdate(tableId, request.body, { new: true })

        return response.status(200).json({
            accepted: true,
            message: 'تم تحديث الطاولة بنجاح',
            table: updatedTable
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

const updateTableActivity = async (request, response) => {

    try {

        const dataValidation = tableValidation.updateTableActivity(request.body)
        if(!dataValidation.isAccepted) {
            return response.status(400).json({
                accepted: dataValidation.isAccepted,
                message: dataValidation.message,
                field: dataValidation.field
            })
        }

        const { tableId } = request.params
        const { isActive } = request.body

        const updatedTable = await TableModel
        .findByIdAndUpdate(tableId, { isActive }, { new: true })

        return response.status(200).json({
            accepted: true,
            message: 'تم تحديث فعالية الطاولة بنجاح',
            table: updatedTable
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


module.exports = { getTables, addTable, deleteTable, updateTable, updateTableActivity }