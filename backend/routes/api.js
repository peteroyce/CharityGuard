const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { asyncHandler } = require('../middleware/errorHandler');

// Import route modules
const nonprofitRoutes = require('./nonprofits');
const transactionRoutes = require('./transactions');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Import User model (create this file)
const User = require('../models/User');

// ========================================
// AUTHENTICATION ROUTES
// ========================================

// Google OAuth login
router.post('/auth/google', asyncHandler(async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Google token is required' 
      });
    }
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Google token' 
      });
    }

    // Find or create user
    let user = await User.findOne({ googleId: payload.sub });
    
    if (!user) {
      user = new User({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
      await user.save();
      console.log('New user created:', user.email);
    } else {
      // Update user info if needed
      user.name = payload.name;
      user.picture = payload.picture;
      await user.save();
      console.log('Existing user logged in:', user.email);
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        googleId: user.googleId,
        createdAt: user.createdAt,
        totalDonations: user.donations.length,
      },
      token: jwtToken,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed',
      details: error.message 
    });
  }
}));

// Verify JWT token
router.get('/auth/verify', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-googleId')
      .populate('donations.charityId', 'name registrationNumber');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        createdAt: user.createdAt,
        donations: user.donations,
        totalDonations: user.donations.length,
        totalAmount: user.donations.reduce((sum, d) => sum + d.amount, 0)
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Token verification failed',
      details: error.message 
    });
  }
}));

// Logout (optional - mainly for token cleanup)
router.post('/auth/logout', authenticateToken, asyncHandler(async (req, res) => {
  // In a more sophisticated setup, you might want to blacklist the token
  res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
}));

// Get user profile
router.get('/auth/profile', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('donations.charityId', 'name registrationNumber verificationStatus trustScore');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Calculate donation statistics
    const donationStats = {
      totalDonations: user.donations.length,
      totalAmount: user.donations.reduce((sum, d) => sum + d.amount, 0),
      averageAmount: user.donations.length > 0 
        ? user.donations.reduce((sum, d) => sum + d.amount, 0) / user.donations.length 
        : 0,
      lastDonationDate: user.donations.length > 0 
        ? user.donations[user.donations.length - 1].date 
        : null,
      favoriteCharities: user.donations
        .reduce((acc, donation) => {
          const charityId = donation.charityId._id.toString();
          acc[charityId] = (acc[charityId] || 0) + 1;
          return acc;
        }, {}),
    };

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      donations: user.donations,
      statistics: donationStats
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch profile',
      details: error.message 
    });
  }
}));

// ========================================
// PAYMENT ROUTES
// ========================================

// Create payment intent (Stripe integration)
router.post('/payments/create-intent', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { amount, charityId } = req.body;
    
    // Validate inputs
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }
    
    if (!charityId) {
      return res.status(400).json({
        success: false,
        error: 'Charity ID is required'
      });
    }

    // Verify charity exists
    const Nonprofit = require('../models/Nonprofit');
    const charity = await Nonprofit.findById(charityId);
    
    if (!charity) {
      return res.status(404).json({
        success: false,
        error: 'Charity not found'
      });
    }

    // Create Stripe payment intent (you'll need to install stripe: npm install stripe)
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: 'usd',
      metadata: {
        charityId: charityId,
        charityName: charity.name,
        userId: req.userId,
        charityEIN: charity.registrationNumber,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      charity: {
        id: charity._id,
        name: charity.name,
        ein: charity.registrationNumber,
      }
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent',
      details: error.message
    });
  }
}));

// Confirm payment and record donation
router.post('/payments/confirm', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID is required'
      });
    }

    // Verify payment with Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed'
      });
    }

    // Record donation in user's profile
    const user = await User.findById(req.userId);
    const donation = {
      charityId: paymentIntent.metadata.charityId,
      amount: paymentIntent.amount / 100, // Convert from cents
      date: new Date(),
      paymentIntentId: paymentIntentId,
      status: 'completed'
    };

    user.donations.push(donation);
    await user.save();

    // Also create a transaction record
    const Transaction = require('../models/Transaction');
    const transaction = new Transaction({
      nonprofit: paymentIntent.metadata.charityId,
      nonprofitName: paymentIntent.metadata.charityName,
      amount: paymentIntent.amount / 100,
      donorWallet: user.email,
      description: `Donation via CharityGuard by ${user.name}`,
      fraudScore: 0.05, // Low fraud score for authenticated users
      status: 'completed',
      userId: req.userId,
      paymentIntentId: paymentIntentId,
    });

    await transaction.save();

    res.json({
      success: true,
      donation: donation,
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        charity: transaction.nonprofitName,
        date: transaction.date,
        status: transaction.status
      },
      message: 'Donation recorded successfully'
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm payment',
      details: error.message
    });
  }
}));

