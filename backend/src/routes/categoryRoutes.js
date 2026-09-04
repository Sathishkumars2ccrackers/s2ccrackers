const express = require('express');
const router = express.Router();
const {
  getCategories,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protectAdmin } = require('../middleware/auth');

router.get('/', getCategories);
router.get('/admin/all', protectAdmin, getAllCategoriesAdmin);
router.post('/', protectAdmin, createCategory);
router.put('/:id', protectAdmin, updateCategory);
router.delete('/:id', protectAdmin, deleteCategory);

module.exports = router;
