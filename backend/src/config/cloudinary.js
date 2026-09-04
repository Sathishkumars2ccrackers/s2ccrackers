const cloudinary = require('cloudinary').v2;

// Configure Cloudinary SDK v2
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Extract Cloudinary public_id from a full Cloudinary CDN URL
 * Examples:
 * https://res.cloudinary.com/s9wbnb4d/image/upload/v1725478900/s2c_crackers/products/prod-12345.webp
 * -> "s2c_crackers/products/prod-12345"
 * 
 * @param {string} url 
 * @returns {string|null}
 */
const extractPublicId = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com') && !url.includes('res.cloudinary')) {
    // If it's already a public_id (not a full URL)
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      return url;
    }
    return null;
  }

  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    let pathAfterUpload = url.substring(uploadIndex + 8);
    // Remove version segment if present (e.g. "v1725478900/")
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
    // Remove file extension
    const lastDotIndex = pathAfterUpload.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      pathAfterUpload = pathAfterUpload.substring(0, lastDotIndex);
    }
    return pathAfterUpload;
  } catch (err) {
    console.error('❌ Error extracting Cloudinary public ID:', err.message);
    return null;
  }
};

/**
 * Delete an image from Cloudinary by public ID or Cloudinary URL
 * @param {string} publicIdOrUrl 
 * @returns {Promise<object|null>}
 */
const deleteCloudinaryImage = async (publicIdOrUrl) => {
  if (!publicIdOrUrl) return null;

  try {
    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
      publicId = extractPublicId(publicIdOrUrl);
    }

    if (!publicId) {
      return null;
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: 'image',
    });
    console.log(`🗑️ Cloudinary image deleted: ${publicId} (Result: ${result.result})`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to delete Cloudinary image (${publicIdOrUrl}):`, error.message);
    return null;
  }
};

/**
 * Upload a memory buffer directly to Cloudinary
 * @param {Buffer} buffer 
 * @param {string} folder 
 * @param {object} options 
 * @returns {Promise<object>}
 */
const uploadBufferToCloudinary = (buffer, folder = 's2c_crackers/products', options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: 'image',
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    stream.end(buffer);
  });
};

module.exports = {
  cloudinary,
  extractPublicId,
  deleteCloudinaryImage,
  uploadBufferToCloudinary,
};
