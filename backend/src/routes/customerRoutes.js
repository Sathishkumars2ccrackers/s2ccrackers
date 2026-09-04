const express = require('express');
const router = express.Router();
const { getAllCustomersAdmin, getCustomerDetailsAdmin } = require('../controllers/customerController');
const { protectAdmin } = require('../middleware/auth');

router.get('/admin/all', protectAdmin, getAllCustomersAdmin);
router.get('/admin/:id', protectAdmin, getCustomerDetailsAdmin);

module.exports = router;
