const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

// File type filter: JPG, PNG, WebP, GIF
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WebP images are allowed.'), false);
  }
};

// 1. Cloudinary Storage for Product Images
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 's2c_crackers/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
    ],
    public_id: (req, file) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      const cleanName = (file.originalname || 'product')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 30);
      return `prod-${cleanName}-${uniqueSuffix}`;
    },
  },
});

// 2. Cloudinary Storage for Promotional & Hero Banners
const bannerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 's2c_crackers/banners',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { width: 1920, height: 1080, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
    ],
    public_id: (req, file) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      const cleanName = (file.originalname || 'banner')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 30);
      return `banner-${cleanName}-${uniqueSuffix}`;
    },
  },
});

// Multer Upload Instances
const uploadProduct = multer({
  storage: productStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

const uploadBanner = multer({
  storage: bannerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

module.exports = {
  uploadProduct,
  uploadBanner,
  productStorage,
  bannerStorage,
};
