const { client } = require('../config/database');

class CartModel {
  // Get or create cart for user
  static async getOrCreateCart(userId) {
    // First, try to get existing cart
    let query = 'SELECT id FROM carts WHERE user_id = $1';
    let result = await client.query(query, [userId]);

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    // Create new cart if doesn't exist
    query = 'INSERT INTO carts (user_id) VALUES ($1) RETURNING id';
    result = await client.query(query, [userId]);
    return result.rows[0].id;
  }

  // Add item to cart
  static async addItem(cartId, itemId, quantity) {
    // Check if item already exists in cart
    const existingQuery = 'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND item_id = $2';
    const existingResult = await client.query(existingQuery, [cartId, itemId]);

    if (existingResult.rows.length > 0) {
      // Update quantity
      const newQuantity = existingResult.rows[0].quantity + quantity;
      const updateQuery = 'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING id';
      await client.query(updateQuery, [newQuantity, existingResult.rows[0].id]);
    } else {
      // Insert new item
      const insertQuery = 'INSERT INTO cart_items (cart_id, item_id, quantity) VALUES ($1, $2, $3)';
      await client.query(insertQuery, [cartId, itemId, quantity]);
    }
  }

  // Update item quantity in cart
  static async updateItem(cartId, itemId, quantity) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await this.removeItem(cartId, itemId);
      return;
    }

    const query = 'UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND item_id = $3';
    await client.query(query, [quantity, cartId, itemId]);
  }

  // Remove item from cart
  static async removeItem(cartId, itemId) {
    const query = 'DELETE FROM cart_items WHERE cart_id = $1 AND item_id = $2';
    await client.query(query, [cartId, itemId]);
  }

  // Clear entire cart
  static async clearCart(cartId) {
    const query = 'DELETE FROM cart_items WHERE cart_id = $1';
    await client.query(query, [cartId]);
  }

  // Get cart with full item details and total
  static async getCartWithItems(userId) {
    const cartId = await this.getOrCreateCart(userId);

    const query = `
      SELECT
        ci.item_id,
        ci.quantity,
        mi.name,
        mi.price,
        mi.description,
        mi.category,
        mi.type,
        mi.availability
      FROM cart_items ci
      JOIN menu_items mi ON ci.item_id = mi.id
      WHERE ci.cart_id = $1
      ORDER BY ci.id
    `;

    const result = await client.query(query, [cartId]);
    const items = result.rows;

    // Calculate total
    let total = 0;
    items.forEach(item => {
      total += parseFloat(item.price) * item.quantity;
    });

    return {
      cartId,
      items,
      total: total.toFixed(2)
    };
  }

  // Check if item exists in menu
  static async itemExists(itemId) {
    const query = 'SELECT id FROM menu_items WHERE id = $1 AND availability = true';
    const result = await client.query(query, [itemId]);
    return result.rows.length > 0;
  }
}

module.exports = CartModel;
