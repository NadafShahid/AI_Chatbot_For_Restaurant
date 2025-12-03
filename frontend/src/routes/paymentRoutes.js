const express = require('express');
const PaymentController = require('../controllers/paymentController');

const router = express.Router();

// Routes
router.post('/', PaymentController.createPayment);
router.get('/', PaymentController.getAllPayments);
router.get('/order/:orderId', PaymentController.getPaymentsByOrder);
router.put('/:id/status', PaymentController.updatePaymentStatus);

module.exports = router;
