const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const ActivityLog = require('../models/ActivityLog');
const { exportToBuffer } = require('../utils/excelEngine');
const { logActivity } = require('../utils/activityLogger');

const getCodeNumber = (code) => {
  if (code === undefined || code === null || code === '') return 999999;
  const clean = String(code).trim().replace(/^#+/, '');
  const match = clean.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    return isNaN(num) ? 999999 : num;
  }
  const num = parseInt(clean, 10);
  return isNaN(num) ? 999999 : num;
};

const formatProductCode = (code) => {
  if (code === undefined || code === null || code === '') return '—';
  const clean = String(code).trim().replace(/^#+/, '');
  if (!clean) return '—';
  if (/^\d+$/.test(clean)) {
    return `#${clean.padStart(2, '0')}`;
  }
  return `#${clean}`;
};

const sortProductsByCode = (products) => {
  if (!Array.isArray(products)) return [];
  return [...products].sort((a, b) => {
    const numA = getCodeNumber(a?.productCode ?? a?.code);
    const numB = getCodeNumber(b?.productCode ?? b?.code);
    if (numA !== numB) return numA - numB;
    return (a?.name || '').localeCompare(b?.name || '');
  });
};

// @desc    Get complete dashboard summary widgets & analytics
// @route   GET /api/analytics/dashboard-summary
// @access  Private (Admin)
const getDashboardSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parallel queries for high performance
    const [
      totalProducts,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      lowStockCount,
      outOfStockCount,
      revenueResult,
      todayOrders,
      todayRevenueResult,
      recentOrders,
      bestSellingProducts,
      recentLogs,
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: 'Confirmed' }),
      Order.countDocuments({ status: 'Shipped' }),
      Order.countDocuments({ status: 'Delivered' }),
      Order.countDocuments({ status: 'Cancelled' }),
      Product.countDocuments({ stockQuantity: { $gt: 0, $lte: 10 } }),
      Product.countDocuments({ stockQuantity: { $lte: 0 } }),
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, todayRevenue: { $sum: '$totalAmount' } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(6).lean(),
      Product.find({ isActive: true }).sort({ totalSold: -1 }).limit(5).populate('category', 'name').lean(),
      ActivityLog.find().sort({ createdAt: -1 }).limit(6).lean(),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    const todayRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].todayRevenue : 0;

    // 7-day sales trend aggregation
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrends = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $ne: 'Cancelled' },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          ordersCount: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      summary: {
        totalRevenue,
        todayRevenue,
        totalOrders,
        todayOrders,
        pendingOrders,
        confirmedOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalProducts,
        lowStockCount,
        outOfStockCount,
      },
      dailyTrends,
      recentOrders,
      bestSellingProducts,
      recentLogs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export data to Excel or CSV
// @route   GET /api/analytics/export
// @access  Private (Admin)
const exportData = async (req, res, next) => {
  try {
    const { type = 'orders', format = 'xlsx' } = req.query;
    let exportData = [];
    let fileName = `s2c-export-${type}-${Date.now()}`;
    let sheetName = 'Export';

    switch (type) {
      case 'products':
        sheetName = 'Products';
        fileName = `s2c-products-${Date.now()}`;
        const rawProducts = await Product.find().populate('category', 'name').lean();
        const sortedProducts = sortProductsByCode(rawProducts);
        exportData = sortedProducts.map((p) => ({
          'Code': formatProductCode(p.productCode),
          'Product ID': p._id.toString(),
          'Product Name': p.name,
          'Category': p.category ? p.category.name : 'Uncategorized',
          'Price (INR)': p.price,
          'Original Price': p.originalPrice || p.price,
          'Stock Quantity': p.stockQuantity,
          'Total Sold': p.totalSold || 0,
          'Is Featured': p.isFeatured ? 'Yes' : 'No',
          'Status': p.isActive ? 'Active' : 'Hidden',
          'Description': p.description,
          'Created Date': new Date(p.createdAt).toLocaleDateString('en-IN'),
        }));
        break;

      case 'inventory':
        sheetName = 'Inventory';
        fileName = `s2c-inventory-${Date.now()}`;
        const rawInventoryProducts = await Product.find().populate('category', 'name').lean();
        const sortedInventoryProducts = sortProductsByCode(rawInventoryProducts);
        exportData = sortedInventoryProducts.map((p) => {
          let stockStatus = 'In Stock';
          if (p.stockQuantity <= 0) stockStatus = 'OUT OF STOCK';
          else if (p.stockQuantity <= 10) stockStatus = 'LOW STOCK';

          return {
            'Code': formatProductCode(p.productCode),
            'Product ID': p._id.toString(),
            'Product Name': p.name,
            'Category': p.category ? p.category.name : 'N/A',
            'Stock Status': stockStatus,
            'Current Stock': p.stockQuantity,
            'Price (INR)': p.price,
            'Total Value in Stock (INR)': p.price * p.stockQuantity,
            'Units Sold': p.totalSold || 0,
          };
        });
        break;

      case 'orders':
        sheetName = 'Orders';
        fileName = `s2c-orders-${Date.now()}`;
        const orders = await Order.find().sort({ createdAt: -1 }).lean();
        exportData = orders.map((o) => ({
          'Order ID': o.orderId,
          'Order Date': new Date(o.createdAt).toLocaleString('en-IN'),
          'Customer Name': o.customerDetails.name,
          'Customer Phone': o.customerDetails.phone,
          'Customer Email': o.customerDetails.email || '',
          'Delivery Address': o.customerDetails.address,
          'City': o.customerDetails.city,
          'PIN Code': o.customerDetails.pincode,
          'Items Ordered': o.items.map((i) => `${i.quantity}x ${i.name}`).join(' | '),
          'Total Items Qty': o.items.reduce((sum, i) => sum + i.quantity, 0),
          'Subtotal (INR)': o.subtotal,
          'Delivery Fee (INR)': o.deliveryFee,
          'Grand Total (INR)': o.totalAmount,
          'Payment Mode': o.paymentMethod,
          'Order Status': o.status,
        }));
        break;

      case 'customers':
        sheetName = 'Customers';
        fileName = `s2c-customers-${Date.now()}`;
        const customers = await Customer.find().sort({ totalSpent: -1 }).lean();
        exportData = customers.map((c) => ({
          'Customer Name': c.name,
          'Phone': c.phone,
          'Email': c.email || '',
          'City': c.city || '',
          'PIN Code': c.pincode || '',
          'Total Orders Placed': c.totalOrders,
          'Total Spent (INR)': c.totalSpent,
          'Last Order Date': c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('en-IN') : 'N/A',
        }));
        break;

      case 'activity-logs':
        sheetName = 'ActivityLogs';
        fileName = `s2c-activity-logs-${Date.now()}`;
        const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(500).lean();
        exportData = logs.map((l) => ({
          'Timestamp': new Date(l.createdAt).toLocaleString('en-IN'),
          'Admin User': l.adminName,
          'Action Type': l.actionType,
          'Entity Type': l.entityType,
          'Entity ID': l.entityId,
          'Action Details': l.details,
          'IP Address': l.ipAddress || '',
        }));
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid export type specified.' });
    }

    if (exportData.length === 0) {
      exportData = [{ Message: 'No records available to export for this dataset.' }];
    }

    const fileBuffer = exportToBuffer(exportData, sheetName, format);

    await logActivity({
      admin: req.admin,
      actionType: 'DATA_EXPORT',
      entityType: 'System',
      details: `Exported ${type} data in ${format.toUpperCase()} format (${exportData.length} records)`,
      req,
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      return res.send(fileBuffer);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xlsx"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  exportData,
};
