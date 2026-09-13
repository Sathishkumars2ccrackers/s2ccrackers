# S2C Crackers - Admin Push Notification (FCM) & PWA Setup Guide

Complete end-to-end setup guide for the **Firebase Cloud Messaging (FCM)** push notification system and **Progressive Web App (PWA)** for the S2C Crackers Admin Portal.

---

## 🌟 Key Features & Capabilities

- **Zero Cost**: 100% free unlimited push notifications using Firebase Cloud Messaging (no SMS or WhatsApp API charges).
- **Multi-Device Broadcast**: Simultaneous instant push delivery to all registered admin devices (Android phones, tablets, laptops, office desktops).
- **Background & Closed Browser Delivery**: Receives push notifications on mobile phones even when the browser or admin dashboard is closed.
- **Offline Delivery Queue**: Notifications queue for up to 24 hours if a device is offline, and deliver as soon as the device reconnects.
- **Direct Order Deep-Linking**: Tapping the notification opens `/admin/orders/{orderId}`, scrolls to the order, highlights it with an animated golden glow, and opens the order details modal.
- **Real-Time Foreground Alerts**: Synthesized festive audio chime + animated floating top banner (`🚨 NEW ORDER RECEIVED`) with quick action buttons when the dashboard is open.
- **Delivery Audit Logs**: Complete history of dispatched notifications with delivery statuses and error logs in MongoDB.

---

## 📋 Step 1: Firebase Project Configuration

Your project is configured with Firebase project: `s2c-crackers`.

### 1.1 Generate Web Push Certificate (VAPID Key) for Browsers
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project **`s2c-crackers`**.
3. Click the gear icon ⚙️ in the left sidebar > **Project settings**.
4. Go to the **Cloud Messaging** tab.
5. Scroll down to **Web configuration** > **Web Push certificates**.
6. Click **Generate key pair**.
7. Copy the generated public key string (e.g., `BN9xK8...`).
8. Add it to `frontend/.env`:
   ```env
   VITE_FIREBASE_VAPID_KEY="your_generated_vapid_public_key_here"
   ```

---

### 1.2 Generate Service Account Private Key for Backend Server
1. In the Firebase Console, go to **Project settings** > **Service accounts** tab.
2. Ensure **Node.js** is selected.
3. Click **Generate new private key** and confirm by clicking **Generate key**.
4. A JSON file will download (e.g., `s2c-crackers-firebase-adminsdk-xxxxx.json`).
5. You can configure this in `backend/.env` using either of the following methods:

#### Option A: Direct JSON in .env (Recommended for Cloud / Render / Vercel)
Paste the entire JSON content on a single line:
```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your_project_id",...}'
```

#### Option B: Key File Path (Local Development)
Save the JSON file in `backend/` and set:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./s2c-crackers-firebase-adminsdk.json
```

#### Option C: Individual Environment Variables
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="your_private_key_content"
```

---

## 🔧 Step 2: Environment Variables Summary

### Backend (`backend/.env`)
```env
# Server
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://127.0.0.1:27017/s2ccrackers
JWT_SECRET=s2c_crackers_festival_jwt_secret_key_2026_production_safe

# Firebase Admin SDK Credentials
FIREBASE_PROJECT_ID=s2c-crackers
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"s2c-crackers",...}'
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=/api
VITE_FIREBASE_API_KEY="AIzaSyCh6HPOdgwElndvmhAfepranBfXxZdBn5k"
VITE_FIREBASE_AUTH_DOMAIN="s2c-crackers.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="s2c-crackers"
VITE_FIREBASE_STORAGE_BUCKET="s2c-crackers.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="846368923282"
VITE_FIREBASE_APP_ID="1:846368923282:web:6693a3920be4908ad0104b"
VITE_FIREBASE_VAPID_KEY="your_generated_vapid_public_key_here"
```

---

## 📱 Step 3: Installing the Admin PWA on Mobile / Desktop

The Admin Portal is converted into a standalone Progressive Web App (PWA).

