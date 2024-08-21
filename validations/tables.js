const config = require('../config/config')


const addTable = (tableData) => {

    const { tableNumber, seatingCapacity, location } = tableData

    if(!tableNumber) return { isAccepted: false, message: 'Table number is required', field: 'tableNumber' }

    if(typeof tableNumber != 'string') return { isAccepted: false, message: 'Invalid table name format', field: 'tableNumber' }

    if(!seatingCapacity) return { isAccepted: false, message: 'Seating capacity is required', field: 'seatingCapacity' }

    if(typeof seatingCapacity != 'number') return { isAccepted: false, message: 'Invalid seating capacity format', field: 'seatingCapacity' }

    if(location && typeof location != 'string') return { isAccepted: false, message: 'Invalid location format', field: 'location' }


    return { isAccepted: true, message: 'data is valid', data: tableData }
}

const updateTable = (tableData) => {

    const { tableNumber, seatingCapacity, location } = tableData

    if(tableNumber && typeof tableNumber != 'string') return { isAccepted: false, message: 'Invalid table name format', field: 'tableNumber' }

    if(seatingCapacity && typeof seatingCapacity != 'number') return { isAccepted: false, message: 'Invalid seating capacity format', field: 'seatingCapacity' }

    if(location && typeof location != 'string') return { isAccepted: false, message: 'Invalid location format', field: 'location' }


    return { isAccepted: true, message: 'data is valid', data: tableData }
}

const updateTableActivity = (tableData) => {

    const { isActive } = tableData

    if(typeof isActive != 'boolean') return { isAccepted: false, message: 'Invalid isActive format', field: 'isActive' }
    

    return { isAccepted: true, message: 'data is valid', data: tableData }

}


module.exports = { addTable, updateTable, updateTableActivity }