
const { client } = require('../config/database');

class OrderModel {
  // Create order from cart
  static async createFromCart(userId, paymentMethod, tableId) {
    const dbClient = await client.connect();

    try {
      await dbClient.query('BEGIN');

      // Get cart with items
      const cartResult = await dbClient.query(
        `SELECT c.id, c.user_id, ci.item_id, ci.quantity, mi.price
         FROM carts c
         JOIN cart_items ci ON c.id = ci.cart_id
         JOIN menu_items mi ON ci.item_id = mi.id
         WHERE c.user_id = $1`,
        [userId]
      );

      if (cartResult.rows.length === 0) {
        throw new Error('Cart is empty');
      }

      // Calculate total
      const total = cartResult.rows.reduce(
        (sum, item) => sum + item.quantity * parseFloat(item.price),
        0
      );

      // Create order with table_id
      const orderResult = await dbClient.query(
        `INSERT INTO orders (user_id, table_id, total_amount, payment_method, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING id`,
        [userId, tableId, total, paymentMethod]
      );

      const orderId = orderResult.rows[0].id;

      // Insert order items
      for (const item of cartResult.rows) {
        await dbClient.query(
          `INSERT INTO order_items (order_id, item_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [orderId, item.item_id, item.quantity, item.price]
        );
      }

      // Clear cart
      await dbClient.query(
        'DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)',
        [userId]
      );

      await dbClient.query('COMMIT');
      return orderId;
    } catch (err) {
      await dbClient.query('ROLLBACK');
      throw err;
    } finally {
      dbClient.release();
    }
  }

  // Get all orders with optional filters
  static async getAll(filters = {}) {
    let query = `
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
    `;
    const params = [];
    const conditions = [];

    if (filters.status) {
      conditions.push(`o.status = $${params.length + 1}`);
      params.push(filters.status);
    }

    if (filters.user_id) {
      conditions.push(`o.user_id = $${params.length + 1}`);
      params.push(filters.user_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY o.created_at DESC';

    const result = await client.query(query, params);
    return result.rows;
  }

  // Get order by ID with items
  static async getById(orderId) {
    // Get order details
    const orderQuery = `
      SELECT
        o.id,
        o.user_id,
        o.total_amount,
        o.payment_method,
        o.status,
        o.created_at,
        u.name as user_name,
        u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    const orderResult = await client.query(orderQuery, [orderId]);

    if (orderResult.rows.length === 0) {
      return null;
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsQuery = `
      SELECT
        oi.item_id,
        oi.quantity,
        oi.price,
        mi.name,
        mi.description,
        mi.category,
        mi.type
      FROM order_items oi
      JOIN menu_items mi ON oi.item_id = mi.id
      WHERE oi.order_id = $1
    `;
    const itemsResult = await client.query(itemsQuery, [orderId]);

    order.items = itemsResult.rows;
    return order;
  }

  // Update order status
  static async updateStatus(orderId, status) {
    const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'delivered'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    const query = 'UPDATE orders SET status = $1 WHERE id = $2 RETURNING id';
    const result = await client.query(query, [status, orderId]);

    if (result.rows.length === 0) {
      throw new Error('Order not found');
    }

    return result.rows[0].id;
  }

  // Delete order (only if status is 'pending')
  static async delete(orderId) {
    // Check current status
    const checkQuery = 'SELECT status FROM orders WHERE id = $1';
    const checkResult = await client.query(checkQuery, [orderId]);

    if (checkResult.rows.length === 0) {
      throw new Error('Order not found');
    }

    if (checkResult.rows[0].status !== 'pending') {
      throw new Error('Only pending orders can be cancelled');
    }

    // Delete order items first (due to foreign key constraint)
    await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);

    // Delete order
    const deleteQuery = 'DELETE FROM orders WHERE id = $1 RETURNING id';
    const result = await client.query(deleteQuery, [orderId]);

    return result.rows[0].id;
  }

  // Check if order belongs to user
  static async belongsToUser(orderId, userId) {
    const query = 'SELECT id FROM orders WHERE id = $1 AND user_id = $2';
    const result = await client.query(query, [orderId, userId]);
    return result.rows.length > 0;
  }
}

module.exports = OrderModel;
