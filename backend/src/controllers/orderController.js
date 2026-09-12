const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Setting = require('../models/Setting');
const { generateOrderId } = require('../utils/orderIdGenerator');
const { sendCustomerOrderConfirmationEmail, sendAdminNewOrderAlertEmail } = require('../config/mailer');
const { logActivity } = require('../utils/activityLogger');

// Calculate highest matching discount slab from business settings
const calculateDiscount = (subtotal, slabs = []) => {
  if (!slabs || !Array.isArray(slabs) || slabs.length === 0 || subtotal <= 0) {
    return { discountPercentage: 0, discountAmount: 0 };
  }

  const matchingSlabs = slabs.filter((s) => subtotal >= s.minAmount && s.discountPercentage > 0);
  if (matchingSlabs.length === 0) {
    return { discountPercentage: 0, discountAmount: 0 };
  }

  // Pick highest matching minimum amount slab (or highest discount %)
  matchingSlabs.sort((a, b) => b.minAmount - a.minAmount || b.discountPercentage - a.discountPercentage);
  const bestSlab = matchingSlabs[0];
  const discountPercentage = bestSlab.discountPercentage;
  const discountAmount = Math.round((subtotal * discountPercentage) / 100);

  return { discountPercentage, discountAmount };
};

// Generate pre-filled WhatsApp confirmation message
const buildWhatsAppMessage = (order, businessPhone = '919944476516') => {
  const itemsText = order.items
    .map((item) => `- ${item.quantity}x ${item.name} (₹${item.price * item.quantity})`)
    .join('\n');

  let discountText = '';
  if (order.discountAmount > 0) {
    discountText = `\nItems Subtotal: ₹${order.subtotal}\nSpecial Discount (${order.discountPercentage}%): -₹${order.discountAmount}\nDelivery: ${order.deliveryFee > 0 ? '₹' + order.deliveryFee : 'FREE'}`;
  }

  const rawMessage = `Hello S2C Crackers,\n\nI have placed an order through the website.\n\nOrder ID: ${order.orderId}\nCustomer Name: ${order.customerDetails.name}\nPhone Number: ${order.customerDetails.phone}\n\nOrdered Items:\n${itemsText}${discountText}\n\nTotal Amount: ₹${order.totalAmount}\nPayment Method: Door Delivery Available\nDelivery Address: ${order.customerDetails.address}, ${order.customerDetails.city} - ${order.customerDetails.pincode}\n\nPlease confirm my order.`;

  const encodedMessage = encodeURIComponent(rawMessage);
  const cleanNumber = businessPhone.replace(/[^0-9]/g, '');
  return {
    rawMessage,
    whatsappUrl: `https://wa.me/${cleanNumber}?text=${encodedMessage}`,
  };
};

