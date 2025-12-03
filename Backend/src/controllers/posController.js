const PosModel = require('../models/posModel');
const UserModel = require('../models/userModel'); // For user validation
const { success, error } = require('../utils/response');
const { validateRequiredFields } = require('../middleware/validation');

class PosController {
  /**
   * Handles the creation of a quick order via POS.
   * POST /api/pos/order
   */
  static async createQuickOrder(req, res, next) {
    try {
      const { user_id: userId, items, payment_method: paymentMethod } =
        req.body || {};

      const { valid, missing } = validateRequiredFields(req.body, [
        'user_id',
        'items',
        'payment_method'
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

      if (!Array.isArray(items) || items.length === 0) {
        return res
          .status(400)
          .json(
            error(
              'items must be a non-empty array',
              'VALIDATION_ERROR'
            )
          );
      }

      // Validate user exists
      const user = await UserModel.getById(userId);
      if (!user) {
        return res
          .status(404)
          .json(error('User not found.', 'NOT_FOUND'));
      }

      const orderId = await PosModel.createQuickOrder(
        userId,
        items,
        paymentMethod
      );
      const newOrder = await PosModel.closeOrder(orderId); // Assuming quick orders are immediately closed/paid

      return res
        .status(201)
        .json(
          success('Quick order created and closed successfully.', newOrder)
        );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error creating quick order:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  /**
   * Retrieves all active orders.
   * GET /api/pos/orders/active
   */
  static async getActiveOrders(req, res, next) {
    try {
      const activeOrders = await PosModel.getActiveOrders();

      return res
        .status(200)
        .json(success('Active orders retrieved successfully.', activeOrders));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error getting active orders:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  /**
   * Marks an order as delivered and paid (closed).
   * PUT /api/pos/orders/:id/close
   */
  static async closeOrder(req, res, next) {
    try {
      const { id } = req.params;
      const orderId = parseInt(id, 10);

      if (Number.isNaN(orderId)) {
        return res
          .status(400)
          .json(error('Invalid order ID provided.', 'VALIDATION_ERROR'));
      }

      const closedOrder = await PosModel.closeOrder(orderId);

      return res
        .status(200)
        .json(
          success(`Order ${orderId} closed successfully.`, closedOrder)
        );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Error closing order ${req.params.id}:`, err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }
}

module.exports = PosController;
