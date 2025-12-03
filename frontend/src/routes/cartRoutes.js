const express = require('express');
const CartController = require('../controllers/cartController');

const router = express.Router();

// Routes
router.post('/:userId/add', CartController.addItem);
router.get('/:userId', CartController.getCart);
router.put('/:userId/update', CartController.updateItem);
router.delete('/:userId/remove/:itemId', CartController.removeItem);
router.delete('/:userId/clear', CartController.clearCart);


module.exports = router;
