const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import utilities first
const logger = require('./utils/logger');
const connectDB = require('./config/db'); // Use your existing db.js

// Import config (with error handling)
let config;
try {
  config = require('./config/environment');
} catch (error) {
  logger.error('Failed to load config, using defaults:', error.message);
  config = {
    PORT: process.env.PORT || 3001,
    MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/charityguard',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 100,
    NODE_ENV: process.env.NODE_ENV || 'development',
    IS_DEVELOPMENT: process.env.NODE_ENV !== 'production'
  };
}

// Import middleware and routes
const errorHandler = require('./middleware/errorHandler');

// Import routes (check if they exist)
let nonprofitRoutes, authRoutes, paymentRoutes, apiRoutes, transactionRoutes;

try {
  nonprofitRoutes = require('./routes/nonprofits');
} catch (e) {
  logger.warn('Nonprofit routes not found, creating basic version');
  nonprofitRoutes = express.Router();
  nonprofitRoutes.get('/', (req, res) => {
    res.json({ 
      success: true,
      message: 'Nonprofits endpoint - enhanced version ready',
      data: [],
      timestamp: new Date().toISOString()
    });
  });
  nonprofitRoutes.get('/search', (req, res) => {
    res.json({
      success: true,
      message: 'Search functionality - enhanced version ready',
      data: [],
      query: req.query.q || '',
      timestamp: new Date().toISOString()
    });
  });
}

try {
  authRoutes = require('./routes/auth');
} catch (e) {
  console.warn('Auth routes not found, creating basic version');
  authRoutes = express.Router();
  authRoutes.get('/', (req, res) => {
    res.json({ 
      success: true,
      message: 'Auth endpoint - enhanced version coming in Step 2',
      endpoints: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        google: 'POST /api/auth/google'
      },
      timestamp: new Date().toISOString()
    });
  });
}

try {
  paymentRoutes = require('./routes/payments');
} catch (e) {
  logger.warn('Payment routes not found, creating basic version');
  paymentRoutes = express.Router();
  paymentRoutes.get('/', (req, res) => {
    res.json({ 
      success: true,
      message: 'Payments endpoint - enhanced version coming in Step 2',
      endpoints: {
        'create-intent': 'POST /api/payments/create-intent',
        'confirm': 'POST /api/payments/confirm',
        'history': 'GET /api/payments/history'
      },
      timestamp: new Date().toISOString()
    });
  });
}

try {
  apiRoutes = require('./routes/api');
} catch (e) {
  logger.warn('API routes not found, will create basic endpoints');
  apiRoutes = express.Router();
  
  // Collections endpoint for debugging
  apiRoutes.get('/collections', async (req, res) => {
    try {
      const database = req.app.locals.db || global.db;
      if (!database) {
        return res.status(503).json({
          success: false,
          error: 'Database not connected'
        });
      }
      
      const collections = await database.listCollections().toArray();
      const collectionStats = [];
      
      for (const collection of collections) {
        try {
          const count = await database.collection(collection.name).countDocuments();
          collectionStats.push({
            name: collection.name,
            count: count
          });
        } catch (error) {
          collectionStats.push({
            name: collection.name,
            count: 0,
            error: error.message
          });
        }
      }
      
      res.json({
        success: true,
        data: {
          database: database.databaseName,
          collections: collectionStats,
          totalCollections: collections.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Database stats endpoint
  apiRoutes.get('/database/stats', async (req, res) => {
    try {
      const database = req.app.locals.db || global.db;
      if (!database) {
        return res.status(503).json({
          success: false,
          error: 'Database not connected'
        });
      }

      const stats = await database.stats();
      res.json({
        success: true,
        data: {
          name: database.databaseName,
          collections: stats.collections,
          dataSize: stats.dataSize,
          storageSize: stats.storageSize,
          indexes: stats.indexes
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

try {
  transactionRoutes = require('./routes/transactions');
} catch (e) {
  logger.warn('Transaction routes not found');
  transactionRoutes = express.Router();
  transactionRoutes.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Transactions endpoint - ready for enhancement',
      data: []
    });
  });
}

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"]
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Rate limiting (only for API routes)
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/';
  }
});
app.use('/api', limiter);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      config.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.requestId = requestId;
  req.startTime = start;

  // Skip logging for health checks to reduce noise
  if (req.path !== '/health') {
    logger.info(`➡️  ${req.method} ${req.path}`, {
      requestId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      query: Object.keys(req.query).length > 0 ? req.query : undefined
    });
  }

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    if (req.path !== '/health') {
      const logLevel = res.statusCode >= 400 ? 'error' : 'info';
      logger[logLevel](`⬅️  ${req.method} ${req.path} - ${res.statusCode}`, {
        requestId,
        duration: `${duration}ms`,
        status: res.statusCode
      });
    }
  });

  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'CharityGuard API',
    version: '1.0.0',
    description: 'AI-powered fraud detection for charitable donations',
    status: 'operational',
    environment: config.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      health: '/health',
      api: '/api',
      nonprofits: '/api/nonprofits',
      auth: '/api/auth',
      payments: '/api/payments',
      transactions: '/api/transactions'
    },
    features: [
      'AI Fraud Detection',
      'IRS Database Verification (559K+ Records)', 
      'Blockchain Integration',
      'Real-time Monitoring'
    ],
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint (detailed)
app.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    environment: config.NODE_ENV,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    },
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      api: 'operational',
      collections: mongoose.connection.readyState === 1 ? 'available' : 'unavailable'
    }
  };

  const statusCode = mongoose.connection.readyState === 1 ? 200 : 503;
  res.status(statusCode).json(healthData);
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'CharityGuard API',
    version: '1.0.0',
    description: 'AI-powered fraud detection for charitable donations',
    endpoints: {
      nonprofits: {
        url: '/api/nonprofits',
        methods: ['GET'],
        description: 'Search and retrieve nonprofit organizations (559K+ records)'
      },
      auth: {
        url: '/api/auth',
        methods: ['GET', 'POST'],
        description: 'Authentication and user management'
      },
      payments: {
        url: '/api/payments',
        methods: ['GET', 'POST'],
        description: 'Payment processing and transaction management'
      },
      transactions: {
        url: '/api/transactions',
        methods: ['GET', 'POST'],
        description: 'Blockchain transaction tracking'
      },
      collections: {
        url: '/api/collections',
        methods: ['GET'],
        description: 'Database collection information'
      }
    },
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      collections: mongoose.connection.readyState === 1 ? 'available' : 'unavailable'
    },
    status: 'operational',
    documentation: 'https://charityguard.org/docs',
    support: 'https://charityguard.org/support'
  });
});

