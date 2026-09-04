const express = require('express');
const router = express.Router();
const {
  getActiveBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController');
const { protectAdmin } = require('../middleware/auth');
const { upload, optimizeBannerImage } = require('../middleware/imageOptimizer');

router.get('/', getActiveBanners);
router.get('/admin/all', protectAdmin, getAllBannersAdmin);
router.post('/admin', protectAdmin, upload.single('image'), optimizeBannerImage, createBanner);
router.put('/admin/:id', protectAdmin, upload.single('image'), optimizeBannerImage, updateBanner);
router.delete('/admin/:id', protectAdmin, deleteBanner);

module.exports = router;
