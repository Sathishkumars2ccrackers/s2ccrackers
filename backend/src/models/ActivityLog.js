const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    adminName: {
      type: String,
      default: 'Admin',
      trim: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        'PRODUCT_CREATE',
        'PRODUCT_UPDATE',
        'PRODUCT_DELETE',
        'PRICE_UPDATE',
        'STOCK_UPDATE',
        'ORDER_STATUS_UPDATE',
        'ORDER_CANCEL',
        'BANNER_CREATE',
        'BANNER_UPDATE',
        'BANNER_DELETE',
        'SETTINGS_UPDATE',
        'PINCODE_CREATE',
        'PINCODE_UPDATE',
        'PINCODE_DELETE',
        'BULK_IMPORT',
        'DATA_EXPORT',
        'ADMIN_LOGIN',
      ],
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Product', 'Order', 'Banner', 'Setting', 'Pincode', 'Customer', 'Auth', 'System'],
      index: true,
    },
    entityId: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      required: true,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
