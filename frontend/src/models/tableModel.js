const { client } = require('../config/database');

class TableModel {
  static async getAll() {
    const result = await client.query(
      'SELECT * FROM restaurant_tables ORDER BY table_number ASC'
    );
    return result.rows;
  }

  static async getById(id) {
    const result = await client.query(
      'SELECT * FROM restaurant_tables WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async updateOccupied(id, isOccupied) {
    const result = await client.query(
      'UPDATE restaurant_tables SET is_occupied = $1 WHERE id = $2 RETURNING *',
      [isOccupied, id]
    );
    return result.rows[0];
  }

    static async update(id, data) {
      const { table_number, seats, is_occupied } = data;

      const result = await client.query(
        `UPDATE restaurant_tables 
        SET table_number = $1, seats = $2, is_occupied = $3 
        WHERE id = $4 
        RETURNING *`,
        [table_number, seats, is_occupied, id]
      );

      return result.rows[0];
    }


}







module.exports = TableModel;