// ========================================
// EXISTING API ROUTES (Database, Collections, etc.)
// ========================================

// Get list of all collections (tables)
router.get('/collections', asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  const collectionsInfo = await Promise.all(
    collections.map(async (collection) => {
      try {
        const count = await db.collection(collection.name).countDocuments();
        return {
          name: collection.name,
          type: collection.type || 'collection',
          documentCount: count,
          options: collection.options || {}
        };
      } catch (error) {
        return {
          name: collection.name,
          type: collection.type || 'collection',
          documentCount: 0,
          options: collection.options || {},
          error: 'Could not count documents'
        };
      }
    })
  );
  
  res.json({
    success: true,
    database: mongoose.connection.name || 'charityguard',
    collections: collectionsInfo,
    totalCollections: collections.length,
    connectionStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
}));

// Get collection schema/structure
router.get('/collections/:name/schema', asyncHandler(async (req, res) => {
  const collectionName = req.params.name;
  const db = mongoose.connection.db;
  
  // Check if collection exists
  const collections = await db.listCollections({ name: collectionName }).toArray();
  if (collections.length === 0) {
    return res.status(404).json({ 
      success: false,
      error: 'Collection not found', 
      collection: collectionName 
    });
  }
  
  // Get sample documents to infer schema
  const sampleDocs = await db.collection(collectionName).find({}).limit(5).toArray();
  
  if (sampleDocs.length === 0) {
    return res.json({ 
      success: true,
      collection: collectionName, 
      schema: {}, 
      message: 'Collection exists but contains no documents',
      documentCount: 0
    });
  }
  
  // Create schema from sample documents
  const schema = {};
  sampleDocs.forEach(doc => {
    Object.keys(doc).forEach(key => {
      if (!schema[key]) {
        schema[key] = {
          type: Array.isArray(doc[key]) ? 'array' : typeof doc[key],
          example: doc[key],
          required: sampleDocs.every(d => d.hasOwnProperty(key))
        };
      }
    });
  });
  
  const totalCount = await db.collection(collectionName).countDocuments();
  
  res.json({
    success: true,
    collection: collectionName,
    totalDocuments: totalCount,
    sampleSize: sampleDocs.length,
    schema,
    sampleDocuments: sampleDocs
  });
}));

// Get database statistics
router.get('/database/stats', asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  const stats = await db.stats();
  
  res.json({
    success: true,
    database: mongoose.connection.name,
    collections: stats.collections,
    dataSize: stats.dataSize,
    storageSize: stats.storageSize,
    indexes: stats.indexes,
    indexSize: stats.indexSize,
    objects: stats.objects,
    avgObjSize: stats.avgObjSize,
    connectionStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
}));

// Debug endpoint for MongoDB connection
router.get('/debug', (req, res) => {
  res.json({ 
    success: true,
    mongooseConnected: mongoose.connection.readyState === 1,
    mongooseState: mongoose.connection.readyState,
    databaseName: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    connectionStates: {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    },
    currentState: mongoose.connection.readyState === 1 ? 'connected' : 
                 mongoose.connection.readyState === 0 ? 'disconnected' :
                 mongoose.connection.readyState === 2 ? 'connecting' : 'disconnecting'
  });
});

// Test endpoint to verify API is working
router.get('/status', (req, res) => {
  res.json({ 
    success: true,
    status: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    features: {
      authentication: true,
      payments: true,
      fraudDetection: true,
      irsIntegration: true
    }
  });
});

// Health check endpoint
router.get('/health', asyncHandler(async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
  const uptime = process.uptime();
  
  res.json({
    success: true,
    status: 'healthy',
    database: dbStatus,
    uptime: Math.floor(uptime),
    uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
    },
    timestamp: new Date().toISOString()
  });
}));

// ========================================
// MIDDLEWARE FUNCTIONS
// ========================================

// JWT Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }
    
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userName = decoded.name;
    next();
  });
}

// ========================================
// SUBROUTES REGISTRATION
// ========================================

// Register subroutes for nonprofits and transactions
router.use('/nonprofits', nonprofitRoutes);
router.use('/transactions', transactionRoutes);

// Handle 404 for unmatched API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    requestedPath: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/status',
      'GET /api/health', 
      'GET /api/debug',
      'POST /api/auth/google',
      'GET /api/auth/verify',
      'GET /api/auth/profile',
      'POST /api/auth/logout',
      'POST /api/payments/create-intent',
      'POST /api/payments/confirm',
      'GET /api/collections',
      'GET /api/collections/:name/schema',
      'GET /api/database/stats',
      'GET|POST /api/nonprofits',
      'GET|POST /api/transactions'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;