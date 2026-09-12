/**
 * Integration Test for POST /api/orders/track Express endpoint with rate limiting
 */
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Order = require('../models/Order');
const orderRoutes = require('../routes/orderRoutes');

function postJson(port, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
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
    req.write(data);
    req.end();
  });
}

async function testExpressRoutes() {
  console.log('🚀 Testing Express Routes and Rate Limiting for POST /api/orders/track...\n');
  await mongoose.connect(process.env.MONGODB_URI);

  const app = express();
  app.use(express.json());
  app.use('/api/orders', orderRoutes);

  // Error handling middleware
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ success: false, message: err.message });
  });

  const PORT = 5098;
  const server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}`);

    const TEST_ID = 'S2C-ROUTE-TEST-001';
    await Order.deleteOne({ orderId: TEST_ID });
    await Order.create({
      orderId: TEST_ID,
      customerDetails: {
        name: 'Route Test Buyer',
        phone: '9844001122',
        address: '570 (East Part), Singapore Nagar, Chatitapatti',
        city: 'Madurai',
        pincode: '625014',
      },
      items: [{ productId: new mongoose.Types.ObjectId(), name: 'Standard Sparklers', price: 100, quantity: 1, subtotal: 100 }],
      subtotal: 100,
      deliveryFee: 150,
      totalAmount: 250,
      status: 'Confirmed',
    });

    try {
      // 1. Valid Request
      console.log('1️⃣ Sending valid tracking request...');
      let res = await postJson(PORT, '/api/orders/track', { orderId: TEST_ID, phone: '9844001122' });
      console.log('Status:', res.status, 'Success:', res.json?.success, 'Order ID:', res.json?.order?.orderId);
      if (res.status !== 200 || !res.json?.success) throw new Error('Valid tracking request failed');

      // 2. Test Rate Limiting (Attempting 11 more requests to trigger 10/15min rate limit)
      console.log('\n2️⃣ Testing Rate Limiting (Exceeding 10 requests per 15 mins)...');
      let rateLimitTriggered = false;
      for (let i = 1; i <= 12; i++) {
        res = await postJson(PORT, '/api/orders/track', { orderId: TEST_ID, phone: '9844001122' });
        if (res.status === 429) {
          console.log(`✅ Rate limit successfully triggered on attempt #${i + 1}! Status: 429, Message: "${res.json?.message}"`);
          rateLimitTriggered = true;
          break;
        }
      }

      if (!rateLimitTriggered) {
        throw new Error('Rate limit was not triggered after 12 requests');
      }

      console.log('\n🎉 ALL EXPRESS ROUTE & RATE LIMITING TESTS PASSED!');
    } catch (e) {
      console.error('Test error:', e);
      process.exitCode = 1;
    } finally {
      await Order.deleteOne({ orderId: TEST_ID });
      server.close();
      await mongoose.disconnect();
    }
  });
}

testExpressRoutes();
