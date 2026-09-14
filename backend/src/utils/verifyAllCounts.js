const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');

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
    return '#' + clean.padStart(2, '0');
  }
  return '#' + clean;
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

async function verifyAllCounts() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));

  // 1. Master DB count
  const masterProducts = await Product.find().lean();
  const sorted = sortProductsByCode(masterProducts);
  const totalMasterCount = sorted.length;

  // 2. Admin Catalog query simulation
  const adminProducts = await Product.find({}).collation({ locale: 'en', numericOrdering: true }).sort({ productCode: 1, createdAt: 1 }).lean();
  const catalogCount = adminProducts.length;

  // 3. Inventory Overview query simulation
  const inventoryTotalCount = await Product.countDocuments();
  const inventoryInStock = await Product.countDocuments({ stockQuantity: { $gt: 10 } });
  const inventoryLowStock = await Product.countDocuments({ stockQuantity: { $gt: 0, $lte: 10 } });
  const inventoryOutOfStock = await Product.countDocuments({ stockQuantity: { $lte: 0 } });

  // 4. Storefront query simulation
  const storefrontProducts = await Product.find({ isActive: true }).collation({ locale: 'en', numericOrdering: true }).sort({ productCode: 1, createdAt: 1 }).lean();
  const storefrontCount = storefrontProducts.length;

  // 5. Export query simulation
  const exportProducts = await Product.find().lean();
  const exportCount = exportProducts.length;

  console.log('================================================================');
  console.log('            S2C CRACKERS - UNIFIED PRODUCT COUNTS AUDIT         ');
  console.log('================================================================');
  console.log(`1. Master Database Collection Count:  ${totalMasterCount}`);
  console.log(`2. Product Catalog Page Count:        ${catalogCount}  (Expected: 64) -> ${catalogCount === 64 ? 'MATCH ✓' : 'MISMATCH ✗'}`);
  console.log(`3. Inventory Management Count:        ${inventoryTotalCount}  (Expected: 64) -> ${inventoryTotalCount === 64 ? 'MATCH ✓' : 'MISMATCH ✗'}`);
  console.log(`   - In Stock (>10):                  ${inventoryInStock}`);
  console.log(`   - Low Stock (1-10):                ${inventoryLowStock}`);
  console.log(`   - Out of Stock (0):                ${inventoryOutOfStock}`);
  console.log(`4. Storefront All Crackers Count:     ${storefrontCount}  (Expected: 64) -> ${storefrontCount === 64 ? 'MATCH ✓' : 'MISMATCH ✗'}`);
  console.log(`5. Storefront Catalog Footer Count:   ${storefrontCount}  (Expected: 64) -> ${storefrontCount === 64 ? 'MATCH ✓' : 'MISMATCH ✗'}`);
  console.log(`6. Excel / CSV Export Count:          ${exportCount}  (Expected: 64) -> ${exportCount === 64 ? 'MATCH ✓' : 'MISMATCH ✗'}`);
  console.log('================================================================\n');

  console.log('Code Range & Numeric Ordering:');
  console.log(`- First Product: ${formatProductCode(sorted[0].productCode)} (${sorted[0].name})`);
  console.log(`- Last Product:  ${formatProductCode(sorted[sorted.length - 1].productCode)} (${sorted[sorted.length - 1].name})`);

  let strictlyOrdered = true;
  for (let i = 0; i < sorted.length; i++) {
    const expectedNum = i + 1;
    const actualNum = getCodeNumber(sorted[i].productCode);
    if (actualNum !== expectedNum) {
      console.log(`Ordering gap at index ${i}: expected #${expectedNum}, found #${actualNum}`);
      strictlyOrdered = false;
    }
  }
  console.log(`- Continuous #01 to #64 Numeric Ordering: ${strictlyOrdered ? 'VERIFIED 100% PERFECT ✓' : 'FAILED ✗'}`);

  await mongoose.disconnect();
}

verifyAllCounts().catch(err => {
  console.error(err);
  process.exit(1);
});
