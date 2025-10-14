const IRSOrg = require('../models/IRSOrg');
const Nonprofit = require('../models/Nonprofit');

class VerificationService {
  
  /**
   * Verify EIN against IRS database and calculate trust metrics
   * @param {string} ein - The EIN to verify
   * @returns {Object} Verification result with status, trust score, and IRS data
   */
  async verifyEIN(ein) {
    try {
      // Clean and format EIN
      const cleanEIN = this.formatEIN(ein);
      
      if (!this.isValidEINFormat(cleanEIN)) {
        return {
          isValid: false,
          verificationStatus: 'rejected',
          trustLevel: 'new',
          trustScore: 0.1,
          error: 'Invalid EIN format'
        };
      }

      // Check against IRS database
      const irsRecord = await IRSOrg.findOne({ ein: cleanEIN }).lean();
      
      if (irsRecord) {
        // EIN found in IRS database
        return {
          isValid: true,
          verificationStatus: 'verified',
          trustLevel: this.calculateTrustLevel(irsRecord),
          trustScore: this.calculateTrustScore(irsRecord),
          irsData: {
            name: irsRecord.name,
            status: irsRecord.status,
            nteeCode: irsRecord.nteeCode,
            deductibility: irsRecord.deductibility,
            classification: irsRecord.classification,
            city: irsRecord.city,
            state: irsRecord.state
          }
        };
      } else {
        // EIN not found in IRS database
        return {
          isValid: false,
          verificationStatus: 'pending',
          trustLevel: 'new', 
          trustScore: 0.25,
          error: 'EIN not found in IRS database'
        };
      }

    } catch (error) {
      console.error('EIN verification error:', error);
      return {
        isValid: false,
        verificationStatus: 'pending',
        trustLevel: 'new',
        trustScore: 0.25,
        error: 'Verification service temporarily unavailable'
      };
    }
  }

  /**
   * Calculate trust level based on IRS data
   * @param {Object} irsRecord - IRS organization record
   * @returns {string} Trust level
   */
  calculateTrustLevel(irsRecord) {
    if (!irsRecord) return 'new';
    
    const status = irsRecord.status?.toLowerCase() || '';
    const deductibility = irsRecord.deductibility?.toLowerCase() || '';
    
    // High trust for active, deductible organizations
    if (status.includes('active') && deductibility.includes('deductible')) {
      return 'trusted';
    }
    
    // Medium trust for active organizations
    if (status.includes('active')) {
      return 'trusted';
    }
    
    // Lower trust for inactive/revoked status
    if (status.includes('revoked') || status.includes('terminated')) {
      return 'blacklisted';
    }
    
    return 'new';
  }

  /**
   * Calculate numerical trust score (0-1)
   * @param {Object} irsRecord - IRS organization record
   * @returns {number} Trust score between 0 and 1
   */
  calculateTrustScore(irsRecord) {
    if (!irsRecord) return 0.25;
    
    let score = 0.5; // Base score
    
    const status = irsRecord.status?.toLowerCase() || '';
    const deductibility = irsRecord.deductibility?.toLowerCase() || '';
    const classification = irsRecord.classification?.toLowerCase() || '';
    
    // Positive factors
    if (status.includes('active')) score += 0.3;
    if (deductibility.includes('deductible')) score += 0.2;
    if (classification.includes('public charity')) score += 0.1;
    if (irsRecord.nteeCode) score += 0.05; // Has NTEE classification
    
    // Negative factors
    if (status.includes('revoked')) score -= 0.6;
    if (status.includes('terminated')) score -= 0.5;
    if (status.includes('suspended')) score -= 0.4;
    
    return Math.max(0.1, Math.min(score, 1.0));
  }

