'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'models/**/*.js',
    '!**/node_modules/**',
  ],
  setupFiles: ['<rootDir>/tests/setup.js'],
  testTimeout: 15000,
};
