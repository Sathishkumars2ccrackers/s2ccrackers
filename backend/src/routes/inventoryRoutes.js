const express = require('express');
const router = express.Router();
const { getInventoryOverview, adjustStock } = require('../controllers/inventoryController');
const { protectAdmin } = require('../middleware/auth');

router.get('/overview', protectAdmin, getInventoryOverview);
router.patch('/adjust/:id', protectAdmin, adjustStock);

module.exports = router;
