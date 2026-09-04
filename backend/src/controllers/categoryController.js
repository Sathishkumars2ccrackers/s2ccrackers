const Category = require('../models/Category');
const Product = require('../models/Product');
const { generateSlug } = require('../utils/excelEngine');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get all active categories (Public)
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories for Admin (including inactive) with product counts
// @route   GET /api/categories/admin/all
// @access  Private (Admin)
const getAllCategoriesAdmin = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1, createdAt: -1 }).lean();

    // Attach product counts for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ category: cat._id });
        return { ...cat, productCount };
      })
    );

    res.status(200).json({ success: true, categories: categoriesWithCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Category
// @route   POST /api/categories
// @access  Private (Admin)
const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, icon, displayOrder, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const slug = generateSlug(name);
    const existing = await Category.findOne({ $or: [{ name: name.trim() }, { slug }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A category with this name or slug already exists.' });
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description || '',
      image: image || '',
      icon: icon || 'Sparkles',
      displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    await logActivity({
      admin: req.admin,
      actionType: 'SETTINGS_UPDATE',
      entityType: 'System',
      entityId: category._id,
      details: `Created new category: ${category.name}`,
      req,
    });

    res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
const updateCategory = async (req, res, next) => {
  try {
    const { name, description, image, icon, displayOrder, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name && name.trim() !== category.name) {
      category.name = name.trim();
      category.slug = generateSlug(name);
    }

    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (icon !== undefined) category.icon = icon;
    if (displayOrder !== undefined) category.displayOrder = parseInt(displayOrder, 10);
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    await logActivity({
      admin: req.admin,
      actionType: 'SETTINGS_UPDATE',
      entityType: 'System',
      entityId: category._id,
      details: `Updated category: ${category.name}`,
      req,
    });

    res.status(200).json({ success: true, message: 'Category updated successfully', category });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if products are assigned
    const productsUsing = await Product.countDocuments({ category: category._id });
    if (productsUsing > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}" because ${productsUsing} products are currently assigned to it. Please reassign or delete the products first.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    await logActivity({
      admin: req.admin,
      actionType: 'SETTINGS_UPDATE',
      entityType: 'System',
      entityId: req.params.id,
      details: `Deleted category: ${category.name}`,
      req,
    });

    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
};
