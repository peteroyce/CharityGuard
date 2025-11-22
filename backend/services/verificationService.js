'use strict';

const mongoose = require('mongoose');
const Nonprofit = require('../models/Nonprofit');

class VerificationService {
  // ── Pure helpers ─────────────────────────────────────────────────────────

  formatEIN(ein) {
    if (!ein) return '';
    const clean = ein.replace(/\D/g, '');
    if (clean.length === 9) return `${clean.substring(0, 2)}-${clean.substring(2)}`;
    return ein;
  }

  isValidEINFormat(ein) {
    if (!ein) return false;
    const clean = ein.replace(/\D/g, '');
    return clean.length === 9 && /^\d{9}$/.test(clean);
  }

  calculateTrustLevel(trustScore) {
    if (trustScore >= 0.85) return 'whitelisted';
    if (trustScore >= 0.65) return 'trusted';
    return 'new';
  }

  calculateTrustScore(orgData = {}) {
    let score = 0.5;
    if (orgData.status === '01') score += 0.15;       // active IRS status
    if (orgData.deductibility === '1') score += 0.10; // tax deductible
    if (orgData.foundation === '15') score += 0.05;   // public charity
    if (orgData.ein) score += 0.10;                   // has EIN
    if (orgData.name && orgData.city && orgData.state) score += 0.10;
    return Math.min(Math.max(score, 0), 1);
  }

  // ── IRS lookup ───────────────────────────────────────────────────────────

  async verifyEIN(ein) {
    if (!this.isValidEINFormat(ein)) {
      return {
        isValid: false,
        verificationStatus: 'rejected',
        trustLevel: 'new',
        trustScore: 0,
        irsData: null,
        error: 'Invalid EIN format — must be 9 digits',
      };
    }

    try {
      const cleanEIN = ein.replace(/\D/g, '');
      const db = mongoose.connection.db;

      if (!db) {
        return {
          isValid: true,
          verificationStatus: 'pending',
          trustLevel: 'new',
          trustScore: 0.5,
          irsData: null,
          error: 'Database unavailable — manual review required',
        };
      }

      const org = await db.collection('irsorgs').findOne({ ein: cleanEIN });

      if (!org) {
        return {
          isValid: false,
          verificationStatus: 'pending',
          trustLevel: 'new',
          trustScore: 0.3,
          irsData: null,
          error: 'EIN not found in IRS records',
        };
      }

      const trustScore = this.calculateTrustScore(org);
      const trustLevel = this.calculateTrustLevel(trustScore);

      return {
        isValid: true,
        verificationStatus: org.status === '01' ? 'verified' : 'pending',
        trustLevel,
        trustScore,
        irsData: {
          name: org.name,
          ein: this.formatEIN(cleanEIN),
          city: org.city,
          state: org.state,
          classification: org.classification,
          status: org.status,
          deductibility: org.deductibility,
          foundation: org.foundation,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        verificationStatus: 'pending',
        trustLevel: 'new',
        trustScore: 0.3,
        irsData: null,
        error: error.message,
      };
    }
  }

  // ── Trust management ─────────────────────────────────────────────────────

  async updateTrustMetrics(nonprofitId, recentTransactions = []) {
    const nonprofit = await Nonprofit.findById(nonprofitId);
    if (!nonprofit) throw new Error('Nonprofit not found');

    const total = recentTransactions.length;
    const completed = recentTransactions.filter(tx => tx.status === 'completed').length;
    const flagged = recentTransactions.filter(
      tx => tx.status === 'flagged' || tx.status === 'blocked'
    ).length;
    const avgFraudScore =
      total > 0
        ? recentTransactions.reduce((sum, tx) => sum + (tx.fraudScore || 0), 0) / total
        : 0;

    let newTrustScore = nonprofit.trustScore;

    if (total >= 10) {
      const consistencyRatio = completed / total;
      const fraudPenalty = flagged / total * 0.3;
      const fraudFactor = 1 - avgFraudScore - fraudPenalty;

      newTrustScore = Math.min(
        newTrustScore + consistencyRatio * 0.1 + fraudFactor * 0.05,
        1.0
      );

      if (avgFraudScore > 0.6 || flagged > 3) {
        newTrustScore = Math.max(newTrustScore - 0.2, 0.1);
        nonprofit.trustLevel = 'blacklisted';
      } else if (
        newTrustScore > 0.9 &&
        total > 20 &&
        consistencyRatio > 0.95 &&
        flagged === 0
      ) {
        nonprofit.trustLevel = 'whitelisted';
        nonprofit.whitelistedAt = new Date();
        nonprofit.whitelistReason = 'Excellent history, zero fraud';
      } else {
        nonprofit.trustLevel = this.calculateTrustLevel(newTrustScore);
      }
    }

    nonprofit.trustScore = newTrustScore;
    await nonprofit.save();

    return {
      trustScore: newTrustScore,
      trustLevel: nonprofit.trustLevel,
      metrics: {
        totalTransactions: total,
        completedTransactions: completed,
        flaggedTransactions: flagged,
        consistencyRatio: total > 0 ? completed / total : 0,
        avgFraudScore,
      },
    };
  }

  async addRiskFlag(nonprofitId, flagType, reason, flaggedBy = 'admin') {
    const nonprofit = await Nonprofit.findById(nonprofitId);
    if (!nonprofit) throw new Error('Nonprofit not found');
    nonprofit.addRiskFlag(flagType, reason, flaggedBy);
    await nonprofit.save();
    return nonprofit;
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getVerificationStats() {
    const Transaction = require('../models/Transaction');

    const [nonprofitStats, fraudStats] = await Promise.all([
      Nonprofit.aggregate([{ $group: { _id: '$verificationStatus', count: { $sum: 1 } } }]),
      Transaction.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const total = nonprofitStats.reduce((sum, s) => sum + s.count, 0);
    const verified = nonprofitStats.find(s => s._id === 'verified')?.count || 0;

    return {
      total,
      verified,
      pending: nonprofitStats.find(s => s._id === 'pending')?.count || 0,
      rejected: nonprofitStats.find(s => s._id === 'rejected')?.count || 0,
      suspended: nonprofitStats.find(s => s._id === 'suspended')?.count || 0,
      verificationRate: total > 0 ? ((verified / total) * 100).toFixed(2) : '0.00',
      fraudStats: fraudStats.reduce((acc, s) => {
        acc[s._id || 'unknown'] = s.count;
        return acc;
      }, {}),
    };
  }
}

module.exports = new VerificationService();
