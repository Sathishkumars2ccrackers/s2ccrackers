const AdminNotificationToken = require('../models/AdminNotificationToken');
const NotificationLog = require('../models/NotificationLog');
const {
  sendTestNotification,
  getNotificationHealth,
} = require('../services/notificationService');

// @desc    Register or refresh FCM push notification token
// @route   POST /api/notifications/register-token
// @access  Private (Admin)
const registerToken = async (req, res, next) => {
  try {
    const { token, deviceName, deviceType, browser, os } = req.body;
    const adminId = req.admin._id;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid FCM registration token is required.',
      });
    }

    const cleanToken = token.trim();

    // Prevent duplicate entries - upsert by token
    const updatedDevice = await AdminNotificationToken.findOneAndUpdate(
      { token: cleanToken },
      {
        adminId,
        token: cleanToken,
        deviceName: deviceName ? deviceName.trim() : 'Admin Device',
        deviceType: deviceType || 'unknown',
        browser: browser ? browser.trim() : 'Unknown Browser',
        os: os ? os.trim() : 'Unknown OS',
        isActive: true,
        lastActiveAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'FCM device token registered successfully for instant order alerts.',
      device: updatedDevice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unregister / disable FCM push notification token
// @route   POST /api/notifications/unregister-token
// @access  Private (Admin)
const unregisterToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required to unregister.',
      });
    }

    const result = await AdminNotificationToken.findOneAndDelete({ token: token.trim() });

    res.status(200).json({
      success: true,
      message: result
        ? 'Device unregistered from push notifications.'
        : 'Device was not previously registered.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registered admin devices
// @route   GET /api/notifications/devices
// @access  Private (Admin)
const getAdminDevices = async (req, res, next) => {
  try {
    const devices = await AdminNotificationToken.find()
      .populate('adminId', 'name email role')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: devices.length,
      devices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update device name or toggle active status
// @route   PATCH /api/notifications/devices/:id
// @access  Private (Admin)
const updateAdminDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deviceName, isActive } = req.body;

    const device = await AdminNotificationToken.findById(id);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Registered device not found.',
      });
    }

    if (deviceName !== undefined) device.deviceName = deviceName.trim();
    if (isActive !== undefined) device.isActive = Boolean(isActive);

    await device.save();

    res.status(200).json({
      success: true,
      message: 'Device details updated successfully.',
      device,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a registered device
// @route   DELETE /api/notifications/devices/:id
// @access  Private (Admin)
const deleteAdminDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const device = await AdminNotificationToken.findByIdAndDelete(id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Registered device not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Device removed from push notifications.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notification delivery logs
// @route   GET /api/notifications/logs
// @access  Private (Admin)
const getNotificationLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const status = req.query.status;
    const type = req.query.type;

    const query = {};
    if (status && status !== 'all') query.deliveryStatus = status;
    if (type && type !== 'all') query.notificationType = type;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      NotificationLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a test push notification
// @route   POST /api/notifications/test
// @access  Private (Admin)
const triggerTestNotification = async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await sendTestNotification(req.admin, token || null);

    res.status(200).json({
      success: true,
      message: 'Test push notification sent successfully!',
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send test push notification.',
    });
  }
};

// @desc    Get Notification System Health
// @route   GET /api/notifications/health
// @access  Private (Admin)
const getHealthStatus = async (req, res, next) => {
  try {
    const health = await getNotificationHealth();
    res.status(200).json({
      success: true,
      health,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Public VAPID & Firebase Configuration status
// @route   GET /api/notifications/config
// @access  Public
const getNotificationConfig = async (req, res) => {
  res.status(200).json({
    success: true,
    vapidKey:
      process.env.VAPID_PUBLIC_KEY ||
      process.env.VITE_FIREBASE_VAPID_KEY ||
      'BJYYaqCPPT90pNcAEQp9r9rP8H3xZpdofBS7XkLiJBEdJatB2jXNuMpdeB3nHH4Jr1XD6pWEEA_ZKSKJZjcGIl0',
    projectId: process.env.FIREBASE_PROJECT_ID || 's2c-crackers',
  });
};

// @desc    Get Detailed Firebase Debug & Diagnostics Information
// @route   GET /api/notifications/debug
// @access  Public / Admin
const { getFirebaseDiagnostics } = require('../config/firebaseAdmin');

const getFirebaseDebug = async (req, res) => {
  const diag = getFirebaseDiagnostics();
  res.status(200).json({
    success: true,
    ...diag,
    environment: {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '(not set)',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '(not set)',
      FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '(not set)',
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || '(not set)',
      HAS_INLINE_SERVICE_ACCOUNT_KEY: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    },
  });
};

module.exports = {
  registerToken,
  unregisterToken,
  getAdminDevices,
  updateAdminDevice,
  deleteAdminDevice,
  getNotificationLogs,
  triggerTestNotification,
  getHealthStatus,
  getNotificationConfig,
  getFirebaseDebug,
};