// API routes - Mount all your existing routes
app.use('/api/nonprofits', nonprofitRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api', apiRoutes); // Mount API routes last

// Database status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    services: {
      api: 'healthy',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      mongodb: {
        state: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      }
    },
    performance: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api',
      'GET /api/nonprofits',  
      'GET /api/auth',
      'GET /api/payments',
      'GET /api/transactions',
      'GET /api/collections',
      'GET /api/status'
    ],
    timestamp: new Date().toISOString()
  });
});

// 404 handler for all other routes  
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    suggestion: 'Try /api for available endpoints',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// Database connection using your existing config/db.js
async function connectDatabase() {
  try {
    // Use your existing connection function
    await connectDB();
    
    // Make database available to routes
    app.locals.db = mongoose.connection.db;
    global.db = mongoose.connection.db;
    
    logger.info('✅ MongoDB connected successfully', {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      readyState: mongoose.connection.readyState
    });

    // Database event handlers
    mongoose.connection.on('error', (error) => {
      logger.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB reconnected');
    });

  } catch (error) {
    logger.error('❌ MongoDB connection failed:', {
      error: error.message,
      uri: config.MONGODB_URI ? config.MONGODB_URI.replace(/\/\/.*@/, '//***@') : 'Not configured'
    });
    
    // In development, continue without database
    if (config.NODE_ENV === 'development') {
      logger.warn('⚠️  Continuing without database in development mode');
    } else {
      process.exit(1);
    }
  }
}

// Graceful shutdown handler
function setupGracefulShutdown(server) {
  const gracefulShutdown = (signal) => {
    logger.info(`📴 ${signal} received, shutting down gracefully`);
    
    server.close((err) => {
      if (err) {
        logger.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }
      
      logger.info('🔒 HTTP server closed');
      
      // Close database connection
      mongoose.connection.close(false, (err) => {
        if (err) {
          logger.error('❌ Error closing database connection:', err);
          process.exit(1);
        }
        
        logger.info('🔒 Database connection closed');
        logger.info('👋 CharityGuard API shutdown complete');
        process.exit(0);
      });
    });
  };

  // Handle different shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('🚨 Uncaught Exception:', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

// Start server
async function startServer() {
  try {
    // Connect to database first
    await connectDatabase();
    
    // Start HTTP server
    const server = app.listen(config.PORT, () => {
      logger.info('🚀 CharityGuard API Server started successfully', {
        port: config.PORT,
        environment: config.NODE_ENV,
        pid: process.pid,
        nodeVersion: process.version
      });
      
      logger.info('🌍 Server endpoints:', {
        health: `http://localhost:${config.PORT}/health`,
        api: `http://localhost:${config.PORT}/api`,
        root: `http://localhost:${config.PORT}/`,
        nonprofits: `http://localhost:${config.PORT}/api/nonprofits/search`
      });
      
      logger.info('📊 Server metrics:', {
        uptime: '0s',
        memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        database: mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'
      });
    });

    // Setup graceful shutdown
    setupGracefulShutdown(server);

    return server;

  } catch (error) {
    logger.error('❌ Failed to start CharityGuard API server:', error);
    process.exit(1);
  }
}

// Initialize server
if (require.main === module) {
  startServer();
}

module.exports = app;