const express = require('express');
const router = express.Router();
const {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
  exportDatabaseBackup,
} = require('../controllers/settingController');
const { protectAdmin } = require('../middleware/auth');

// Public settings endpoints
router.get('/', getPublicSettings);
router.get('/public', getPublicSettings);

// Admin-only settings management
router.put('/', protectAdmin, updateSettings);
router.get('/admin', protectAdmin, getAdminSettings);
router.put('/admin', protectAdmin, updateSettings);
router.get('/admin/backup', protectAdmin, exportDatabaseBackup);

module.exports = router;

