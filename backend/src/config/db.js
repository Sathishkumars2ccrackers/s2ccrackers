const mongoose = require('mongoose');

let isConnected = false;
let mongodInstance = null;

const connectDB = async () => {
  let mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/s2ccrackers';

  const options = {
    serverSelectionTimeoutMS: 3000,
    socketTimeoutMS: 45000,
    autoIndex: true,
  };

  try {
    const conn = await mongoose.connect(mongoURI, options);
    isConnected = true;
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host} / Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ Direct connection to ${mongoURI} failed (${error.message}).`);
    
    // In development mode, fallback to embedded/in-memory MongoDB if available
    try {
      console.log('🔄 Initializing embedded MongoDB server for development...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        binary: {
          version: '6.0.14',
        },
        instance: {
          dbName: 's2ccrackers',
        },
      });
      const memoryURI = mongodInstance.getUri();
      console.log(`🚀 Embedded MongoDB instance started at: ${memoryURI}`);
      
      const conn = await mongoose.connect(memoryURI, {
        serverSelectionTimeoutMS: 10000,
        autoIndex: true,
      });
      isConnected = true;
      console.log('✅ Connected to embedded MongoDB successfully.');

      // Automatically seed catalog into embedded database
      try {
        const seedDatabase = require('../utils/seedData');
        await seedDatabase();
      } catch (seedErr) {
        console.error('Seed error on embedded DB:', seedErr.message);
      }

      return conn;
    } catch (fallbackErr) {
      isConnected = false;
      console.error('❌ Embedded MongoDB fallback error:', fallbackErr.message);
      console.error('💡 Please start MongoDB or provide a valid MONGODB_URI in .env.');
    }
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
    if (mongodInstance) {
      await mongodInstance.stop();
    }
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
