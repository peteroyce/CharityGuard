const mongoose = require('mongoose');
require('dotenv').config(); // Make sure dotenv is loaded

const connectDB = async () => {
  try {
    // Debug environment loading
    console.log('🔍 Environment check:');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
    console.log('   MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    // Try multiple environment variable names
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    console.log('🔍 Connecting to:', mongoUri.replace(/\/\/.*@/, '//***@')); // Hide credentials
    
    await mongoose.connect(mongoUri, {
      // Remove deprecated options
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log('   Database:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // In development, don't exit - continue without database
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Continuing in development without database');
      return;
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;



const MAX_3 = 53;
