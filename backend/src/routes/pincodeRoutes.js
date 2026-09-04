const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  checkPincode,
  getAllPincodesAdmin,
  createPincode,
  updatePincode,
  deletePincode,
  bulkImportPincodes,
} = require('../controllers/pincodeController');
const { protectAdmin } = require('../middleware/auth');

const importUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Public check
router.post('/check', checkPincode);

// Admin routes
router.get('/admin/all', protectAdmin, getAllPincodesAdmin);
router.post('/admin', protectAdmin, createPincode);
router.put('/admin/:id', protectAdmin, updatePincode);
router.delete('/admin/:id', protectAdmin, deletePincode);
router.post('/admin/bulk-import', protectAdmin, importUpload.single('file'), bulkImportPincodes);

module.exports = router;
