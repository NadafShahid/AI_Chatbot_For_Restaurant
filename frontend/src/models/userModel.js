const { client } = require('../config/database');

class UserModel {
  // Create a new user
  static async create(userData) {
    const { name, email, phone, role, password } = userData;
    const query = `
      INSERT INTO users (name, email, phone, role, password)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone, role, created_at
    `;
    const values = [name, email, phone || null, role || 'customer', password];
    const result = await client.query(query, values);
    return result.rows[0];
  }

  // Get all users
  static async getAll() {
    const query = 'SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC';
    const result = await client.query(query);
    return result.rows;
  }

  // Get user by ID
  static async getById(id) {
    const query = 'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1';
    const result = await client.query(query, [id]);
    return result.rows[0];
  }

  // Update user
  static async update(id, userData) {
    const { name, email, phone, role, password } = userData;
    const query = `
      UPDATE users
      SET name = $1, email = $2, phone = $3, role = $4, password = $5
      WHERE id = $6
      RETURNING id, name, email, phone, role, created_at
    `;
    const values = [name, email, phone || null, role || 'customer', password, id];
    const result = await client.query(query, values);
    return result.rows[0];
  }

  // Delete user
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await client.query(query, [id]);
    return result.rows[0];
  }

  // Check if email exists
  static async emailExists(email, excludeId = null) {
    let query = 'SELECT id FROM users WHERE email = $1';
    let values = [email];
    if (excludeId) {
      query += ' AND id != $2';
      values.push(excludeId);
    }
    const result = await client.query(query, values);
    return result.rows.length > 0;
  }

  // Login user
  static async login(email, password) {
    const query = 'SELECT id, name, email, phone, role, created_at FROM users WHERE email = $1 AND password = $2';
    const result = await client.query(query, [email, password]);
    return result.rows[0];
  }

  // Get user by role (useful for finding bot/admin users)
  static async getByRole(role) {
    const query = 'SELECT id, name, email, phone, role, created_at FROM users WHERE role = $1 LIMIT 1';
    const result = await client.query(query, [role]);
    return result.rows[0] || null;
  }
}

module.exports = UserModel;
