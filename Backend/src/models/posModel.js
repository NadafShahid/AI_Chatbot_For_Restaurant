const { client } = require('../config/database');
const OrderModel = require('./orderModel');
const MenuModel = require('./menuModel');
const UserModel = require('./userModel'); // Assuming a userModel exists for user validation

class PosModel {
  /**
   * Creates a quick order directly, bypassing the cart.
   * @param {number} userId - The ID of the user placing the order.
   * @param {Array<Object>} items - An array of item objects, each with item_id and quantity.
   * @param {string} paymentMethod - The payment method for the order.
   * @returns {Promise<number>} The ID of the newly created order.
   */
  static async createQuickOrder(userId, items, paymentMethod) {
    if (!items || items.length === 0) {
      throw new Error('Order must contain at least one item.');
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuModel.getById(item.item_id);
      if (!menuItem || !menuItem.availability) {
        throw new Error(`Menu item with ID ${item.item_id} not found or not available.`);
      }
      const itemPrice = parseFloat(menuItem.price);
      const itemQuantity = parseInt(item.quantity);

      if (isNaN(itemQuantity) || itemQuantity <= 0) {
        throw new Error(`Invalid quantity for item ID ${item.item_id}.`);
      }

      orderItems.push({
        item_id: item.item_id,
        quantity: itemQuantity,
        price: itemPrice,
      });
      totalAmount += itemPrice * itemQuantity;
    }

    // Create the order
    const orderQuery = `
      INSERT INTO orders (user_id, total_amount, payment_method, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING id;
    `;
    const orderResult = await client.query(orderQuery, [userId, totalAmount.toFixed(2), paymentMethod]);
    const orderId = orderResult.rows[0].id;

    // Insert order items
    const orderItemInsertQuery = `
      INSERT INTO order_items (order_id, item_id, quantity, price)
      VALUES ($1, $2, $3, $4);
    `;
    for (const item of orderItems) {
      await client.query(orderItemInsertQuery, [orderId, item.item_id, item.quantity, item.price]);
    }

    return orderId;
  }

  /**
   * Retrieves all active orders (not delivered or cancelled).
   * @returns {Promise<Array<Object>>} An array of active orders.
   */
  static async getActiveOrders() {
    const query = `
      SELECT
        o.id,
        o.user_id,
        o.total_amount,
        o.payment_method,
        o.status,
        o.created_at,
        u.name as user_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.status NOT IN ('delivered', 'cancelled')
      ORDER BY o.created_at DESC;
    `;
    const result = await client.query(query);
    return result.rows;
  }

  /**
   * Marks an order as delivered and paid.
   * @param {number} orderId - The ID of the order to close.
   * @returns {Promise<Object>} The updated order.
   */
  static async closeOrder(orderId) {
    // First, check if the order exists
    const existingOrder = await OrderModel.getById(orderId);
    if (!existingOrder) {
      throw new Error('Order not found.');
    }

    // Update the order status to 'delivered' and payment status (assuming 'paid' is implied by closing)
    const query = `
      UPDATE orders
      SET status = 'delivered'
      WHERE id = $1
      RETURNING id, user_id, total_amount, payment_method, status, created_at;
    `;
    const result = await client.query(query, [orderId]);

    if (result.rows.length === 0) {
      throw new Error('Failed to close order.');
    }

    return result.rows[0];
  }
}

module.exports = PosModel;
