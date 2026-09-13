const admin = require('firebase-admin');
const { getMessaging: getAdminMessaging } = require('firebase-admin/messaging');
const fs = require('fs');
const path = require('path');

let isConfigured = false;
let messagingInstance = null;

try {
  const apps = admin.getApps ? admin.getApps() : admin.apps || [];
  if (apps.length > 0) {
    messagingInstance = getAdminMessaging(apps[0]);
    isConfigured = true;
  } else {
    let credential = null;
    const certFn = admin.cert || (admin.credential && admin.credential.cert);

    // 1. Check if direct JSON string is in FIREBASE_SERVICE_ACCOUNT_KEY
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY && certFn) {
      try {
        const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
        const parsedKey = rawJson.startsWith('{')
          ? JSON.parse(rawJson)
          : JSON.parse(Buffer.from(rawJson, 'base64').toString('utf8'));
        credential = certFn(parsedKey);
      } catch (e) {
        console.error('⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', e.message);
      }
    }

    // 2. Check if file path is provided in FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS
    if (!credential && certFn) {
      const filePath =
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (filePath) {
        const resolvedPath = path.isAbsolute(filePath)
          ? filePath
          : path.resolve(process.cwd(), filePath);
        if (fs.existsSync(resolvedPath)) {
          try {
            const keyData = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
            credential = certFn(keyData);
          } catch (e) {
            console.error('⚠️ Failed to load Firebase credentials from file:', e.message);
          }
        }
      }
    }

    // 3. Check individual parameters (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)
    if (
      !credential &&
      certFn &&
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      try {
        credential = certFn({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
      } catch (e) {
        console.error('⚠️ Failed to initialize Firebase with individual environment variables:', e.message);
      }
    }

    // 4. Default application credentials fallback
    if (!credential && admin.applicationDefault) {
      try {
        credential = admin.applicationDefault();
      } catch {
        // Fallback silently
      }
    }

    if (credential) {
      const app = admin.initializeApp({
        credential,
        projectId: process.env.FIREBASE_PROJECT_ID || 's2c-crackers',
      });
      messagingInstance = getAdminMessaging(app);
      isConfigured = true;
      console.log('✅ Firebase Admin SDK successfully initialized for Live Push Notifications.');
    } else {
      console.warn(
        '⚠️ Firebase Admin SDK initialized in mock/fallback mode. Push notifications will be logged to database until Service Account credentials are provided in .env (FIREBASE_SERVICE_ACCOUNT_KEY).'
      );
    }
  }
} catch (error) {
  console.error('⚠️ Error initializing Firebase Admin SDK:', error.message);
}

const isFirebaseConfigured = () => isConfigured;
const getMessaging = () => messagingInstance;

module.exports = {
  admin,
  getMessaging,
  isFirebaseConfigured,
};
