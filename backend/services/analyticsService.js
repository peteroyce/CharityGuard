const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

class AnalyticsService {
  
  // Get donor historical patterns
  async getDonorPattern(nonprofitId) {
    const patterns = await Transaction.aggregate([
      { $match: { nonprofitId: new mongoose.Types.ObjectId(nonprofitId) } },
      { $group: {
        _id: "$nonprofitId",
        totalDonations: { $sum: 1 },
        avgAmount: { $avg: "$amount" },
        stdDevAmount: { $stdDevPop: "$amount" },
        minAmount: { $min: "$amount" },
        maxAmount: { $max: "$amount" },
        avgFraudScore: { $avg: "$fraudScore" },
        firstDonation: { $min: "$date" },
        lastDonation: { $max: "$date" },
        completedTransactions: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
        }
      }}
    ]);

    if (patterns.length === 0) return null;
    
    const pattern = patterns[0];
    const daysSinceFirst = (Date.now() - pattern.firstDonation) / (1000 * 60 * 60 * 24);
    const avgFrequencyDays = daysSinceFirst / pattern.totalDonations;
    
    return {
      ...pattern,
      avgFrequencyDays,
      consistencyScore: pattern.completedTransactions / pattern.totalDonations,
      trustScore: Math.max(0, 1 - pattern.avgFraudScore)
    };
  }

  // Advanced fraud scoring algorithm
  async calculateAdvancedFraudScore(transaction, nonprofitId) {
    const pattern = await this.getDonorPattern(nonprofitId);
    
    if (!pattern) return 0.5; // New donor gets moderate risk
    
    let riskFactors = 0;
    
    // Amount deviation analysis
    const amountDeviation = Math.abs(transaction.amount - pattern.avgAmount) / pattern.avgAmount;
    if (amountDeviation > 0.5) riskFactors += 0.3;
    
    // Trust score factor
    const trustAdjustment = (1 - pattern.trustScore) * 0.3;
    
    // Frequency analysis
    const daysSinceLastDonation = (Date.now() - pattern.lastDonation) / (1000 * 60 * 60 * 24);
    const frequencyDeviation = Math.abs(daysSinceLastDonation - pattern.avgFrequencyDays) / pattern.avgFrequencyDays;
    if (frequencyDeviation > 0.6) riskFactors += 0.2;
    
    // Consistency bonus for reliable donors
    if (pattern.consistencyScore > 0.95 && pattern.totalDonations > 10) {
      riskFactors -= 0.2;
    }
    
    return Math.max(0, Math.min(riskFactors + trustAdjustment, 1.0));
  }

  // Donor analytics endpoint data
  async getDonorAnalytics(nonprofitId) {
    const pattern = await this.getDonorPattern(nonprofitId);
    const recentTransactions = await Transaction.find({ nonprofitId })
      .sort({ date: -1 })
      .limit(12);
    
    return {
      donorProfile: pattern,
      recentActivity: recentTransactions,
      riskAssessment: this.assessRiskLevel(pattern?.avgFraudScore || 0.5),
      insights: this.generateInsights(pattern, recentTransactions)
    };
  }

  assessRiskLevel(avgFraudScore) {
    if (avgFraudScore < 0.3) return "low";
    if (avgFraudScore < 0.7) return "medium";
    return "high";
  }

  generateInsights(pattern, transactions) {
    const insights = [];
    if (pattern?.consistencyScore > 0.9) {
      insights.push("Highly reliable donation pattern");
    }
    if (pattern?.totalDonations > 12) {
      insights.push("Long-term committed donor");
    }
    if (pattern?.avgFraudScore < 0.2) {
      insights.push("Minimal fraud risk - trusted donor");
    }
    return insights;
  }
}

module.exports = new AnalyticsService();
