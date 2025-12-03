const { client } = require('../config/database');

class MenuModel {
  // Create a new menu item
  static async create(menuData) {
    const { name, price, description, category, type, availability, image_url } = menuData;

    const query = `
      INSERT INTO menu_items 
      (name, price, description, category, type, availability, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, price, description, category, type, availability, image_url, created_at
    `;

    const values = [
      name,
      price,
      description || null,
      category || null,
      type || 'food',
      availability !== undefined ? availability : true,
      image_url || null
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  }

  // Get all menu items with filters
  static async getAll(filters = {}) {
    let query = `
      SELECT id, name, price, description, category, type, availability, image_url, created_at 
      FROM menu_items 
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (filters.category) {
      query += ` AND category = $${paramIndex}`;
      values.push(filters.category);
      paramIndex++;
    }

    if (filters.type) {
      query += ` AND type = $${paramIndex}`;
      values.push(filters.type);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';
    const result = await client.query(query, values);
    return result.rows;
  }

  // Get menu item by ID
  static async getById(id) {
    const query = `
      SELECT id, name, price, description, category, type, availability, image_url, created_at 
      FROM menu_items 
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    return result.rows[0];
  }

  // Update menu item
  static async update(id, menuData) {
    const { name, price, description, category, type, availability, image_url } = menuData;

    const query = `
      UPDATE menu_items
      SET name = $1, 
          price = $2, 
          description = $3, 
          category = $4, 
          type = $5, 
          availability = $6,
          image_url = $7
      WHERE id = $8
      RETURNING id, name, price, description, category, type, availability, image_url, created_at
    `;

    const values = [
      name,
      price,
      description || null,
      category || null,
      type || 'food',
      availability !== undefined ? availability : true,
      image_url || null,
      id
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  }

  // Delete menu item
  static async delete(id) {
    const query = 'DELETE FROM menu_items WHERE id = $1 RETURNING id';
    const result = await client.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = MenuModel;
