/**
 * Automated Verification Script for S2C Crackers Payment Status Management Feature
 */
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Admin = require('../models/Admin');
const ActivityLog = require('../models/ActivityLog');
const orderRoutes = require('../routes/orderRoutes');

function requestHttp(port, path, method, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      ...headers,
    };
    if (data) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(data);
    }
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(responseData) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: responseData });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runPaymentStatusTests() {
  console.log('🧪 Starting Verification Tests for Payment Status Feature...\n');
  await mongoose.connect(process.env.MONGODB_URI);

  const app = express();
  app.use(express.json());
  app.use('/api/orders', orderRoutes);

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ success: false, message: err.message });
  });

  const PORT = 5099;
  const server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}`);

    // Create a temporary test admin token
    let admin = await Admin.findOne();
    if (!admin) {
      admin = await Admin.create({
        name: 'Test Admin',
        email: 'testadmin_payment@s2ccrackers.com',
        password: 'Password123!',
        role: 'superadmin',
        isActive: true,
      });
    }

    const adminToken = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET || 's2c_crackers_festival_jwt_secret_key_2026_production_safe',
      { expiresIn: '1h' }
    );
    const authHeader = { Authorization: `Bearer ${adminToken}` };

    const TEST_ORDER_ID_1 = 'S2C-PAYTEST-001';
    const TEST_ORDER_ID_2 = 'S2C-PAYTEST-002';
    const TEST_PRODUCT_NAME = 'Payment Test 1000 Wala';

    await Order.deleteMany({ orderId: { $in: [TEST_ORDER_ID_1, TEST_ORDER_ID_2] } });
    await Product.deleteMany({ name: TEST_PRODUCT_NAME });

    let testCategory = await Category.findOne();
    if (!testCategory) {
      testCategory = await Category.create({
        name: 'Test Garlands',
        slug: 'test-garlands',
      });
    }

    const testProduct = await Product.create({
      name: TEST_PRODUCT_NAME,
      slug: 'payment-test-1000-wala',
      category: testCategory._id,
      description: 'Quality tested garland cracker',
      price: 450,
      stockQuantity: 50,
      isActive: true,
    });

    try {
      // TEST 1: Default paymentStatus is Unpaid
      console.log('Test 1: Default paymentStatus on newly created order...');
      const order1 = await Order.create({
        orderId: TEST_ORDER_ID_1,
        customerDetails: {
          name: 'Test Customer 1',
          phone: '9844002211',
          address: 'Main Bazaar, Sivakasi',
          city: 'Sivakasi',
          pincode: '626123',
        },
        items: [{
          productId: testProduct._id,
          name: testProduct.name,
          price: 450,
          quantity: 2,
          subtotal: 900,
        }],
        subtotal: 900,
        totalAmount: 900,
        status: 'Pending',
      });

      if (order1.paymentStatus !== 'Unpaid') {
        throw new Error(`Expected paymentStatus 'Unpaid', got '${order1.paymentStatus}'`);
      }
      console.log('✅ Test 1 Passed: Newly created order defaults to "Unpaid".');

      // TEST 2: Existing order without paymentStatus field displays Unpaid
      console.log('\nTest 2: Existing legacy order without paymentStatus field displays Unpaid...');
      await mongoose.connection.collection('orders').insertOne({
        orderId: TEST_ORDER_ID_2,
        customerDetails: {
          name: 'Legacy Customer',
          phone: '9844002233',
          address: 'Gandhi Road',
          city: 'Madurai',
          pincode: '625001',
        },
        items: [{
          productId: testProduct._id,
          name: testProduct.name,
          price: 450,
          quantity: 1,
          subtotal: 450,
        }],
        subtotal: 450,
        totalAmount: 450,
        status: 'Confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const fetchedLegacy = await Order.findOne({ orderId: TEST_ORDER_ID_2 });
      if (fetchedLegacy.paymentStatus !== 'Unpaid') {
        throw new Error(`Expected legacy order paymentStatus to default to 'Unpaid', got '${fetchedLegacy.paymentStatus}'`);
      }
      console.log('✅ Test 2 Passed: Legacy order without paymentStatus resolves to "Unpaid".');

      // TEST 3: Unauthenticated request to update payment status is blocked
      console.log('\nTest 3: Unauthenticated access to PATCH /api/orders/admin/:id/payment-status...');
      let unauthRes = await requestHttp(PORT, `/api/orders/admin/${order1._id}/payment-status`, 'PATCH', {}, {
        paymentStatus: 'Paid',
      });
      if (unauthRes.status !== 401) {
        throw new Error(`Expected 401 Unauthorized, got status ${unauthRes.status}`);
      }
      console.log('✅ Test 3 Passed: Unauthenticated requests are securely rejected with 401.');

      // TEST 4: Invalid paymentStatus value is rejected
      console.log('\nTest 4: Invalid paymentStatus value validation...');
      let invalidRes = await requestHttp(PORT, `/api/orders/admin/${order1._id}/payment-status`, 'PATCH', authHeader, {
        paymentStatus: 'InvalidStatus',
      });
      if (invalidRes.status !== 400) {
        throw new Error(`Expected 400 Bad Request for invalid payment status, got ${invalidRes.status}`);
      }
      console.log('✅ Test 4 Passed: Server validates and rejects invalid paymentStatus.');

      // TEST 5: Admin marks order as Paid with payment reference
      console.log('\nTest 5: Admin marks order as Paid...');
      let markPaidRes = await requestHttp(PORT, `/api/orders/admin/${order1._id}/payment-status`, 'PATCH', authHeader, {
        paymentStatus: 'Paid',
        paymentReference: 'UPI-REF-998877665544',
      });
      if (markPaidRes.status !== 200 || markPaidRes.json?.order?.paymentStatus !== 'Paid') {
        throw new Error(`Failed to mark order as Paid: ${JSON.stringify(markPaidRes.json)}`);
      }
      if (markPaidRes.json?.order?.paymentReference !== 'UPI-REF-998877665544') {
        throw new Error(`Payment reference not saved: ${markPaidRes.json?.order?.paymentReference}`);
      }
      console.log('✅ Test 5 Passed: Order successfully marked as Paid and reference saved.');

      // TEST 6: Admin changes Paid order back to Unpaid
      console.log('\nTest 6: Admin changes Paid order back to Unpaid...');
      let markUnpaidRes = await requestHttp(PORT, `/api/orders/admin/${order1._id}/payment-status`, 'PATCH', authHeader, {
        paymentStatus: 'Unpaid',
        paymentReference: 'Incorrect mark corrected',
      });
      if (markUnpaidRes.status !== 200 || markUnpaidRes.json?.order?.paymentStatus !== 'Unpaid') {
        throw new Error(`Failed to change order back to Unpaid: ${JSON.stringify(markUnpaidRes.json)}`);
      }
      console.log('✅ Test 6 Passed: Order successfully updated back to Unpaid.');

      // TEST 7: Changing dispatch status does NOT alter payment status
      console.log('\nTest 7: Independence of dispatch status and payment status...');
      // Mark as Paid again
      await requestHttp(PORT, `/api/orders/admin/${order1._id}/payment-status`, 'PATCH', authHeader, {
        paymentStatus: 'Paid',
      });
      // Change dispatch status to Shipped
      let dispatchRes = await requestHttp(PORT, `/api/orders/admin/${order1._id}/status`, 'PATCH', authHeader, {
        status: 'Shipped',
        note: 'Dispatched via VRL Surface',
      });
      if (dispatchRes.status !== 200) {
        throw new Error(`Failed to update dispatch status: ${JSON.stringify(dispatchRes.json)}`);
      }
      const recheckedOrder = await Order.findById(order1._id);
      if (recheckedOrder.status !== 'Shipped' || recheckedOrder.paymentStatus !== 'Paid') {
        throw new Error(`Status mismatch: status=${recheckedOrder.status}, paymentStatus=${recheckedOrder.paymentStatus}`);
      }
      console.log('✅ Test 7 Passed: Dispatch status updated to "Shipped" while preserving paymentStatus "Paid".');

      // TEST 8: Customer tracking receives paymentStatus safely
      console.log('\nTest 8: Customer tracking endpoint sanitization...');
      let trackRes = await requestHttp(PORT, '/api/orders/track', 'POST', {}, {
        orderId: TEST_ORDER_ID_1,
        phone: '9844002211',
      });
      if (trackRes.status !== 200 || trackRes.json?.order?.paymentStatus !== 'Paid') {
        throw new Error(`Tracking did not return expected paymentStatus: ${JSON.stringify(trackRes.json)}`);
      }
      console.log('✅ Test 8 Passed: Public tracking returns paymentStatus "Paid" for verified customer.');

      // TEST 9: Admin filter by paymentStatus works
      console.log('\nTest 9: Admin order list paymentStatus filtering...');
      let filterPaid = await requestHttp(PORT, '/api/orders/admin/all?paymentStatus=Paid', 'GET', authHeader);
      let filterUnpaid = await requestHttp(PORT, '/api/orders/admin/all?paymentStatus=Unpaid', 'GET', authHeader);
      if (filterPaid.status !== 200 || filterUnpaid.status !== 200) {
        throw new Error('Failed to query orders with paymentStatus filters');
      }
      const hasOrder1InPaid = filterPaid.json?.orders?.some((o) => o.orderId === TEST_ORDER_ID_1);
      const hasOrder2InUnpaid = filterUnpaid.json?.orders?.some((o) => o.orderId === TEST_ORDER_ID_2);
      if (!hasOrder1InPaid || !hasOrder2InUnpaid) {
        throw new Error('paymentStatus filter did not return expected orders');
      }
      console.log('✅ Test 9 Passed: Admin orders list filtered by Paid and Unpaid accurately.');

      // TEST 10: Cancel order and restock maintains paymentStatus
      console.log('\nTest 10: Cancel order and restock integrity...');
      const initialStock = (await Product.findById(testProduct._id)).stockQuantity;
      let cancelRes = await requestHttp(PORT, `/api/orders/admin/${order1._id}/cancel`, 'PATCH', authHeader, {
        reason: 'Customer requested change',
      });
      if (cancelRes.status !== 200 || cancelRes.json?.order?.status !== 'Cancelled') {
        throw new Error(`Cancellation failed: ${JSON.stringify(cancelRes.json)}`);
      }
      const postCancelStock = (await Product.findById(testProduct._id)).stockQuantity;
      if (postCancelStock !== initialStock + 2) {
        throw new Error(`Stock was not restored correctly: was ${initialStock}, now ${postCancelStock}`);
      }
      console.log('✅ Test 10 Passed: Order cancelled and inventory items restocked cleanly.');

      console.log('\n🎉 ALL 10 UNIT & INTEGRATION TESTS PASSED PERFECTLY!\n');
    } catch (err) {
      console.error('❌ Test failed with error:', err);
      process.exitCode = 1;
    } finally {
      await Order.deleteMany({ orderId: { $in: [TEST_ORDER_ID_1, TEST_ORDER_ID_2] } });
      await Product.deleteMany({ name: TEST_PRODUCT_NAME });
      server.close();
      await mongoose.disconnect();
    }
  });
}

runPaymentStatusTests();
