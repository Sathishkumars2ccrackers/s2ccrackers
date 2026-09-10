/**
 * Migration & Normalization Script for Categories in MongoDB
 * Standardizes category names and slugs to exact specification.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Category = require('../models/Category');
const Product = require('../models/Product');

const CATEGORY_STANDARDIZATION = [
  {
    targetName: 'Sparklers',
    targetSlug: 'sparklers',
    aliases: ['sparklers', 'sparkler'],
  },
  {
    targetName: 'Ground Chakkars',
    targetSlug: 'ground-chakkars',
    aliases: ['ground-chakkar', 'ground-chakkars', 'groundchakkar', 'groundchakkars', 'ground chakkar', 'ground chakkars'],
  },
  {
    targetName: 'Flower Pots',
    targetSlug: 'flower-pots',
    aliases: ['flower-pots', 'flower-pot', 'flowerpots', 'flowerpot', 'flower pots', 'flower pot'],
  },
  {
    targetName: 'Rockets & Missiles',
    targetSlug: 'rockets-missiles',
    aliases: ['rockets', 'rocket', 'rockets-missiles', 'rockets-and-missiles', 'rockets & missiles'],
  },
  {
    targetName: 'Multi-Shot Sky Shots',
    targetSlug: 'multi-shot-sky-shots',
    aliases: ['ariel-fancy-shots', 'sky-shots', 'multi-shot-sky-shots', 'multishot-sky-shots', 'ariel fancy shots', 'sky shots', 'multi-shot sky shots'],
  },
  {
    targetName: 'Sound Crackers',
    targetSlug: 'sound-crackers',
    aliases: ['sound-crackers', 'sound-cracker', 'soundcrackers', 'soundcracker', 'sound crackers', 'sound cracker'],
  },
  {
    targetName: 'Kids Special',
    targetSlug: 'kids-special',
    aliases: ['kids-novelties', 'kids-special', 'kids novelties', 'kids special', 'kidsnovelties', 'kidsspecial'],
  },
  {
    targetName: 'Deluxe Gift Boxes',
    targetSlug: 'deluxe-gift-boxes',
    aliases: ['gift-boxes', 'gift-box', 'deluxe-gift-boxes', 'deluxe gift boxes', 'gift boxes', 'gift box', 'giftboxes'],
  },
];

async function normalize() {
  console.log('🚀 Starting Category Standardization & Migration...\n');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  for (const std of CATEGORY_STANDARDIZATION) {
    // Find matching category by slug or name
    const found = await Category.findOne({
      $or: [
        { slug: std.targetSlug },
        { name: std.targetName },
        { slug: { $in: std.aliases } },
        { name: { $in: std.aliases } },
      ],
    });

    if (found) {
      const oldName = found.name;
      const oldSlug = found.slug;
      found.name = std.targetName;
      found.slug = std.targetSlug;
      await found.save();
      const count = await Product.countDocuments({ category: found._id });
      console.log(`✅ Normalized: "${oldName}" (${oldSlug}) ➔ "${found.name}" (${found.slug}) [Products: ${count}]`);
    } else {
      console.log(`ℹ️ Category not found for "${std.targetName}". Creating new...`);
      const created = await Category.create({
        name: std.targetName,
        slug: std.targetSlug,
        description: `Authentic Sivakasi ${std.targetName} fireworks`,
        isActive: true,
      });
      console.log(`✅ Created category: "${created.name}" (${created.slug})`);
    }
  }

  console.log('\n--- VERIFYING ALL CATEGORIES AFTER NORMALIZATION ---');
  const allCategories = await Category.find().lean();
  for (const c of allCategories) {
    const pCount = await Product.countDocuments({ category: c._id });
    console.log(`• ID: ${c._id} | Name: "${c.name}" | Slug: "${c.slug}" | Products: ${pCount}`);
  }

  await mongoose.disconnect();
  console.log('\n🎉 Category Normalization Complete!');
}

normalize().catch(console.error);
