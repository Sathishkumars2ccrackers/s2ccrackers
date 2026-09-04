const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { logActivity } = require('../utils/activityLogger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 's2c_crackers_festival_jwt_secret_key_2026_production_safe', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Admin Login
// @route   POST /api/auth/login
// @access  Public
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'This admin account has been deactivated.' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    // Log admin login
    await logActivity({
      admin,
      actionType: 'ADMIN_LOGIN',
      entityType: 'Auth',
      entityId: admin._id,
      details: `Admin ${admin.name} logged in successfully`,
      req,
    });

    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current Admin Profile
// @route   GET /api/auth/me
// @access  Private (Admin)
const getAdminProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Admin Password
// @route   PUT /api/auth/update-password
// @access  Private (Admin)
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new passwords.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const admin = await Admin.findById(req.admin._id).select('+password');

    if (!(await admin.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password does not match.' });
    }

    admin.password = newPassword;
    await admin.save();

    await logActivity({
      admin,
      actionType: 'SETTINGS_UPDATE',
      entityType: 'Auth',
      entityId: admin._id,
      details: `Admin ${admin.name} updated account password`,
      req,
    });

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  getAdminProfile,
  updatePassword,
};
