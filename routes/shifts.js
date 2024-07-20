const router = require('express').Router()
const shiftsController = require('../controllers/shifts')
const { verifySpecialityId } = require('../middlewares/verify-routes-params')
const authorization = require('../middlewares/verify-permission')


router.get(
    '/v1/shifts',
    authorization.allPermission,
    (request, response) => shiftsController.getShifts(request, response)
)


module.exports = router