const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // === Product Identification & Code ===
    productCode: {
      type: String,
      trim: true,
      index: true,
      default: '',
    },
    brand: {
      type: String,
      default: 'NACHIYAR',
      trim: true,
      index: true,
    },
    piecesPerPack: {
      type: Number,
      default: 1,
    },

    // === Core Fields ===
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return Array.isArray(v);
        },
        message: 'Images must be an array of URLs',
      },
    },
    imagePublicIds: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
      index: true,
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // === Expandable Festival Details ===
    originalPrice: {
      type: Number,
      min: 0,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    soundLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Low/Kids Friendly', 'Medium Sound', 'High Sound', 'No Sound / Visual Only'],
      default: 'Medium',
    },
    regionalName: {
      type: String,
      default: '',
      trim: true,
    },
    packSize: {
      type: String,
      default: '1 Box',
      trim: true,
    },
    piecesPerBox: {
      type: Number,
      default: 1,
    },
    burningDuration: {
      type: String,
      default: '',
    },
    safetyTips: {
      type: [String],
      default: [
        'Always light with a long agarbatti/sparkler stick at arm length.',
        'Keep a bucket of water and sand nearby.',
        'Wear cotton clothes while handling fireworks.',
      ],
    },
    totalSold: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true }
);

// Text search index for fast multi-field search queries
productSchema.index({ name: 'text', description: 'text', regionalName: 'text', brand: 'text', productCode: 'text' });

// Virtual to check if in stock
productSchema.virtual('inStock').get(function () {
  return this.stockQuantity > 0;
});

module.exports = mongoose.model('Product', productSchema);

