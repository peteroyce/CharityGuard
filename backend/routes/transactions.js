const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  validateTransaction,
  validateObjectId,
  validatePagination,
  validateTransactionStatusUpdate
} = require('../middleware/validation');
const { generalLimiter, transactionLimiter } = require('../middleware/security');

// Apply rate limiting to all transaction routes
router.use(generalLimiter);

// GET /api/transactions - Get all transactions with filtering
router.get('/',
  validatePagination,
  asyncHandler(transactionController.getAllTransactions)
);

// POST /api/transactions - Process new transaction
router.post('/',
  transactionLimiter, // Stricter rate limit for transaction processing
  validateTransaction,
  asyncHandler(transactionController.processTransaction)
);

// GET /api/transactions/stats - Get transaction statistics
router.get('/stats',
  asyncHandler(transactionController.getTransactionStats)
);

// GET /api/transactions/flagged - Get flagged transactions
router.get('/flagged',
  asyncHandler(transactionController.getFlaggedTransactions)
);

// GET /api/transactions/:id - Get transaction by ID
router.get('/:id',
  validateObjectId(),
  asyncHandler(transactionController.getTransactionById)
);

// PUT /api/transactions/:id/status - Update transaction status
router.put('/:id/status',
  validateObjectId(),
  validateTransactionStatusUpdate,
  asyncHandler(transactionController.updateTransactionStatus)
);

module.exports = router;
