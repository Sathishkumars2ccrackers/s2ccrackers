const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      default: 'S2C Crackers',
    },
    businessDomain: {
      type: String,
      default: 'www.s2ccrackers.com',
    },
    phone: {
      type: String,
      default: '+91 94421 87654',
    },
    whatsappNumber: {
      type: String,
      default: '919442187654',
    },
    email: {
      type: String,
      default: 'orders@s2ccrackers.com',
    },
    address: {
      type: String,
      default: '124/B, Sivakasi Main Road, Viswanatham, Sivakasi, Tamil Nadu - 626123',
    },
    minOrderAmount: {
      type: Number,
      default: 500,
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 3000,
    },
    defaultDeliveryFee: {
      type: Number,
      default: 150,
    },
    festivalAnnouncement: {
      type: String,
      default: '💥 SIVAKASI DIRECT FACTORY PRICES! Book your Festival Crackers early & Get Up To 80% OFF. Cash on Delivery Available! 💥',
    },
    isStoreOpen: {
      type: Boolean,
      default: true,
    },
    storeClosedNotice: {
      type: String,
      default: 'We are temporarily not taking new orders due to high festival demand. Existing orders are being dispatched.',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
