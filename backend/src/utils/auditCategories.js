const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Category = require('../models/Category');
const Product = require('../models/Product');

async function audit() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const categories = await Category.find().lean();
  console.log('\n--- ALL CATEGORIES IN DB ---');
  for (const c of categories) {
    const productCount = await Product.countDocuments({ category: c._id });
    console.log(`ID: ${c._id} | Name: "${c.name}" | Slug: "${c.slug}" | Products: ${productCount}`);
  }

  const productsWithoutCategory = await Product.countDocuments({ category: { $exists: false } });
  const productsWithNullCategory = await Product.countDocuments({ category: null });
  console.log(`\nProducts without category field: ${productsWithoutCategory}`);
  console.log(`Products with null category: ${productsWithNullCategory}`);

  await mongoose.disconnect();
}

audit();
