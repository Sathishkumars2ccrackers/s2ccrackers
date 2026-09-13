const mongoose = require('mongoose');

const adminNotificationTokenSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Admin ID is required'],
      index: true,
    },
    token: {
      type: String,
      required: [true, 'FCM registration token is required'],
      unique: true,
      trim: true,
      index: true,
    },
    deviceName: {
      type: String,
      default: 'Admin Device',
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown',
    },
    browser: {
      type: String,
      default: 'Unknown Browser',
      trim: true,
    },
    os: {
      type: String,
      default: 'Unknown OS',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'adminNotificationTokens',
  }
);

// Compound index for querying active tokens efficiently
adminNotificationTokenSchema.index({ isActive: 1, adminId: 1 });

module.exports = mongoose.model('AdminNotificationToken', adminNotificationTokenSchema);
