const CartModel = require('../models/cartModel');
const UserModel = require('../models/userModel');
const { success, error } = require('../utils/response');
const { validateRequiredFields } = require('../middleware/validation');

class CartController {
  // Add item to cart
  static async addItem(req, res, next) {
    try {
      const { userId } = req.params;
      const { item_id: itemId, quantity } = req.body;

      const { valid, missing } = validateRequiredFields(req.body, [
        'item_id',
        'quantity'
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

      if (Number(quantity) <= 0) {
        return res
          .status(400)
          .json(error('Quantity must be greater than 0', 'VALIDATION_ERROR'));
      }

      // Check if user exists
      const user = await UserModel.getById(userId);
      if (!user) {
        return res
          .status(404)
          .json(error('User not found', 'NOT_FOUND'));
      }

      // Check if item exists and is available
      const itemExists = await CartModel.itemExists(itemId);
      if (!itemExists) {
        return res
          .status(404)
          .json(error('Menu item not found or not available', 'NOT_FOUND'));
      }

      // Get or create cart
      const cartId = await CartModel.getOrCreateCart(userId);

      // Add item to cart
      await CartModel.addItem(cartId, itemId, quantity);

      // Get updated cart
      const cart = await CartModel.getCartWithItems(userId);

      return res
        .status(200)
        .json(success('Item added to cart successfully', cart));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error adding item to cart:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Get user's cart
  static async getCart(req, res, next) {
    try {
      const { userId } = req.params;

      // Check if user exists
      const user = await UserModel.getById(userId);
      if (!user) {
        return res
          .status(404)
          .json(error('User not found', 'NOT_FOUND'));
      }

      const cart = await CartModel.getCartWithItems(userId);

      return res
        .status(200)
        .json(success('Cart retrieved successfully', cart));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error getting cart:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Update item quantity in cart
  static async updateItem(req, res, next) {
    try {
      const { userId } = req.params;
      const { item_id: itemId, quantity } = req.body;

      const { valid, missing } = validateRequiredFields(req.body, [
        'item_id',
        'quantity'
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

      if (Number(quantity) < 0) {
        return res
          .status(400)
          .json(error('Quantity cannot be negative', 'VALIDATION_ERROR'));
      }

      // Check if user exists
      const user = await UserModel.getById(userId);
      if (!user) {
        return res
          .status(404)
          .json(error('User not found', 'NOT_FOUND'));
      }

      // Get cart
      const cartId = await CartModel.getOrCreateCart(userId);

      // Update item
      await CartModel.updateItem(cartId, itemId, quantity);

      // Get updated cart
      const cart = await CartModel.getCartWithItems(userId);

      return res
        .status(200)
        .json(success('Cart item updated successfully', cart));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error updating cart item:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Remove item from cart
  static async removeItem(req, res, next) {
    try {
      const { userId, itemId } = req.params;

      // Check if user exists
      const user = await UserModel.getById(userId);
      if (!user) {
        return res
          .status(404)
          .json(error('User not found', 'NOT_FOUND'));
      }

      // Get cart
      const cartId = await CartModel.getOrCreateCart(userId);

      // Remove item
      await CartModel.removeItem(cartId, itemId);

      // Get updated cart
      const cart = await CartModel.getCartWithItems(userId);

      return res
        .status(200)
        .json(success('Item removed from cart successfully', cart));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error removing item from cart:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Clear entire cart
  static async clearCart(req, res, next) {
    try {
      const { userId } = req.params;

      // Check if user exists
      const user = await UserModel.getById(userId);
      if (!user) {
        return res
          .status(404)
          .json(error('User not found', 'NOT_FOUND'));
      }

      // Get cart
      const cartId = await CartModel.getOrCreateCart(userId);

      // Clear cart
      await CartModel.clearCart(cartId);

      // Get updated cart (should be empty)
      const cart = await CartModel.getCartWithItems(userId);

      return res
        .status(200)
        .json(success('Cart cleared successfully', cart));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error clearing cart:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }
}

module.exports = CartController;
