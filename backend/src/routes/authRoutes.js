const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { loginAdmin, getAdminProfile, updatePassword } = require('../controllers/authController');
const { protectAdmin } = require('../middleware/auth');

// Brute-force protection for login: max 10 requests per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, loginAdmin);
router.get('/me', protectAdmin, getAdminProfile);
router.put('/update-password', protectAdmin, updatePassword);

module.exports = router;
