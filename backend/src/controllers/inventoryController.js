const Product = require('../models/Product');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get Inventory Overview & Stats
// @route   GET /api/inventory/overview
// @access  Private (Admin)
const getInventoryOverview = async (req, res, next) => {
  try {
    const [totalProducts, outOfStockCount, lowStockCount, inStockCount] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, stockQuantity: { $lte: 0 } }),
      Product.countDocuments({ isActive: true, stockQuantity: { $gt: 0, $lte: 10 } }),
      Product.countDocuments({ isActive: true, stockQuantity: { $gt: 10 } }),
    ]);

    // Fetch low and out of stock products for fast dashboard widgets
    const urgentRestockList = await Product.find({
      isActive: true,
      stockQuantity: { $lte: 10 },
    })
      .populate('category', 'name')
      .sort({ stockQuantity: 1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        outOfStockCount,
        lowStockCount,
        inStockCount,
      },
      urgentRestockList,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Adjust single product stock inline
// @route   PATCH /api/inventory/adjust/:id
// @access  Private (Admin)
const adjustStock = async (req, res, next) => {
  try {
    const { stockQuantity, reason } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (stockQuantity === undefined || isNaN(stockQuantity)) {
      return res.status(400).json({ success: false, message: 'Valid stock quantity is required.' });
    }

    const previousStock = product.stockQuantity;
    const newStock = Math.max(0, parseInt(stockQuantity, 10));
    product.stockQuantity = newStock;
    await product.save();

    await logActivity({
      admin: req.admin,
      actionType: 'STOCK_UPDATE',
      entityType: 'Product',
      entityId: product._id,
      details: `Manual inventory adjustment for "${product.name}": changed from ${previousStock} to ${newStock}. Reason: ${reason || 'Manual Admin Adjust'}`,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Stock for "${product.name}" updated to ${newStock}`,
      product,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventoryOverview,
  adjustStock,
};
