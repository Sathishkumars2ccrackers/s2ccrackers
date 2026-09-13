const admin = require('firebase-admin');
const { getMessaging: getAdminMessaging } = require('firebase-admin/messaging');
const fs = require('fs');
const path = require('path');

// Diagnostic status tracking object
const diagnostics = {
  firebaseInitialized: false,
  messagingAvailable: false,
  projectId: null,
  clientEmail: null,
  serviceAccountLoaded: false,
  serviceAccountPath: null,
  attempts: [],
  error: null,
};

let messagingInstance = null;
let firebaseApp = null;

const initializeFirebaseAdmin = () => {
  try {
    const apps = admin.getApps ? admin.getApps() : admin.apps || [];
    if (apps.length > 0) {
      firebaseApp = apps[0];
      messagingInstance = getAdminMessaging(firebaseApp);
      diagnostics.firebaseInitialized = true;
      diagnostics.messagingAvailable = true;
      diagnostics.projectId = firebaseApp.options.projectId || 's2c-crackers';
      console.log('✓ Firebase Admin already initialized [', diagnostics.projectId, ']');
      return;
    }

    let credential = null;
    const certFn = admin.cert || (admin.credential && admin.credential.cert);

    if (!certFn) {
      throw new Error('Firebase Admin cert function is unavailable.');
    }

    // List of candidate service account file paths to probe
    const candidatePaths = [];

    // 1. Explicit environment variable paths
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      candidatePaths.push(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      candidatePaths.push(path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
      candidatePaths.push(path.resolve(__dirname, '../../', process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
    }
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      candidatePaths.push(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      candidatePaths.push(path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS));
    }

    // 2. Standard location probes
    const standardFilenames = [
      's2c-crackers-firebase-adminsdk.json',
      'firebase-service-account.json',
      'service-account.json',
      'config/firebase-service-account.json',
    ];

    const searchDirs = [
      process.cwd(),
      path.resolve(process.cwd(), 'backend'),
      path.resolve(__dirname, '../..'),
      path.resolve(__dirname, '..'),
      path.resolve(__dirname, '../../config'),
      path.resolve(process.cwd(), 'config'),
    ];

    for (const dir of searchDirs) {
      for (const file of standardFilenames) {
        candidatePaths.push(path.resolve(dir, file));
      }
    }

    // Deduplicate candidate paths
    const uniquePaths = Array.from(new Set(candidatePaths));

    // Try loading from candidate files
    for (const testPath of uniquePaths) {
      try {
        if (fs.existsSync(testPath)) {
          const raw = fs.readFileSync(testPath, 'utf8');
          const parsed = JSON.parse(raw);
          if (parsed && parsed.project_id && parsed.private_key) {
            // Clean up private key newlines
            if (typeof parsed.private_key === 'string') {
              parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
            }
            credential = certFn(parsed);
            diagnostics.serviceAccountLoaded = true;
            diagnostics.serviceAccountPath = testPath;
            diagnostics.projectId = parsed.project_id;
            diagnostics.clientEmail = parsed.client_email;
            diagnostics.attempts.push({ path: testPath, status: 'loaded' });
            console.log(`✓ Firebase JSON Found: ${testPath}`);
            console.log(`✓ Firebase Project ID: ${parsed.project_id}`);
            break;
          }
        } else {
          diagnostics.attempts.push({ path: testPath, status: 'not_found' });
        }
      } catch (err) {
        diagnostics.attempts.push({ path: testPath, status: 'error', message: err.message });
      }
    }

    // 3. Check direct JSON string in FIREBASE_SERVICE_ACCOUNT_KEY if no file loaded
    if (!credential && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
        const parsedKey = rawJson.startsWith('{')
          ? JSON.parse(rawJson)
          : JSON.parse(Buffer.from(rawJson, 'base64').toString('utf8'));
        if (parsedKey.private_key) {
          parsedKey.private_key = parsedKey.private_key.replace(/\\n/g, '\n');
        }
        credential = certFn(parsedKey);
        diagnostics.serviceAccountLoaded = true;
        diagnostics.serviceAccountPath = 'FIREBASE_SERVICE_ACCOUNT_KEY (env)';
        diagnostics.projectId = parsedKey.project_id;
        diagnostics.clientEmail = parsedKey.client_email;
        console.log('✓ Firebase JSON loaded from FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
      } catch (e) {
        console.error('⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', e.message);
        diagnostics.error = `FIREBASE_SERVICE_ACCOUNT_KEY parse error: ${e.message}`;
      }
    }

    // 4. Check individual environment variables (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)
    if (
      !credential &&
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
        diagnostics.serviceAccountLoaded = true;
        diagnostics.serviceAccountPath = 'FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY (env)';
        diagnostics.projectId = process.env.FIREBASE_PROJECT_ID;
        diagnostics.clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        console.log('✓ Firebase credentials loaded from individual environment variables');
      } catch (e) {
        console.error('⚠️ Failed to initialize Firebase with individual environment variables:', e.message);
        diagnostics.error = `Individual env vars error: ${e.message}`;
      }
    }

    // Explicit Initialization - NO applicationDefault() fallback!
    if (credential) {
      firebaseApp = admin.initializeApp({
        credential,
        projectId: diagnostics.projectId || process.env.FIREBASE_PROJECT_ID || 's2c-crackers',
      });
      messagingInstance = getAdminMessaging(firebaseApp);
      diagnostics.firebaseInitialized = true;
      diagnostics.messagingAvailable = true;
      diagnostics.error = null;
      console.log('✓ Firebase Admin Initialized');
      console.log('✓ Firebase Messaging Ready');
    } else {
      diagnostics.firebaseInitialized = false;
      diagnostics.messagingAvailable = false;
      diagnostics.error = 'No valid Firebase service account JSON or environment credentials found.';
      console.warn('⚠️ ' + diagnostics.error);
    }
  } catch (error) {
    diagnostics.firebaseInitialized = false;
    diagnostics.messagingAvailable = false;
    diagnostics.error = error.message;
    console.error('❌ Firebase Admin Initialization Failed:', error.message);
  }
};

// Initialize immediately on load
initializeFirebaseAdmin();

const isFirebaseConfigured = () => diagnostics.firebaseInitialized && !!messagingInstance;
const getMessaging = () => messagingInstance;
const getFirebaseDiagnostics = () => ({ ...diagnostics, timestamp: new Date().toISOString() });

module.exports = {
  admin,
  getMessaging,
  isFirebaseConfigured,
  getFirebaseDiagnostics,
  initializeFirebaseAdmin,
};
