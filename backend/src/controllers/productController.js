const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { generateSlug, parseBulkProductFile } = require('../utils/excelEngine');
const { logActivity } = require('../utils/activityLogger');
const { deleteCloudinaryImage, extractPublicId } = require('../config/cloudinary');

// Canonical Category Alias Map for fault-tolerant fuzzy resolution
const CATEGORY_ALIAS_MAP = {
  'sparklers': ['sparklers', 'sparkler'],
  'ground-chakkars': ['ground-chakkars', 'ground-chakkar', 'groundchakkars', 'groundchakkar', 'ground chakkars', 'ground chakkar'],
  'flower-pots': ['flower-pots', 'flower-pot', 'flowerpots', 'flowerpot', 'flower pots', 'flower pot'],
  'rockets-missiles': ['rockets-missiles', 'rockets', 'rocket', 'missiles', 'missile', 'rockets-and-missiles', 'rockets & missiles', 'rockets missiles'],
  'multi-shot-sky-shots': ['multi-shot-sky-shots', 'sky-shots', 'skyshots', 'ariel-fancy-shots', 'ariel fancy shots', 'fancy-shots', 'fancy shots', 'multishot-sky-shots', 'multi shot sky shots', 'sky shots'],
  'sound-crackers': ['sound-crackers', 'sound-cracker', 'soundcrackers', 'soundcracker', 'sound crackers', 'sound cracker'],
  'kids-special': ['kids-special', 'kids-novelties', 'kids special', 'kids novelties', 'kidsspecial', 'kidsnovelties', 'kids'],
  'deluxe-gift-boxes': ['deluxe-gift-boxes', 'gift-boxes', 'gift-box', 'giftboxes', 'giftbox', 'deluxe gift boxes', 'gift boxes', 'gift box'],
  'bijili-crackers': ['bijili-crackers', 'bijili-cracker', 'bijili crackers', 'bijili'],
  'bombs': ['bombs', 'bomb'],
  'twinkling-star': ['twinkling-star', 'twinkling-stars', 'twinkling star'],
  'digital-wala': ['digital-wala', 'digital wala'],
  'childrens-color-match-box': ['childrens-color-match-box', 'children-color-match-box', "children's color match box", 'color-match-box'],
  'childrens-gun': ['childrens-gun', 'children-gun', "children's gun", 'children gun'],
  'wala': ['wala', 'walas'],
};

