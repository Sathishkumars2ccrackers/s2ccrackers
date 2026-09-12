const Setting = require('../models/Setting');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Banner = require('../models/Banner');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get public site settings
// @route   GET /api/settings/public or GET /api/settings
// @access  Public
const getPublicSettings = async (req, res, next) => {
  try {
    let setting = await Setting.findOne().lean();
    if (!setting) {
      setting = await Setting.create({});
    }

    const minAmount = setting.minimumOrderAmount !== undefined ? setting.minimumOrderAmount : (setting.minOrderAmount || 500);

    res.status(200).json({
      success: true,
      settings: {
        businessName: setting.businessName || 'S2C Crackers',
        businessDomain: setting.businessDomain || 'www.s2ccrackers.com',
        phone: setting.phone || '+91 99444 76516',
        whatsappNumber: setting.whatsappNumber || '919944476516',
        email: setting.email || 's2ccrackers@gmail.com',
        address: setting.address || 'Azhagar Crackers, 570 (East Part), Singapore Nagar, Chatitapatti, Madurai - 625014, Tamil Nadu, India',
        minimumOrderAmount: minAmount,
        minOrderAmount: minAmount,
        freeDeliveryThreshold: setting.freeDeliveryThreshold !== undefined ? setting.freeDeliveryThreshold : 3000,
        defaultDeliveryFee: setting.defaultDeliveryFee !== undefined ? setting.defaultDeliveryFee : 150,
        discountSlabs: Array.isArray(setting.discountSlabs)
          ? setting.discountSlabs
          : [
              { minAmount: 1000, discountPercentage: 5 },
              { minAmount: 3000, discountPercentage: 10 },
              { minAmount: 5000, discountPercentage: 15 },
            ],
        deliveryMessage: setting.deliveryMessage || 'Door Delivery Available',
        cartProgressMessage: setting.cartProgressMessage || 'Add more items to unlock benefits',
        festivalAnnouncement: setting.festivalAnnouncement || '',
        isStoreOpen: setting.isStoreOpen !== undefined ? setting.isStoreOpen : true,
        storeClosedNotice: setting.storeClosedNotice || '',
        updatedAt: setting.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get full settings for admin
// @route   GET /api/settings/admin
// @access  Private (Admin)
const getAdminSettings = async (req, res, next) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({});
    }

    res.status(200).json({ success: true, settings: setting });
  } catch (error) {
    next(error);
  }
};

// @desc    Update settings (Admin)
// @route   PUT /api/settings/admin or PUT /api/settings
// @access  Private (Admin)
const updateSettings = async (req, res, next) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting();
    }

    const {
      businessName,
      businessDomain,
      phone,
      whatsappNumber,
      email,
      address,
      minimumOrderAmount,
      minOrderAmount,
      freeDeliveryThreshold,
      defaultDeliveryFee,
      discountSlabs,
      deliveryMessage,
      cartProgressMessage,
      festivalAnnouncement,
      isStoreOpen,
      storeClosedNotice,
    } = req.body;

    if (businessName !== undefined) setting.businessName = businessName.trim();
    if (businessDomain !== undefined) setting.businessDomain = businessDomain.trim();
    if (phone !== undefined) setting.phone = phone.trim();
    if (whatsappNumber !== undefined) setting.whatsappNumber = whatsappNumber.trim();
    if (email !== undefined) setting.email = email.trim().toLowerCase();
    if (address !== undefined) setting.address = address.trim();

    const targetMinOrder = minimumOrderAmount !== undefined ? minimumOrderAmount : minOrderAmount;
    if (targetMinOrder !== undefined) {
      const parsedMin = Math.max(0, parseFloat(targetMinOrder) || 0);
      setting.minimumOrderAmount = parsedMin;
      setting.minOrderAmount = parsedMin;
    }

    if (freeDeliveryThreshold !== undefined) {
      setting.freeDeliveryThreshold = Math.max(0, parseFloat(freeDeliveryThreshold) || 0);
    }
    if (defaultDeliveryFee !== undefined) {
      setting.defaultDeliveryFee = Math.max(0, parseFloat(defaultDeliveryFee) || 0);
    }

    // Validate and update discount slabs
    if (discountSlabs !== undefined) {
      if (!Array.isArray(discountSlabs)) {
        return res.status(400).json({
          success: false,
          message: 'Discount slabs must be an array of rules.',
        });
      }

      const formattedSlabs = [];
      for (const slab of discountSlabs) {
        const slabMin = parseFloat(slab.minAmount);
        const slabPct = parseFloat(slab.discountPercentage);

        if (isNaN(slabMin) || slabMin <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Each discount slab must have a valid minimum order amount greater than 0.',
          });
        }
        if (isNaN(slabPct) || slabPct <= 0 || slabPct > 100) {
          return res.status(400).json({
            success: false,
            message: 'Discount percentage must be greater than 0% and up to 100%.',
          });
        }

        formattedSlabs.push({
          minAmount: slabMin,
          discountPercentage: slabPct,
        });
      }

      // Sort slabs ascending by minAmount
      formattedSlabs.sort((a, b) => a.minAmount - b.minAmount);
      setting.discountSlabs = formattedSlabs;
    }

    if (deliveryMessage !== undefined) setting.deliveryMessage = deliveryMessage.trim();
    if (cartProgressMessage !== undefined) setting.cartProgressMessage = cartProgressMessage.trim();
    if (festivalAnnouncement !== undefined) setting.festivalAnnouncement = festivalAnnouncement;
    if (isStoreOpen !== undefined) setting.isStoreOpen = isStoreOpen;
    if (storeClosedNotice !== undefined) setting.storeClosedNotice = storeClosedNotice;

    await setting.save();

    await logActivity({
      admin: req.admin,
      actionType: 'SETTINGS_UPDATE',
      entityType: 'Setting',
      entityId: setting._id,
      details: `Updated business rules (Min order: ₹${setting.minimumOrderAmount}, Free delivery: ₹${setting.freeDeliveryThreshold}, Slabs: ${setting.discountSlabs?.length || 0})`,
      req,
    });

    res.status(200).json({ success: true, message: 'Settings updated successfully', settings: setting });
  } catch (error) {
    next(error);
  }
};

// @desc    Download complete database backup in JSON format
// @route   GET /api/settings/admin/backup
// @access  Private (Admin)
const exportDatabaseBackup = async (req, res, next) => {
  try {
    const [products, categories, orders, customers, banners, settings] = await Promise.all([
      Product.find().lean(),
      Category.find().lean(),
      Order.find().lean(),
      Customer.find().lean(),
      Banner.find().lean(),
      Setting.find().lean(),
    ]);

    const backupPayload = {
      backupTimestamp: new Date().toISOString(),
      business: 'S2C Crackers (www.s2ccrackers.com)',
      version: '1.0.0',
      data: {
        products,
        categories,
        orders,
        customers,
        banners,
        settings,
      },
    };

    const fileName = `s2ccrackers-db-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const jsonString = JSON.stringify(backupPayload, null, 2);

    await logActivity({
      admin: req.admin,
      actionType: 'DATA_EXPORT',
      entityType: 'System',
      details: `Downloaded complete database JSON backup (${products.length} products, ${orders.length} orders)`,
      req,
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send(jsonString);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
  exportDatabaseBackup,
};
