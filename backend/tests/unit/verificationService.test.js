'use strict';

// Mock the models and mongoose.connection — do NOT mock the entire mongoose module
// so that models/Nonprofit.js can still call new mongoose.Schema(...)
jest.mock('../../models/Nonprofit', () => ({
  findById: jest.fn(),
  aggregate: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../models/Transaction', () => ({
  aggregate: jest.fn().mockResolvedValue([]),
}));

// Patch mongoose.connection.db to be null (simulates no DB)
const mongoose = require('mongoose');
Object.defineProperty(mongoose, 'connection', {
  get: () => ({ db: null }),
});

const verificationService = require('../../services/verificationService');

describe('VerificationService — pure helpers', () => {
  describe('formatEIN', () => {
    it('formats 9-digit string to XX-XXXXXXX', () => {
      expect(verificationService.formatEIN('123456789')).toBe('12-3456789');
    });

    it('strips dashes then reformats', () => {
      expect(verificationService.formatEIN('12-3456789')).toBe('12-3456789');
    });

    it('returns empty string for null/undefined', () => {
      expect(verificationService.formatEIN(null)).toBe('');
      expect(verificationService.formatEIN(undefined)).toBe('');
      expect(verificationService.formatEIN('')).toBe('');
    });

    it('returns input unchanged when not 9 digits', () => {
      expect(verificationService.formatEIN('12345')).toBe('12345');
    });
  });

  describe('isValidEINFormat', () => {
    it('accepts valid 9-digit EIN', () => {
      expect(verificationService.isValidEINFormat('123456789')).toBe(true);
    });

    it('accepts EIN with dash', () => {
      expect(verificationService.isValidEINFormat('12-3456789')).toBe(true);
    });

    it('rejects EIN with fewer than 9 digits', () => {
      expect(verificationService.isValidEINFormat('1234567')).toBe(false);
    });

    it('rejects EIN with more than 9 digits', () => {
      expect(verificationService.isValidEINFormat('1234567890')).toBe(false);
    });

    it('rejects non-numeric input', () => {
      expect(verificationService.isValidEINFormat('ABCDEFGHI')).toBe(false);
    });

    it('rejects null/undefined', () => {
      expect(verificationService.isValidEINFormat(null)).toBe(false);
      expect(verificationService.isValidEINFormat(undefined)).toBe(false);
    });
  });

  describe('calculateTrustLevel', () => {
    it('returns whitelisted for score >= 0.85', () => {
      expect(verificationService.calculateTrustLevel(0.85)).toBe('whitelisted');
      expect(verificationService.calculateTrustLevel(1.0)).toBe('whitelisted');
    });

    it('returns trusted for score >= 0.65 and < 0.85', () => {
      expect(verificationService.calculateTrustLevel(0.65)).toBe('trusted');
      expect(verificationService.calculateTrustLevel(0.84)).toBe('trusted');
    });

    it('returns new for score < 0.65', () => {
      expect(verificationService.calculateTrustLevel(0.64)).toBe('new');
      expect(verificationService.calculateTrustLevel(0)).toBe('new');
    });
  });

  describe('calculateTrustScore', () => {
    it('returns 0.5 base score for empty object', () => {
      expect(verificationService.calculateTrustScore({})).toBe(0.5);
    });

    it('adds bonus for active IRS status', () => {
      const score = verificationService.calculateTrustScore({ status: '01' });
      expect(score).toBeGreaterThan(0.5);
    });

    it('adds bonus for tax deductibility', () => {
      const score = verificationService.calculateTrustScore({ deductibility: '1' });
      expect(score).toBeGreaterThan(0.5);
    });

    it('fully verified org scores higher than partial', () => {
      const full = verificationService.calculateTrustScore({
        status: '01',
        deductibility: '1',
        foundation: '15',
        ein: '123456789',
        name: 'Red Cross',
        city: 'DC',
        state: 'DC',
      });
      const partial = verificationService.calculateTrustScore({ status: '01' });
      expect(full).toBeGreaterThan(partial);
    });

    it('clamps output between 0 and 1', () => {
      const score = verificationService.calculateTrustScore({
        status: '01', deductibility: '1', foundation: '15',
        ein: '1', name: 'Test', city: 'NY', state: 'NY',
      });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('verifyEIN — invalid format', () => {
    it('returns invalid result for malformed EIN', async () => {
      const result = await verificationService.verifyEIN('bad-ein');
      expect(result.isValid).toBe(false);
      expect(result.verificationStatus).toBe('rejected');
      expect(result.error).toMatch(/Invalid EIN/);
    });

    it('returns pending when DB is unavailable', async () => {
      const result = await verificationService.verifyEIN('123456789');
      expect(result.isValid).toBe(true);
      expect(result.verificationStatus).toBe('pending');
      expect(result.error).toMatch(/Database unavailable/);
    });
  });
});
