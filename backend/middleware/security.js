// backend/middleware/security.js
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// Rate limiting configuration factory
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// General API rate limit
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later'
);

// Strict rate limit for registration/sensitive operations
const strictLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many registration attempts, please try again later'
);

// Transaction processing rate limit
const transactionLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  10, // limit each IP to 10 transactions per minute
  'Too many transaction requests, please slow down'
);

// Search rate limit (for nonprofit searches)
const searchLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  30, // limit each IP to 30 searches per minute
  'Too many search requests, please slow down'
);

// Donation rate limit (for blockchain donations)
const donationLimiter = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  3, // limit each IP to 3 donations per 5 minutes
  'Too many donation attempts, please wait before trying again'
);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://charityguard.vercel.app',
      'https://charityguard-frontend.vercel.app',
      // Add your production domains here
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key'
  ]
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Set comprehensive security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // Remove powered by header
  res.removeHeader('X-Powered-By');
  
  next();
};

// Input validation middleware
const validateInput = (fields) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const field of fields) {
      let value;
      
      // Check different request locations for the field
      if (field === 'id') {
        value = req.params.id;
        // Validate MongoDB ObjectId format
        if (!value || !value.match(/^[0-9a-fA-F]{24}$/)) {
          errors.push({
            field: field,
            message: `Invalid ${field} format - must be a valid MongoDB ObjectId`,
            received: value
          });
        }
      } else if (field === 'email') {
        value = req.body[field] || req.query[field];
        // Validate email format
        if (!value || !/\S+@\S+\.\S+/.test(value)) {
          errors.push({
            field: field,
            message: `Invalid ${field} format - must be a valid email address`,
            received: value ? 'invalid format' : 'missing'
          });
        }
      } else if (field === 'ein') {
        value = req.body[field] || req.query[field];
        // Validate EIN format (XX-XXXXXXX or XXXXXXXXX)
        if (!value || !/^\d{2}-?\d{7}$/.test(value.toString().replace(/-/g, ''))) {
          errors.push({
            field: field,
            message: `Invalid ${field} format - must be XX-XXXXXXX or XXXXXXXXX`,
            received: value ? 'invalid format' : 'missing'
          });
        }
      } else if (field === 'amount') {
        value = req.body[field] || req.query[field];
        const numValue = parseFloat(value);
        if (!value || isNaN(numValue) || numValue <= 0) {
          errors.push({
            field: field,
            message: `Invalid ${field} - must be a positive number`,
            received: value
          });
        }
      } else if (field === 'address') {
        value = req.body[field] || req.query[field];
        // Validate Ethereum address format
        if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
          errors.push({
            field: field,
            message: `Invalid ${field} format - must be a valid Ethereum address`,
            received: value ? 'invalid format' : 'missing'
          });
        }
      } else {
        // Check required fields
        value = req.body[field] || req.query[field] || req.params[field];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push({
            field: field,
            message: `${field} is required`,
            received: 'missing or empty'
          });
        }
      }
    }
    
    if (errors.length > 0) {
      console.warn(`Validation failed for ${req.method} ${req.path}:`, errors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize request body, query, and params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// Sanitize object recursively
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Sanitize single string
const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['";]/g, '') // Remove SQL injection characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/onload/gi, '') // Remove onload events
    .replace(/onerror/gi, '') // Remove onerror events
    .slice(0, 1000); // Limit length to prevent buffer overflow
};

// Sanitize single input function (for utility use)
const sanitizeInputString = (input) => {
  return sanitizeString(input);
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip} - UA: ${userAgent.slice(0, 100)}`);
  
  // Log request body for non-GET requests (excluding sensitive data)
  if (method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    const logBody = { ...req.body };
    
    // Remove sensitive fields from logs
    const sensitiveFields = [
      'password', 'token', 'apiKey', 'privateKey', 'secret', 
      'authorization', 'cookie', 'session'
    ];
    
    sensitiveFields.forEach(field => {
      if (logBody[field]) {
        logBody[field] = '[REDACTED]';
      }
    });
    
    console.log(`[${timestamp}] Request Body:`, JSON.stringify(logBody, null, 2));
  }
  
  // Log response time
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${timestamp}] ${method} ${url} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Health check bypass middleware
const healthCheckBypass = (req, res, next) => {
  if (req.path === '/api/health' || req.path === '/api/status' || req.path === '/health') {
    return next();
  }
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error on ${req.method} ${req.path}:`, err);
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: isDevelopment ? err.message : 'Invalid input data'
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      details: isDevelopment ? err.message : 'Please provide a valid ID'
    });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      details: isDevelopment ? err.message : 'This record already exists'
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    details: isDevelopment ? err.message : 'Something went wrong'
  });
};

// API key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.get('X-API-Key') || req.query.apiKey;
  const validApiKeys = (process.env.API_KEYS || '').split(',').filter(Boolean);
  
  if (validApiKeys.length === 0) {
    // If no API keys configured, skip validation
    return next();
  }
  
  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing API key'
    });
  }
  
  next();
};

// Blockchain transaction validation
const validateBlockchainTransaction = (req, res, next) => {
  const { charity, charityName, charityEIN, amount, fraudScore } = req.body;
  const errors = [];
  
  // Validate Ethereum address
  if (!charity || !/^0x[a-fA-F0-9]{40}$/.test(charity)) {
    errors.push('Invalid charity address format');
  }
  
  // Validate charity name
  if (!charityName || charityName.trim().length < 2) {
    errors.push('Charity name must be at least 2 characters');
  }
  
  // Validate EIN
  if (!charityEIN || !/^\d{2}-?\d{7}$/.test(charityEIN.replace(/-/g, ''))) {
    errors.push('Invalid EIN format');
  }
  
  // Validate amount
  const numAmount = parseFloat(amount);
  if (!amount || isNaN(numAmount) || numAmount <= 0 || numAmount > 1000) {
    errors.push('Amount must be between 0.001 and 1000 ETH');
  }
  
  // Validate fraud score
  if (fraudScore !== undefined && (isNaN(fraudScore) || fraudScore < 0 || fraudScore > 1)) {
    errors.push('Fraud score must be between 0 and 1');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Blockchain transaction validation failed',
      details: errors
    });
  }
  
  next();
};

module.exports = {
  // Rate limiters
  generalLimiter,
  strictLimiter,
  transactionLimiter,
  searchLimiter,
  donationLimiter,
  
  // Security configurations
  corsOptions,
  securityHeaders,
  
  // Validation and sanitization
  validateInput,
  sanitizeInput,
  sanitizeInputString,
  sanitizeString,
  sanitizeObject,
  
  // Specialized validators
  validateApiKey,
  validateBlockchainTransaction,
  
  // Logging and monitoring
  requestLogger,
  errorHandler,
  
  // Utilities
  healthCheckBypass,
  
  // Combined middleware for easy application
  applySecurity: [
    cors(corsOptions),
    securityHeaders,
    mongoSanitize(),
    xss(),
    hpp({
      whitelist: ['tags', 'category'] // Allow multiple values for these fields
    }),
    sanitizeInput,
    requestLogger
  ]
};