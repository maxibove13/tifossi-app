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

  // Transform files - transpile TypeScript and JavaScript on the fly
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', {
      presets: [
        '@babel/preset-typescript',
        ['@babel/preset-env', { targets: { node: 'current' } }]
      ]
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }]
      ]
    }],
  },

  // Transform node_modules except those that need transpilation
  // No longer ignore /dist/ since we're using source files now
  transformIgnorePatterns: ['/node_modules/(?!(mercadopago)/)'],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Ignore patterns - no longer ignore /dist/ since tests use source
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/.cache/', '/.tmp/'],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Global variables
  globals: {
    strapi: {},
  },
};
