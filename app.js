const express = require('express')
const app = express()
const http = require('http')
const dotenv = require('dotenv').config()
const config = require('./config/config')
const functions = require('firebase-functions')


//const Bree = require('bree')

const morgan = require('morgan')
const db = require('./config/database')
const cors = require('cors')
const { verifyLanguage } = require('./middlewares/language')

const server = http.createServer(app)

app.use(morgan('dev'))
app.use(express.json())
app.use(cors())
app.use(verifyLanguage)

/*const bree = new Bree({ jobs: [{ name: 'mail-report', interval: 'at 11:24pm' }]})
bree.start()*/


app.use('/api', require('./routes/auth'))
app.use('/api', require('./routes/users'))
app.use('/api', require('./routes/specialities'))
app.use('/api', require('./routes/employees'))
app.use('/api', require('./routes/analytics'))
app.use('/api', require('./routes/items'))
app.use('/api', require('./routes/orders'))
app.use('/api', require('./routes/suppliers'))
app.use('/api', require('./routes/stock-records'))
app.use('/api', require('./routes/shifts'))
app.use('/api', require('./routes/tables'))

db()
.then(data => console.log('Mongo is up and running... ;)'))
.catch(error => console.error(error))


app.get('/', (request, response) => {
    return response.status(200).json({
        message: `welcome to RA'AYA`
    })
})


//server.listen(config.PORT, () => console.log(`server started on port ${config.PORT} [RA'AYA APP]`))

exports.app = functions.https.onRequest(app)