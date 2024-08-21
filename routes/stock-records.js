const router = require('express').Router()
const stockRecordsController = require('../controllers/stock-records')
const { verifyStockRecordId } = require('../middlewares/verify-routes-params')
const authorization = require('../middlewares/verify-permission')


router.get(
    '/v1/stock-records',
    authorization.allPermission,
    (request, response) => stockRecordsController.getStockRecords(request, response)
)

router.post(
    '/v1/stock-records',
    authorization.allPermission,
    (request, response) => stockRecordsController.addStockRecord(request, response)
)

router.delete(
    '/v1/stock-records/:stockRecordId',
    authorization.allPermission,
    verifyStockRecordId,
    (request, response) => stockRecordsController.deleteStockRecord(request, response)
)

router.get(
    '/v1/analytics/stock-records/stats',
    authorization.allPermission,
    (request, response) => stockRecordsController.getStockRecordsStats(request, response)
)

router.patch(
    '/v1/stock-records/:stockRecordId/total-price',
    authorization.allPermission,
    verifyStockRecordId,
    (request, response) => stockRecordsController.updateStockRecordPrice(request, response)
)


module.exports = router