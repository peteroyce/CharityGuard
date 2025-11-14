const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const VerificationService = require('./verificationService');  // Integrated for trust checks

class AnalyticsService {
  
  // Get donor historical patterns (enhanced for fraud)
  async getDonorPattern(nonprofitId) {
    const patterns = await Transaction.aggregate([
      { $match: { nonprofit: new mongoose.Types.ObjectId(nonprofitId) } },  // Fixed: Use 'nonprofit' field
      { $group: {
        _id: "$nonprofit",
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
        },
        recentDonations: { $push: { $cond: [{ $gte: ["$date", { $subtract: [new Date(), 5 * 60 * 1000] }] }, "$date", null] } }  // Last 5 min for burst detection
      }},
      { $project: { recentDonations: { $filter: { input: "$recentDonations", cond: { $ne: ["$$this", null] } } } } }
    ]);

    if (patterns.length === 0) return null;
    
    const pattern = patterns[0];
    const daysSinceFirst = (Date.now() - pattern.firstDonation) / (1000 * 60 * 60 * 24);
    const avgFrequencyDays = daysSinceFirst / pattern.totalDonations;
    
    return {
      ...pattern,
      avgFrequencyDays,
      consistencyScore: pattern.completedTransactions / pattern.totalDonations,
      trustScore: Math.max(0, 1 - pattern.avgFraudScore),
      burstCount: pattern.recentDonations.length  // For fraud: donations in last 5 min
    };
  }

  // FULL FRAUD DETECTION ALGORITHM (Working Example - Called in processTransaction)
  async detectFraud(transactionData, nonprofitId) {
    let fraudScore = 0;
    let reasons = [];
    const pattern = await this.getDonorPattern(nonprofitId);
    
    if (!pattern) {
      fraudScore = 0.5;  // New donor: moderate risk
      reasons.push('New donor - limited history');
      return { fraudScore, reasons, status: 'under_review' };
    }

    // Rule 1: Amount Outlier ( >3x avg or <0.1x min)
    const amountDeviation = Math.abs(transactionData.amount - pattern.avgAmount) / pattern.avgAmount;
    if (amountDeviation > 3 || transactionData.amount < 0.1 * pattern.minAmount) {
      fraudScore += 0.4;
      reasons.push(`Amount outlier: ${amountDeviation.toFixed(2)}x deviation`);
    }

    // Rule 2: Burst Attack (>3 donations in 5 min)
    if (pattern.burstCount >= 3) {
      fraudScore += 0.3;
      reasons.push(`Suspicious frequency: ${pattern.burstCount} donations in last 5 min`);
    }

    // Rule 3: Wallet History (Low donations = higher risk)
    if (pattern.totalDonations < 5) {
      fraudScore += 0.2;
      reasons.push('Low wallet history');
    }

    // Rule 4: Time Pattern (Odd hours: 2-5 AM UTC)
    const hour = new Date(transactionData.date || Date.now()).getUTCHours();
    if (hour >= 2 && hour <= 5) {
      fraudScore += 0.25;
      reasons.push('Unusual donation time');
    }

    // Rule 5: Deviation from StdDev
    if (pattern.stdDevAmount && Math.abs(transactionData.amount - pattern.avgAmount) > 2 * pattern.stdDevAmount) {
      fraudScore += 0.15;
      reasons.push('Beyond 2 std dev from average');
    }

    // Trust Adjustment (from verification)
    const trust = await VerificationService.calculateTrustScore({});  // Mock; integrate real IRS
    fraudScore += (1 - trust) * 0.1;
    reasons.push(`Trust adjustment: ${trust.toFixed(2)}`);

    // Final Status
    let status = 'completed';
    if (fraudScore > 0.7) status = 'blocked';
    else if (fraudScore > 0.4) status = 'flagged';

    fraudScore = Math.min(1, Math.max(0, fraudScore));  // Clamp 0-1
    return { fraudScore, reasons, status };
  }

  // Enhanced fraud scoring (calls detectFraud)
  async calculateAdvancedFraudScore(transaction, nonprofitId) {
    const fraudResult = await this.detectFraud(transaction, nonprofitId);
    return fraudResult.fraudScore;
  }

  // Donor analytics endpoint data (enhanced with fraud insights)
  async getDonorAnalytics(nonprofitId) {
    const pattern = await this.getDonorPattern(nonprofitId);
    const recentTransactions = await Transaction.find({ nonprofit: nonprofitId })
      .sort({ date: -1 })
      .limit(12);
    
    // Fraud demo: Check recent for flags
    const flaggedRecent = recentTransactions.filter(tx => tx.status === 'flagged').length;
    const riskLevel = flaggedRecent > 0 ? 'high' : this.assessRiskLevel(pattern?.avgFraudScore || 0.5);

    return {
      donorProfile: pattern,
      recentActivity: recentTransactions,
      riskAssessment: riskLevel,
      fraudAlerts: flaggedRecent,
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
    // Fraud insight example
    const flagged = transactions.filter(t => t.status === 'flagged').length;
    if (flagged > 0) {
      insights.push(`${flagged} flagged transactions - review recommended`);
    }
    return insights;
  }
}

module.exports = new AnalyticsService();
