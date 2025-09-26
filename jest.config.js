module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '<rootDir>/app/_tests/setup.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|react-native-svg|react-native-reanimated|@gorhom/bottom-sheet|@tanstack/react-query|zustand|fuse.js|expo-apple-authentication)'
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
    '!**/app/_layout.tsx',
    '!**/app/_tests/**',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 27,
      functions: 26,
      lines: 30,
      statements: 29
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: '<rootDir>/coverage',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    // Configure jsdom environment
    url: 'http://localhost:3000'
  },
  testTimeout: 5000,
  clearMocks: true,
  moduleNameMapper: {
    // App aliases
    '^@/(.*)$': '<rootDir>/app/$1',
    '^@components/(.*)$': '<rootDir>/app/_components/$1',
    '^@stores/(.*)$': '<rootDir>/app/_stores/$1',
    '^@utils/(.*)$': '<rootDir>/app/_utils/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
    '^@types/(.*)$': '<rootDir>/app/_types/$1',
    '^@config/(.*)$': '<rootDir>/app/_config/$1',
    '^@styles/(.*)$': '<rootDir>/app/_styles/$1',
    '^@common/(.*)$': '<rootDir>/app/_common/$1',
    
    // Asset mocks
    '\\.svg$': '<rootDir>/app/_tests/mocks/svg-mock.ts',
    '\\.(png|jpg|jpeg|gif|webp|bmp|ico)$': '<rootDir>/app/_tests/mocks/image-mock.ts',
    '\\.(mp4|webm|wav|mp3|m4a|aac|oga|ogg)$': '<rootDir>/app/_tests/mocks/media-mock.ts',
    
    // CSS/Style mocks (in case they're imported)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  }
};