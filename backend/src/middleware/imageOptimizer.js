const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// In-memory storage for raw incoming buffer
const storage = multer.memoryStorage();

// File type filter: JPG, PNG, WebP, GIF
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB limit
  fileFilter,
});

/**
 * Middleware to optimize uploaded product images
 */
const optimizeProductImages = async (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }

  const uploadDir = path.join(__dirname, '../../uploads/products');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  try {
    const rawFiles = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    const processedUrls = [];

    for (const file of rawFiles) {
      if (!file || !file.buffer) continue;

      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      const baseFilename = `prod-${uniqueSuffix}`;
      const mainFilename = `${baseFilename}.webp`;
      const thumbFilename = `${baseFilename}-thumb.webp`;

      const mainFilePath = path.join(uploadDir, mainFilename);
      const thumbFilePath = path.join(uploadDir, thumbFilename);

      // 1. Process Main Image: Max 1200px width/height, WebP quality 82
      await sharp(file.buffer)
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toFile(mainFilePath);

      // 2. Process Thumbnail: 300x300 cover crop for fast grid rendering
      await sharp(file.buffer)
        .resize({ width: 300, height: 300, fit: 'cover' })
        .webp({ quality: 75 })
        .toFile(thumbFilePath);

      processedUrls.push(`/uploads/products/${mainFilename}`);
    }

    req.optimizedImages = processedUrls;
    if (processedUrls.length === 1) {
      req.optimizedImage = processedUrls[0];
    }
    next();
  } catch (error) {
    console.error('❌ Image optimization error:', error.message);
    next(new Error(`Failed to process and optimize image: ${error.message}`));
  }
};

/**
 * Middleware to optimize uploaded banner images
 */
const optimizeBannerImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const uploadDir = path.join(__dirname, '../../uploads/banners');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  try {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const mainFilename = `banner-${uniqueSuffix}.webp`;
    const mainFilePath = path.join(uploadDir, mainFilename);

    // Banner: Max 1920px width, WebP quality 85
    await sharp(req.file.buffer)
      .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(mainFilePath);

    req.optimizedBanner = `/uploads/banners/${mainFilename}`;
    next();
  } catch (error) {
    console.error('❌ Banner optimization error:', error.message);
    next(new Error(`Failed to optimize banner image: ${error.message}`));
  }
};

module.exports = {
  upload,
  optimizeProductImages,
  optimizeBannerImage,
};
