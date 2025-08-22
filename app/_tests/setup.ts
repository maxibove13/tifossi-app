/**
 * Enhanced Test Setup for Tifossi App
 * This file contains comprehensive setup code for Jest tests
 * It is not a test file itself
 * @jest-environment jsdom
 */

import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Polyfills for MSW and modern JavaScript features
import { TextEncoder, TextDecoder } from 'util';

// Mock AsyncStorage for testing
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock React Native Dimensions early
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({
    width: 375,
    height: 812,
    scale: 2,
    fontScale: 1,
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock PixelRatio
jest.mock('react-native/Libraries/Utilities/PixelRatio', () => ({
  get: jest.fn(() => 2),
  getFontScale: jest.fn(() => 1),
  getPixelSizeForLayoutSize: jest.fn((layoutSize) => layoutSize * 2),
  roundToNearestPixel: jest.fn((layoutSize) => Math.round(layoutSize)),
}));

// Mock StyleSheet to avoid PixelRatio issues
jest.mock('react-native/Libraries/StyleSheet/StyleSheet', () => ({
  create: jest.fn((styles) => styles),
  flatten: jest.fn((style) => style),
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hairlineWidth: 1,
}));
// Set up global polyfills
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Add basic Response, Request, Headers polyfills for MSW
if (typeof global.Response === 'undefined') {
  global.Response = class MockResponse {
    body: any;
    status: number;
    statusText: string;
    ok: boolean;
    headers: any;

    constructor(body: any, init: any = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = init.headers || new Map();
    }
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }
    clone() {
      return this;
    }
  } as any;
}

if (typeof global.Request === 'undefined') {
  global.Request = class MockRequest {
    url: string;
    method: string;
    headers: any;

    constructor(input: any, init: any = {}) {
      this.url = input;
      this.method = init.method || 'GET';
      this.headers = init.headers || new Map();
    }
  } as any;
}

if (typeof global.Headers === 'undefined') {
  global.Headers = Map as any;
}

// Mock BroadcastChannel for MSW
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class MockBroadcastChannel {
    name: string;

    constructor(name: string) {
      this.name = name;
    }
    postMessage() {}
    addEventListener() {}
    removeEventListener() {}
    close() {}
  } as any;
}

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
  // MSW setup skipped - MSW not available for tests
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

// Apple authentication is mocked in individual test files when needed
// since expo-apple-authentication is not installed in all environments

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

// Mock zustand with proper implementation
jest.mock('zustand', () => ({
  create: jest.fn(() => (fn: any) => {
    const state = fn(
      jest.fn(), // setState
      jest.fn(), // getState
      { setState: jest.fn(), getState: jest.fn(), subscribe: jest.fn(), destroy: jest.fn() } // store
    );

    const hook = jest.fn(() => state) as any;
    hook.getState = jest.fn(() => state);
    hook.setState = jest.fn();
    hook.subscribe = jest.fn();
    hook.destroy = jest.fn();

    return hook;
  }),
}));

// Mock zustand/middleware/persist
jest.mock('zustand/middleware', () => ({
  persist: jest.fn((fn) => fn),
  createJSONStorage: jest.fn(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  })),
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

// Silent mock implementation for tests
console.error = jest.fn();

console.warn = jest.fn();

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
// Dimensions mock is handled above

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
  isPad: false,
  isTVOS: false,
  Version: 16,
}));

// Mock Settings
jest.mock('react-native/Libraries/Settings/Settings', () => ({
  get: jest.fn(),
  set: jest.fn(),
  watchKeys: jest.fn(),
  clearWatch: jest.fn(),
}));

// Mock TurboModuleRegistry
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: jest.fn().mockReturnValue({}),
  get: jest.fn().mockReturnValue({}),
}));

// Mock native modules that cause issues
jest.mock('react-native/Libraries/BatchedBridge/NativeModules', () => ({
  SettingsManager: {},
  DeviceInfo: {},
}));

// Mock Alert for tests
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  default: jest.fn(() => ({
    onReady: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock('@react-native-firebase/auth', () => ({
  default: jest.fn(() => ({
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
    onAuthStateChanged: jest.fn(),
    currentUser: null,
  })),
}));

// Global test timeout
jest.setTimeout(10000);

// Restore console after tests
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});
