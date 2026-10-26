const assert = require('assert');
const {
  toPaise,
  toRupees,
  calculateItemPricing,
  calculateOrderPricing,
  calculateOrderTotalsFromOrder,
} = require('./src/utils/pricing');

console.log('====================================================');
console.log('🧪 S2C CRACKERS - UNIFIED PRICING AUDIT TEST SUITE');
console.log('====================================================\n');

let testsPassed = 0;
let testsTotal = 0;

function runTest(name, fn) {
  testsTotal++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// Test 1: Integer Paise Arithmetic Precision
// -----------------------------------------------------------------------------
runTest('Integer Paise Arithmetic (zero IEEE-754 drift)', () => {
  // Test floating point drift cases
  assert.strictEqual(toPaise(0.1 + 0.2), 30);
  assert.strictEqual(toRupees(toPaise(0.1 + 0.2)), 0.3);
  assert.strictEqual(toPaise(3193.333), 319333);
  assert.strictEqual(toRupees(319333), 3193.33);
  assert.strictEqual(toPaise('3848.00'), 384800);
  assert.strictEqual(toRupees(384800), 3848);
});

// -----------------------------------------------------------------------------
// Test 2: One Product with Quantity One
// -----------------------------------------------------------------------------
runTest('One Product with Quantity One', () => {
  const product = {
    _id: 'prod_1',
    name: '10cm Electric Sparklers',
    price: 80,
    originalPrice: 400,
    discountPercentage: 80,
  };

  const itemPricing = calculateItemPricing(product, 1);
  assert.strictEqual(itemPricing.mrpPrice, 400);
  assert.strictEqual(itemPricing.sellingPrice, 80);
  assert.strictEqual(itemPricing.lineMrp, 400);
  assert.strictEqual(itemPricing.lineSellingPrice, 80);
  assert.strictEqual(itemPricing.lineSavings, 320);

  const orderTotals = calculateOrderPricing([itemPricing], {
    freeDeliveryThreshold: 7000,
    defaultDeliveryFee: 300,
    discountSlabs: [
      { minAmount: 5000, discountPercentage: 2 },
      { minAmount: 8000, discountPercentage: 3 },
    ],
  });

  assert.strictEqual(orderTotals.totalMRP, 400);
  assert.strictEqual(orderTotals.totalProductDiscount, 320);
  assert.strictEqual(orderTotals.amountAfterProductDiscount, 80);
  assert.strictEqual(orderTotals.specialDiscount, 0);
  assert.strictEqual(orderTotals.deliveryCharges, 300);
  assert.strictEqual(orderTotals.finalPayableAmount, 380); // 80 + 300
  assert.strictEqual(orderTotals.totalSavings, 320);
});

// -----------------------------------------------------------------------------
// Test 3: Multiple Products with Different MRPs & Discounts
// -----------------------------------------------------------------------------
runTest('Multiple Products with Different MRPs & Discounts', () => {
  const items = [
    { name: 'Item A', originalPrice: 500, price: 100, quantity: 2 },  // MRP: 1000, Selling: 200, Save: 800
    { name: 'Item B', originalPrice: 1000, price: 250, quantity: 3 }, // MRP: 3000, Selling: 750, Save: 2250
    { name: 'Item C', originalPrice: 2000, price: 600, quantity: 1 }, // MRP: 2000, Selling: 600, Save: 1400
  ];

  const orderTotals = calculateOrderPricing(items, {
    freeDeliveryThreshold: 7000,
    defaultDeliveryFee: 300,
    discountSlabs: [{ minAmount: 5000, discountPercentage: 2 }],
  });

  assert.strictEqual(orderTotals.totalMRP, 6000);
  assert.strictEqual(orderTotals.totalProductDiscount, 4450);
  assert.strictEqual(orderTotals.amountAfterProductDiscount, 1550);
  assert.strictEqual(orderTotals.specialDiscount, 0);
  assert.strictEqual(orderTotals.deliveryCharges, 300);
  assert.strictEqual(orderTotals.finalPayableAmount, 1850);
  assert.strictEqual(orderTotals.totalSavings, 4450);
});

// -----------------------------------------------------------------------------
// Test 4: Quantity Changes and Item Removal Recalculations
// -----------------------------------------------------------------------------
runTest('Quantity Changes and Item Removal', () => {
  const baseItems = [
    { productId: '1', name: 'Item 1', originalPrice: 1000, price: 200, quantity: 1 },
    { productId: '2', name: 'Item 2', originalPrice: 2000, price: 500, quantity: 2 },
  ];

  // Initial
  let totals = calculateOrderPricing(baseItems, { freeDeliveryThreshold: 7000, defaultDeliveryFee: 300 });
  assert.strictEqual(totals.amountAfterProductDiscount, 1200); // 200 + 1000

  // Update quantity of Item 1 to 3
  const updatedItems = baseItems.map((item) =>
    item.productId === '1' ? { ...item, quantity: 3 } : item
  );
  totals = calculateOrderPricing(updatedItems, { freeDeliveryThreshold: 7000, defaultDeliveryFee: 300 });
  assert.strictEqual(totals.totalMRP, 7000); // 3*1000 + 2*2000
  assert.strictEqual(totals.amountAfterProductDiscount, 1600); // 3*200 + 2*500 = 600 + 1000
  assert.strictEqual(totals.finalPayableAmount, 1900); // 1600 + 300

  // Remove Item 2
  const filteredItems = updatedItems.filter((item) => item.productId !== '2');
  totals = calculateOrderPricing(filteredItems, { freeDeliveryThreshold: 7000, defaultDeliveryFee: 300 });
  assert.strictEqual(totals.totalMRP, 3000);
  assert.strictEqual(totals.amountAfterProductDiscount, 600);
  assert.strictEqual(totals.finalPayableAmount, 900); // 600 + 300
});

// -----------------------------------------------------------------------------
// Test 5: Eligible & Ineligible Special Discounts & Free Delivery Thresholds
// -----------------------------------------------------------------------------
runTest('Eligible & Ineligible Special Discounts and Free Delivery', () => {
  const options = {
    freeDeliveryThreshold: 7000,
    defaultDeliveryFee: 300,
    discountSlabs: [
      { minAmount: 5000, discountPercentage: 2 },
      { minAmount: 8000, discountPercentage: 3 },
    ],
  };

  // Case A: Below first slab (subtotal 4,000) -> 0% slab discount, paid delivery (300)
  const cartA = [{ originalPrice: 10000, price: 4000, quantity: 1 }];
  const resA = calculateOrderPricing(cartA, options);
  assert.strictEqual(resA.specialDiscountPercentage, 0);
  assert.strictEqual(resA.specialDiscount, 0);
  assert.strictEqual(resA.deliveryCharges, 300);
  assert.strictEqual(resA.finalPayableAmount, 4300);

  // Case B: Eligible for 2% slab (subtotal 6,000) -> 2% slab discount (120), paid delivery (300)
  const cartB = [{ originalPrice: 15000, price: 6000, quantity: 1 }];
  const resB = calculateOrderPricing(cartB, options);
  assert.strictEqual(resB.specialDiscountPercentage, 2);
  assert.strictEqual(resB.specialDiscount, 120); // 2% of 6000
  assert.strictEqual(resB.deliveryCharges, 300); // 6000 < 7000
  assert.strictEqual(resB.finalPayableAmount, 6180); // 6000 - 120 + 300

  // Case C: Eligible for Free Delivery only (subtotal 7,500) -> 2% slab discount (150), free delivery (0)
  const cartC = [{ originalPrice: 20000, price: 7500, quantity: 1 }];
  const resC = calculateOrderPricing(cartC, options);
  assert.strictEqual(resC.specialDiscountPercentage, 2);
  assert.strictEqual(resC.specialDiscount, 150); // 2% of 7500
  assert.strictEqual(resC.deliveryCharges, 0); // 7500 >= 7000
  assert.strictEqual(resC.finalPayableAmount, 7350); // 7500 - 150 + 0

  // Case D: Eligible for 3% slab and Free Delivery (subtotal 10,000) -> 3% slab discount (300), free delivery (0)
  const cartD = [{ originalPrice: 30000, price: 10000, quantity: 1 }];
  const resD = calculateOrderPricing(cartD, options);
  assert.strictEqual(resD.specialDiscountPercentage, 3);
  assert.strictEqual(resD.specialDiscount, 300); // 3% of 10000
  assert.strictEqual(resD.deliveryCharges, 0);
  assert.strictEqual(resD.finalPayableAmount, 9700); // 10000 - 300 + 0
});

// -----------------------------------------------------------------------------
// Test 6: Root Cause Resolution: The ₹3,193 vs ₹3,848 Mismatch
// -----------------------------------------------------------------------------
runTest('Root Cause Resolution: ₹3,193 vs ₹3,848 Discrepancy', () => {
  // Scenario: Cart with discounted subtotal = 3,548
  const testCartItems = [
    { productId: 'p1', name: 'Combo Item 1', originalPrice: 6000, price: 2000, quantity: 1 },
    { productId: 'p2', name: 'Combo Item 2', originalPrice: 4000, price: 1548, quantity: 1 },
  ];

  // Old buggy FloatingCartBar behavior before fix (with default 10% slab for subtotal >= 3000, and no delivery fee):
  const oldDiscountAmount = Math.round((3548 * 10) / 100); // 355
  const oldFloatingCartTotal = 3548 - oldDiscountAmount; // 3193!
  assert.strictEqual(oldFloatingCartTotal, 3193);

  // Old checkout behavior (with production settings: fee 300, slabs starting at 5000):
  const oldCheckoutTotal = 3548 - 0 + 300; // 3848!
  assert.strictEqual(oldCheckoutTotal, 3848);

  // New Unified Behavior with Fixed Engine:
  const liveProductionOptions = {
    freeDeliveryThreshold: 7000,
    defaultDeliveryFee: 300,
    discountSlabs: [
      { minAmount: 5000, discountPercentage: 2 },
      { minAmount: 8000, discountPercentage: 3 },
    ],
  };

  const unifiedCartTotals = calculateOrderPricing(testCartItems, liveProductionOptions);

  // Verify that the unified pricing engine calculates 3,848 everywhere:
  assert.strictEqual(unifiedCartTotals.amountAfterProductDiscount, 3548);
  assert.strictEqual(unifiedCartTotals.specialDiscount, 0); // 3548 < 5000 slab
  assert.strictEqual(unifiedCartTotals.deliveryCharges, 300); // 3548 < 7000 free threshold
  assert.strictEqual(unifiedCartTotals.finalPayableAmount, 3848); // EXACT MATCH

  // Now simulate creating an order with this cart
  const orderDoc = {
    orderId: 'S2C-20261026-TEST01',
    customerDetails: { name: 'Test Customer', phone: '9876543210' },
    items: testCartItems,
    totalMRP: unifiedCartTotals.totalMRP,
    totalProductDiscount: unifiedCartTotals.totalProductDiscount,
    amountAfterProductDiscount: unifiedCartTotals.amountAfterProductDiscount,
    specialDiscount: unifiedCartTotals.specialDiscount,
    specialDiscountPercentage: unifiedCartTotals.specialDiscountPercentage,
    deliveryCharges: unifiedCartTotals.deliveryCharges,
    finalPayableAmount: unifiedCartTotals.finalPayableAmount,
    totalSavings: unifiedCartTotals.totalSavings,
    orderMrpTotal: unifiedCartTotals.totalMRP,
    orderSavingsTotal: unifiedCartTotals.totalSavings,
    orderFinalTotal: unifiedCartTotals.finalPayableAmount,
    subtotal: unifiedCartTotals.amountAfterProductDiscount,
    deliveryFee: unifiedCartTotals.deliveryCharges,
    totalAmount: unifiedCartTotals.finalPayableAmount,
  };

  // Re-read order totals as OrderSuccess, Invoice, Tracking, and Admin do:
  const orderViewTotals = calculateOrderTotalsFromOrder(orderDoc);

  assert.strictEqual(orderViewTotals.amountAfterProductDiscount, 3548);
  assert.strictEqual(orderViewTotals.specialDiscount, 0);
  assert.strictEqual(orderViewTotals.deliveryCharges, 300);
  assert.strictEqual(orderViewTotals.finalPayableAmount, 3848);
  assert.strictEqual(orderViewTotals.totalMRP, 10000);
  assert.strictEqual(orderViewTotals.totalSavings, 6452);
});

// -----------------------------------------------------------------------------
// Test 7: Cart Rehydration & JSON Serialization Roundtrip
// -----------------------------------------------------------------------------
runTest('Cart Rehydration & JSON Serialization Roundtrip', () => {
  const originalCart = [
    { productId: 'p1', name: 'Item 1', originalPrice: 500, price: 100, quantity: 2 },
    { productId: 'p2', name: 'Item 2', originalPrice: 1000, price: 300, quantity: 1 },
  ];

  const serialized = JSON.stringify(originalCart);
  const rehydrated = JSON.parse(serialized);

  const totalsBefore = calculateOrderPricing(originalCart);
  const totalsAfter = calculateOrderPricing(rehydrated);

  assert.deepStrictEqual(totalsBefore, totalsAfter);
});

// -----------------------------------------------------------------------------
// Test 8: Backward Compatibility with Legacy Orders
// -----------------------------------------------------------------------------
runTest('Backward Compatibility with Legacy Orders', () => {
  // Older order created before unified schema additions
  const legacyOrder = {
    orderId: 'S2C-LEGACY-001',
    subtotal: 3500,
    orderMrpTotal: 10000,
    orderSavingsTotal: 6500,
    discountAmount: 100,
    discountPercentage: 5,
    deliveryFee: 150,
    totalAmount: 3550, // 3500 - 100 + 150
  };

  const reconstructed = calculateOrderTotalsFromOrder(legacyOrder);

  assert.strictEqual(reconstructed.totalMRP, 10000);
  assert.strictEqual(reconstructed.amountAfterProductDiscount, 3500);
  assert.strictEqual(reconstructed.totalProductDiscount, 6500);
  assert.strictEqual(reconstructed.specialDiscount, 100);
  assert.strictEqual(reconstructed.specialDiscountPercentage, 5);
  assert.strictEqual(reconstructed.deliveryCharges, 150);
  assert.strictEqual(reconstructed.finalPayableAmount, 3550);
  assert.strictEqual(reconstructed.totalSavings, 6600); // 6500 + 100
});

console.log('\n====================================================');
console.log(`📊 TEST RESULTS: ${testsPassed} / ${testsTotal} PASSED`);
console.log('====================================================');

if (testsPassed === testsTotal) {
  console.log('🎉 ALL PRICING AND CHECKOUT TESTS PASSED WITH 100% ACCURACY!');
} else {
  process.exit(1);
}
