/**
 * Test Setup
 * This file contains setup code for Jest tests
 * It is not a test file itself
 * @jest-environment node
 */

// Mock any global methods that might be called during tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
  } as Response)
);

// Setup for react-native-reanimated
jest.mock('react-native-reanimated', () => {
  return {
    default: {
      call: jest.fn(),
      createAnimatedComponent: jest.fn((component) => component),
      View: 'View',
      Text: 'Text',
      Image: 'Image',
    },
  };
});

// Mock the StatusBar component
jest.mock('expo-status-bar', () => ({
  StatusBar: () => 'StatusBar',
}));

// Mock expo-router hooks
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    navigate: jest.fn(),
  }),
  useSegments: () => [''],
  usePathname: () => '/',
}));

// Silence console warnings and errors during tests to keep output clean
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  if (args[0]?.includes?.('Error loading font')) return;
  if (args[0]?.includes?.('react-native-gesture-handler')) return;
  originalConsoleError(...args);
};

console.warn = (...args) => {
  if (args[0]?.includes?.('fontFamily')) return;
  if (args[0]?.includes?.('Reanimated')) return;
  originalConsoleWarn(...args);
};
