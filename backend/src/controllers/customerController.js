const Customer = require('../models/Customer');
const Order = require('../models/Order');

// @desc    Get all customers (Admin)
// @route   GET /api/customers/admin/all
// @access  Private (Admin)
const getAllCustomersAdmin = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { phone: searchRegex }, { city: searchRegex }, { pincode: searchRegex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ lastOrderAt: -1 }).skip(skip).limit(limitNum).lean(),
      Customer.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      customers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single customer profile & orders (Admin)
// @route   GET /api/customers/admin/:id
// @access  Private (Admin)
const getCustomerDetailsAdmin = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const orders = await Order.find({ 'customerDetails.phone': customer.phone })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      customer,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCustomersAdmin,
  getCustomerDetailsAdmin,
};
