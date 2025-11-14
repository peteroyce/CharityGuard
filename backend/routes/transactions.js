const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// IMPORTANT: Specific routes MUST come before parameterized routes (:id)

// Test data generation route
router.get('/test-data/generate', transactionController.generateTestData);

// GET /api/transactions/flagged - Get all flagged transactions
router.get('/flagged', transactionController.getFlaggedTransactions);

// GET /api/transactions/stats/fraud - Get fraud statistics
router.get('/stats/fraud', transactionController.getFraudStats);

// GET /api/transactions/export - Export transactions
router.get('/export', transactionController.exportTransactions);

// POST /api/transactions/bulk-update - Bulk update transactions
router.post('/bulk-update', transactionController.bulkUpdateTransactions);

// GET /api/transactions/donor/:address - Get donor transaction history
router.get('/donor/:address', transactionController.getDonorTransactions);

// GET /api/transactions/:id/details - Get transaction details
router.get('/:id/details', transactionController.getTransactionDetails);

// GET /api/transactions/:hash - Get transaction by hash
router.get('/:hash', transactionController.getTransactionByHash);

// PATCH /api/transactions/:id/status - Update transaction status
router.patch('/:id/status', transactionController.updateTransactionStatus);

// POST /api/transactions - Create new transaction (with fraud detection)
router.post('/', transactionController.createTransaction);

// GET /api/transactions - Get all transactions with pagination
router.get('/', transactionController.getAllTransactions);

module.exports = router;

