const Pincode = require('../models/Pincode');
const XLSX = require('xlsx');
const { logActivity } = require('../utils/activityLogger');

// @desc    Check if a pincode is serviceable
// @route   POST /api/pincodes/check
// @access  Public
const checkPincode = async (req, res, next) => {
  try {
    const { pincode } = req.body;

    if (!pincode || !pincode.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a 6-digit PIN code.' });
    }

    const cleanPin = pincode.toString().trim();
    const pincodeDoc = await Pincode.findOne({ pincode: cleanPin, isActive: true });

    if (!pincodeDoc) {
      return res.status(200).json({
        success: true,
        serviceable: false,
        pincode: cleanPin,
        message: `Sorry, delivery is currently not serviceable to PIN code ${cleanPin}. We deliver across Tamil Nadu & major South Indian cities.`,
      });
    }

    res.status(200).json({
      success: true,
      serviceable: true,
      pincode: pincodeDoc.pincode,
      city: pincodeDoc.city,
      state: pincodeDoc.state,
      deliveryFee: pincodeDoc.deliveryFee,
      estimatedDays: pincodeDoc.estimatedDays,
      message: `Great news! Delivery is available to ${pincodeDoc.city} (${pincodeDoc.pincode}). Estimated delivery: ${pincodeDoc.estimatedDays}.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pincodes (Admin)
// @route   GET /api/pincodes/admin/all
// @access  Private (Admin)
const getAllPincodesAdmin = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ pincode: searchRegex }, { city: searchRegex }, { state: searchRegex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [pincodes, total] = await Promise.all([
      Pincode.find(query).sort({ pincode: 1 }).skip(skip).limit(limitNum).lean(),
      Pincode.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      pincodes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Pincode
// @route   POST /api/pincodes/admin
// @access  Private (Admin)
const createPincode = async (req, res, next) => {
  try {
    const { pincode, city, state, deliveryFee, estimatedDays, isActive } = req.body;

    if (!pincode || !city) {
      return res.status(400).json({ success: false, message: 'Pincode and City are required.' });
    }

    const cleanPin = pincode.toString().trim();
    const existing = await Pincode.findOne({ pincode: cleanPin });
    if (existing) {
      return res.status(400).json({ success: false, message: `Pincode ${cleanPin} is already registered.` });
    }

    const createdPin = await Pincode.create({
      pincode: cleanPin,
      city: city.trim(),
      state: state ? state.trim() : 'Tamil Nadu',
      deliveryFee: deliveryFee !== undefined ? parseFloat(deliveryFee) : 150,
      estimatedDays: estimatedDays ? estimatedDays.trim() : '2-4 business days',
      isActive: isActive !== undefined ? isActive : true,
    });

    await logActivity({
      admin: req.admin,
      actionType: 'PINCODE_CREATE',
      entityType: 'Pincode',
      entityId: createdPin._id,
      details: `Added serviceable pincode: ${cleanPin} (${city})`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Pincode added successfully',
      pincode: createdPin,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Pincode
// @route   PUT /api/pincodes/admin/:id
// @access  Private (Admin)
const updatePincode = async (req, res, next) => {
  try {
    const { city, state, deliveryFee, estimatedDays, isActive } = req.body;
    const pincodeDoc = await Pincode.findById(req.params.id);

    if (!pincodeDoc) {
      return res.status(404).json({ success: false, message: 'Pincode not found' });
    }

    if (city) pincodeDoc.city = city.trim();
    if (state) pincodeDoc.state = state.trim();
    if (deliveryFee !== undefined) pincodeDoc.deliveryFee = parseFloat(deliveryFee);
    if (estimatedDays) pincodeDoc.estimatedDays = estimatedDays.trim();
    if (isActive !== undefined) pincodeDoc.isActive = isActive;

    await pincodeDoc.save();

    await logActivity({
      admin: req.admin,
      actionType: 'PINCODE_UPDATE',
      entityType: 'Pincode',
      entityId: pincodeDoc._id,
      details: `Updated pincode settings for ${pincodeDoc.pincode} (${pincodeDoc.city})`,
      req,
    });

    res.status(200).json({ success: true, message: 'Pincode updated successfully', pincode: pincodeDoc });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Pincode
// @route   DELETE /api/pincodes/admin/:id
// @access  Private (Admin)
const deletePincode = async (req, res, next) => {
  try {
    const pincodeDoc = await Pincode.findById(req.params.id);
    if (!pincodeDoc) {
      return res.status(404).json({ success: false, message: 'Pincode not found' });
    }

    await Pincode.findByIdAndDelete(req.params.id);

    await logActivity({
      admin: req.admin,
      actionType: 'PINCODE_DELETE',
      entityType: 'Pincode',
      entityId: req.params.id,
      details: `Deleted serviceable pincode ${pincodeDoc.pincode} (${pincodeDoc.city})`,
      req,
    });

    res.status(200).json({ success: true, message: 'Pincode deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Import Pincodes (Excel or CSV)
// @route   POST /api/pincodes/admin/bulk-import
// @access  Private (Admin)
const bulkImportPincodes = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel or CSV file.' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows found in file.' });
    }

    const existingPincodes = await Pincode.find({}, 'pincode');
    const existingSet = new Set(existingPincodes.map((p) => p.pincode));

    const validInserts = [];
    const seenInFile = new Set();

    for (const row of rows) {
      const pin = (row['Pincode'] || row['pincode'] || row['PIN'] || row['Pin'] || '').toString().trim();
      const city = (row['City'] || row['city'] || 'Tamil Nadu District').toString().trim();
      const state = (row['State'] || row['state'] || 'Tamil Nadu').toString().trim();
      const deliveryFee = parseFloat(row['Delivery Fee'] || row['deliveryFee'] || 150);
      const estimatedDays = (row['Estimated Days'] || row['estimatedDays'] || '2-4 business days').toString().trim();

      if (pin && /^[1-9][0-9]{5}$/.test(pin) && !existingSet.has(pin) && !seenInFile.has(pin)) {
        seenInFile.add(pin);
        validInserts.push({
          pincode: pin,
          city,
          state,
          deliveryFee: isNaN(deliveryFee) ? 150 : deliveryFee,
          estimatedDays,
          isActive: true,
        });
      }
    }

    let insertedCount = 0;
    if (validInserts.length > 0) {
      const result = await Pincode.insertMany(validInserts, { ordered: false });
      insertedCount = result.length;
    }

    await logActivity({
      admin: req.admin,
      actionType: 'BULK_IMPORT',
      entityType: 'Pincode',
      details: `Imported ${insertedCount} serviceable pincodes via file upload`,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Successfully added ${insertedCount} new serviceable pincodes.`,
      insertedCount,
      skippedCount: rows.length - insertedCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkPincode,
  getAllPincodesAdmin,
  createPincode,
  updatePincode,
  deletePincode,
  bulkImportPincodes,
};
