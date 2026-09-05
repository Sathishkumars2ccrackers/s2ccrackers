const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { connectDB, getDBStatus } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const pincodeRoutes = require('./routes/pincodeRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const customerRoutes = require('./routes/customerRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const settingRoutes = require('./routes/settingRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Connect to MongoDB Atlas / Database
connectDB();

// Security & Utility Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: true, // Allow frontend dev & production hosts
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/pincodes', pincodeRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'online',
    service: 'S2C Crackers REST API',
    businessDomain: process.env.BUSINESS_DOMAIN || 'www.s2ccrackers.com',
    imageStorage: 'Cloudinary CDN',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 S2C Crackers Production Backend Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`📡 Health Check endpoint: http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection Error:', err.message);
});

module.exports = app;
