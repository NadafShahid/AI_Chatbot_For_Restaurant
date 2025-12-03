const MenuModel = require('../models/menuModel');
const { success, error } = require('../utils/response');
const { validateRequiredFields } = require('../middleware/validation');

class MenuController {
  // Create menu item
  static async createMenuItem(req, res, next) {
    try {
      const { name, price, description, category, type, availability } = req.body;

      // Validate required fields
      const { valid, missing } = validateRequiredFields(req.body, ['name', 'price']);
      if (!valid) {
        return res.status(400).json(
          error(`Missing required fields: ${missing.join(', ')}`, 'VALIDATION_ERROR')
        );
      }

      if (Number(price) <= 0) {
        return res.status(400).json(error('Price must be greater than 0', 'VALIDATION_ERROR'));
      }

      // Handle image upload
      const image_url = req.file ? `/images/${req.file.filename}` : '';

      const menuItem = await MenuModel.create({
        name,
        price,
        description,
        category,
        type,
        availability,
        image_url
      });

      return res.status(201).json(success('Menu item created successfully', menuItem));
    } catch (err) {
      console.error('Error creating menu item:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Get all menu items
  static async getAllMenuItems(req, res, next) {
    try {
      const { category, type } = req.query;
      const filters = {};
      if (category) filters.category = category;
      if (type) filters.type = type;

      const menuItems = await MenuModel.getAll(filters);
      return res.status(200).json(success('Menu items retrieved successfully', menuItems));
    } catch (err) {
      console.error('Error getting menu items:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Get menu item by ID
  static async getMenuItemById(req, res, next) {
    try {
      const { id } = req.params;
      const menuItem = await MenuModel.getById(id);

      if (!menuItem) {
        return res.status(404).json(error('Menu item not found', 'NOT_FOUND'));
      }

      return res.status(200).json(success('Menu item retrieved successfully', menuItem));
    } catch (err) {
      console.error('Error getting menu item:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Update menu item
  static async updateMenuItem(req, res, next) {
    try {
      const { id } = req.params;
      const { name, price, description, category, type, availability } = req.body;

      // Validate required fields
      const { valid, missing } = validateRequiredFields(req.body, ['name', 'price']);
      if (!valid) {
        return res.status(400).json(
          error(`Missing required fields: ${missing.join(', ')}`, 'VALIDATION_ERROR')
        );
      }

      if (Number(price) <= 0) {
        return res.status(400).json(error('Price must be greater than 0', 'VALIDATION_ERROR'));
      }

      // Check if menu item exists
      const existingItem = await MenuModel.getById(id);
      if (!existingItem) {
        return res.status(404).json(error('Menu item not found', 'NOT_FOUND'));
      }

      // Handle image upload
      const updatedData = {
        name,
        price,
        description,
        category,
        type,
        availability
      };
      if (req.file) updatedData.image_url = `/images/${req.file.filename}`;

      const menuItem = await MenuModel.update(id, updatedData);
      return res.status(200).json(success('Menu item updated successfully', menuItem));
    } catch (err) {
      console.error('Error updating menu item:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Delete menu item
  static async deleteMenuItem(req, res, next) {
    try {
      const { id } = req.params;

      // Check if menu item exists
      const existingItem = await MenuModel.getById(id);
      if (!existingItem) {
        return res.status(404).json(error('Menu item not found', 'NOT_FOUND'));
      }

      await MenuModel.delete(id);
      return res.status(200).json(success('Menu item deleted successfully'));
    } catch (err) {
      console.error('Error deleting menu item:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }
}

module.exports = MenuController;
