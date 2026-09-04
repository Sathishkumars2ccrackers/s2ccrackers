const Banner = require('../models/Banner');
const { logActivity } = require('../utils/activityLogger');
const { deleteCloudinaryImage, extractPublicId } = require('../config/cloudinary');

// @desc    Get active banners for customer homepage
// @route   GET /api/banners
// @access  Public
const getActiveBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: banners.length, banners });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all banners for admin
// @route   GET /api/banners/admin/all
// @access  Private (Admin)
const getAllBannersAdmin = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: banners.length, banners });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Banner
// @route   POST /api/banners/admin
// @access  Private (Admin)
const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, badge, discountTag, imageUrl: bodyImageUrl, linkUrl, buttonText, displayOrder, isActive } = req.body;

    let imageUrl = bodyImageUrl;
    let imagePublicId = '';

    if (req.file) {
      imageUrl = req.file.path || req.file.secure_url;
      imagePublicId = req.file.filename || req.file.public_id || extractPublicId(imageUrl) || '';
    } else if (bodyImageUrl) {
      imagePublicId = extractPublicId(bodyImageUrl) || '';
    }

    if (!title || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Banner title and image are required.' });
    }

    const banner = await Banner.create({
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      badge: badge ? badge.trim() : 'MEGA FESTIVAL SALE',
      discountTag: discountTag ? discountTag.trim() : 'Up to 80% Off Sivakasi Crackers',
      imageUrl,
      imagePublicId,
      linkUrl: linkUrl ? linkUrl.trim() : '/products',
      buttonText: buttonText ? buttonText.trim() : 'Shop Crackers Now',
      displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
      isActive: isActive !== undefined ? isActive === true || isActive === 'true' : true,
    });

    await logActivity({
      admin: req.admin,
      actionType: 'BANNER_CREATE',
      entityType: 'Banner',
      entityId: banner._id,
      details: `Created home page banner: "${banner.title}"`,
      req,
    });

    res.status(201).json({ success: true, message: 'Banner created successfully', banner });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Banner
// @route   PUT /api/banners/admin/:id
// @access  Private (Admin)
const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    const { title, subtitle, badge, discountTag, imageUrl: bodyImageUrl, linkUrl, buttonText, displayOrder, isActive } = req.body;

    if (title) banner.title = title.trim();
    if (subtitle !== undefined) banner.subtitle = subtitle.trim();
    if (badge !== undefined) banner.badge = badge.trim();
    if (discountTag !== undefined) banner.discountTag = discountTag.trim();

    // If new image file was uploaded to Cloudinary
    if (req.file) {
      // Automatically delete old Cloudinary image
      if (banner.imagePublicId || banner.imageUrl) {
        await deleteCloudinaryImage(banner.imagePublicId || banner.imageUrl);
      }
      banner.imageUrl = req.file.path || req.file.secure_url;
      banner.imagePublicId = req.file.filename || req.file.public_id || extractPublicId(banner.imageUrl) || '';
    } else if (bodyImageUrl && bodyImageUrl !== banner.imageUrl) {
      // If manual image URL was changed
      if (banner.imagePublicId || banner.imageUrl) {
        await deleteCloudinaryImage(banner.imagePublicId || banner.imageUrl);
      }
      banner.imageUrl = bodyImageUrl;
      banner.imagePublicId = extractPublicId(bodyImageUrl) || '';
    }

    if (linkUrl !== undefined) banner.linkUrl = linkUrl.trim();
    if (buttonText !== undefined) banner.buttonText = buttonText.trim();
    if (displayOrder !== undefined) banner.displayOrder = parseInt(displayOrder, 10);
    if (isActive !== undefined) banner.isActive = isActive === true || isActive === 'true';

    await banner.save();

    await logActivity({
      admin: req.admin,
      actionType: 'BANNER_UPDATE',
      entityType: 'Banner',
      entityId: banner._id,
      details: `Updated home page banner: "${banner.title}"`,
      req,
    });

    res.status(200).json({ success: true, message: 'Banner updated successfully', banner });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Banner
// @route   DELETE /api/banners/admin/:id
// @access  Private (Admin)
const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    // Automatically delete Cloudinary image
    if (banner.imagePublicId || banner.imageUrl) {
      await deleteCloudinaryImage(banner.imagePublicId || banner.imageUrl);
    }

    await Banner.findByIdAndDelete(req.params.id);

    await logActivity({
      admin: req.admin,
      actionType: 'BANNER_DELETE',
      entityType: 'Banner',
      entityId: req.params.id,
      details: `Deleted banner: "${banner.title}"`,
      req,
    });

    res.status(200).json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
};
