// Backwards-compatible re-export for cloudinaryUpload
const { uploadProduct, uploadBanner } = require('./cloudinaryUpload');

module.exports = {
  upload: uploadProduct,
  uploadProduct,
  uploadBanner,
  // Pass-through middlewares if routes use them
  optimizeProductImages: (req, res, next) => next(),
  optimizeBannerImage: (req, res, next) => next(),
};
