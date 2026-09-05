const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    photoURL: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'manager', 'staff'],
      default: 'customer',
      index: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    addresses: [
      {
        name: String,
        phone: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        pincode: String,
        type: { type: String, default: 'home' },
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
