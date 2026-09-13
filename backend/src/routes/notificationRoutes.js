const express = require('express');
const router = express.Router();
const {
  registerToken,
  unregisterToken,
  getAdminDevices,
  updateAdminDevice,
  deleteAdminDevice,
  getNotificationLogs,
  triggerTestNotification,
  getHealthStatus,
  getNotificationConfig,
} = require('../controllers/notificationController');
const { protectAdmin } = require('../middleware/auth');

// Public config
router.get('/config', getNotificationConfig);

// Protected Admin routes
router.post('/register-token', protectAdmin, registerToken);
router.post('/unregister-token', protectAdmin, unregisterToken);
router.get('/devices', protectAdmin, getAdminDevices);
router.patch('/devices/:id', protectAdmin, updateAdminDevice);
router.delete('/devices/:id', protectAdmin, deleteAdminDevice);
router.get('/logs', protectAdmin, getNotificationLogs);
router.post('/test', protectAdmin, triggerTestNotification);
router.get('/health', protectAdmin, getHealthStatus);

module.exports = router;