### Android (Google Chrome)
1. Open Chrome on your Android mobile phone and navigate to `https://www.s2ccrackers.com/admin` (or your local dev URL).
2. Log in with your administrator account.
3. Tap the **"Install Admin App"** button at the top header or sidebar.
4. Alternatively, tap the Chrome menu (⋮) > **"Add to Home screen"** / **"Install app"**.
5. S2C Crackers Admin will install with the festival emblem icon `#f97316` and launch in fullscreen standalone mode just like a native Android APK!

### Windows / macOS / Desktop Chrome
1. Navigate to `/admin` in Google Chrome or Microsoft Edge.
2. Click the **Install** icon in the browser address bar (or click **"Install Admin App"** in the dashboard).
3. S2C Admin will open in a dedicated desktop app window with taskbar pinning support.

---

## 🔔 Step 4: Registering Admin Devices for Push Notifications

1. In the Admin Dashboard, click the **Push Notifications** tab in the sidebar (or navigate to `/admin?tab=notifications`).
2. Under **This Device Registration**, click **"Enable Push Notifications"**.
3. When prompted by the browser, click **"Allow"**.
4. The device will be registered with its auto-detected metadata (Browser, OS, Device Type) in MongoDB collection `adminNotificationTokens`.
5. Repeat this step on any additional devices (e.g. your mobile phone, tablet, and office laptop). All registered devices will receive simultaneous alerts.

---

## 🧪 Step 5: Testing & Verification Procedures

### Test 1: Send Test Push Notification
1. Navigate to `/admin?tab=notifications`.
2. Click **"Send Test Notification"**.
3. Verify that:
   - A distinct festive alert chime plays.
   - A push notification arrives with title `Test Notification` and body `S2C Crackers notification system is working correctly.`.
   - The delivery is logged under the **Delivery Logs** tab.

### Test 2: End-to-End Customer Order Notification
1. Open an incognito browser window or customer storefront (`/products` or `/cart`).
2. Add crackers to cart and go to `/checkout`.
3. Fill in customer details and click **"Confirm & Place Festival Order"**.
4. Verify that:
   - Customer receives instant order confirmation with unique Order ID (e.g., `S2C-20260913-982341`).
   - Admin receives an instant push notification on all registered phones/laptops:
     ```
     🚨 New Order Received
     Order ID: S2C-20260913-982341
     Customer: Surya Kumar
     Amount: ₹3,450
     ```
   - In open Admin Dashboard tabs:
     - The polyphonic festive chime rings.
     - The animated top banner `🚨 NEW ORDER RECEIVED` displays with countdown timer.
     - The unread badge updates on the Orders tab.
5. Tap the push notification on your mobile phone:
   - The Admin Portal opens directly to `/admin/orders/S2C-20260913-982341`.
   - The order row is highlighted with a glowing golden border.
   - The Order Details Modal opens automatically for instant processing and 1-click WhatsApp customer confirmation!

---

## 🛠️ Architecture & Failsafe Design

```
[ Customer Places Order ]
           │
           ▼
[ MongoDB Order Created ]
           │
           ├──────────────────────────────┐
           │ (Non-blocking async)         │ (Non-blocking async)
           ▼                              ▼
[ Email Notifications ]       [ FCM Multicast Push Service ]
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
            [ Android Mobile Phone ]                   [ Desktop / Laptop ]
         (Closed Browser / Background)               (Open Tab / Standalone PWA)
                     │                                         │
                     ▼                                         ▼
         [ Native Push Alert ]                      [ Alert Banner + Chime ]
                     │                                         │
                     └────────────────────┬────────────────────┘
                                          │ Admin Taps Notification
                                          ▼
                         [ /admin/orders/{orderId} ]
                         • Auto-scroll to order
                         • Glowing highlight animation
                         • Auto-open Details Modal
```

- **Failsafe**: If Firebase or network has transient issues, customer order creation is never blocked or delayed. The push service retries once after 3 seconds and records all delivery attempts in `notificationLogs`.
- **Token Maintenance**: Invalid or uninstalled FCM tokens are automatically detected and pruned from MongoDB.
