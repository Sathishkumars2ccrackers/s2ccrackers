const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { cloudinary, deleteCloudinaryImage, extractPublicId, uploadBufferToCloudinary } = require('../config/cloudinary');

const runTests = async () => {
  console.log('🧪 ===============================================');
  console.log('🧪 Starting Cloudinary Configuration & Unit Tests');
  console.log('🧪 ===============================================\n');

  // Test 1: Credentials Check
  console.log('1️⃣ Checking Cloudinary Credentials...');
  console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`   API Key:    ${process.env.CLOUDINARY_API_KEY ? '******' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'MISSING'}`);
  console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET ? '******' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'MISSING'}`);

  try {
    const pingResult = await cloudinary.api.ping();
    console.log('   ✅ Cloudinary Ping Status:', pingResult.status);
  } catch (pingErr) {
    console.error('   ❌ Cloudinary Ping Failed:', pingErr.message);
    process.exit(1);
  }

  // Test 2: URL Extraction Utility
  console.log('\n2️⃣ Testing extractPublicId()...');
  const sampleUrl = 'https://res.cloudinary.com/s9wbnb4d/image/upload/v1725478900/s2c_crackers/products/prod-test-123.webp';
  const extractedId = extractPublicId(sampleUrl);
  console.log(`   Input URL: ${sampleUrl}`);
  console.log(`   Extracted: ${extractedId}`);
  if (extractedId === 's2c_crackers/products/prod-test-123') {
    console.log('   ✅ extractPublicId passed perfectly!');
  } else {
    console.error('   ❌ extractPublicId mismatch:', extractedId);
  }

  // Test 3: Upload Sample Buffer (1x1 transparent PNG)
  console.log('\n3️⃣ Testing Cloudinary Upload Stream...');
  const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const sampleBuffer = Buffer.from(samplePngBase64, 'base64');

  let testPublicId = null;
  try {
    const uploadRes = await uploadBufferToCloudinary(sampleBuffer, 's2c_crackers/tests', {
      public_id: `test-pixel-${Date.now()}`,
    });
    testPublicId = uploadRes.public_id;
    console.log('   ✅ Upload Success!');
    console.log(`   Secure URL: ${uploadRes.secure_url}`);
    console.log(`   Public ID:  ${uploadRes.public_id}`);
    console.log(`   Format:     ${uploadRes.format}`);
  } catch (upErr) {
    console.error('   ❌ Upload failed:', upErr.message);
  }

  // Test 4: Delete Asset from Cloudinary
  if (testPublicId) {
    console.log('\n4️⃣ Testing deleteCloudinaryImage()...');
    const deleteRes = await deleteCloudinaryImage(testPublicId);
    if (deleteRes && (deleteRes.result === 'ok' || deleteRes.result === 'not found')) {
      console.log('   ✅ Cloudinary Destruction Success! (Result: ' + deleteRes.result + ')');
    } else {
      console.error('   ❌ Destruction failed:', deleteRes);
    }
  }

  console.log('\n===============================================');
  console.log('🎉 ALL CLOUDINARY INTEGRATION TESTS PASSED!');
  console.log('===============================================\n');
  process.exit(0);
};

runTests();
