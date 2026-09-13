# S2C Crackers - Production Deployment Guide (Render & Vercel)

This document provides step-by-step instructions for deploying the upgraded **S2C Crackers** application to **Render** (Backend API) and **Vercel** (Frontend SPA) with **Cloudinary** cloud image storage.

---

## 1. Architecture Overview

- **Backend Web Service**: Node.js / Express deployed on **Render.com** (Free / Starter tier).
- **Database**: **MongoDB Atlas** (Managed Cloud Database).
- **Image Storage & Media CDN**: **Cloudinary** (Persistent cloud storage, auto-optimized WebP, CDN delivery).
- **Frontend SPA**: React (Vite + TailwindCSS) deployed on **Vercel**.

---

## 2. Backend Deployment on Render.com

### Step 1: Create a New Web Service
1. Log in to [Render.com Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `s2ccrackers`.
4. Configure the service settings:
   - **Name**: `s2ccrackers-backend` (or your chosen name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Region**: `Singapore (ap-southeast-1)` (or closest to India for lowest latency)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free` or `Starter`

### Step 2: Configure Environment Variables on Render
In the **Environment Variables** section of your Render Web Service, add the following key-value pairs:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `10000` (or leave default Render port) | Port bound by server |
| `MONGODB_URI` | `mongodb+srv://s2ccrackers_db_user:S2c2026@cluster0.fixrotk.mongodb.net/s2ccrackers?retryWrites=true&w=majority&appName=Cluster0` | MongoDB Atlas Connection String |
| `JWT_SECRET` | `s2c_crackers_festival_jwt_secret_key_2026_production_safe` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | `7d` | Token expiration period |
| `CLOUDINARY_CLOUD_NAME` | `s9wbnb4d` | Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | `179594668765791` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | `kixGCTNDt5JzWCRWrsh7S-DpEes` | Cloudinary API Secret |
| `BUSINESS_NAME` | `S2C Crackers` | Store business title |
| `BUSINESS_DOMAIN` | `www.s2ccrackers.com` | Business domain |
| `BUSINESS_PHONE` | `+91 99444 76516` | Customer service contact |
| `BUSINESS_WHATSAPP_NUMBER` | `919944476516` | WhatsApp order notifications |
| `ADMIN_EMAIL` | `admin@s2ccrackers.com` | Admin email address |
| `FRONTEND_URL` | `https://s2ccrackers.vercel.app` (your Vercel URL) | Allowed CORS origin |
| `MIN_ORDER_AMOUNT` | `500` | Minimum order policy |
| `FREE_DELIVERY_THRESHOLD` | `3000` | Free shipping threshold (₹) |
| `DEFAULT_DELIVERY_FEE` | `150` | Standard delivery fee (₹) |
| `FIREBASE_PROJECT_ID` | `s2c-crackers` | Firebase Cloud Messaging Project ID |
| `FIREBASE_CLIENT_EMAIL` | `your-service-account-email@s2c-crackers.iam.gserviceaccount.com` | Firebase Service Account Client Email |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | *(Paste entire Service Account JSON on a single line)* | Firebase Admin private key credentials for server push |

### Step 3: Deploy & Verify Backend
1. Click **Create Web Service**.
2. Render will run `npm install` and `node src/server.js`.
3. Check the deployment log for:
   ```
   ✅ MongoDB Connected Successfully
   ✅ Firebase Admin SDK successfully initialized for Live Push Notifications.
   🚀 S2C Crackers Production Backend Server running on port ...
   ```
4. Test the health check endpoint: `https://your-render-app.onrender.com/api/health`.

---

## 3. Frontend Deployment on Vercel

### Step 1: Import Project to Vercel
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Select your `s2ccrackers` repository.
4. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 2: Set Environment Variables on Vercel
Add the following variables in Vercel:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-render-app.onrender.com/api` | Backend API URL on Render |
| `VITE_FIREBASE_API_KEY` | `AIzaSyCh6HPOdgwElndvmhAfepranBfXxZdBn5k` | Web Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `s2c-crackers.firebaseapp.com` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | `s2c-crackers` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `s2c-crackers.firebasestorage.app` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `846368923282` | Firebase Cloud Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | `1:846368923282:web:6693a3920be4908ad0104b` | Web App ID |
| `VITE_FIREBASE_VAPID_KEY` | `your_vapid_public_key_from_firebase_console` | Web Push Certificate Public Key |

### Step 3: Deploy & Test
1. Click **Deploy**.
2. Once deployed, copy your Vercel URL (e.g. `https://s2ccrackers.vercel.app`) and update the `FRONTEND_URL` environment variable on Render.

---

## 4. Database Image Migration Script

If you have existing products or banners with local `/uploads/...` paths, run the automated migration script locally or via Render console:

```bash
cd backend
npm run migrate:images
```

This will automatically:
1. Scan all Products and Banners in MongoDB.
2. Upload any local or remote assets directly to Cloudinary.
3. Replace database records with the Cloudinary `secure_url` and `public_id`.
