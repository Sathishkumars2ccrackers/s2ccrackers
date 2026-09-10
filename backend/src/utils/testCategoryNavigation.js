/**
 * Comprehensive Category Navigation & Filter Test Suite
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { getProducts } = require('../controllers/productController');

async function testCategoryNavigation() {
  console.log('🚀 Starting Category Navigation & Filter Test Suite...\n');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const mockRequest = (query) => {
    let resStatus = 200;
    let resJson = null;
    const res = {
      status: (code) => {
        resStatus = code;
        return res;
      },
      json: (data) => {
        resJson = data;
        return res;
      },
    };
    return { req: { query }, res, getResult: () => ({ status: resStatus, json: resJson }) };
  };

  let passCount = 0;
  let failCount = 0;

  const assertTest = (testName, condition, details = '') => {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${details}`);
      failCount++;
    }
  };

  const HOMEPAGE_CATEGORIES = [
    { slug: 'sparklers', name: 'Sparklers', minCount: 1 },
    { slug: 'ground-chakkars', name: 'Ground Chakkars', minCount: 1 },
    { slug: 'flower-pots', name: 'Flower Pots', minCount: 1 },
    { slug: 'rockets-missiles', name: 'Rockets & Missiles', minCount: 1 },
    { slug: 'multi-shot-sky-shots', name: 'Multi-Shot Sky Shots', minCount: 1 },
    { slug: 'sound-crackers', name: 'Sound Crackers', minCount: 1 },
    { slug: 'kids-special', name: 'Kids Special', minCount: 1 },
    { slug: 'deluxe-gift-boxes', name: 'Deluxe Gift Boxes', minCount: 1 },
  ];

  console.log('--- 1. Testing All 8 Homepage Category Slugs ---');
  for (const cat of HOMEPAGE_CATEGORIES) {
    const { req, res, getResult } = mockRequest({ category: cat.slug });
    await getProducts(req, res, () => {});
    const result = getResult();

    assertTest(
      `Category "${cat.name}" (slug: ${cat.slug}) returned status 200`,
      result.status === 200
    );
    assertTest(
      `Category "${cat.name}" returned >= ${cat.minCount} products (Got: ${result.json?.products?.length})`,
      result.json?.products?.length >= cat.minCount,
      `Products: ${result.json?.products?.length}`
    );
    // Verify all returned products belong to this category
    const allMatch = result.json?.products?.every(
      (p) => p.category?.slug === cat.slug || p.category?.name === cat.name
    );
    assertTest(`All returned products belong to "${cat.name}"`, allMatch);
  }

  console.log('\n--- 2. Testing Inconsistent/Legacy Aliases & Spelling Variations ---');
  const ALIAS_TESTS = [
    { alias: 'ground-chakkar', expectedSlug: 'ground-chakkars' },
    { alias: 'rockets', expectedSlug: 'rockets-missiles' },
    { alias: 'sky-shots', expectedSlug: 'multi-shot-sky-shots' },
    { alias: 'ariel-fancy-shots', expectedSlug: 'multi-shot-sky-shots' },
    { alias: 'kids-novelties', expectedSlug: 'kids-special' },
    { alias: 'gift-boxes', expectedSlug: 'deluxe-gift-boxes' },
    { alias: 'flower-pot', expectedSlug: 'flower-pots' },
    { alias: 'sound-cracker', expectedSlug: 'sound-crackers' },
  ];

  for (const t of ALIAS_TESTS) {
    const { req, res, getResult } = mockRequest({ category: t.alias });
    await getProducts(req, res, () => {});
    const result = getResult();

    assertTest(
      `Alias "${t.alias}" resolves to "${t.expectedSlug}" and returns products`,
      result.json?.products?.length > 0 && result.json?.products[0]?.category?.slug === t.expectedSlug,
      `Found ${result.json?.products?.length} products`
    );
  }

  console.log('\n--- 3. Testing Case-Insensitivity & Whitespace Trimming ---');
  const CASE_TESTS = [
    { input: 'SPARKLERS', expectedSlug: 'sparklers' },
    { input: ' Flower Pots ', expectedSlug: 'flower-pots' },
    { input: 'DELUXE-GIFT-BOXES', expectedSlug: 'deluxe-gift-boxes' },
    { input: 'Kids Special', expectedSlug: 'kids-special' },
  ];

  for (const t of CASE_TESTS) {
    const { req, res, getResult } = mockRequest({ category: t.input });
    await getProducts(req, res, () => {});
    const result = getResult();

    assertTest(
      `Input "${t.input}" correctly matches "${t.expectedSlug}"`,
      result.json?.products?.length > 0 && result.json?.products[0]?.category?.slug === t.expectedSlug,
      `Count: ${result.json?.products?.length}`
    );
  }

  console.log('\n--- 4. Testing Non-Existent Category Fallback Handling ---');
  {
    const { req, res, getResult } = mockRequest({ category: 'non-existent-space-cracker' });
    await getProducts(req, res, () => {});
    const result = getResult();

    assertTest('Non-existent category returns 200 with 0 products (not all products)', result.json?.products?.length === 0 && result.json?.total === 0);
  }

  console.log('\n========================================');
  console.log(`CATEGORY TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('========================================\n');

  await mongoose.disconnect();
  if (failCount > 0) process.exit(1);
  else process.exit(0);
}

testCategoryNavigation().catch(console.error);