// Robust helper to resolve category document from slug, ID, or name
const resolveCategoryDoc = async (rawCategory) => {
  if (!rawCategory || rawCategory === 'all') return null;
  const cleanInput = decodeURIComponent(rawCategory).trim();

  // 1. Direct MongoDB ObjectId match
  if (cleanInput.match(/^[0-9a-fA-F]{24}$/)) {
    const doc = await Category.findById(cleanInput);
    if (doc) return doc;
  }

  const normalizedInput = cleanInput.toLowerCase().replace(/[\s_]+/g, '-');
  const simpleInput = cleanInput.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 2. Direct Slug Match (Case-insensitive)
  let catDoc = await Category.findOne({
    slug: { $regex: new RegExp(`^${normalizedInput.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') },
  });
  if (catDoc) return catDoc;

  // 3. Direct Name Match (Case-insensitive)
  catDoc = await Category.findOne({
    name: { $regex: new RegExp(`^${cleanInput.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') },
  });
  if (catDoc) return catDoc;

  // 4. Alias lookup
  for (const [canonicalSlug, aliases] of Object.entries(CATEGORY_ALIAS_MAP)) {
    if (
      canonicalSlug === normalizedInput ||
      canonicalSlug.replace(/[^a-z0-9]/g, '') === simpleInput ||
      aliases.some((a) => a === normalizedInput || a === cleanInput.toLowerCase() || a.replace(/[^a-z0-9]/g, '') === simpleInput)
    ) {
      catDoc = await Category.findOne({
        $or: [
          { slug: canonicalSlug },
          { slug: { $in: aliases } },
        ],
      });
      if (catDoc) return catDoc;
    }
  }

  // 5. Fallback partial regex search on name/slug
  catDoc = await Category.findOne({
    $or: [
      { slug: { $regex: new RegExp(simpleInput, 'i') } },
      { name: { $regex: new RegExp(cleanInput, 'i') } },
    ],
  });

  return catDoc;
};

// @desc    Get public products with filters, search, brand, and sorting
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      sort = 'featured',
      page = 1,
      limit = 24,
    } = req.query;

    const query = { isActive: true };

    // Search query (name, description, regional name, brand, productCode)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { regionalName: searchRegex },
        { brand: searchRegex },
        { productCode: searchRegex },
      ];
    }

    // Category filter (slug, name, alias, or ObjectId)
    if (category && category !== 'all') {
      const resolvedCat = await resolveCategoryDoc(category);
      if (resolvedCat) {
        query.category = resolvedCat._id;
        console.log(`[Products API] Resolved Category: "${category}" ➔ "${resolvedCat.name}" (Slug: ${resolvedCat.slug}, ID: ${resolvedCat._id})`);
      } else {
        // Explicit category requested but not found -> Return 0 products
        query.category = new mongoose.Types.ObjectId();
        console.log(`[Products API] No matching category found for: "${category}". Returning empty product list.`);
      }
    }

    // Brand filter (single or comma-separated / array)
    if (brand && brand !== 'all') {
      const brandArray = Array.isArray(brand)
        ? brand
        : brand.split(',').map((b) => b.trim()).filter(Boolean);
      if (brandArray.length === 1) {
        query.brand = new RegExp(`^${brandArray[0]}$`, 'i');
      } else if (brandArray.length > 1) {
        query.brand = { $in: brandArray.map((b) => new RegExp(`^${b}$`, 'i')) };
      }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') query.price.$lte = Number(maxPrice);
    }

    // In-stock filter
    if (inStock === 'true' || inStock === true) {
      query.stockQuantity = { $gt: 0 };
    }

    // Featured filter
    if (isFeatured === 'true' || isFeatured === true) {
      query.isFeatured = true;
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'price-asc':
        sortOption = { price: 1 };
        break;
      case 'price-desc':
        sortOption = { price: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'name-asc':
        sortOption = { name: 1 };
        break;
      case 'code-asc':
        sortOption = { productCode: 1, createdAt: 1 };
        break;
      case 'bestseller':
        sortOption = { totalSold: -1, createdAt: -1 };
        break;
      case 'featured':
      default:
        sortOption = { isFeatured: -1, totalSold: -1, createdAt: -1 };
        break;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 24;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug icon')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
    ]);

    console.log(`[Products API] Returned ${products.length} products (Total matches: ${total}) for category="${category || 'all'}", search="${search || ''}"`);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get distinct brand names for filters
