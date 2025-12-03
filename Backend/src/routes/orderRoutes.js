const express = require('express');
const OrderController = require('../controllers/orderController');

const router = express.Router();

// Routes
router.post('/', OrderController.createOrder);
router.get('/', OrderController.getAllOrders);
router.get('/:id', OrderController.getOrderById);
router.put('/:id/status', OrderController.updateOrderStatus);
router.delete('/:id', OrderController.cancelOrder);

module.exports = router;
