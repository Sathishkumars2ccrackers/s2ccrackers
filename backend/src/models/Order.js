const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: String,
      default: 'System',
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    uid: {
      type: String,
      default: '',
      index: true,
    },
    customerDetails: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, '10-digit phone number is required'],
        trim: true,
        index: true,
      },
      altPhone: {
        type: String,
        default: '',
        trim: true,
      },
      alternatePhone: {
        type: String,
        default: '',
        trim: true,
      },
      secondaryPhone: {
        type: String,
        default: '',
        trim: true,
      },
      email: {
        type: String,
        default: '',
        trim: true,
        lowercase: true,
      },
      address: {
        type: String,
        required: [true, 'Delivery address is required'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        trim: true,
        index: true,
      },
      landmark: {
        type: String,
        default: '',
        trim: true,
      },
      state: {
        type: String,
        default: 'Tamil Nadu',
        trim: true,
      },
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Order must contain at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['COD'],
      default: 'COD',
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    dispatchStatus: {
      type: String,
      default: 'Order Placed',
      trim: true,
    },
    trackingNumber: {
      type: String,
      default: '',
      trim: true,
    },
    courierName: {
      type: String,
      default: 'Sivakasi Surface Transport',
      trim: true,
    },
    estimatedDelivery: {
      type: String,
      default: '3-5 Business Days',
      trim: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: function () {
        return [
          {
            status: 'Pending',
            timestamp: new Date(),
            note: 'Order placed by customer (Cash on Delivery)',
            updatedBy: 'Customer',
          },
        ];
      },
    },
    notes: {
      type: String,
      default: '',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    isWhatsAppConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound indexes for rapid admin filtering and search
orderSchema.index({ 'customerDetails.phone': 1, orderId: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ uid: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
