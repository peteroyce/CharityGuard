const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const logger = require('./utils/logger');
const connectDB = require('./config/db');

let config;
try {
  config = require('./config/environment');
} catch (error) {
  logger.error('Failed to load config, using defaults:', error.message);
  config = {
    PORT: process.env.PORT || 3001,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/charityguard',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 100,
    NODE_ENV: process.env.NODE_ENV || 'development',
    IS_DEVELOPMENT: process.env.NODE_ENV !== 'production'
  };
}

const errorHandler = require('./middleware/errorHandler');
const { applySecurity, generalLimiter, transactionLimiter } = require('./middleware/security');

let nonprofitRoutes, authRoutes, paymentRoutes, apiRoutes, transactionRoutes, userRoutes, activityLogsRoutes;

try {
  nonprofitRoutes = require('./routes/nonprofits');
} catch (e) {
  logger.warn('Nonprofit routes not found, creating basic version');
  nonprofitRoutes = express.Router();
  nonprofitRoutes.get('/', (req, res) => {
    res.json({ success: true, message: 'Nonprofits endpoint', data: [], timestamp: new Date().toISOString() });
  });
  nonprofitRoutes.get('/search', (req, res) => {
    res.json({ success: true, message: 'Search functionality', data: [], query: req.query.q || '', timestamp: new Date().toISOString() });
  });
}

authRoutes = require('./routes/auth');

try {
  paymentRoutes = require('./routes/payments');
} catch (e) {
  logger.warn('Payment routes not found');
  paymentRoutes = express.Router();
  paymentRoutes.get('/', (req, res) => {
    res.json({ success: true, message: 'Payments endpoint', timestamp: new Date().toISOString() });
  });
}

try {
  apiRoutes = require('./routes/api');
} catch (e) {
  logger.warn('API routes not found');
  apiRoutes = express.Router();
  apiRoutes.get('/collections', async (req, res) => {
    try {
      const database = req.app.locals.db;
      if (!database) return res.status(503).json({ success: false, error: 'Database not connected' });
      const collections = await database.listCollections().toArray();
      const collectionStats = [];
      for (const collection of collections) {
        try {
          const count = await database.collection(collection.name).countDocuments();
          collectionStats.push({ name: collection.name, count });
        } catch (err) {
          collectionStats.push({ name: collection.name, count: 0, error: err.message });
        }
      }
      res.json({ success: true, data: { database: database.databaseName, collections: collectionStats, totalCollections: collections.length } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

transactionRoutes = require('./routes/transactions');
userRoutes = require('./routes/users');

try {
  activityLogsRoutes = require('./routes/activityLogs');
} catch (e) {
  activityLogsRoutes = express.Router();
  activityLogsRoutes.get('/', (req, res) => {
    res.json({ success: true, message: 'Activity logs endpoint', data: [] });
  });
}

const app = express();

// Security headers
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

app.use(compression());

// Apply security middleware (CORS, mongoSanitize, xss, hpp, sanitizeInput)
app.use(applySecurity);

// Rate limiting
app.use('/api', generalLimiter);
app.use('/api/transactions', transactionLimiter);

app.use(express.json({ limit: '10mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  if (req.path !== '/health') {
    logger.info(`${req.method} ${req.path}`, { requestId, ip: req.ip });
  }
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/health') {
      const logLevel = res.statusCode >= 400 ? 'error' : 'info';
      logger[logLevel](`${req.method} ${req.path} ${res.statusCode}`, { requestId, duration: `${duration}ms` });
    }
  });
  next();
});

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
      auth: '/api/auth',
      nonprofits: '/api/nonprofits',
      payments: '/api/payments',
      transactions: '/api/transactions',
      users: '/api/users',
      activityLogs: '/api/activity-logs'
    },
    features: ['AI Fraud Detection', 'IRS Database Verification (559K+ Records)', 'Blockchain Integration', 'Real-time Monitoring'],
    timestamp: new Date().toISOString()
  });
});

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
      api: 'operational'
    }
  };
  const statusCode = mongoose.connection.readyState === 1 ? 200 : 503;
  res.status(statusCode).json(healthData);
});

app.use('/api/nonprofits', nonprofitRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api', apiRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found', path: req.originalUrl });
});

app.use(errorHandler);

async function connectDatabase() {
  try {
    await connectDB();
    app.locals.db = mongoose.connection.db;
    logger.info('MongoDB connected', { host: mongoose.connection.host, name: mongoose.connection.name });
  } catch (error) {
    logger.error('MongoDB failed:', { error: error.message });
    if (config.NODE_ENV !== 'development') process.exit(1);
  }
}

function setupGracefulShutdown(server) {
  const gracefulShutdown = (signal) => {
    logger.info(`${signal} - shutting down`);
    server.close((err) => {
      if (err) { logger.error('Shutdown error:', err); process.exit(1); }
      mongoose.connection.close(false, (err) => {
        if (err) { logger.error('DB close error:', err); process.exit(1); }
        logger.info('Shutdown complete');
        process.exit(0);
      });
    });
  };
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

async function startServer() {
  try {
    await connectDatabase();
    const server = app.listen(config.PORT, () => {
      logger.info('CharityGuard API started', { port: config.PORT, env: config.NODE_ENV, pid: process.pid });
    });
    setupGracefulShutdown(server);
    return server;
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
}

if (require.main === module) startServer();

module.exports = app;


function validate0(input) {
  return input != null;
}


function format20(val) {
  return String(val).trim();
}
