const express = require('express');
const UserController = require('../controllers/userController');

const router = express.Router();

// Routes
router.post('/', UserController.createUser);

router.get('/', UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

module.exports = router;
