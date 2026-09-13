const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema(
  {
    notificationType: {
      type: String,
      enum: [
        'NEW_ORDER',
        'ORDER_CONFIRMED',
        'ORDER_CANCELLED',
        'LOW_STOCK',
        'OUT_OF_STOCK',
        'SYSTEM_ALERT',
        'TEST_NOTIFICATION',
      ],
      default: 'NEW_ORDER',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    orderId: {
      type: String,
      default: null,
      index: true,
    },
    deviceCount: {
      type: Number,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    deliveryStatus: {
      type: String,
      enum: ['sent', 'partial', 'failed', 'no_devices'],
      default: 'sent',
      index: true,
    },
    details: [
      {
        token: String,
        deviceName: String,
        success: Boolean,
        messageId: String,
        error: String,
      },
    ],
  },
  {
    timestamps: true,
    collection: 'notificationLogs',
  }
);

// Index for sorting and filtering logs
notificationLogSchema.index({ createdAt: -1 });
notificationLogSchema.index({ deliveryStatus: 1, createdAt: -1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
