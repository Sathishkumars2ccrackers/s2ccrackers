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
const { uploadBanner } = require('../middleware/cloudinaryUpload');

router.get('/', getActiveBanners);
router.get('/admin/all', protectAdmin, getAllBannersAdmin);
router.post('/admin', protectAdmin, uploadBanner.single('image'), createBanner);
router.put('/admin/:id', protectAdmin, uploadBanner.single('image'), updateBanner);
router.delete('/admin/:id', protectAdmin, deleteBanner);

module.exports = router;
