const router = require('express').Router()
const ordersController = require('../controllers/orders')
const { verifyOrderId, verifyUserId } = require('../middlewares/verify-routes-params')
const authorization = require('../middlewares/verify-permission')


router.get(
    '/v1/orders',
    authorization.allPermission,
    (request, response) => ordersController.getOrders(request, response)
)

router.get(
    '/v1/orders/:orderId/numeric',
    authorization.allPermission,
    (request, response) => ordersController.getOrderByNumericId(request, response)
)

router.get(
    '/v1/orders/:orderId',
    verifyOrderId,
    (request, response) => ordersController.getOrderById(request, response)
)


router.get(
    '/v1/orders/cashiers/:userId',
    authorization.allPermission,
    verifyUserId,
    (request, response) => ordersController.getOrdersByCashierId(request, response)
)

router.post(
    '/v1/orders',
    authorization.allPermission,
    (request, response) => ordersController.addOrder(request, response)
)

router.delete(
    '/v1/orders/:orderId',
    authorization.allPermission,
    verifyOrderId,
    (request, response) => ordersController.deleteOrder(request, response)
)

router.patch(
    '/v1/orders/:orderId/refunding',
    authorization.allPermission,
    verifyOrderId,
    (request, response) => ordersController.updateOrderRefunding(request, response)
)

router.get(
    '/v1/analytics/orders/growth',
    authorization.allPermission,
    (request, response) => ordersController.getOrdersGrowthStats(request, response)
)

router.get(
    '/v1/analytics/orders/stats',
    authorization.allPermission,
    (request, response) => ordersController.getOrdersStats(request, response)
)

router.get(
    '/v1/analytics/orders/items/quantity/stats',
    authorization.allPermission,
    (request, response) => ordersController.getOrdersItemsQuantityStats(request, response)
)


module.exports = router