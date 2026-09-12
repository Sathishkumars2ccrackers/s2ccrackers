const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  placeOrder,
  trackOrder,
  getOrderByOrderId,
  getAllOrdersAdmin,
  updateOrderStatus,
  cancelOrderAdmin,
  recordWhatsAppConfirmation,
} = require('../controllers/orderController');
const { protectAdmin } = require('../middleware/auth');

// Rate limiting on checkout: max 20 orders per 15 minutes per IP
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many order requests. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting on tracking: max 10 attempts per 15 minutes per IP
const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many tracking attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public Routes
router.post('/', orderLimiter, placeOrder);
router.post('/track', trackLimiter, trackOrder);

// Admin Routes
router.get('/admin/all', protectAdmin, getAllOrdersAdmin);
router.get('/admin/by-id/:orderId', protectAdmin, getOrderByOrderId);
router.patch('/admin/:id/status', protectAdmin, updateOrderStatus);
router.patch('/admin/:id/cancel', protectAdmin, cancelOrderAdmin);
router.patch('/admin/:id/whatsapp-confirm', protectAdmin, recordWhatsAppConfirmation);

module.exports = router;
