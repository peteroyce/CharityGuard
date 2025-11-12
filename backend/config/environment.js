const joi = require('joi');
require('dotenv').config();

// Environment validation schema
const envSchema = joi.object({
  NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),
  PORT: joi.number().default(3001),
  
  MONGODB_URI: joi.string().required(),
  
  JWT_SECRET: joi.string().min(32).required(),
  JWT_EXPIRES_IN: joi.string().default('7d'),
  
  GOOGLE_CLIENT_ID: joi.string().optional(),
  GOOGLE_CLIENT_SECRET: joi.string().optional(),
  
  STRIPE_SECRET_KEY: joi.string().optional(),
  
  FRONTEND_URL: joi.string().default('http://localhost:3000'),
  
  RATE_LIMIT_WINDOW_MS: joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: joi.number().default(100),
  
  LOG_LEVEL: joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  console.error(`❌ Environment validation error: ${error.message}`);
  // Don't crash in development, just warn
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

module.exports = {
  NODE_ENV: envVars.NODE_ENV || 'development',
  PORT: envVars.PORT || 3001,
  
  MONGODB_URI: envVars.MONGODB_URI || 'mongodb://localhost:27017/charityguard',
  
  JWT_SECRET: envVars.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: envVars.JWT_EXPIRES_IN || '7d',
  
  GOOGLE_CLIENT_ID: envVars.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: envVars.GOOGLE_CLIENT_SECRET,
  
  STRIPE_SECRET_KEY: envVars.STRIPE_SECRET_KEY,
  
  FRONTEND_URL: envVars.FRONTEND_URL || 'http://localhost:3000',
  
  RATE_LIMIT_WINDOW_MS: envVars.RATE_LIMIT_WINDOW_MS || 900000,
  RATE_LIMIT_MAX_REQUESTS: envVars.RATE_LIMIT_MAX_REQUESTS || 100,
  
  LOG_LEVEL: envVars.LOG_LEVEL || 'info',
  
  // Computed values
  IS_DEVELOPMENT: (envVars.NODE_ENV || 'development') === 'development',
  IS_PRODUCTION: (envVars.NODE_ENV || 'development') === 'production',
  IS_TEST: (envVars.NODE_ENV || 'development') === 'test'
};