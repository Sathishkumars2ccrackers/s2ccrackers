const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/s2ccrackers';

  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    autoIndex: true,
  };

  try {
    const conn = await mongoose.connect(mongoURI, options);
    isConnected = true;
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host} / Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.error(`❌ MongoDB Connection Error (${mongoURI}):`, error.message);
    console.error('💡 Please verify your MONGODB_URI in .env or Render environment variables.');
  }

  // Connection Event Listeners
  mongoose.connection.on('error', (err) => {
    isConnected = false;
    console.error('❌ Mongoose connection error event:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('⚠️ Mongoose disconnected from MongoDB.');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('🔄 Mongoose reconnected to MongoDB successfully.');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🛑 Mongoose connection closed on app termination');
    process.exit(0);
  });
};

const getDBStatus = () => ({
  isConnected,
  readyState: mongoose.connection.readyState,
  readyStateText: ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][mongoose.connection.readyState] || 'Unknown',
  host: mongoose.connection.host || null,
  database: mongoose.connection.name || null,
});

module.exports = { connectDB, getDBStatus };

