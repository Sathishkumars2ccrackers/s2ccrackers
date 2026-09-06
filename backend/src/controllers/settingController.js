const Setting = require('../models/Setting');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Banner = require('../models/Banner');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get public site settings
// @route   GET /api/settings/public
// @access  Public
const getPublicSettings = async (req, res, next) => {
  try {
    let setting = await Setting.findOne().lean();
    if (!setting) {
      setting = await Setting.create({});
    }

    res.status(200).json({
      success: true,
      settings: {
        businessName: setting.businessName || 'S2C Crackers',
        businessDomain: setting.businessDomain || 'www.s2ccrackers.com',
        phone: setting.phone || '+91 99444 76516',
        whatsappNumber: setting.whatsappNumber || '919944476516',
        email: setting.email || 's2ccrackers@gmail.com',
        address: setting.address || '124/B, Sivakasi Main Road, Viswanatham, Sivakasi, Tamil Nadu - 626123',
        minOrderAmount: setting.minOrderAmount || 500,
        freeDeliveryThreshold: setting.freeDeliveryThreshold || 3000,
        defaultDeliveryFee: setting.defaultDeliveryFee || 150,
        festivalAnnouncement: setting.festivalAnnouncement || '',
        isStoreOpen: setting.isStoreOpen !== undefined ? setting.isStoreOpen : true,
        storeClosedNotice: setting.storeClosedNotice || '',
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
// @route   PUT /api/settings/admin
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
      minOrderAmount,
      freeDeliveryThreshold,
      defaultDeliveryFee,
      festivalAnnouncement,
      isStoreOpen,
      storeClosedNotice,
    } = req.body;

    if (businessName) setting.businessName = businessName.trim();
    if (businessDomain) setting.businessDomain = businessDomain.trim();
    if (phone) setting.phone = phone.trim();
    if (whatsappNumber) setting.whatsappNumber = whatsappNumber.trim();
    if (email) setting.email = email.trim().toLowerCase();
    if (address) setting.address = address.trim();
    if (minOrderAmount !== undefined) setting.minOrderAmount = parseFloat(minOrderAmount);
    if (freeDeliveryThreshold !== undefined) setting.freeDeliveryThreshold = parseFloat(freeDeliveryThreshold);
    if (defaultDeliveryFee !== undefined) setting.defaultDeliveryFee = parseFloat(defaultDeliveryFee);
    if (festivalAnnouncement !== undefined) setting.festivalAnnouncement = festivalAnnouncement;
    if (isStoreOpen !== undefined) setting.isStoreOpen = isStoreOpen;
    if (storeClosedNotice !== undefined) setting.storeClosedNotice = storeClosedNotice;

    await setting.save();

    await logActivity({
      admin: req.admin,
      actionType: 'SETTINGS_UPDATE',
      entityType: 'Setting',
      entityId: setting._id,
      details: 'Updated business contact details and store delivery policies',
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
