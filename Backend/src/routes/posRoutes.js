const express = require('express');
const PosController = require('../controllers/posController');

const router = express.Router();

// POST /api/pos/order - Quick order creation (skip cart)
router.post('/order', PosController.createQuickOrder);

// GET /api/pos/orders/active - Get all active orders (not delivered/cancelled)
router.get('/orders/active', PosController.getActiveOrders);

// PUT /api/pos/orders/:id/close - Mark order as delivered and paid
router.put('/orders/:id/close', PosController.closeOrder);

module.exports = router;
