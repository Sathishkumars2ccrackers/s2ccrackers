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
      default: '+91 99444 76516',
    },
    whatsappNumber: {
      type: String,
      default: '919944476516',
    },
    email: {
      type: String,
      default: 's2ccrackers@gmail.com',
    },
    address: {
      type: String,
      default: 'Azhagar Crackers, 570 (East Part), Singapore Nagar, Chatitapatti, Madurai - 625014, Tamil Nadu, India',
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
      default: '💥 SIVAKASI DIRECT FACTORY PRICES! Book your Festival Crackers early & Get Up To 80% OFF. Door Delivery Available Across India! 💥',
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
