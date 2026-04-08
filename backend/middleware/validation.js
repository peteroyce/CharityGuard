const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Nonprofit validation rules
const validateNonprofitRegistration = [
  body('ein')
    .notEmpty()
    .withMessage('EIN is required')
    .matches(/^\d{2}-?\d{7}$/)
    .withMessage('EIN must be in format XX-XXXXXXX or XXXXXXXXX'),
  
  body('name')
    .notEmpty()
    .withMessage('Organization name is required')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Name must be between 2 and 200 characters'),
  
  body('contactEmail')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  
  body('category')
    .optional()
    .isIn(['education', 'healthcare', 'environment', 'social', 'religious', 'arts', 'animals', 'human_rights', 'other'])
    .withMessage('Invalid category'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  handleValidationErrors
];

// Transaction validation rules
const validateTransaction = [
  body('nonprofitId')
    .notEmpty()
    .withMessage('Nonprofit ID is required')
    .isMongoId()
    .withMessage('Invalid nonprofit ID format'),
  
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      if (parseFloat(value) > 1000000) {
        throw new Error('Amount cannot exceed $1,000,000');
      }
      return true;
    }),
  
  body('donorWallet')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Donor wallet must not exceed 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  handleValidationErrors
];

// Risk flag validation
const validateRiskFlag = [
  body('flagType')
    .notEmpty()
    .withMessage('Flag type is required')
    .isIn(['high_fraud_transaction', 'suspicious_pattern', 'manual_review', 'compliance_issue', 'other'])
    .withMessage('Invalid flag type'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  
  body('flaggedBy')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Flagged by must not exceed 100 characters'),
  
  handleValidationErrors
];

// Update transaction status validation
const validateTransactionStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['completed', 'flagged', 'under_review', 'blocked'])
    .withMessage('Invalid status'),
  
  body('reviewNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Review notes must not exceed 1000 characters'),
  
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
  
  handleValidationErrors
];

// Query parameter validation for pagination
const validatePagination = (allowedSortFields = ['createdAt']) => [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('skip')
    .optional()
    .isInt({ min: 0, max: 100000 })
    .withMessage('Skip must be between 0 and 100000'),

  query('sortBy')
    .optional()
    .isIn(allowedSortFields)
    .withMessage(`Sort by must be one of: ${allowedSortFields.join(', ')}`),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),

  handleValidationErrors
];

// EIN format validation middleware
const validateEINFormat = (req, res, next) => {
  const { ein } = req.body;
  if (ein) {
    const cleanEIN = ein.toString().replace(/[^0-9-]/g, '');
    if (cleanEIN.length === 9 && !cleanEIN.includes('-')) {
      req.body.ein = cleanEIN.substring(0, 2) + '-' + cleanEIN.substring(2);
    } else {
      req.body.ein = cleanEIN;
    }
  }
  next();
};

// Auth validation rules
const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Wallet address validation (Ethereum format)
const validateWalletAddress = (paramName = 'walletAddress') => [
  param(paramName)
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum wallet address format'),
  handleValidationErrors
];

// User status update validation
const validateUserStatusUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  body('action')
    .isIn(['suspend', 'activate', 'ban'])
    .withMessage('Action must be one of: suspend, activate, ban'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
  handleValidationErrors
];

// User notes validation
const validateUserNotes = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Notes must not exceed 5000 characters'),
  handleValidationErrors
];

// User profile update validation
const validateUserProfile = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters'),
  handleValidationErrors
];

// EIN param validation
const validateEINParam = [
  param('ein')
    .matches(/^\d{2}-?\d{7}$/)
    .withMessage('EIN must be in format XX-XXXXXXX or XXXXXXXXX'),
  handleValidationErrors
];

