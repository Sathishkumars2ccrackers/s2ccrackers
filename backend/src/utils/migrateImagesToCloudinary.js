const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { cloudinary, extractPublicId } = require('../config/cloudinary');
const Product = require('../models/Product');
const Banner = require('../models/Banner');

const migrateImagesToCloudinary = async () => {
  console.log('=====================================================');
  console.log('🚀 S2C Crackers: Starting Image Migration to Cloudinary');
  console.log('=====================================================');

  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/s2ccrackers';
  console.log(`🔌 Connecting to MongoDB: ${mongoURI}`);

  try {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connected successfully.');
  } catch (dbErr) {
    console.error('❌ Failed to connect to MongoDB:', dbErr.message);
    process.exit(1);
  }

  // Check Cloudinary credentials
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Missing Cloudinary configuration in .env!');
    process.exit(1);
  }

  console.log(`☁️ Cloudinary Account: ${process.env.CLOUDINARY_CLOUD_NAME}`);

  let productSuccess = 0;
  let productSkipped = 0;
  let productFailed = 0;

  let bannerSuccess = 0;
  let bannerSkipped = 0;
  let bannerFailed = 0;

  const uploadsBaseDir = path.join(__dirname, '../../uploads');

  // ==========================================
  // 1. Migrate Products
  // ==========================================
  console.log('\n📦 Migrating Product Images...');
  try {
    const products = await Product.find();
    console.log(`Found ${products.length} products to check.`);

    for (const product of products) {
      let isModified = false;
      const updatedImages = [];
      const updatedPublicIds = [];

      for (let i = 0; i < (product.images || []).length; i++) {
        const img = product.images[i];
        if (!img) continue;

        // Case A: Already a Cloudinary URL
        if (img.includes('cloudinary.com') || img.includes('res.cloudinary')) {
          updatedImages.push(img);
          const pid = extractPublicId(img) || '';
          updatedPublicIds.push(pid);
          continue;
        }

        // Case B: Local upload path (e.g. /uploads/products/xxx.webp)
        let localFilePath = null;
        if (img.startsWith('/uploads/')) {
          localFilePath = path.join(uploadsBaseDir, img.replace('/uploads/', ''));
        } else if (img.startsWith('uploads/')) {
          localFilePath = path.join(uploadsBaseDir, img.replace('uploads/', ''));
        } else if (!img.startsWith('http://') && !img.startsWith('https://')) {
          localFilePath = path.join(uploadsBaseDir, 'products', img);
        }

        if (localFilePath && fs.existsSync(localFilePath)) {
          try {
            console.log(`  ⬆️ Uploading local product file: ${localFilePath}`);
            const result = await cloudinary.uploader.upload(localFilePath, {
              folder: 's2c_crackers/products',
              transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
            });

            updatedImages.push(result.secure_url);
            updatedPublicIds.push(result.public_id);
            isModified = true;
            console.log(`    ✅ Migrated to: ${result.secure_url}`);
          } catch (uploadErr) {
            console.error(`    ❌ Failed to upload local file (${localFilePath}):`, uploadErr.message);
            updatedImages.push(img);
          }
        } else if (img.startsWith('http://') || img.startsWith('https://')) {
          // Case C: Remote URL (e.g. Unsplash) - Optionally mirror to Cloudinary
          try {
            console.log(`  ⬆️ Migrating remote product URL to Cloudinary: ${img.substring(0, 60)}...`);
            const result = await cloudinary.uploader.upload(img, {
              folder: 's2c_crackers/products',
              transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
            });

            updatedImages.push(result.secure_url);
            updatedPublicIds.push(result.public_id);
            isModified = true;
            console.log(`    ✅ Migrated to: ${result.secure_url}`);
          } catch (remoteErr) {
            console.warn(`    ⚠️ Could not upload remote URL to Cloudinary, keeping original URL:`, remoteErr.message);
            updatedImages.push(img);
            updatedPublicIds.push('');
          }
        } else {
          // Unknown path, keep as is
          updatedImages.push(img);
        }
      }

      if (isModified || (product.imagePublicIds || []).length !== updatedPublicIds.length) {
        product.images = updatedImages;
        product.imagePublicIds = updatedPublicIds;
        await product.save();
        productSuccess++;
      } else {
        productSkipped++;
      }
    }
    console.log(`✅ Products migration finished: ${productSuccess} updated, ${productSkipped} already up to date.`);
  } catch (pErr) {
    console.error('❌ Error during product migration:', pErr.message);
    productFailed++;
  }

  // ==========================================
  // 2. Migrate Banners
  // ==========================================
  console.log('\n🖼️ Migrating Banner Images...');
  try {
    const banners = await Banner.find();
    console.log(`Found ${banners.length} banners to check.`);

    for (const banner of banners) {
      if (!banner.imageUrl) continue;

      // Case A: Already a Cloudinary URL
      if (banner.imageUrl.includes('cloudinary.com') || banner.imageUrl.includes('res.cloudinary')) {
        const pid = extractPublicId(banner.imageUrl) || '';
        if (!banner.imagePublicId && pid) {
          banner.imagePublicId = pid;
          await banner.save();
          bannerSuccess++;
        } else {
          bannerSkipped++;
        }
        continue;
      }

      // Case B: Local upload path
      let localFilePath = null;
      if (banner.imageUrl.startsWith('/uploads/')) {
        localFilePath = path.join(uploadsBaseDir, banner.imageUrl.replace('/uploads/', ''));
      } else if (banner.imageUrl.startsWith('uploads/')) {
        localFilePath = path.join(uploadsBaseDir, banner.imageUrl.replace('uploads/', ''));
      } else if (!banner.imageUrl.startsWith('http://') && !banner.imageUrl.startsWith('https://')) {
        localFilePath = path.join(uploadsBaseDir, 'banners', banner.imageUrl);
      }

      if (localFilePath && fs.existsSync(localFilePath)) {
        try {
          console.log(`  ⬆️ Uploading local banner file: ${localFilePath}`);
          const result = await cloudinary.uploader.upload(localFilePath, {
            folder: 's2c_crackers/banners',
            transformation: [{ width: 1920, height: 1080, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
          });

          banner.imageUrl = result.secure_url;
          banner.imagePublicId = result.public_id;
          await banner.save();
          bannerSuccess++;
          console.log(`    ✅ Migrated to: ${result.secure_url}`);
        } catch (bUploadErr) {
          console.error(`    ❌ Failed to upload banner file (${localFilePath}):`, bUploadErr.message);
          bannerFailed++;
        }
      } else if (banner.imageUrl.startsWith('http://') || banner.imageUrl.startsWith('https://')) {
        // Case C: Remote URL (e.g. Unsplash)
        try {
          console.log(`  ⬆️ Migrating remote banner URL to Cloudinary: ${banner.imageUrl.substring(0, 60)}...`);
          const result = await cloudinary.uploader.upload(banner.imageUrl, {
            folder: 's2c_crackers/banners',
            transformation: [{ width: 1920, height: 1080, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
          });

          banner.imageUrl = result.secure_url;
          banner.imagePublicId = result.public_id;
          await banner.save();
          bannerSuccess++;
          console.log(`    ✅ Migrated to: ${result.secure_url}`);
        } catch (bRemoteErr) {
          console.warn(`    ⚠️ Could not upload remote banner URL, keeping original:`, bRemoteErr.message);
          bannerSkipped++;
        }
      }
    }
    console.log(`✅ Banners migration finished: ${bannerSuccess} updated, ${bannerSkipped} already up to date.`);
  } catch (bErr) {
    console.error('❌ Error during banner migration:', bErr.message);
    bannerFailed++;
  }

  console.log('\n=====================================================');
  console.log('🎉 Migration Completed Summary:');
  console.log(`   📦 Products: ${productSuccess} migrated, ${productSkipped} unchanged, ${productFailed} errors`);
  console.log(`   🖼️ Banners:  ${bannerSuccess} migrated, ${bannerSkipped} unchanged, ${bannerFailed} errors`);
  console.log('=====================================================\n');

  await mongoose.connection.close();
  process.exit(0);
};

// Execute if run directly
if (require.main === module) {
  migrateImagesToCloudinary();
}

module.exports = migrateImagesToCloudinary;
