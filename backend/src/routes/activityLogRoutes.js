const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/activityLogController');
const { protectAdmin } = require('../middleware/auth');

router.get('/admin', protectAdmin, getActivityLogs);

module.exports = router;