// @desc    Place a new customer order (Door Delivery)
// @route   POST /api/orders
// @access  Public
const placeOrder = async (req, res, next) => {
  try {
    const { customerDetails, items: rawItems, notes, uid } = req.body;

    if (!customerDetails || !rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain valid customer details and at least one item.',
      });
    }

    const { name, phone, address, city, pincode } = customerDetails;
    if (!name || !phone || !address || !city || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Name, Phone, Address, City, and Pincode are required.',
      });
    }

    const cleanPin = pincode.toString().trim();

    // 1. Validate Items & Stock Availability
    const productIds = rawItems.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    let calculatedSubtotal = 0;
    const validatedItems = [];
    const stockErrors = [];

    for (const item of rawItems) {
      const product = productMap.get(item.productId.toString());

      if (!product || !product.isActive) {
        stockErrors.push(`Product "${item.name || 'Selected item'}" is no longer available.`);
        continue;
      }

      const requestedQty = parseInt(item.quantity, 10);
      if (isNaN(requestedQty) || requestedQty <= 0) {
        stockErrors.push(`Invalid quantity for "${product.name}".`);
        continue;
      }

      if (product.stockQuantity < requestedQty) {
        stockErrors.push(
          `Insufficient stock for "${product.name}". Only ${product.stockQuantity} box(es) remaining in stock.`
        );
        continue;
      }

      const itemSubtotal = product.price * requestedQty;
      calculatedSubtotal += itemSubtotal;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: requestedQty,
        subtotal: itemSubtotal,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
      });
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: stockErrors[0],
        errors: stockErrors,
      });
    }

    // 2. Fetch Business Settings & Calculate Delivery Fee, Discount Slabs & Thresholds
    const setting = (await Setting.findOne()) || {
      minimumOrderAmount: 500,
      minOrderAmount: 500,
      freeDeliveryThreshold: 3000,
      defaultDeliveryFee: 150,
      discountSlabs: [
        { minAmount: 1000, discountPercentage: 5 },
        { minAmount: 3000, discountPercentage: 10 },
        { minAmount: 5000, discountPercentage: 15 },
      ],
      whatsappNumber: '919944476516',
    };

    const minRequired = setting.minimumOrderAmount !== undefined ? setting.minimumOrderAmount : (setting.minOrderAmount || 500);

    if (calculatedSubtotal < minRequired) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${minRequired}. Please add more items to place your festival order.`,
      });
    }

    const { discountPercentage, discountAmount } = calculateDiscount(calculatedSubtotal, setting.discountSlabs);

    const freeThreshold = setting.freeDeliveryThreshold !== undefined ? setting.freeDeliveryThreshold : 3000;
    const defaultFee = setting.defaultDeliveryFee !== undefined ? setting.defaultDeliveryFee : 150;
    const deliveryFee = calculatedSubtotal >= freeThreshold ? 0 : defaultFee;
    const totalAmount = Math.max(0, calculatedSubtotal - discountAmount + deliveryFee);

    // 3. Generate Order ID (S2C-YYYYMMDD-XXXXXX)
    let orderId = generateOrderId();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      const existing = await Order.findOne({ orderId });
      if (!existing) {
        isUnique = true;
      } else {
        orderId = generateOrderId();
        attempts++;
      }
    }

    // 4. Create Order
    const cleanUid = (uid || customerDetails?.uid || '').toString().trim();
    const order = await Order.create({
      orderId,
      uid: cleanUid,
      customerDetails: {
        name: name.trim(),
        phone: phone.trim(),
        altPhone: customerDetails.altPhone ? customerDetails.altPhone.trim() : '',
        email: customerDetails.email ? customerDetails.email.trim().toLowerCase() : '',
        address: address.trim(),
        city: city.trim(),
        pincode: cleanPin,
        landmark: customerDetails.landmark ? customerDetails.landmark.trim() : '',
        state: customerDetails.state ? customerDetails.state.trim() : 'Tamil Nadu',
      },
      items: validatedItems,
      subtotal: calculatedSubtotal,
      discountPercentage,
      discountAmount,
      deliveryFee,
      totalAmount,
      paymentMethod: 'Door Delivery Available',
      status: 'Pending',
      notes: notes ? notes.trim() : '',
    });

    // 6. Automatically Deduct Inventory & Increment Total Sold
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          stockQuantity: -item.quantity,
          totalSold: item.quantity,
        },
      });
    }

    // 7. Update Customer Profile Aggregation
    const customerPhone = phone.trim();
    let customer = await Customer.findOne({ phone: customerPhone });
    if (customer) {
      customer.name = name.trim();
      if (customerDetails.email) customer.email = customerDetails.email.trim().toLowerCase();
      customer.address = address.trim();
      customer.city = city.trim();
      customer.pincode = cleanPin;
      customer.totalOrders += 1;
      customer.totalSpent += totalAmount;
      customer.lastOrderAt = new Date();
      await customer.save();
    } else {
      await Customer.create({
        name: name.trim(),
        phone: customerPhone,
        email: customerDetails.email ? customerDetails.email.trim().toLowerCase() : '',
        address: address.trim(),
        city: city.trim(),
        pincode: cleanPin,
        totalOrders: 1,
        totalSpent: totalAmount,
        lastOrderAt: new Date(),
      });
    }

    // 8. Generate WhatsApp Link Payload
    const whatsappPayload = buildWhatsAppMessage(order, setting.whatsappNumber || '919944476516');

    // 9. Dispatch Non-blocking Email Notifications
    sendCustomerOrderConfirmationEmail(order).catch((err) =>
      console.error('Customer email trigger failed:', err.message)
    );
    sendAdminNewOrderAlertEmail(order).catch((err) =>
      console.error('Admin email alert trigger failed:', err.message)
    );

    res.status(201).json({
      success: true,
      message: 'Your festival order has been placed successfully!',
      orderId: order.orderId,
      order,
      whatsapp: whatsappPayload,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track order securely by Order ID and Phone Number
// @route   POST /api/orders/track
// @access  Public (Rate-limited)
const trackOrder = async (req, res, next) => {
  try {
    const { orderId, phone } = req.body || {};

    const genericNotFoundMessage = 'Order not found. Please verify your Order ID and Phone Number.';

    if (!orderId || !phone || !orderId.toString().trim() || !phone.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: genericNotFoundMessage,
      });
    }

    const cleanOrderId = orderId.toString().trim().toUpperCase();
    const cleanPhoneDigits = phone.toString().replace(/\D/g, '');

    if (!cleanPhoneDigits) {
      return res.status(400).json({
        success: false,
        message: genericNotFoundMessage,
      });
    }

    const order = await Order.findOne({ orderId: cleanOrderId }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: genericNotFoundMessage,
      });
    }

    // Phone normalization helper
    const normalizePhone = (p) => (p ? p.toString().replace(/\D/g, '') : '');

    const candidatePhones = [
      normalizePhone(order.customerDetails?.phone),
      normalizePhone(order.customerDetails?.altPhone),
      normalizePhone(order.customerDetails?.alternatePhone),
      normalizePhone(order.customerDetails?.secondaryPhone),
    ].filter(Boolean);

    const last10Digits = cleanPhoneDigits.length >= 10 ? cleanPhoneDigits.slice(-10) : cleanPhoneDigits;

    const isMatch = candidatePhones.some((stored) => {
      if (stored === cleanPhoneDigits) return true;
      if (last10Digits && stored.endsWith(last10Digits)) return true;
      if (stored.length >= 10 && cleanPhoneDigits.length >= 10 && stored.slice(-10) === cleanPhoneDigits.slice(-10)) return true;
      return false;
    });

    if (!isMatch) {
      return res.status(404).json({
        success: false,
        message: genericNotFoundMessage,
      });
    }

    // Derive dispatch status label
    let dispatchStatusLabel = order.dispatchStatus || 'Order Placed';
    if (!order.dispatchStatus) {
      if (order.status === 'Shipped') dispatchStatusLabel = 'Dispatched / In Transit';
      else if (order.status === 'Packed') dispatchStatusLabel = 'Factory Packed';
      else if (order.status === 'Delivered') dispatchStatusLabel = 'Delivered';
      else if (order.status === 'Cancelled') dispatchStatusLabel = 'Order Cancelled';
      else if (order.status === 'Confirmed') dispatchStatusLabel = 'Confirmed';
      else dispatchStatusLabel = 'Order Placed';
    }

    // Sanitize response strictly for privacy and security
    // NEVER expose customer phone numbers, emails, internal admin notes, or admin user IDs
    const sanitizedOrder = {
      orderId: order.orderId,
      customerName: order.customerDetails?.name || 'Valued Customer',
      customerDetails: {
        name: order.customerDetails?.name || 'Valued Customer',
        address: order.customerDetails?.address || '',
        city: order.customerDetails?.city || '',
        state: order.customerDetails?.state || 'Tamil Nadu',
        pincode: order.customerDetails?.pincode || '',
        landmark: order.customerDetails?.landmark || '',
      },
      orderDate: order.createdAt,
      createdAt: order.createdAt,
      orderStatus: order.status,
      status: order.status,
      dispatchStatus: dispatchStatusLabel,
      trackingNumber: order.trackingNumber || '',
      courierName: order.courierName || 'Sivakasi Surface Transport',
      estimatedDelivery: order.estimatedDelivery || (order.status === 'Delivered' ? 'Delivered' : '3-5 Business Days'),
      items: (order.items || []).map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal || item.price * item.quantity,
        image: item.image || '',
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod || 'Door Delivery Available',
      cancellationReason: order.status === 'Cancelled' ? (order.cancellationReason || 'No reason provided') : '',
      cancelledAt: order.status === 'Cancelled' ? order.cancelledAt : null,
      statusHistory: (order.statusHistory || []).map((h) => ({
        status: h.status,
        timestamp: h.timestamp,
        note: h.note || '',
      })),
    };

    res.status(200).json({
      success: true,
      order: sanitizedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details by Order ID (Admin Only)
// @route   GET /api/orders/admin/by-id/:orderId
// @access  Private (Admin)
const getOrderByOrderId = async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId.toUpperCase() }).lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const setting = (await Setting.findOne()) || { whatsappNumber: '919944476516' };
    const whatsappPayload = buildWhatsAppMessage(order, setting.whatsappNumber || '919944476516');

    res.status(200).json({
      success: true,
      order,
      whatsapp: whatsappPayload,
    });
  } catch (error) {
    next(error);
  }
};
// ================= ADMIN CONTROLLERS =================

// @desc    Get all orders for Admin with filters and pagination
// @route   GET /api/orders/admin/all
// @access  Private (Admin)
const getAllOrdersAdmin = async (req, res, next) => {
  try {
    const { status, search, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderId: searchRegex },
        { 'customerDetails.name': searchRegex },
        { 'customerDetails.phone': searchRegex },
        { 'customerDetails.city': searchRegex },
        { 'customerDetails.pincode': searchRegex },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Order Status
// @route   PATCH /api/orders/admin/:id/status
// @access  Private (Admin)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const validStatuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status value.' });
    }

    const oldStatus = order.status;
    order.status = status;

    // Handle cancellation state transitions
    if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
      order.cancellationReason = note?.trim() || 'No reason provided';
      order.cancelledAt = new Date();
    } else if (oldStatus === 'Cancelled' && status !== 'Cancelled') {
      order.cancellationReason = '';
      order.cancelledAt = null;
    }

    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated from ${oldStatus} to ${status}`,
      updatedBy: req.admin ? req.admin.name : 'Admin',
    });

    await order.save();

    // If order was transitioned to Cancelled, restock inventory
    if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: {
            stockQuantity: item.quantity,
            totalSold: -item.quantity,
          },
        });
      }
    } else if (oldStatus === 'Cancelled' && status !== 'Cancelled') {
      // Re-deduct if un-cancelled
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: {
            stockQuantity: -item.quantity,
            totalSold: item.quantity,
          },
        });
      }
    }

    await logActivity({
      admin: req.admin,
      actionType: status === 'Cancelled' ? 'ORDER_CANCEL' : 'ORDER_STATUS_UPDATE',
      entityType: 'Order',
      entityId: order.orderId,
      details: `Updated order ${order.orderId} status from "${oldStatus}" to "${status}"${status === 'Cancelled' ? ' (Inventory automatically restocked)' : ''}`,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}${status === 'Cancelled' ? ' and items restocked' : ''}`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel Order & Restock inventory
// @route   PATCH /api/orders/admin/:id/cancel
// @access  Private (Admin)
const cancelOrderAdmin = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled.' });
    }

    const cancellationReason = reason && typeof reason === 'string' && reason.trim() ? reason.trim() : 'No reason provided';
    const cancelledAt = new Date();

    order.status = 'Cancelled';
    order.cancellationReason = cancellationReason;
    order.cancelledAt = cancelledAt;

    order.statusHistory.push({
      status: 'Cancelled',
      timestamp: cancelledAt,
      note: `Cancelled by Admin: ${cancellationReason}`,
      updatedBy: req.admin ? req.admin.name : 'Admin',
    });

    await order.save();

    // Restock items back to inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          stockQuantity: item.quantity,
          totalSold: -item.quantity,
        },
      });
    }

    await logActivity({
      admin: req.admin,
      actionType: 'ORDER_CANCEL',
      entityType: 'Order',
      entityId: order.orderId,
      details: `Cancelled order ${order.orderId} and restocked inventory items. Reason: ${reason || 'N/A'}`,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Order ${order.orderId} has been cancelled and products restocked.`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  placeOrder,
  trackOrder,
  getOrderByOrderId,
  getAllOrdersAdmin,
  updateOrderStatus,
  cancelOrderAdmin,
};
