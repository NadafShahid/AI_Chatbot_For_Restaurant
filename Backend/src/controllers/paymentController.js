const PaymentModel = require('../models/paymentModel');
const OrderModel = require('../models/orderModel');
const { success, error } = require('../utils/response');
const { validateRequiredFields } = require('../middleware/validation');

class PaymentController {
  // Record payment
  static async createPayment(req, res, next) {
    try {
      const { order_id: orderId, amount, method, transaction_id, status } = req.body || {};

      const { valid, missing } = validateRequiredFields(req.body, [
        'order_id',
        'amount',
        'method'
      ]);

      if (!valid) {
        return res
          .status(400)
          .json(
            error(
              `Missing required fields: ${missing.join(', ')}`,
              'VALIDATION_ERROR'
            )
          );
      }

      // Check if order exists
      const order = await OrderModel.getById(orderId);
      if (!order) {
        return res
          .status(404)
          .json(error('Order not found', 'NOT_FOUND'));
      }

      // Validate amount (should match order total)
      if (parseFloat(amount) !== parseFloat(order.total_amount)) {
        return res
          .status(400)
          .json(
            error(
              'Payment amount must match order total',
              'VALIDATION_ERROR'
            )
          );
      }

      // Check if payment already exists for this order
      const existingPayments = await PaymentModel.getByOrderId(orderId);
      let payment;

      if (existingPayments.length > 0) {
        // Update existing payment
        const existingPayment = existingPayments[0];
        await PaymentModel.updateStatus(existingPayment.id, status || 'completed');

        // Get updated payment
        payment = await PaymentModel.getById(existingPayment.id);
      } else {
        // Create new payment
        payment = await PaymentModel.create(orderId, amount, method, transaction_id, status || 'pending');
      }

      return res
        .status(201)
        .json(success('Payment recorded successfully', payment));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error creating payment:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Get all payments
  static async getAllPayments(req, res, next) {
    try {
      const payments = await PaymentModel.getAll();

      return res
        .status(200)
        .json(success('Payments retrieved successfully', payments));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error getting payments:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Get payments for specific order
  static async getPaymentsByOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const orderIdInt = parseInt(orderId, 10);

      // Check if order exists
      const order = await OrderModel.getById(orderIdInt);
      if (!order) {
        return res
          .status(404)
          .json(error('Order not found', 'NOT_FOUND'));
      }

      const payments = await PaymentModel.getByOrderId(orderIdInt);

      return res
        .status(200)
        .json(success('Payments retrieved successfully', payments));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error getting payments:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Update payment status
  static async updatePaymentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const paymentId = parseInt(id, 10);

      const { valid } = validateRequiredFields(req.body, ['status']);
      if (!valid) {
        return res
          .status(400)
          .json(error('status is required', 'VALIDATION_ERROR'));
      }

      const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
      if (!validStatuses.includes(status)) {
        return res
          .status(400)
          .json(
            error(
              'Invalid status. Valid statuses: pending, completed, failed, refunded',
              'VALIDATION_ERROR'
            )
          );
      }

      // Check if payment exists
      const payment = await PaymentModel.getById(paymentId);
      if (!payment) {
        return res
          .status(404)
          .json(error('Payment not found', 'NOT_FOUND'));
      }

      // Update status
      await PaymentModel.updateStatus(paymentId, status);

      // Get updated payment
      const updatedPayment = await PaymentModel.getById(paymentId);

      return res
        .status(200)
        .json(success('Payment status updated successfully', updatedPayment));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error updating payment status:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }
}

module.exports = PaymentController;
