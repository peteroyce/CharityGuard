const Transaction = require('../models/Transaction');
const Nonprofit = require('../models/Nonprofit');
const analyticsService = require('../services/analyticsService');
const verificationService = require('../services/verificationService');

class TransactionController {

  /**
   * Get all transactions with filtering and pagination
   */
  async getAllTransactions(req, res) {
    try {
      const {
        nonprofit,
        status,
        minAmount,
        maxAmount,
        minFraudScore,
        maxFraudScore,
        limit = 50,
        page = 1,
        sortBy = 'date',
        sortOrder = 'desc'
      } = req.query;

      // Build filter object
      const filter = {};
      if (nonprofit) filter.nonprofit = nonprofit;
      if (status) filter.status = status;
      if (minAmount || maxAmount) {
        filter.amount = {};
        if (minAmount) filter.amount.$gte = parseFloat(minAmount);
        if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
      }
      if (minFraudScore || maxFraudScore) {
        filter.fraudScore = {};
        if (minFraudScore) filter.fraudScore.$gte = parseFloat(minFraudScore);
        if (maxFraudScore) filter.fraudScore.$lte = parseFloat(maxFraudScore);
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query with population
      const transactions = await Transaction
        .find(filter)
        .populate('nonprofit', 'name registrationNumber verificationStatus trustLevel')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      // Get total count
      const totalCount = await Transaction.countDocuments(filter);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve transactions',
        details: error.message
      });
    }
  }

  /**
   * Process a new donation transaction
   */
  async processTransaction(req, res) {
    try {
      const { nonprofitId, amount, donorWallet, description } = req.body;

      // Validate required fields
      if (!nonprofitId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: nonprofitId, amount'
        });
      }

      // Get nonprofit details
      const nonprofit = await Nonprofit.findById(nonprofitId);
      if (!nonprofit) {
        return res.status(404).json({
          success: false,
          error: 'Nonprofit not found'
        });
      }

      // Calculate fraud score using analytics service
      const fraudScore = await analyticsService.calculateAdvancedFraudScore(
        { amount, donorWallet: donorWallet || 'anonymous' },
        nonprofitId
      );

      // Determine transaction status based on fraud score
      let status = 'completed';
      if (fraudScore >= 0.7) {
        status = 'flagged';
      } else if (fraudScore >= 0.4) {
        status = 'under_review';
      }

      // Create transaction
      const transactionData = {
        nonprofit: nonprofit._id,
        nonprofitName: nonprofit.name,
        amount: parseFloat(amount),
        donorWallet: donorWallet?.trim() || 'anonymous',
        description: description?.trim() || '',
        fraudScore,
        status
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      // Update nonprofit donation metrics
      await nonprofit.updateDonationMetrics();

      // Update trust metrics if significant transaction volume
      const transactionCount = await Transaction.countDocuments({ nonprofit: nonprofitId });
      if (transactionCount % 10 === 0) { // Update every 10 transactions
        const recentTransactions = await Transaction
          .find({ nonprofit: nonprofitId })
          .sort({ date: -1 })
          .limit(50)
          .lean();
        
        await verificationService.updateTrustMetrics(nonprofitId, recentTransactions);
      }

      // Add risk flag if high fraud score
      if (fraudScore >= 0.8) {
        await verificationService.addRiskFlag(
          nonprofitId,
          'high_fraud_transaction',
          `Transaction with fraud score ${fraudScore.toFixed(3)} detected`,
          'fraud_detection_system'
        );
      }

      res.status(201).json({
        success: true,
        data: {
          transactionId: savedTransaction._id,
          nonprofitName: savedTransaction.nonprofitName,
          amount: savedTransaction.amount,
          fraudScore: savedTransaction.fraudScore,
          status: savedTransaction.status,
          date: savedTransaction.date,
          riskLevel: fraudScore >= 0.7 ? 'HIGH' : fraudScore >= 0.3 ? 'MEDIUM' : 'LOW'
        },
        message: `Transaction ${status === 'completed' ? 'processed successfully' : 
                  status === 'flagged' ? 'flagged for review' : 'under review'}`
      });

    } catch (error) {
      console.error('Process transaction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process transaction',
        details: error.message
      });
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(req, res) {
    try {
      const { id } = req.params;

      const transaction = await Transaction
        .findById(id)
        .populate('nonprofit', 'name registrationNumber verificationStatus trustLevel trustScore')
        .lean();

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: transaction
      });

    } catch (error) {
      console.error('Get transaction by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve transaction',
        details: error.message
      });
    }
  }

  /**
   * Get flagged transactions for review
   */
  async getFlaggedTransactions(req, res) {
    try {
      const flaggedTransactions = await Transaction
        .find({ 
          status: { $in: ['flagged', 'under_review'] }
        })
        .populate('nonprofit', 'name registrationNumber')
        .sort({ fraudScore: -1, date: -1 })
        .limit(100)
        .lean();

      res.json({
        success: true,
        data: flaggedTransactions,
        count: flaggedTransactions.length
      });

    } catch (error) {
      console.error('Get flagged transactions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve flagged transactions',
        details: error.message
      });
    }
  }

  /**
   * Update transaction status (for manual review)
   */
  async updateTransactionStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reviewNotes } = req.body;

      if (!['completed', 'flagged', 'under_review', 'blocked'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be: completed, flagged, under_review, or blocked'
        });
      }

      const transaction = await Transaction.findByIdAndUpdate(
        id,
        { 
          status,
          reviewNotes: reviewNotes?.trim() || '',
          lastReviewedAt: new Date()
        },
        { new: true }
      ).populate('nonprofit', 'name registrationNumber');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: transaction,
        message: `Transaction status updated to ${status}`
      });

    } catch (error) {
      console.error('Update transaction status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update transaction status',
        details: error.message
      });
    }
  }

  /**
   * Get transaction analytics/statistics
   */
  async getTransactionStats(req, res) {
    try {
      const stats = await Transaction.aggregate([
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            avgFraudScore: { $avg: '$fraudScore' },
            completedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            flaggedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] }
            },
            underReviewCount: {
              $sum: { $cond: [{ $eq: ['$status', 'under_review'] }, 1, 0] }
            },
            blockedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] }
            }
          }
        }
      ]);

      const riskStats = await Transaction.aggregate([
        {
          $group: {
            _id: {
              $cond: [
                { $gte: ['$fraudScore', 0.7] }, 'HIGH',
                { $cond: [{ $gte: ['$fraudScore', 0.3] }, 'MEDIUM', 'LOW'] }
              ]
            },
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        overview: stats[0] || {
          totalTransactions: 0,
          totalAmount: 0,
          avgAmount: 0,
          avgFraudScore: 0,
          completedCount: 0,
          flaggedCount: 0,
          underReviewCount: 0,
          blockedCount: 0
        },
        riskDistribution: riskStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, { HIGH: 0, MEDIUM: 0, LOW: 0 })
      };

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Get transaction stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve transaction statistics',
        details: error.message
      });
    }
  }
}

module.exports = new TransactionController();