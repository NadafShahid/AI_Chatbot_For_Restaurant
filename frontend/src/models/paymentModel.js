const { client } = require('../config/database');

class PaymentModel {
  // Create payment record
  static async create(orderId, amount, method, transactionId = null, status = 'pending') {
    const query = `
      INSERT INTO payments (order_id, amount, method, transaction_id, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, order_id, amount, method, transaction_id, status, created_at
    `;
    const result = await client.query(query, [orderId, amount, method, transactionId, status]);
    return result.rows[0];
  }

  // Get all payments
  static async getAll() {
    const query = `
      SELECT
        p.id,
        p.order_id,
        p.amount,
        p.method,
        p.status,
        p.created_at,
        o.user_id,
        o.total_amount as order_total,
        u.name as user_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.user_id = u.id
      ORDER BY p.created_at DESC
    `;
    const result = await client.query(query);
    return result.rows;
  }

  // Get payments for specific order
  static async getByOrderId(orderId) {
    const query = `
      SELECT
        p.id,
        p.order_id,
        p.amount,
        p.method,
        p.status,
        p.created_at
      FROM payments p
      WHERE p.order_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await client.query(query, [orderId]);
    return result.rows;
  }

  // Get payment by ID
  static async getById(paymentId) {
    const query = `
      SELECT
        p.id,
        p.order_id,
        p.amount,
        p.method,
        p.status,
        p.created_at,
        o.user_id,
        o.total_amount as order_total,
        u.name as user_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE p.id = $1
    `;
    const result = await client.query(query, [paymentId]);
    return result.rows[0] || null;
  }

  // Update payment status
  static async updateStatus(paymentId, status) {
    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    const query = 'UPDATE payments SET status = $1 WHERE id = $2 RETURNING id';
    const result = await client.query(query, [status, paymentId]);

    if (result.rows.length === 0) {
      throw new Error('Payment not found');
    }

    return result.rows[0].id;
  }

  // Check if payment belongs to order
  static async belongsToOrder(paymentId, orderId) {
    const query = 'SELECT id FROM payments WHERE id = $1 AND order_id = $2';
    const result = await client.query(query, [paymentId, orderId]);
    return result.rows.length > 0;
  }
}

module.exports = PaymentModel;
