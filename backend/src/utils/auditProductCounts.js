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

async function audit() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected.\n');

  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));

  const allDbProducts = await Product.find().lean();
  console.log('Total Products in MongoDB:', allDbProducts.length);

  const categories = await Category.find().lean();
  const catMap = {};
  categories.forEach(c => { catMap[c._id.toString()] = c.name; });

  const sortedProducts = sortProductsByCode(allDbProducts);

  console.log('\n--- DETAILED PRODUCT LIST ---');
  sortedProducts.forEach((p, i) => {
    console.log(
      `${i + 1}. Code: ${formatProductCode(p.productCode)} (raw: ${p.productCode}) | Name: ${p.name} | isActive: ${p.isActive} | stock: ${p.stockQuantity} | category: ${catMap[p.category?.toString()] || p.category} | isFeatured: ${p.isFeatured}`
    );
  });

  // Check code distribution
  const existingCodes = sortedProducts.map(p => getCodeNumber(p.productCode));
  console.log('\nSorted Code Numbers:', existingCodes.join(', '));

  // Find missing codes from 1 to 64
  const missingCodes = [];
  for (let c = 1; c <= 64; c++) {
    if (!existingCodes.includes(c)) {
      missingCodes.push(c);
    }
  }
  console.log('Missing Code numbers between 1 and 64:', missingCodes);

  // Check duplicate codes
  const codeCounts = {};
  sortedProducts.forEach(p => {
    const num = getCodeNumber(p.productCode);
    codeCounts[num] = (codeCounts[num] || 0) + 1;
  });
  const duplicates = Object.entries(codeCounts).filter(([k, v]) => v > 1);
  console.log('Duplicate codes:', duplicates);

  // Inactive products
  const inactives = sortedProducts.filter(p => !p.isActive);
  console.log('\nInactive products count:', inactives.length);
  inactives.forEach(p => {
    console.log(`- Code: ${formatProductCode(p.productCode)} | Name: ${p.name} | isActive: ${p.isActive}`);
  });

  await mongoose.disconnect();
}

audit().catch(err => {
  console.error(err);
  process.exit(1);
});
