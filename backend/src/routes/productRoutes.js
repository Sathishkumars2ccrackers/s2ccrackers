const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getProducts,
  getBrands,
  getProductByIdentifier,
  getFeaturedShowcase,
  getAllProductsAdmin,
  checkDuplicateProductName,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  toggleFeaturedStatus,
  bulkUpdateStock,
  bulkUpdatePrice,
  importProducts,
} = require('../controllers/productController');
const { protectAdmin } = require('../middleware/auth');
const { uploadProduct } = require('../middleware/cloudinaryUpload');

// Memory storage for bulk import file (.xlsx / .csv)
const importUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Public Routes
router.get('/', getProducts);
router.get('/meta/brands', getBrands);
router.get('/featured/showcase', getFeaturedShowcase);
router.get('/:identifier', getProductByIdentifier);

// Admin Routes
router.get('/admin/all', protectAdmin, getAllProductsAdmin);
router.post('/admin/check-duplicate', protectAdmin, checkDuplicateProductName);
router.post('/admin', protectAdmin, uploadProduct.array('images', 6), createProduct);
router.put('/admin/:id', protectAdmin, uploadProduct.array('images', 6), updateProduct);
router.delete('/admin/:id', protectAdmin, deleteProduct);
router.patch('/admin/:id/toggle-status', protectAdmin, toggleProductStatus);
router.patch('/admin/:id/toggle-featured', protectAdmin, toggleFeaturedStatus);
router.post('/admin/bulk-stock-update', protectAdmin, bulkUpdateStock);
router.post('/admin/bulk-price-update', protectAdmin, bulkUpdatePrice);
router.post('/admin/import', protectAdmin, importUpload.single('file'), importProducts);

module.exports = router;
