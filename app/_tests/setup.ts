/**
 * Enhanced Test Setup for Tifossi App
 * This file contains comprehensive setup code for Jest tests
 * It is not a test file itself
 * @jest-environment jsdom
 */

import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Polyfills for MSW
import { TextEncoder, TextDecoder } from 'util';

// Mock AsyncStorage for testing
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock Dimensions
import { Dimensions } from 'react-native';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Start MSW server for tests (optional - skip if MSW not available)
try {
  const { mswHelpers } = require('./utils/msw-setup');
  beforeAll(() => {
    mswHelpers.startServer();
  });

  afterAll(() => {
    mswHelpers.stopServer();
  });
} catch (error) {
  console.warn('MSW setup skipped - MSW not available for tests');
}
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock MMKV for testing
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    contains: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(() => []),
  })),
}));

// Mock fetch with enhanced capabilities
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
  } as unknown as Response)
);

// Enhanced react-native-reanimated mock
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  // Add additional mock functions
  Reanimated.default.call = jest.fn();
  Reanimated.default.createAnimatedComponent = jest.fn((component) => component);
  Reanimated.default.View = 'Animated.View';
  Reanimated.default.Text = 'Animated.Text';
  Reanimated.default.Image = 'Animated.Image';
  Reanimated.default.ScrollView = 'Animated.ScrollView';
  Reanimated.default.FlatList = 'Animated.FlatList';

  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  Swipeable: 'Swipeable',
  DrawerLayout: 'DrawerLayout',
  State: {},
  ScrollView: 'ScrollView',
  Slider: 'Slider',
  Switch: 'Switch',
  TextInput: 'TextInput',
  ToolbarAndroid: 'ToolbarAndroid',
  ViewPagerAndroid: 'ViewPagerAndroid',
  DrawerLayoutAndroid: 'DrawerLayoutAndroid',
  WebView: 'WebView',
  NativeViewGestureHandler: 'NativeViewGestureHandler',
  TapGestureHandler: 'TapGestureHandler',
  FlingGestureHandler: 'FlingGestureHandler',
  ForceTouchGestureHandler: 'ForceTouchGestureHandler',
  LongPressGestureHandler: 'LongPressGestureHandler',
  PanGestureHandler: 'PanGestureHandler',
  PinchGestureHandler: 'PinchGestureHandler',
  RotationGestureHandler: 'RotationGestureHandler',
  RawButton: 'RawButton',
  BaseButton: 'BaseButton',
  RectButton: 'RectButton',
  BorderlessButton: 'BorderlessButton',
  FlatList: 'FlatList',
  gestureHandlerRootHOC: jest.fn((component) => component),
  Directions: {},
}));

// Mock expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      name: 'Tifossi',
      slug: 'tifossi',
    },
    appOwnership: 'standalone',
    platform: {
      ios: {
        platform: 'ios',
      },
    },
  },
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
}));

jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(() => Promise.resolve()),
    fromModule: jest.fn(() => ({
      downloadAsync: jest.fn(() => Promise.resolve()),
    })),
  },
}));

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(() => Promise.resolve()),
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('expo-av', () => ({
  Video: 'Video',
  Audio: {
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `exp://localhost:8081/--/${path}`),
  parse: jest.fn((url) => ({ hostname: 'localhost', path: '/' })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  }),
  useSegments: () => [''],
  usePathname: () => '/',
  useGlobalSearchParams: () => ({}),
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
  Link: 'Link',
  Redirect: 'Redirect',
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  },
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
  Ellipse: 'Ellipse',
  G: 'G',
  Text: 'Text',
  TSpan: 'TSpan',
  TextPath: 'TextPath',
  Path: 'Path',
  Polygon: 'Polygon',
  Polyline: 'Polyline',
  Line: 'Line',
  Rect: 'Rect',
  Use: 'Use',
  Image: 'Image',
  Symbol: 'Symbol',
  Defs: 'Defs',
  LinearGradient: 'LinearGradient',
  RadialGradient: 'RadialGradient',
  Stop: 'Stop',
  ClipPath: 'ClipPath',
  Pattern: 'Pattern',
  Mask: 'Mask',
}));

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheet: 'BottomSheet',
  BottomSheetView: 'BottomSheetView',
  BottomSheetScrollView: 'BottomSheetScrollView',
  BottomSheetFlatList: 'BottomSheetFlatList',
  BottomSheetModal: 'BottomSheetModal',
  BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) => children,
  useBottomSheetDynamicSnapPoints: () => ({
    animatedHandleHeight: { value: 0 },
    animatedSnapPoints: { value: [] },
    animatedContentHeight: { value: 0 },
    handleContentLayout: jest.fn(),
  }),
}));

// Mock @ptomasroos/react-native-multi-slider
jest.mock('@ptomasroos/react-native-multi-slider', () => ({
  MultiSlider: 'MultiSlider',
}));

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock zustand
jest.mock('zustand', () => ({
  create: jest.fn((fn) => fn),
}));

// Mock fuse.js
jest.mock('fuse.js', () => {
  return jest.fn().mockImplementation(() => ({
    search: jest.fn(() => []),
    setCollection: jest.fn(),
  }));
});

// Mock react-native-country-flag
jest.mock('react-native-country-flag', () => ({
  CountryFlag: 'CountryFlag',
}));

// Silence console warnings and errors during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = (...args) => {
  if (args[0]?.includes?.('Error loading font')) return;
  if (args[0]?.includes?.('react-native-gesture-handler')) return;
  if (args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) return;
  if (args[0]?.includes?.("Warning: Can't perform a React state update")) return;
  originalConsoleError(...args);
};

console.warn = (...args) => {
  if (args[0]?.includes?.('fontFamily')) return;
  if (args[0]?.includes?.('Reanimated')) return;
  if (args[0]?.includes?.('VirtualizedLists should never be nested')) return;
  originalConsoleWarn(...args);
};

// Mock global performance for performance testing
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  getEntries: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
} as any;
jest.spyOn(Dimensions, 'get').mockReturnValue({
  width: 375,
  height: 812,
  scale: 2,
  fontScale: 1,
});

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
  isPad: false,
  isTVOS: false,
  Version: 16,
}));

// Global test timeout
jest.setTimeout(10000);

// Restore console after tests
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});
