/** @type {import('jest').Config} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: '<rootDir>/e2e/globalSetup.js',
  globalTeardown: '<rootDir>/e2e/globalTeardown.js',
  setupFilesAfterEnv: ['<rootDir>/e2e/init.js'],
  testEnvironment: 'node',
  verbose: true,
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './e2e/reports',
        filename: 'e2e-report.html',
        openReport: false,
        pageTitle: 'Tifossi E2E Test Report',
      },
    ],
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/e2e/**',
  ],
  coverageDirectory: '<rootDir>/e2e/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
        ],
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(@react-native|react-native|@expo|expo-.*)/)'],
};
