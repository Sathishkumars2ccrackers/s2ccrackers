const mongoose = require('mongoose');

const pincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: [true, '6-digit Pincode is required'],
      unique: true,
      trim: true,
      match: [/^[1-9][0-9]{5}$/, 'Please provide a valid 6-digit Indian PIN code'],
      index: true,
    },
    city: {
      type: String,
      required: [true, 'City name is required'],
      trim: true,
    },
    state: {
      type: String,
      default: 'Tamil Nadu',
      trim: true,
    },
    deliveryFee: {
      type: Number,
      default: 150,
      min: 0,
    },
    estimatedDays: {
      type: String,
      default: '2-4 business days',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pincode', pincodeSchema);
