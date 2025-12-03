const UserModel = require('../models/userModel');
const { success, error } = require('../utils/response');
const {
  validateEmail,
  validatePhone,
  validateRequiredFields
} = require('../middleware/validation');

class UserController {
  // Create user
  static async createUser(req, res, next) {
    try {
      const { name, email, phone, role, password } = req.body;

      const { valid, missing } = validateRequiredFields(req.body, [
        'name',
        'email',
        'password'
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

      if (!validateEmail(email)) {
        return res
          .status(400)
          .json(error('Invalid email address', 'VALIDATION_ERROR'));
      }

      if (!validatePhone(phone)) {
        return res
          .status(400)
          .json(error('Invalid phone number', 'VALIDATION_ERROR'));
      }

      // Check if email already exists
      const emailExists = await UserModel.emailExists(email);
      if (emailExists) {
        return res
          .status(409)
          .json(error('Email already exists', 'CONFLICT_ERROR'));
      }

      const user = await UserModel.create({
        name,
        email,
        phone,
        role,
        password
      });
      return res
        .status(201)
        .json(success('User created successfully', user));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error creating user:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Get all users
  static async getAllUsers(req, res, next) {
    try {
      const users = await UserModel.getAll();
      return res
        .status(200)
        .json(success('Users retrieved successfully', users));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error getting users:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Get user by ID
  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await UserModel.getById(id);

      if (!user) {
        return res
          .status(404)
          .json(error('User not found', 'NOT_FOUND'));
      }

      return res
        .status(200)
        .json(success('User retrieved successfully', user));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error getting user:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Update user
  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { name, email, phone, role, password } = req.body;

      const { valid, missing } = validateRequiredFields(req.body, [
        'name',
        'email',
        'password'
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

      if (!validateEmail(email)) {
        return res
          .status(400)
          .json(error('Invalid email address', 'VALIDATION_ERROR'));
      }

      if (!validatePhone(phone)) {
        return res
          .status(400)
          .json(error('Invalid phone number', 'VALIDATION_ERROR'));
      }

      // Check if user exists
      const existingUser = await UserModel.getById(id);
      if (!existingUser) {
        return res
          .status(404)
          .json(error('User not found', 'NOT_FOUND'));
      }

      // Check if email already exists (excluding current user)
      const emailExists = await UserModel.emailExists(email, id);
      if (emailExists) {
        return res
          .status(409)
          .json(error('Email already exists', 'CONFLICT_ERROR'));
      }

      const user = await UserModel.update(id, {
        name,
        email,
        phone,
        role,
        password
      });
      return res
        .status(200)
        .json(success('User updated successfully', user));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error updating user:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }

  // Delete user
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = await UserModel.getById(id);
      if (!existingUser) {
        return res
          .status(404)
          .json(error('User not found', 'NOT_FOUND'));
      }

      await UserModel.delete(id);
      return res
        .status(200)
        .json(success('User deleted successfully'));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error deleting user:', err);
      err.status = err.status || 500;
      err.code = err.code || 'INTERNAL_ERROR';
      return next(err);
    }
  }
}

module.exports = UserController;
