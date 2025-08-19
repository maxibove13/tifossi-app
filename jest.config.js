module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '<rootDir>/app/_tests/setup.ts',
    '<rootDir>/app/_tests/utils/test-setup.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|react-native-svg|react-native-reanimated|@gorhom/bottom-sheet|@tanstack/react-query|zustand|fuse.js)'
  ],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/*.test.[jt]s?(x)',
    '**/app/_tests/**/*.test.[jt]s?(x)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/backend/',
    '/dist/',
    '/build/',
    '/.expo/'
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/e2e/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/.expo/**',
    '!**/app/_layout.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: '<rootDir>/coverage',
  testEnvironment: 'jsdom',
  testTimeout: 10000,
  clearMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
    '^@components/(.*)$': '<rootDir>/app/_components/$1',
    '^@stores/(.*)$': '<rootDir>/app/_stores/$1',
    '^@utils/(.*)$': '<rootDir>/app/_utils/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
    '\\.(png|jpg|jpeg|gif|svg)$': 'identity-obj-proxy'
  }
};