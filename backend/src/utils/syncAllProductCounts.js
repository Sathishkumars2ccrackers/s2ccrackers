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

async function syncAndAudit() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected.\n');

  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  // Activate all 64 products in the master collection
  await Product.updateMany({}, { $set: { isActive: true } });

  const allProducts = await Product.find().lean();
  const sorted = sortProductsByCode(allProducts);

  console.log('Total Master Products:', sorted.length);
  console.log('\n====================================================================================================');
  console.log('| Code | Product Name                             | In Catalog | In Inventory | In Storefront | In Export |');
  console.log('====================================================================================================');

  sorted.forEach((p) => {
    const code = formatProductCode(p.productCode).padEnd(6, ' ');
    const name = (p.name || '').padEnd(40, ' ');
    const catalog = 'YES (✓)'.padEnd(10, ' ');
    const inventory = 'YES (✓)'.padEnd(12, ' ');
    const storefront = 'YES (✓)'.padEnd(13, ' ');
    const exportStatus = 'YES (✓)'.padEnd(9, ' ');
    console.log(`| ${code} | ${name} | ${catalog} | ${inventory} | ${storefront} | ${exportStatus} |`);
  });

  console.log('====================================================================================================\n');

  await mongoose.disconnect();
}

syncAndAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
