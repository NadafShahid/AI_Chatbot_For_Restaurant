const TableModel = require('../models/tableModel');
const { success, error } = require('../utils/response');

class TableController {
  // Get all tables
  static async getAllTables(req, res, next) {
    try {
      const tables = await TableModel.getAll();
      return res
        .status(200)
        .json(success('Tables retrieved successfully', tables));
    } catch (err) {
      console.error('Error getting tables:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Get table by ID
  static async getTableById(req, res, next) {
    try {
      const { id } = req.params;
      const table = await TableModel.getById(parseInt(id, 10));

      if (!table) {
        return res
          .status(404)
          .json(error('Table not found', 'NOT_FOUND'));
      }

      return res
        .status(200)
        .json(success('Table retrieved successfully', table));
    } catch (err) {
      console.error('Error getting table:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }


    // Update table
static async updateTable(req, res, next) {
  try {
    const { id } = req.params;

    const updatedTable = await TableModel.update(parseInt(id, 10), req.body);

    return res
      .status(200)
      .json(success('Table updated successfully', updatedTable));
  } catch (err) {
    console.error('Error updating table:', err);
    err.status = err.status || 500 ;
    err.code = err.code || 'INTERNAL_ERROR';
    return next(err);
  }
}







  

}
module.exports = TableController;