/**
 * Jest Configuration for 0RB System
 */

module.exports = {
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'core/**/*.js',
    '!core/**/*.test.js',
    '!**/node_modules/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Module path aliases
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/core/$1',
    '^@utils/(.*)$': '<rootDir>/core/utils/$1'
  },

  // Setup files
  setupFilesAfterEnv: [],

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true
};
