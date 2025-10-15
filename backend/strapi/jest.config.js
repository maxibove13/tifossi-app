module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/tests/smoke.test.js', // Run smoke tests first
    '**/tests/orders.test.js', // Revenue-critical order tests
    '**/tests/mercadopago-webhook.test.js', // Payment webhook tests
    // Integration tests require full Strapi instance setup
    // Uncomment when ready to run integration tests with proper Strapi mocking
    // '**/tests/health.test.js',
    // '**/tests/products.test.js',
    '**/src/**/*.test.js',
    '**/src/**/__tests__/**/*.js',
  ],

  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],

  // Module paths
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },

  // Test timeout
  testTimeout: 30000,

  // Transform files
  transform: {
    '^.+\\.(ts|js)$': 'babel-jest',
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/dist/', '/.cache/', '/.tmp/'],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Global variables
  globals: {
    strapi: {},
  },
};
