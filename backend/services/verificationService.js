const IRSOrg = require('../models/IRSOrg');
const Nonprofit = require('../models/Nonprofit');
const AnalyticsService = require('./analyticsService');  // Integrated for fraud-trust sync

class VerificationService {
  
  // ... (your existing verifyEIN, calculateTrustLevel, calculateTrustScore - unchanged for brevity)

  // Enhanced updateTrustMetrics (now factors in fraud flags)
  async updateTrustMetrics(nonprofitId, recentTransactions = []) {
    try {
      const nonprofit = await Nonprofit.findById(nonprofitId);
      if (!nonprofit) {
        throw new Error('Nonprofit not found');
      }

      // Calculate metrics from transactions
      const totalTransactions = recentTransactions.length;
      const completedTransactions = recentTransactions.filter(tx => tx.status === 'completed').length;
      const flaggedTransactions = recentTransactions.filter(tx => tx.status === 'flagged' || tx.status === 'blocked').length;
      const avgFraudScore = totalTransactions > 0 
        ? recentTransactions.reduce((sum, tx) => sum + (tx.fraudScore || 0), 0) / totalTransactions 
        : 0;
      
      // Fraud penalty
      let fraudPenalty = flaggedTransactions / totalTransactions * 0.3;
      
      // Update trust score based on transaction history + fraud
      let newTrustScore = nonprofit.trustScore;
      
      if (totalTransactions >= 10) {
        const consistencyRatio = completedTransactions / totalTransactions;
        const fraudFactor = 1 - avgFraudScore - fraudPenalty;
        
        newTrustScore = Math.min(
          newTrustScore + (consistencyRatio * 0.1) + (fraudFactor * 0.05),
          1.0
        );
        
        // Auto-downgrade on high fraud
        if (avgFraudScore > 0.6 || flaggedTransactions > 3) {
          newTrustScore = Math.max(newTrustScore - 0.2, 0.1);
          nonprofit.trustLevel = 'under_review';
          nonprofit.reviewReason = `High fraud rate: ${avgFraudScore.toFixed(2)} avg score, ${flaggedTransactions} flags`;
        }
        
        // Auto-whitelist high-performing (low fraud)
        if (newTrustScore > 0.9 && totalTransactions > 20 && consistencyRatio > 0.95 && flaggedTransactions === 0) {
          nonprofit.trustLevel = 'whitelisted';
          nonprofit.whitelistedAt = new Date();
          nonprofit.whitelistReason = 'Excellent history, zero fraud';
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
          flaggedTransactions,  // New: Fraud metric
          consistencyRatio: totalTransactions > 0 ? completedTransactions / totalTransactions : 0,
          avgFraudScore,
          fraudPenalty: fraudPenalty.toFixed(2)
        }
      };

    } catch (error) {
      console.error('Trust metrics update error:', error);
      throw error;
    }
  }

  // ... (rest unchanged: addRiskFlag, formatEIN, isValidEINFormat, getVerificationStats)
  // For getVerificationStats, add fraud stats:
  async getVerificationStats() {
    // ... existing aggregation
    const fraudStats = await Transaction.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    // Return with fraudStats added to response
    return { ...existing, fraudStats };
  }
}

module.exports = new VerificationService();