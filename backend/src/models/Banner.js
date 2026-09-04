const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    badge: {
      type: String,
      default: 'MEGA FESTIVAL SALE',
      trim: true,
    },
    discountTag: {
      type: String,
      default: 'Up to 80% Off Sivakasi Crackers',
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Banner image is required'],
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    linkUrl: {
      type: String,
      default: '/products',
      trim: true,
    },
    buttonText: {
      type: String,
      default: 'Shop Crackers Now',
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