// Bulk update validation
const validateBulkUpdate = [
  body('transactionIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('transactionIds must be an array of 1-100 items'),
  body('transactionIds.*')
    .isMongoId()
    .withMessage('Each transaction ID must be a valid MongoDB ObjectId'),
  body('updates.status')
    .optional()
    .isIn(['completed', 'flagged', 'under_review', 'blocked'])
    .withMessage('Invalid status'),
  handleValidationErrors
];

// Export query validation
const validateExportQuery = [
  query('format')
    .optional()
    .isIn(['csv', 'json'])
    .withMessage('Format must be csv or json'),
  query('status')
    .optional()
    .isIn(['all', 'active', 'suspended', 'banned', 'completed', 'flagged', 'under_review', 'blocked'])
    .withMessage('Invalid status filter'),
  handleValidationErrors
];

// Search query validation
const validateSearchQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query must not exceed 200 characters'),
  query('state')
    .optional()
    .matches(/^[A-Za-z]{2}$/)
    .withMessage('State must be a 2-letter code'),
  query('minTrustScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('minTrustScore must be between 0 and 100'),
  query('sortBy')
    .optional()
    .isIn(['name', 'trustScore', 'state', 'city'])
    .withMessage('sortBy must be one of: name, trustScore, state, city'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('skip')
    .optional()
    .isInt({ min: 0, max: 100000 })
    .withMessage('Skip must be between 0 and 100000'),
  handleValidationErrors
];

// Activity log creation validation
const validateActivityLogCreate = [
  body('action')
    .isIn(['transaction_blocked', 'transaction_cleared', 'transaction_review', 'user_suspended', 'user_activated', 'user_banned', 'bulk_action', 'settings_changed'])
    .withMessage('Invalid action'),
  body('targetType')
    .isIn(['user', 'transaction', 'nonprofit', 'system'])
    .withMessage('Invalid target type'),
  body('targetId')
    .notEmpty()
    .trim()
    .isLength({ max: 200 })
    .withMessage('targetId is required and must not exceed 200 characters'),
  body('details')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Details must not exceed 2000 characters'),
  handleValidationErrors
];

// Activity log stats query validation
const validateActivityLogStats = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
  handleValidationErrors
];

// Auth refresh validation
const validateRefresh = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isLength({ max: 500 })
    .withMessage('Invalid refresh token'),
  handleValidationErrors
];

// Google auth validation
const validateGoogleAuth = [
  body('credential')
    .notEmpty()
    .withMessage('Google credential is required')
    .isLength({ max: 5000 })
    .withMessage('Invalid credential'),
  handleValidationErrors
];

// Registered nonprofit query validation
const validateRegisteredQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'verified', 'rejected', 'suspended'])
    .withMessage('Invalid status filter'),
  query('trustLevel')
    .optional()
    .isIn(['new', 'low', 'medium', 'high', 'verified'])
    .withMessage('Invalid trust level filter'),
  handleValidationErrors
];

// Nonprofit status update validation
const validateNonprofitStatusUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid nonprofit ID format'),
  body('status')
    .optional()
    .isIn(['pending', 'verified', 'rejected', 'suspended'])
    .withMessage('Status must be one of: pending, verified, rejected, suspended'),
  body('trustLevel')
    .optional()
    .isIn(['new', 'low', 'medium', 'high', 'verified'])
    .withMessage('Invalid trust level'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),
  handleValidationErrors
];

// Trust score update validation
const validateTrustScoreUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid nonprofit ID format'),
  body('trustScore')
    .isFloat({ min: 0, max: 1 })
    .withMessage('trustScore must be a number between 0 and 1'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
  handleValidationErrors
];

// Donation query validation
const validateDonationQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('skip')
    .optional()
    .isInt({ min: 0, max: 100000 })
    .withMessage('Skip must be between 0 and 100000'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateNonprofitRegistration,
  validateTransaction,
  validateRiskFlag,
  validateTransactionStatusUpdate,
  validateObjectId,
  validatePagination,
  validateEINFormat,
  handleValidationErrors,
  validateWalletAddress,
  validateUserStatusUpdate,
  validateUserNotes,
  validateUserProfile,
  validateEINParam,
  validateBulkUpdate,
  validateExportQuery,
  validateSearchQuery,
  validateActivityLogCreate,
  validateActivityLogStats,
  validateRefresh,
  validateGoogleAuth,
  validateRegisteredQuery,
  validateNonprofitStatusUpdate,
  validateTrustScoreUpdate,
  validateDonationQuery
};


function validate12(input) {
  return input != null;
}
