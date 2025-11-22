'use strict';

jest.mock('../../models/Transaction');
jest.mock('../../models/Nonprofit');
jest.mock('../../services/verificationService', () => ({
  calculateTrustScore: jest.fn().mockReturnValue(0.5),
}));

const analyticsService = require('../../services/analyticsService');

describe('AnalyticsService — pure logic', () => {
  describe('assessRiskLevel', () => {
    it('returns low for avgFraudScore < 0.3', () => {
      expect(analyticsService.assessRiskLevel(0.0)).toBe('low');
      expect(analyticsService.assessRiskLevel(0.29)).toBe('low');
    });

    it('returns medium for avgFraudScore 0.3 – 0.69', () => {
      expect(analyticsService.assessRiskLevel(0.3)).toBe('medium');
      expect(analyticsService.assessRiskLevel(0.69)).toBe('medium');
    });

    it('returns high for avgFraudScore >= 0.7', () => {
      expect(analyticsService.assessRiskLevel(0.7)).toBe('high');
      expect(analyticsService.assessRiskLevel(1.0)).toBe('high');
    });
  });

  describe('generateInsights', () => {
    it('identifies highly reliable pattern', () => {
      const pattern = { consistencyScore: 0.95, totalDonations: 15, avgFraudScore: 0.1 };
      const insights = analyticsService.generateInsights(pattern, []);
      expect(insights).toContain('Highly reliable donation pattern');
    });

    it('identifies long-term donor', () => {
      const pattern = { consistencyScore: 0.8, totalDonations: 13, avgFraudScore: 0.1 };
      const insights = analyticsService.generateInsights(pattern, []);
      expect(insights).toContain('Long-term committed donor');
    });

    it('identifies minimal fraud risk', () => {
      const pattern = { consistencyScore: 0.8, totalDonations: 5, avgFraudScore: 0.1 };
      const insights = analyticsService.generateInsights(pattern, []);
      expect(insights).toContain('Minimal fraud risk - trusted donor');
    });

    it('flags flagged transactions', () => {
      const pattern = { consistencyScore: 0.5, totalDonations: 5, avgFraudScore: 0.4 };
      const transactions = [{ status: 'flagged' }, { status: 'completed' }];
      const insights = analyticsService.generateInsights(pattern, transactions);
      expect(insights.some(i => i.includes('flagged'))).toBe(true);
    });

    it('returns empty array for null pattern', () => {
      const insights = analyticsService.generateInsights(null, []);
      expect(insights).toEqual([]);
    });
  });

  describe('detectFraud — new donor', () => {
    it('assigns moderate risk for donor with no history', async () => {
      // getDonorPattern returns null for no history
      jest.spyOn(analyticsService, 'getDonorPattern').mockResolvedValueOnce(null);

      const result = await analyticsService.detectFraud({ amount: 100 }, 'nonprofit-id');

      expect(result.fraudScore).toBe(0.5);
      expect(result.status).toBe('under_review');
      expect(result.reasons).toContain('New donor - limited history');
    });
  });

  describe('detectFraud — amount outlier', () => {
    it('flags large amount deviation', async () => {
      const pattern = {
        avgAmount: 100,
        stdDevAmount: 10,
        minAmount: 50,
        maxAmount: 200,
        totalDonations: 20,
        burstCount: 0,
        firstDonation: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        completedTransactions: 18,
      };
      jest.spyOn(analyticsService, 'getDonorPattern').mockResolvedValueOnce(pattern);

      const result = await analyticsService.detectFraud({ amount: 10000 }, 'nonprofit-id');

      expect(result.reasons.some(r => r.includes('outlier'))).toBe(true);
      expect(result.fraudScore).toBeGreaterThan(0);
    });
  });

  describe('detectFraud — burst attack', () => {
    it('flags burst of donations in 5 minutes', async () => {
      const pattern = {
        avgAmount: 100,
        stdDevAmount: 10,
        minAmount: 80,
        maxAmount: 120,
        totalDonations: 20,
        burstCount: 5,
        firstDonation: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        completedTransactions: 18,
      };
      jest.spyOn(analyticsService, 'getDonorPattern').mockResolvedValueOnce(pattern);

      const result = await analyticsService.detectFraud({ amount: 100 }, 'nonprofit-id');

      expect(result.reasons.some(r => r.includes('frequency'))).toBe(true);
    });
  });

  describe('detectFraud — score clamping', () => {
    it('clamps fraud score between 0 and 1', async () => {
      const pattern = {
        avgAmount: 100,
        stdDevAmount: 5,
        minAmount: 80,
        maxAmount: 120,
        totalDonations: 2,
        burstCount: 10,
        firstDonation: new Date(Date.now() - 1000),
        completedTransactions: 1,
      };
      jest.spyOn(analyticsService, 'getDonorPattern').mockResolvedValueOnce(pattern);

      const result = await analyticsService.detectFraud(
        { amount: 99999, date: new Date().setUTCHours(3) },
        'nonprofit-id'
      );

      expect(result.fraudScore).toBeGreaterThanOrEqual(0);
      expect(result.fraudScore).toBeLessThanOrEqual(1);
    });
  });
});
