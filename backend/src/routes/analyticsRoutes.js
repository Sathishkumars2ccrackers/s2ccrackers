const express = require('express');
const router = express.Router();
const { getDashboardSummary, exportData } = require('../controllers/analyticsController');
const { protectAdmin } = require('../middleware/auth');

router.get('/dashboard-summary', protectAdmin, getDashboardSummary);
router.get('/export', protectAdmin, exportData);

module.exports = router;
