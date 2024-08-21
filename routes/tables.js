const router = require('express').Router()
const tablesController = require('../controllers/tables')
const { verifyTableId } = require('../middlewares/verify-routes-params')
const authorization = require('../middlewares/verify-permission')


router.get(
    '/v1/tables',
    authorization.allPermission,
    (request, response) => tablesController.getTables(request, response)
)

router.post(
    '/v1/tables',
    authorization.allPermission,
    (request, response) => tablesController.addTable(request, response)
)

router.put(
    '/v1/tables/:tableId',
    authorization.allPermission,
    verifyTableId,
    (request, response) => tablesController.updateTable(request, response)
)

router.patch(
    '/v1/tables/:tableId/activity',
    authorization.allPermission,
    verifyTableId,
    (request, response) => tablesController.updateTableActivity(request, response)
)

router.delete(
    '/v1/tables/:tableId',
    authorization.allPermission,
    verifyTableId,
    (request, response) => tablesController.deleteTable(request, response)
)

module.exports = router