  /**
   * Update nonprofit trust metrics after transactions
   * @param {string} nonprofitId - Nonprofit ObjectId
   * @param {Array} recentTransactions - Recent transaction data
   * @returns {Object} Updated trust metrics
   */
  async updateTrustMetrics(nonprofitId, recentTransactions = []) {
    try {
      const nonprofit = await Nonprofit.findById(nonprofitId);
      if (!nonprofit) {
        throw new Error('Nonprofit not found');
      }

      // Calculate metrics from transactions
      const totalTransactions = recentTransactions.length;
      const completedTransactions = recentTransactions.filter(tx => tx.status === 'completed').length;
      const avgFraudScore = totalTransactions > 0 
        ? recentTransactions.reduce((sum, tx) => sum + (tx.fraudScore || 0), 0) / totalTransactions 
        : 0;
      
      // Update trust score based on transaction history
      let newTrustScore = nonprofit.trustScore;
      
      if (totalTransactions >= 10) {
        const consistencyRatio = completedTransactions / totalTransactions;
        const fraudFactor = 1 - avgFraudScore;
        
        // Reward consistent, low-fraud organizations
        newTrustScore = Math.min(
          newTrustScore + (consistencyRatio * 0.1) + (fraudFactor * 0.05),
          1.0
        );
        
        // Auto-whitelist high-performing organizations
        if (newTrustScore > 0.9 && totalTransactions > 20 && consistencyRatio > 0.95) {
          nonprofit.trustLevel = 'whitelisted';
          nonprofit.whitelistedAt = new Date();
          nonprofit.whitelistReason = 'Excellent transaction history and low fraud risk';
        }
      }
      
      nonprofit.trustScore = newTrustScore;
      await nonprofit.save();
      
      return {
        trustScore: newTrustScore,
        trustLevel: nonprofit.trustLevel,
        metrics: {
          totalTransactions,
          completedTransactions,
          consistencyRatio: totalTransactions > 0 ? completedTransactions / totalTransactions : 0,
          avgFraudScore
        }
      };

    } catch (error) {
      console.error('Trust metrics update error:', error);
      throw error;
    }
  }

  /**
   * Add risk flag to nonprofit
   * @param {string} nonprofitId - Nonprofit ObjectId
   * @param {string} flagType - Type of risk flag
   * @param {string} reason - Reason for flag
   * @param {string} flaggedBy - Who flagged it
   * @returns {Object} Updated nonprofit with new flag
   */
  async addRiskFlag(nonprofitId, flagType, reason, flaggedBy = 'system') {
    try {
      const nonprofit = await Nonprofit.findById(nonprofitId);
      if (!nonprofit) {
        throw new Error('Nonprofit not found');
      }

      nonprofit.addRiskFlag(flagType, reason, flaggedBy);
      await nonprofit.save();
      
      return nonprofit;
    } catch (error) {
      console.error('Risk flag addition error:', error);
      throw error;
    }
  }

  /**
   * Format EIN to standard format
   * @param {string} ein - Raw EIN input
   * @returns {string} Formatted EIN
   */
  formatEIN(ein) {
    if (!ein) return '';
    
    // Remove all non-digits and non-hyphens
    let cleaned = ein.toString().replace(/[^0-9-]/g, '');
    
    // If no hyphens present and it's 9 digits, add hyphen
    if (cleaned.length === 9 && !cleaned.includes('-')) {
      cleaned = cleaned.substring(0, 2) + '-' + cleaned.substring(2);
    }
    
    return cleaned;
  }

  /**
   * Validate EIN format
   * @param {string} ein - EIN to validate
   * @returns {boolean} True if valid format
   */
  isValidEINFormat(ein) {
    // Standard EIN format: XX-XXXXXXX (9 digits with hyphen)
    const einPattern = /^\d{2}-\d{7}$/;
    return einPattern.test(ein);
  }

  /**
   * Get verification statistics for dashboard
   * @returns {Object} Verification statistics
   */
  async getVerificationStats() {
    try {
      const stats = await Nonprofit.aggregate([
        {
          $group: {
            _id: '$verificationStatus',
            count: { $sum: 1 },
            avgTrustScore: { $avg: '$trustScore' }
          }
        }
      ]);

      const trustLevelStats = await Nonprofit.aggregate([
        {
          $group: {
            _id: '$trustLevel',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get total IRS records count
      const totalIRSRecords = await IRSOrg.countDocuments();

      return {
        verificationStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            avgTrustScore: stat.avgTrustScore
          };
          return acc;
        }, {}),
        trustLevels: trustLevelStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        totalIRSRecords,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Verification stats error:', error);
      throw error;
    }
  }
}

module.exports = new VerificationService();
