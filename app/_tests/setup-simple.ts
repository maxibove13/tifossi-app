/**
 * Simple Test Setup
 *
 * Minimal test configuration that focuses on testing React Native components
 * without complex mocking or MSW setup.
 */

import '@testing-library/jest-native/extend-expect';

// Mock React Native modules that cause issues in tests
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Expo modules
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Stack: {
    Screen: ({ children }: { children: React.ReactNode }) => children,
  },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock MMKV storage
const mockStorage = new Map<string, string>();
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn().mockImplementation((key: string, value: string) => mockStorage.set(key, value)),
    getString: jest.fn().mockImplementation((key: string) => mockStorage.get(key) || null),
    getNumber: jest.fn().mockImplementation((key: string) => {
      const value = mockStorage.get(key);
      return value ? Number(value) : undefined;
    }),
    getBoolean: jest.fn().mockImplementation((key: string) => {
      const value = mockStorage.get(key);
      return value ? JSON.parse(value) : undefined;
    }),
    contains: jest.fn().mockImplementation((key: string) => mockStorage.has(key)),
    delete: jest.fn().mockImplementation((key: string) => mockStorage.delete(key)),
    clearAll: jest.fn().mockImplementation(() => mockStorage.clear()),
  })),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Firebase
jest.mock('../_config/firebase', () => ({
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  },
}));

// Mock alerts
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Global test utilities
global.console = {
  ...console,
  warn: jest.fn(), // Suppress console.warn in tests
};

// Set up fake timers by default
beforeEach(() => {
  jest.useFakeTimers();
  // Clear storage between tests
  mockStorage.clear();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});
