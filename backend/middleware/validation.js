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
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isAlpha()
    .withMessage('Sort by must contain only letters'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
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

module.exports = {
  validateNonprofitRegistration,
  validateTransaction,
  validateRiskFlag,
  validateTransactionStatusUpdate,
  validateObjectId,
  validatePagination,
  validateEINFormat,
  handleValidationErrors
};
