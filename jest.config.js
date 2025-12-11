module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.js'],
  testPathIgnorePatterns: ['/node_modules/', '/web/'],
  moduleFileExtensions: ['js', 'json', 'node'],
  verbose: true
};
