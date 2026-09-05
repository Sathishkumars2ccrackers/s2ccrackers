const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Sync Firebase authenticated user to MongoDB
// @route   POST /api/users/sync
// @access  Public (Called on Firebase login)
const syncUser = async (req, res, next) => {
  try {
    const { uid, name, email, phone, photoURL } = req.body;

    if (!uid) {
      return res.status(400).json({ success: false, message: 'Firebase UID is required for sync.' });
    }

    let user = await User.findOne({ uid });

    if (user) {
      // Update existing user record
      if (name) user.name = name.trim();
      if (email) user.email = email.trim().toLowerCase();
      if (phone) user.phone = phone.trim();
      if (photoURL) user.photoURL = photoURL;
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create new user record in MongoDB
      user = await User.create({
        uid,
        name: (name || 'Customer').trim(),
        email: email ? email.trim().toLowerCase() : '',
        phone: phone ? phone.trim() : '',
        photoURL: photoURL || '',
        role: 'customer',
        lastLogin: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'User synchronized successfully with MongoDB',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer profile details in MongoDB
// @route   PUT /api/users/profile
// @access  Public
const updateProfile = async (req, res, next) => {
  try {
    const { uid, name, phone, email } = req.body;

    if (!uid) {
      return res.status(400).json({ success: false, message: 'UID is required.' });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (phone) updates.phone = phone.trim();
    if (email) updates.email = email.trim().toLowerCase();

    const user = await User.findOneAndUpdate({ uid }, { $set: updates }, { new: true, upsert: true });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully in MongoDB',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile and orders overview
// @route   GET /api/users/profile/:uid
// @access  Public
const getProfile = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in MongoDB.' });
    }

    // Also fetch orders for this user by phone or uid
    const query = { $or: [{ 'customerDetails.phone': user.phone }] };
    if (user.uid) {
      query.$or.push({ uid: user.uid });
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      user,
      ordersCount: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncUser,
  updateProfile,
  getProfile,
};
