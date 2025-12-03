const OrderModel = require('../models/orderModel');
const UserModel = require('../models/userModel');
const CartModel = require('../models/cartModel');
const { success, error } = require('../utils/response');
const { validateRequiredFields } = require('../middleware/validation');

class OrderController {
  // Create order from cart
  // Create order from cart
static async createOrder(req, res, next) {
  try {
    const { user_id: userId, payment_method: paymentMethod, table_id: tableId } = req.body || {};

    const { valid, missing } = validateRequiredFields(req.body, [
      'user_id',
      'payment_method',
      'table_id'
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

    // Check if user exists
    const user = await UserModel.getById(userId);
    if (!user) {
      return res
        .status(404)
        .json(error('User not found', 'NOT_FOUND'));
    }

    // Check if cart has items
    const cart = await CartModel.getCartWithItems(userId);
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json(error('Cart is empty', 'VALIDATION_ERROR'));
    }

    // Create order from cart with table_id
    const orderId = await OrderModel.createFromCart(userId, paymentMethod, tableId);

    // Get created order details
    const order = await OrderModel.getById(orderId);

    return res
      .status(201)
      .json(success('Order created successfully', order));
  } catch (err) {
    console.error('Error creating order:', err);
    err.status = err.status || 500;
    err.code = err.code || 'INTERNAL_ERROR';
    return next(err);
  }
  }

  // Get all orders with optional filters
  static async getAllOrders(req, res, next) {
    try {
      const { status, user_id: userId } = req.query;
      const filters = {};

      if (status) filters.status = status;
      if (userId) filters.user_id = parseInt(userId, 10);

      const orders = await OrderModel.getAll(filters);

      return res
        .status(200)
        .json(success('Orders retrieved successfully', orders));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error getting orders:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Get order details by ID
  static async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const orderId = parseInt(id, 10);

      const order = await OrderModel.getById(orderId);

      if (!order) {
        return res
          .status(404)
          .json(error('Order not found', 'NOT_FOUND'));
      }

      return res
        .status(200)
        .json(success('Order retrieved successfully', order));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error getting order:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Update order status
  static async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const orderId = parseInt(id, 10);

      const { valid } = validateRequiredFields(req.body, ['status']);
      if (!valid) {
        return res
          .status(400)
          .json(error('status is required', 'VALIDATION_ERROR'));
      }

      const validStatuses = [
        'pending',
        'accepted',
        'preparing',
        'ready',
        'delivered',
        'paid'
      ];
      if (!validStatuses.includes(status)) {
        return res
          .status(400)
          .json(
            error(
              'Invalid status. Valid statuses: pending, accepted, preparing, ready, delivered, paid',
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

      // Update status
      await OrderModel.updateStatus(orderId, status);

      // Get updated order
      const updatedOrder = await OrderModel.getById(orderId);

      return res
        .status(200)
        .json(success('Order status updated successfully', updatedOrder));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error updating order status:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Cancel order (delete if pending)
  static async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const orderId = parseInt(id, 10);

      // Check if order exists
      const order = await OrderModel.getById(orderId);
      if (!order) {
        return res
          .status(404)
          .json(error('Order not found', 'NOT_FOUND'));
      }

      // Check if order is pending
      if (order.status !== 'pending') {
        return res
          .status(400)
          .json(
            error('Only pending orders can be cancelled', 'VALIDATION_ERROR')
          );
      }

      // Delete order
      await OrderModel.delete(orderId);

      return res
        .status(200)
        .json(success('Order cancelled successfully'));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error cancelling order:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }
}

module.exports = OrderController;
module.exports = OrderController;
