const XLSX = require('xlsx');
const Category = require('../models/Category');
const Product = require('../models/Product');

/**
 * Generate URL-friendly slug
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Automatic description generator
const getDefaultDescription = (categoryName) => {
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('sparkler')) return 'Safe and colorful sparklers ideal for children and family celebrations.';
  if (cat.includes('flower') || cat.includes('pot')) return 'Beautiful fountain-style fireworks producing vibrant showers of sparks.';
  if (cat.includes('shot') || cat.includes('ariel')) return 'Premium aerial fireworks with colorful burst effects.';
  if (cat.includes('gift') || cat.includes('box')) return 'Curated collection of fireworks suitable for family celebrations and gifting.';
  if (cat.includes('sound') || cat.includes('bomb') || cat.includes('wala')) return 'Traditional high-energy Sivakasi sound celebration fireworks.';
  if (cat.includes('chakkar') || cat.includes('chakra') || cat.includes('spinner')) return 'Fast spinning ground chakkar with radiant golden and color sparks.';
  if (cat.includes('gun') || cat.includes('cap')) return 'Festive toy ring cap guns and accessories for kids.';
  return 'Authentic Sivakasi direct factory firework item with maximum safety standards.';
};

/**
 * Parse uploaded Excel or CSV file buffer into product rows
 */
const parseBulkProductFile = async (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('The uploaded file does not contain any sheets.');
  }

  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  if (!rawRows || rawRows.length === 0) {
    throw new Error('The uploaded sheet contains no data rows.');
  }

  // Fetch all existing categories for rapid lookup
  const categories = await Category.find();
  const categoryMap = new Map();
  categories.forEach((cat) => {
    categoryMap.set(cat.name.toLowerCase().trim(), cat._id);
    categoryMap.set(cat.slug.toLowerCase().trim(), cat._id);
  });

  // Fetch existing products to detect duplicates
  const existingProducts = await Product.find({}, 'name slug productCode');
  const existingCodeSet = new Set(existingProducts.filter((p) => p.productCode).map((p) => p.productCode.toString().trim()));

  const validRows = [];
  const invalidRows = [];
  const fileSeenCodes = new Set();
  const fileSeenNames = new Set();

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowNumber = i + 2; // Account for 1-based index and header row

    // Normalize field names (case-insensitive key lookup)
    const productCode = (row['Product Code'] || row['product code'] || row['Code'] || row['code'] || row['Stock_code'] || row['Stock Code'] || '').toString().trim();
    const name = (row['Product Name'] || row['product name'] || row['Name'] || row['name'] || row['Stock_Name'] || row['Stock Name'] || '').toString().trim();
    const categoryName = (row['Category'] || row['category'] || row['Category Name'] || row['Category_Name'] || 'General Crackers').toString().trim();
    const brandName = (row['Brand'] || row['brand'] || row['Brand Name'] || row['Brand_Name'] || 'NACHIYAR').toString().trim();
    const rawPcs = row['Pieces Per Pack'] || row['Pcs/pack'] || row['pcs/pack'] || row['Pieces'] || row['Pcs'] || 1;
    const rawMrp = row['MRP Price'] || row['MRP'] || row['mrp'] || row['Original Price'] || 0;
    const rawPrice = row['Price'] || row['price'] || row['Sell rate - 2026'] || row['Sell Rate'] || row['Rate'] || row['rate'] || 0;
    const rawStock = row['Stock Quantity'] || row['stock quantity'] || row['Stock'] || row['stock'] || row['Total Booking Qty'] || row['Qty'] || 0;
    const description = (row['Description'] || row['description'] || getDefaultDescription(categoryName)).toString().trim();
    const imageUrl = (row['Image URL'] || row['image url'] || row['Image'] || row['image'] || row['Images'] || '').toString().trim();
    const isFeaturedRaw = row['Featured'] || row['featured'] || row['Is Featured'] || false;

    // Validation checks
    const errors = [];
    if (!name) {
      errors.push('Product Name is required');
    }

    if (productCode) {
      if (fileSeenCodes.has(productCode)) {
        errors.push(`Duplicate Product Code "${productCode}" in this file`);
      }
    }

    const price = parseFloat(rawPrice);
    if (isNaN(price) || price < 0) {
      errors.push('Price/Sell Rate must be a valid non-negative number');
    }

    const originalPrice = parseFloat(rawMrp) || price;
    const stockQuantity = parseInt(rawStock, 10);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      errors.push('Stock quantity must be a non-negative number');
    }

    const piecesPerPack = parseInt(rawPcs, 10) || 1;

    if (errors.length > 0) {
      invalidRows.push({
        rowNumber,
        name: name || 'N/A',
        productCode: productCode || 'N/A',
        errors,
      });
      continue;
    }

    // Resolve or Auto-create Category
    let categoryId = categoryMap.get(categoryName.toLowerCase());
    if (!categoryId) {
      const newCatSlug = generateSlug(categoryName) || `cat-${Date.now()}`;
      const createdCategory = await Category.create({
        name: categoryName,
        slug: newCatSlug,
        description: `${categoryName} Crackers collection`,
      });
      categoryId = createdCategory._id;
      categoryMap.set(categoryName.toLowerCase(), categoryId);
      categoryMap.set(newCatSlug, categoryId);
    }

    const discountPercentage = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    const slug = `item-${productCode || Date.now()}-${generateSlug(name)}`;
    const images = imageUrl ? imageUrl.split(',').map((url) => url.trim()).filter(Boolean) : [];

    if (productCode) fileSeenCodes.add(productCode);
    fileSeenNames.add(name.toLowerCase());

    validRows.push({
      productCode: productCode || '',
      name,
      slug,
      category: categoryId,
      brand: brandName,
      piecesPerPack,
      packSize: `${piecesPerPack} Pcs / Pack`,
      piecesPerBox: piecesPerPack,
      description,
      price,
      originalPrice,
      discountPercentage,
      stockQuantity,
      images,
      isFeatured: isFeaturedRaw === true || isFeaturedRaw === 'true' || isFeaturedRaw === 'TRUE' || isFeaturedRaw === 'yes' || isFeaturedRaw === 1,
      isActive: true,
    });
  }

  return {
    totalRows: rawRows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    validRows,
    invalidRows,
  };
};

/**
 * Generate Excel / CSV Buffer for Export
 */
const exportToBuffer = (data, sheetName = 'Export', format = 'xlsx') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  if (format === 'csv') {
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    return Buffer.from(csvContent, 'utf-8');
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = {
  parseBulkProductFile,
  exportToBuffer,
  generateSlug,
};
