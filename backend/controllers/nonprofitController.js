const Nonprofit = require('../models/Nonprofit');
const verificationService = require('../services/verificationService');
const Transaction = require('../models/Transaction');

class NonprofitController {

  /**
   * Get all nonprofits with optional filtering
   */
  async getAllNonprofits(req, res) {
    try {
      const { 
        status, 
        trustLevel, 
        limit = 50, 
        page = 1,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build filter object
      const filter = { isActive: true };
      if (status) filter.verificationStatus = status;
      if (trustLevel) filter.trustLevel = trustLevel;

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query with pagination and sorting
      const nonprofits = await Nonprofit
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      // Get total count for pagination
      const totalCount = await Nonprofit.countDocuments(filter);

      res.json({
        success: true,
        data: nonprofits,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get nonprofits error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve nonprofits',
        details: error.message
      });
    }
  }

  /**
   * Register a new nonprofit with EIN verification
   */
  async registerNonprofit(req, res) {
    try {
      const { ein, name, contactEmail, address, category, description } = req.body;

      // Validate required fields
      if (!ein || !name || !contactEmail) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: ein, name, contactEmail'
        });
      }

      // Check for existing nonprofit
      const existingNonprofit = await Nonprofit.findOne({ 
        registrationNumber: verificationService.formatEIN(ein) 
      });

      if (existingNonprofit) {
        return res.status(200).json({
          success: true,
          data: existingNonprofit,
          message: 'Nonprofit already registered'
        });
      }

      // Verify EIN against IRS database
      console.log('Verifying EIN:', ein);
      const verificationResult = await verificationService.verifyEIN(ein);

      // Create nonprofit data object
      const nonprofitData = {
        name: verificationResult.irsData?.name || name,
        registrationNumber: verificationService.formatEIN(ein),
        contactEmail: contactEmail.toLowerCase().trim(),
        address: address?.trim() || '',
        category: category || 'other',
        description: description?.trim() || '',
        verificationStatus: verificationResult.verificationStatus,
        trustLevel: verificationResult.trustLevel,
        trustScore: verificationResult.trustScore
      };

      // Add verification timestamp and data if verified
      if (verificationResult.isValid) {
        nonprofitData.verifiedAt = new Date();
        nonprofitData.verifiedBy = 'IRS_DATABASE';
      }

      // Create and save nonprofit
      const nonprofit = new Nonprofit(nonprofitData);
      const savedNonprofit = await nonprofit.save();

      console.log('Nonprofit registered successfully:', savedNonprofit._id);

      res.status(201).json({
        success: true,
        data: {
          _id: savedNonprofit._id,
          name: savedNonprofit.name,
          registrationNumber: savedNonprofit.registrationNumber,
          contactEmail: savedNonprofit.contactEmail,
          address: savedNonprofit.address,
          verificationStatus: savedNonprofit.verificationStatus,
          trustLevel: savedNonprofit.trustLevel,
          trustScore: savedNonprofit.trustScore,
          createdAt: savedNonprofit.createdAt
        },
        verification: {
          isValid: verificationResult.isValid,
          irsData: verificationResult.irsData || null,
          error: verificationResult.error || null
        }
      });

    } catch (error) {
      console.error('Register nonprofit error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register nonprofit',
        details: error.message
      });
    }
  }

  /**
   * Get nonprofit by ID with transaction summary
   */
  async getNonprofitById(req, res) {
    try {
      const { id } = req.params;

      const nonprofit = await Nonprofit.findById(id);
      if (!nonprofit) {
        return res.status(404).json({
          success: false,
          error: 'Nonprofit not found'
        });
      }

      // Get transaction summary
      const transactionStats = await Transaction.aggregate([
        { $match: { nonprofit: nonprofit._id } },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            completedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            flaggedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] }
            },
            avgFraudScore: { $avg: '$fraudScore' }
          }
        }
      ]);

      const stats = transactionStats[0] || {
        totalTransactions: 0,
        totalAmount: 0,
        avgAmount: 0,
        completedCount: 0,
        flaggedCount: 0,
        avgFraudScore: 0
      };

      res.json({
        success: true,
        data: {
          ...nonprofit.toObject(),
          transactionStats: stats
        }
      });

    } catch (error) {
      console.error('Get nonprofit by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve nonprofit',
        details: error.message
      });
    }
  }

  /**
   * Update nonprofit trust metrics
   */
  async updateTrustMetrics(req, res) {
    try {
      const { id } = req.params;

      // Get recent transactions for this nonprofit
      const recentTransactions = await Transaction
        .find({ nonprofit: id })
        .sort({ date: -1 })
        .limit(50)
        .lean();

      const updatedMetrics = await verificationService.updateTrustMetrics(id, recentTransactions);

      res.json({
        success: true,
        data: updatedMetrics,
        message: 'Trust metrics updated successfully'
      });

    } catch (error) {
      console.error('Update trust metrics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update trust metrics',
        details: error.message
      });
    }
  }

  /**
   * Add risk flag to nonprofit
   */
  async addRiskFlag(req, res) {
    try {
      const { id } = req.params;
      const { flagType, reason, flaggedBy = 'admin' } = req.body;

      if (!flagType || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: flagType, reason'
        });
      }

      const updatedNonprofit = await verificationService.addRiskFlag(id, flagType, reason, flaggedBy);

      res.json({
        success: true,
        data: updatedNonprofit,
        message: 'Risk flag added successfully'
      });

    } catch (error) {
      console.error('Add risk flag error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add risk flag',
        details: error.message
      });
    }
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(req, res) {
    try {
      const stats = await verificationService.getVerificationStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get verification stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve verification statistics',
        details: error.message
      });
    }
  }
}

module.exports = new NonprofitController();
