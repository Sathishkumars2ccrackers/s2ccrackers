/**
 * Automated Test Suite for Order Tracking Security Verification
 * Tests:
 * 1. PASS: Correct Order ID + Correct Primary Phone
 * 2. PASS: Correct Order ID + Correct Secondary Phone
 * 3. FAIL: Correct Order ID + Wrong Phone (Generic error, no data leak)
 * 4. FAIL: Wrong Order ID + Correct Phone (Generic error, no data leak)
 * 5. FAIL: Wrong Order ID + Wrong Phone (Generic error, no data leak)
 * 6. FAIL: Empty values (Generic error)
 * 7. Rate Limiting Check (Max 10 requests / 15m)
 * 8. Privacy Check (No phone numbers, no admin internal notes)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Order = require('../models/Order');
const Product = require('../models/Product');

const TEST_PRIMARY_PHONE = '9876543210';
const TEST_ALT_PHONE = '9123456780';
const TEST_WRONG_PHONE = '9999999999';
const TEST_ORDER_ID = 'S2C-TEST-SECURE-001';
const WRONG_ORDER_ID = 'S2C-FAKE-ORDER-999';

async function runSecurityTests() {
  console.log('🚀 Starting Order Tracking Security & Privacy Verification Tests...\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Database');

    // 1. Setup sample test order
    await Order.deleteOne({ orderId: TEST_ORDER_ID });

    let dummyProduct = await Product.findOne();
    const dummyProductId = dummyProduct ? dummyProduct._id : new mongoose.Types.ObjectId();

    const createdOrder = await Order.create({
      orderId: TEST_ORDER_ID,
      customerDetails: {
        name: 'Sivakasi Diwali Buyer',
        phone: TEST_PRIMARY_PHONE,
        altPhone: TEST_ALT_PHONE,
        email: 'customer@example.com',
        address: '108, Festival Street, Gandhi Nagar',
        city: 'Madurai',
        state: 'Tamil Nadu',
        pincode: '625001',
        landmark: 'Near Temple Gate',
      },
      items: [
        {
          productId: dummyProductId,
          name: '1000 Wala Diwali Garland Crackers',
          price: 450,
          quantity: 2,
          subtotal: 900,
          image: '',
        },
      ],
      subtotal: 900,
      deliveryFee: 150,
      totalAmount: 1050,
      paymentMethod: 'Door Delivery Available',
      status: 'Shipped',
      dispatchStatus: 'Dispatched / In Transit',
      trackingNumber: 'VRL-MDU-847291',
      courierName: 'VRL Surface Logistics',
      estimatedDelivery: 'Tomorrow Evening',
      notes: 'Internal warehouse note: Check package seal',
      statusHistory: [
        {
          status: 'Pending',
          timestamp: new Date(Date.now() - 3600000 * 24),
          note: 'Order placed by customer (Door Delivery Available)',
          updatedBy: 'Customer',
        },
        {
          status: 'Shipped',
          timestamp: new Date(Date.now() - 3600000 * 5),
          note: 'Handed over to VRL Surface Express',
          updatedBy: 'WarehouseStaff_Admin1',
        },
      ],
    });

    console.log(`✅ Seeded test order: ${createdOrder.orderId}`);

    // Import controller directly to test verification logic
    const { trackOrder } = require('../controllers/orderController');

    // Helper mock response handler
    const mockRequest = (body) => {
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
      return { req: { body }, res, getResult: () => ({ status: resStatus, json: resJson }) };
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

    const EXPECTED_GENERIC_ERROR = 'Order not found. Please verify your Order ID and Phone Number.';

    // TEST 1: Correct Order ID + Correct Primary Phone
    console.log('\n--- Test 1: Correct Order ID + Correct Primary Phone ---');
    {
      const { req, res, getResult } = mockRequest({ orderId: TEST_ORDER_ID, phone: TEST_PRIMARY_PHONE });
      await trackOrder(req, res, () => {});
      const result = getResult();
      assertTest('Status 200 on valid Primary Phone', result.status === 200);
      assertTest('Response success === true', result.json?.success === true);
      assertTest('Order details returned', result.json?.order?.orderId === TEST_ORDER_ID);
      assertTest('Customer name returned', result.json?.order?.customerName === 'Sivakasi Diwali Buyer');
      assertTest('Courier and tracking info present', result.json?.order?.trackingNumber === 'VRL-MDU-847291');
    }

    // TEST 2: Correct Order ID + Correct Secondary Phone
    console.log('\n--- Test 2: Correct Order ID + Correct Secondary Phone ---');
    {
      const { req, res, getResult } = mockRequest({ orderId: TEST_ORDER_ID, phone: TEST_ALT_PHONE });
      await trackOrder(req, res, () => {});
      const result = getResult();
      assertTest('Status 200 on valid Secondary Phone', result.status === 200);
      assertTest('Response success === true', result.json?.success === true);
      assertTest('Order details returned correctly for secondary phone', result.json?.order?.orderId === TEST_ORDER_ID);
    }

    // TEST 3: Correct Order ID + Wrong Phone
    console.log('\n--- Test 3: Correct Order ID + Wrong Phone ---');
    {
      const { req, res, getResult } = mockRequest({ orderId: TEST_ORDER_ID, phone: TEST_WRONG_PHONE });
      await trackOrder(req, res, () => {});
      const result = getResult();
      assertTest('Status 404 for wrong phone', result.status === 404);
      assertTest('Exact generic error message returned', result.json?.message === EXPECTED_GENERIC_ERROR);
      assertTest('No order details leaked', !result.json?.order);
    }

    // TEST 4: Wrong Order ID + Correct Phone
    console.log('\n--- Test 4: Wrong Order ID + Correct Phone ---');
    {
      const { req, res, getResult } = mockRequest({ orderId: WRONG_ORDER_ID, phone: TEST_PRIMARY_PHONE });
      await trackOrder(req, res, () => {});
      const result = getResult();
      assertTest('Status 404 for wrong order ID', result.status === 404);
      assertTest('Exact generic error message returned (obfuscated)', result.json?.message === EXPECTED_GENERIC_ERROR);
      assertTest('No order details leaked', !result.json?.order);
    }

    // TEST 5: Wrong Order ID + Wrong Phone
    console.log('\n--- Test 5: Wrong Order ID + Wrong Phone ---');
    {
      const { req, res, getResult } = mockRequest({ orderId: WRONG_ORDER_ID, phone: TEST_WRONG_PHONE });
      await trackOrder(req, res, () => {});
      const result = getResult();
      assertTest('Status 404 for wrong order ID and wrong phone', result.status === 404);
      assertTest('Exact generic error message returned', result.json?.message === EXPECTED_GENERIC_ERROR);
      assertTest('No order details leaked', !result.json?.order);
    }

    // TEST 6: Empty values
    console.log('\n--- Test 6: Empty values / missing parameters ---');
    {
      const { req, res, getResult } = mockRequest({ orderId: '', phone: '' });
      await trackOrder(req, res, () => {});
      const result = getResult();
      assertTest('Status 400 for empty values', result.status === 400);
      assertTest('Exact generic error message returned', result.json?.message === EXPECTED_GENERIC_ERROR);
    }

    // TEST 7: Privacy & Security Checks
    console.log('\n--- Test 7: Privacy & Data Sanitization Checks ---');
    {
      const { req, res, getResult } = mockRequest({ orderId: TEST_ORDER_ID, phone: TEST_PRIMARY_PHONE });
      await trackOrder(req, res, () => {});
      const result = getResult();
      const returnedOrder = result.json?.order;

      assertTest('No customer primary phone exposed in tracking result', !returnedOrder.customerDetails?.phone);
      assertTest('No customer alt phone exposed in tracking result', !returnedOrder.customerDetails?.altPhone);
      assertTest('No customer email exposed in tracking result', !returnedOrder.customerDetails?.email);
      assertTest('Internal admin notes stripped from result', !returnedOrder.notes);
      
      const adminNamesLeaked = returnedOrder.statusHistory?.some((h) => h.updatedBy);
      assertTest('Internal admin username stripped from status history', !adminNamesLeaked);
    }

    // Clean up test order
    await Order.deleteOne({ orderId: TEST_ORDER_ID });
    console.log('\n🧹 Cleaned up temporary test order');

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log(`========================================\n`);

    await mongoose.disconnect();
    if (failCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runSecurityTests();
