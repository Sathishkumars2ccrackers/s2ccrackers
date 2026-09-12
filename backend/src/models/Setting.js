const mongoose = require('mongoose');

const discountSlabSchema = new mongoose.Schema(
  {
    minAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { _id: true }
);

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
    minimumOrderAmount: {
      type: Number,
      default: 500,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 500,
      min: 0,
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 3000,
      min: 0,
    },
    defaultDeliveryFee: {
      type: Number,
      default: 150,
      min: 0,
    },
    discountSlabs: {
      type: [discountSlabSchema],
      default: [
        { minAmount: 1000, discountPercentage: 5 },
        { minAmount: 3000, discountPercentage: 10 },
        { minAmount: 5000, discountPercentage: 15 },
      ],
    },
    deliveryMessage: {
      type: String,
      default: 'Door Delivery Available',
      trim: true,
    },
    cartProgressMessage: {
      type: String,
      default: 'Add more items to unlock benefits',
      trim: true,
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

// Keep minimumOrderAmount and minOrderAmount synchronized
settingSchema.pre('save', function (next) {
  if (this.minimumOrderAmount !== undefined) {
    this.minOrderAmount = this.minimumOrderAmount;
  } else if (this.minOrderAmount !== undefined) {
    this.minimumOrderAmount = this.minOrderAmount;
  }
  next();
});

module.exports = mongoose.model('Setting', settingSchema);

