const express = require('express');
const TableController = require('../controllers/tableController');

const router = express.Router();

router.get('/', TableController.getAllTables);
router.get('/:id', TableController.getTableById);
router.put('/:id', TableController.updateTable);


module.exports = router;