// @route   GET /api/products/meta/brands
// @access  Public
const getBrands = async (req, res, next) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });
    const cleanBrands = brands.filter(Boolean).sort();
    res.status(200).json({
      success: true,
      brands: cleanBrands,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by slug, ID, or productCode
// @route   GET /api/products/:identifier
// @access  Public
const getProductByIdentifier = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let query = { isActive: true };

    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = identifier;
    } else {
      query.$or = [
        { slug: identifier.toLowerCase() },
        { productCode: identifier },
      ];
    }

    const product = await Product.findOne(query).populate('category', 'name slug icon description');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
    }

    // Fetch related products in the same category
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isActive: true,
    })
      .limit(6)
      .lean();

    res.status(200).json({
      success: true,
      product,
      relatedProducts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products for homepage showcase
// @route   GET /api/products/featured/showcase
// @access  Public
const getFeaturedShowcase = async (req, res, next) => {
  try {
    const [featured, bestSellers, deals] = await Promise.all([
      Product.find({ isFeatured: true, isActive: true }).populate('category', 'name slug').limit(12).lean(),
      Product.find({ isActive: true }).sort({ totalSold: -1, createdAt: -1 }).populate('category', 'name slug').limit(12).lean(),
      Product.find({ isActive: true, discountPercentage: { $gt: 0 } }).sort({ discountPercentage: -1 }).populate('category', 'name slug').limit(8).lean(),
    ]);

    res.status(200).json({
      success: true,
      featured,
      bestSellers,
      deals,
    });
  } catch (error) {
    next(error);
  }
};

// ================= ADMIN CONTROLLERS =================

// @desc    Get all products for Admin
// @route   GET /api/products/admin/all
// @access  Private (Admin)
const getAllProductsAdmin = async (req, res, next) => {
  try {
    const { search, category, brand, stockStatus, page = 1, limit = 100 } = req.query;
    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { slug: searchRegex },
        { brand: searchRegex },
        { productCode: searchRegex },
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (brand && brand !== 'all') {
      query.brand = brand;
    }

    if (stockStatus === 'low') {
      query.stockQuantity = { $gt: 0, $lte: 10 };
    } else if (stockStatus === 'out') {
      query.stockQuantity = { $lte: 0 };
    } else if (stockStatus === 'in') {
      query.stockQuantity = { $gt: 10 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 100;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check Duplicate Product Name or Code
// @route   POST /api/products/admin/check-duplicate
// @access  Private (Admin)
const checkDuplicateProductName = async (req, res, next) => {
  try {
    const { name, productCode, excludeId } = req.body;
    if ((!name || !name.trim()) && (!productCode || !productCode.trim())) {
      return res.status(200).json({ isDuplicate: false });
    }

    const conditions = [];
    if (name && name.trim()) {
      conditions.push({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    }
    if (productCode && productCode.trim()) {
      conditions.push({ productCode: productCode.trim() });
    }

    const query = { $or: conditions };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Product.findOne(query).select('name slug productCode');
    res.status(200).json({
      isDuplicate: !!existing,
      existingProduct: existing ? { id: existing._id, name: existing.name, productCode: existing.productCode } : null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Product
// @route   POST /api/products/admin
// @access  Private (Admin)
const createProduct = async (req, res, next) => {
  try {
    const {
      productCode,
      name,
      category,
      brand,
      description,
      price,
      originalPrice,
      stockQuantity,
      piecesPerPack,
      isFeatured,
      isActive,
      images: bodyImages,
      soundLevel,
      regionalName,
      packSize,
      piecesPerBox,
      discountPercentage,
      safetyTips,
    } = req.body;

    if (!name || !category || price === undefined || stockQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, Category, Price, and Stock Quantity are required.',
      });
    }

    // Check duplicate
    const slug = `item-${productCode || Date.now()}-${generateSlug(name)}`;
    const existing = await Product.findOne({ $or: [{ name: name.trim() }, { slug }] });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A product with name "${name}" already exists. Please choose a unique name.`,
      });
    }

    // Collect images and public IDs from Cloudinary upload or body
    let images = [];
    let imagePublicIds = [];

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const url = file.path || file.secure_url;
        if (url) {
          images.push(url);
          imagePublicIds.push(file.filename || file.public_id || extractPublicId(url) || '');
        }
      });
    } else if (req.file) {
      const url = req.file.path || req.file.secure_url;
      if (url) {
        images.push(url);
        imagePublicIds.push(req.file.filename || req.file.public_id || extractPublicId(url) || '');
      }
    }

    if (bodyImages) {
      const manualImages = Array.isArray(bodyImages) ? bodyImages : [bodyImages];
      manualImages.forEach((imgUrl) => {
        if (imgUrl && typeof imgUrl === 'string' && imgUrl.trim()) {
          images.push(imgUrl.trim());
          const pid = extractPublicId(imgUrl.trim()) || '';
          imagePublicIds.push(pid);
        }
      });
    }

    const parsedPrice = parseFloat(price);
    const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice) : parsedPrice;
    const calcDiscount = discountPercentage !== undefined && discountPercentage !== ''
      ? parseFloat(discountPercentage)
      : parsedOriginalPrice > parsedPrice
      ? Math.round(((parsedOriginalPrice - parsedPrice) / parsedOriginalPrice) * 100)
      : 0;

    const pcs = piecesPerPack ? parseInt(piecesPerPack, 10) : piecesPerBox ? parseInt(piecesPerBox, 10) : 1;

    const product = await Product.create({
      productCode: productCode ? productCode.toString().trim() : '',
      name: name.trim(),
      slug,
      category,
      brand: brand ? brand.trim() : 'NACHIYAR',
      piecesPerPack: pcs,
      packSize: packSize || `${pcs} Pcs / Pack`,
      piecesPerBox: pcs,
      description: description ? description.trim() : 'Authentic Sivakasi festival cracker item.',
      images,
      imagePublicIds,
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      discountPercentage: calcDiscount,
      stockQuantity: parseInt(stockQuantity, 10),
      isFeatured: isFeatured === true || isFeatured === 'true',
      isActive: isActive !== undefined ? (isActive === true || isActive === 'true') : true,
      soundLevel: soundLevel || 'Medium',
      regionalName: regionalName || '',
      safetyTips: safetyTips ? (Array.isArray(safetyTips) ? safetyTips : [safetyTips]) : undefined,
    });

    await logActivity({
      admin: req.admin,
      actionType: 'PRODUCT_CREATE',
      entityType: 'Product',
      entityId: product._id,
      details: `Created product: "${product.name}" [Code: ${product.productCode || 'N/A'}] (Price: ₹${product.price}, Stock: ${product.stockQuantity})`,
      req,
    });

    const populatedProduct = await Product.findById(product._id).populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: populatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Product
// @route   PUT /api/products/admin/:id
// @access  Private (Admin)
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const {
      productCode,
      name,
      category,
      brand,
      description,
      price,
      originalPrice,
      stockQuantity,
      piecesPerPack,
      isFeatured,
      isActive,
      images: bodyImages,
      soundLevel,
      regionalName,
      packSize,
      piecesPerBox,
      discountPercentage,
      safetyTips,
    } = req.body;

    const oldPrice = product.price;
    const oldStock = product.stockQuantity;

    if (name && name.trim() !== product.name) {
      const slug = `item-${productCode || product.productCode || Date.now()}-${generateSlug(name)}`;
      const existing = await Product.findOne({
        _id: { $ne: product._id },
        $or: [{ name: name.trim() }, { slug }],
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Another product already uses the name "${name}".`,
        });
      }
      product.name = name.trim();
      product.slug = slug;
    }

    if (productCode !== undefined) product.productCode = productCode.toString().trim();
    if (category) product.category = category;
    if (brand !== undefined) product.brand = brand.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = parseFloat(price);
    if (originalPrice !== undefined) product.originalPrice = parseFloat(originalPrice);
    if (stockQuantity !== undefined) product.stockQuantity = parseInt(stockQuantity, 10);
    if (isFeatured !== undefined) product.isFeatured = isFeatured === true || isFeatured === 'true';
    if (isActive !== undefined) product.isActive = isActive === true || isActive === 'true';
    if (soundLevel) product.soundLevel = soundLevel;
    if (regionalName !== undefined) product.regionalName = regionalName;

    if (piecesPerPack !== undefined || piecesPerBox !== undefined) {
      const pcs = parseInt(piecesPerPack || piecesPerBox, 10);
      product.piecesPerPack = pcs;
      product.piecesPerBox = pcs;
    }
    if (packSize !== undefined) product.packSize = packSize;

    if (discountPercentage !== undefined) {
      product.discountPercentage = parseFloat(discountPercentage);
    } else if (product.originalPrice > product.price) {
      product.discountPercentage = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }

    if (safetyTips) product.safetyTips = Array.isArray(safetyTips) ? safetyTips : [safetyTips];

    // Handle image updates and automatic Cloudinary deletion of removed images
    const oldImages = Array.isArray(product.images) ? [...product.images] : [];
    let keptImages = [];
    let keptPublicIds = [];

    if (bodyImages !== undefined) {
      keptImages = Array.isArray(bodyImages) ? bodyImages.filter(Boolean) : [bodyImages].filter(Boolean);
    } else if (!req.files || req.files.length === 0) {
      keptImages = oldImages;
    }

    // Delete any removed images from Cloudinary automatically
    const removedImages = oldImages.filter((oldImg) => !keptImages.includes(oldImg));
    for (const removedUrl of removedImages) {
      await deleteCloudinaryImage(removedUrl);
    }

    // Retain matching public IDs for kept images
    keptImages.forEach((imgUrl) => {
      const pid = extractPublicId(imgUrl) || '';
      keptPublicIds.push(pid);
    });

    // Append newly uploaded Cloudinary images
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const url = file.path || file.secure_url;
        if (url) {
          keptImages.push(url);
          keptPublicIds.push(file.filename || file.public_id || extractPublicId(url) || '');
        }
      });
    } else if (req.file) {
      const url = req.file.path || req.file.secure_url;
      if (url) {
        keptImages.push(url);
        keptPublicIds.push(req.file.filename || req.file.public_id || extractPublicId(url) || '');
      }
    }

    product.images = keptImages;
    product.imagePublicIds = keptPublicIds;

    await product.save();

    // Log Activity
    let actionType = 'PRODUCT_UPDATE';
    let detailMsg = `Updated product details for "${product.name}"`;
    if (oldPrice !== product.price) {
      actionType = 'PRICE_UPDATE';
      detailMsg = `Price for "${product.name}" changed from ₹${oldPrice} to ₹${product.price}`;
    } else if (oldStock !== product.stockQuantity) {
      actionType = 'STOCK_UPDATE';
      detailMsg = `Stock for "${product.name}" adjusted from ${oldStock} to ${product.stockQuantity}`;
    }

    await logActivity({
      admin: req.admin,
      actionType,
      entityType: 'Product',
      entityId: product._id,
      details: detailMsg,
      req,
    });

    const updatedProduct = await Product.findById(product._id).populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Product
// @route   DELETE /api/products/admin/:id
// @access  Private (Admin)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete all associated Cloudinary images automatically
    if (product.images && product.images.length > 0) {
      for (const imgUrl of product.images) {
        await deleteCloudinaryImage(imgUrl);
      }
    }
    if (product.imagePublicIds && product.imagePublicIds.length > 0) {
      for (const pid of product.imagePublicIds) {
        if (pid) {
          await deleteCloudinaryImage(pid);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    await logActivity({
      admin: req.admin,
      actionType: 'PRODUCT_DELETE',
      entityType: 'Product',
      entityId: req.params.id,
      details: `Deleted product "${product.name}"`,
      req,
    });

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Product Active Status
// @route   PATCH /api/products/admin/:id/toggle-status
// @access  Private (Admin)
const toggleProductStatus = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isActive = !product.isActive;
    await product.save();

    await logActivity({
      admin: req.admin,
      actionType: 'PRODUCT_UPDATE',
      entityType: 'Product',
      entityId: product._id,
      details: `Changed active status of "${product.name}" to ${product.isActive ? 'Active' : 'Hidden'}`,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Product is now ${product.isActive ? 'Active and Visible' : 'Hidden from store'}`,
      isActive: product.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Featured Status
// @route   PATCH /api/products/admin/:id/toggle-featured
// @access  Private (Admin)
const toggleFeaturedStatus = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isFeatured = !product.isFeatured;
    await product.save();

    await logActivity({
      admin: req.admin,
      actionType: 'PRODUCT_UPDATE',
      entityType: 'Product',
      entityId: product._id,
      details: `Changed featured status of "${product.name}" to ${product.isFeatured ? 'Featured' : 'Standard'}`,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Product ${product.isFeatured ? 'marked as Featured' : 'removed from Featured'}`,
      isFeatured: product.isFeatured,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Update Stock
// @route   POST /api/products/admin/bulk-stock-update
// @access  Private (Admin)
const bulkUpdateStock = async (req, res, next) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of stock updates.' });
    }

    const bulkOps = updates.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { stockQuantity: Math.max(0, parseInt(item.stockQuantity, 10)) } },
      },
    }));

    const result = await Product.bulkWrite(bulkOps);

    await logActivity({
      admin: req.admin,
      actionType: 'STOCK_UPDATE',
      entityType: 'Product',
      details: `Bulk updated stock quantities for ${result.modifiedCount} products`,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Successfully updated stock for ${result.modifiedCount} products`,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Update Prices
// @route   POST /api/products/admin/bulk-price-update
// @access  Private (Admin)
const bulkUpdatePrice = async (req, res, next) => {
  try {
    const { categoryId, adjustmentType, value } = req.body;

    if (!adjustmentType || value === undefined) {
      return res.status(400).json({ success: false, message: 'Please specify adjustmentType and value.' });
    }

    const filter = {};
    if (categoryId && categoryId !== 'all') {
      filter.category = categoryId;
    }

    const products = await Product.find(filter);
    let updatedCount = 0;

    for (const prod of products) {
      let newPrice = prod.price;
      if (adjustmentType === 'percentage') {
        const factor = 1 + parseFloat(value) / 100;
        newPrice = Math.round(prod.price * factor);
      } else if (adjustmentType === 'flat') {
        newPrice = Math.max(1, prod.price + parseFloat(value));
      }

      prod.price = newPrice;
      await prod.save();
      updatedCount++;
    }

    await logActivity({
      admin: req.admin,
      actionType: 'PRICE_UPDATE',
      entityType: 'Product',
      details: `Bulk adjusted prices for ${updatedCount} products (${adjustmentType}: ${value})`,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Successfully adjusted prices for ${updatedCount} products`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Import Products via Excel or CSV
// @route   POST /api/products/admin/import
// @access  Private (Admin)
const importProducts = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx) or CSV file.' });
    }

    const parseResult = await parseBulkProductFile(req.file.buffer);

    if (parseResult.validRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid product rows were found in the uploaded file.',
        invalidRows: parseResult.invalidRows,
      });
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const row of parseResult.validRows) {
      const existing = await Product.findOne({
        $or: [
          ...(row.productCode ? [{ productCode: row.productCode }] : []),
          { name: row.name },
        ],
      });

      if (existing) {
        Object.assign(existing, row);
        await existing.save();
        updatedCount++;
      } else {
        await Product.create(row);
        insertedCount++;
      }
    }

    await logActivity({
      admin: req.admin,
      actionType: 'BULK_IMPORT',
      entityType: 'Product',
      details: `Bulk import: ${insertedCount} new products created, ${updatedCount} updated. (${parseResult.invalidCount} invalid rows skipped)`,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Bulk Import Completed: ${insertedCount} created, ${updatedCount} updated!`,
      totalRows: parseResult.totalRows,
      insertedCount,
      updatedCount,
      invalidCount: parseResult.invalidCount,
      invalidRows: parseResult.invalidRows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getBrands,
  getProductByIdentifier,
  getFeaturedShowcase,
  getAllProductsAdmin,
  checkDuplicateProductName,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  toggleFeaturedStatus,
  bulkUpdateStock,
  bulkUpdatePrice,
  importProducts,
};
