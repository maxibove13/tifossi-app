/**
 * Minimal Test Setup
 * Following TESTING_PRINCIPLES.md: Mock only at system boundaries
 */

// Set default test timeout for jsdom tests
jest.setTimeout(5000);

// Load test environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

import '@testing-library/jest-native/extend-expect';
import { cleanup } from '@testing-library/react-native';
import { TextEncoder, TextDecoder } from 'util';

// Setup custom matchers for domain-specific assertions
import { setupCustomMatchers } from './utils/custom-matchers';

// Load .env.test file for test environment
config({ path: resolve(__dirname, '../../.env.test') });

// Polyfill fetch for Node.js environment (needed for MercadoPago integration tests)
// Use whatwg-fetch polyfill for Jest environment
if (typeof global.fetch === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('whatwg-fetch');
  } catch {
    // Fallback: Use a minimal fetch implementation that throws a helpful error
    global.fetch = (() => {
      throw new Error(
        'fetch is not available. Install whatwg-fetch or node-fetch to run integration tests.'
      );
    }) as any;
  }
}

// Provide default API endpoints for tests
process.env['EXPO_PUBLIC_API_BASE_URL'] =
  process.env['EXPO_PUBLIC_API_BASE_URL'] || 'http://localhost:1337';
process.env['EXPO_PUBLIC_BACKEND_URL'] =
  process.env['EXPO_PUBLIC_BACKEND_URL'] || 'http://localhost:1337';
process.env['EXPO_PUBLIC_API_URL'] =
  process.env['EXPO_PUBLIC_API_URL'] || 'http://localhost:1337/api';

// Ensure authService is mocked before any store modules load it
jest.mock('../_services/auth/authService', () => {
  const authModule = {
    initialize: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
    loginWithApple: jest.fn(),
    logout: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    changePassword: jest.fn(),
    validateToken: jest.fn(),
    onAuthStateChanged: jest.fn(() => jest.fn()),
    getApiToken: jest.fn(),
    resendVerificationEmail: jest.fn(),
    verifyEmail: jest.fn(),
    confirmPasswordReset: jest.fn(),
    syncUserData: jest.fn(),
    getCurrentUser: jest.fn(),
    isAppleSignInAvailable: jest.fn(),
    getAppleCredentialState: jest.fn(),
    cleanup: jest.fn(),
  };

  return {
    __esModule: true,
    default: authModule,
  };
});

jest.mock('../_services/navigation/deepLinkRouter', () => ({
  initializeDeepLinkRouter: jest.fn().mockResolvedValue(undefined),
}));

// Load store utils after mocks so stores use the mocked services
const storeUtils = require('./utils/store-utils') as typeof import('./utils/store-utils');
const { resetAllStores } = storeUtils;

// Polyfills for Node environment
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Some React Native internals expect setImmediate to exist (InteractionManager)
if (typeof global.setImmediate === 'undefined') {
  // Use setTimeout as a minimal polyfill for the jsdom environment
  global.setImmediate = ((callback: (...args: any[]) => void, ...args: any[]): NodeJS.Immediate => {
    return setTimeout(() => callback(...args), 0) as unknown as NodeJS.Immediate;
  }) as typeof setImmediate;
}

// Mock only what MUST be mocked for React Native environment
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(() => null),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Mock SafeAreaContext - native module that requires device context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  const defaultInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  const defaultFrame = { x: 0, y: 0, width: 390, height: 844 };

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, { testID: 'safe-area-provider' }, children),
    SafeAreaView: ({ children, ...props }: any) =>
      React.createElement(View, { ...props, testID: 'safe-area-view' }, children),
    useSafeAreaInsets: () => defaultInsets,
    useSafeAreaFrame: () => defaultFrame,
    SafeAreaInsetsContext: {
      Consumer: ({ children }: { children: (insets: any) => React.ReactNode }) =>
        children(defaultInsets),
      Provider: ({ children }: { children: React.ReactNode }) => children,
    },
    initialWindowMetrics: {
      insets: defaultInsets,
      frame: defaultFrame,
    },
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock Firebase at the boundary
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(() => () => {}),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
  updatePassword: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn(),
  },
  reauthenticateWithCredential: jest.fn(),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

// Mock React Native Firebase (modular API)
const mockAuth = {
  currentUser: null,
};

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  getAuth: jest.fn(() => mockAuth),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(() => () => {}),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
  updatePassword: jest.fn(),
  sendEmailVerification: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  getIdToken: jest.fn(),
  signInWithCredential: jest.fn(),
  applyActionCode: jest.fn(),
  verifyPasswordResetCode: jest.fn(),
  confirmPasswordReset: jest.fn(),
  GoogleAuthProvider: {
    credential: jest.fn(),
  },
  AppleAuthProvider: {
    credential: jest.fn(),
  },
  EmailAuthProvider: {
    credential: jest.fn(),
  },
  FirebaseAuthTypes: {
    User: {},
  },
}));

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: {
    apps: [],
    initializeApp: jest.fn(),
  },
}));

jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
  AppleAuthenticationResponseType: {
    ID_TOKEN: 0,
  },
  AppleAuthenticationCredentialState: {
    AUTHORIZED: 1,
    NOT_FOUND: 0,
    REVOKED: 2,
  },
}));

// Mock HTTP client directly for more reliable testing
jest.mock('../_services/api/httpClient', () => {
  const { productMockData } = require('../_tests/mocks/data/products');

  // Transform mock data to Strapi v5 format (flat structure, no attributes wrapper)
  const transformMockToStrapi = (mockProduct: any): any => {
    const attrs = mockProduct.attributes;

    return {
      id: parseInt(mockProduct.id),
      documentId: `doc-${mockProduct.id}`,
      title: attrs.name,
      price: attrs.price,
      discountedPrice: attrs.discountPrice,
      isCustomizable: false,
      warranty: '12 meses',
      returnPolicy: '30 días para cambios y devoluciones',
      shortDescription: attrs.shortDescription,
      longDescription: attrs.longDescription,
      createdAt: attrs.createdAt,
      updatedAt: attrs.updatedAt,
      publishedAt: attrs.createdAt,
      category: {
        id: 1,
        slug: attrs.category,
        name: attrs.category.charAt(0).toUpperCase() + attrs.category.slice(1),
      },
      model: {
        id: 1,
        slug: `model-${attrs.team}`,
        name: `Modelo ${attrs.team}`,
      },
      statuses: [
        ...(attrs.featured ? [{ id: 1, name: 'FEATURED', priority: 1 }] : []),
        ...(attrs.isNew ? [{ id: 2, name: 'NEW', priority: 2 }] : []),
      ],
      frontImage: attrs.images.data[0]
        ? {
            id: parseInt(attrs.images.data[0].id),
            url: attrs.images.data[0].attributes.url,
            alternativeText: attrs.images.data[0].attributes.alternativeText,
          }
        : null,
      images: attrs.images.data.map((img: any) => ({
        id: parseInt(img.id),
        url: img.attributes.url,
        alternativeText: img.attributes.alternativeText,
      })),
      colors: attrs.colors.map((color: string, index: number) => ({
        id: index + 1,
        colorName: color,
        quantity: 25 + index,
        hex: '#000000',
        mainImage: attrs.images.data[0]
          ? {
              id: parseInt(attrs.images.data[0].id),
              url: attrs.images.data[0].attributes.url,
            }
          : null,
        additionalImages: attrs.images.data.slice(1).map((img: any) => ({
          id: parseInt(img.id),
          url: img.attributes.url,
        })),
      })),
      sizes: attrs.sizes.map((size: string, index: number) => ({
        id: index + 1,
        name: size,
        isActive: true,
      })),
      dimensions: {
        height: '30cm',
        width: '20cm',
        depth: '2cm',
      },
    };
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

  const defaultAddressStore = [
    {
      id: 0,
      firstName: 'Juan',
      lastName: 'Pérez',
      addressLine1: 'Avenida 18 de Julio 1234',
      addressLine2: '4A',
      city: 'Centro',
      state: 'Montevideo',
      country: 'UY',
      postalCode: '11100',
      phoneNumber: '+598 099 123 456',
      isDefault: true,
      type: 'shipping',
    },
    {
      id: 1,
      firstName: 'Ana',
      lastName: 'Gómez',
      addressLine1: 'Rambla República de México 5678',
      city: 'Pocitos',
      state: 'Montevideo',
      country: 'UY',
      postalCode: '11300',
      phoneNumber: '+598 098 765 432',
      isDefault: false,
      type: 'shipping',
    },
    {
      id: 2,
      firstName: 'Pedro',
      lastName: 'López',
      addressLine1: 'Avenida Italia 3456',
      city: 'Parque Batlle',
      state: 'Montevideo',
      country: 'UY',
      postalCode: '11600',
      phoneNumber: '+598 097 111 222',
      isDefault: false,
      type: 'shipping',
    },
  ];

  let addressStore = deepClone(defaultAddressStore);
  let addressScenario = 'default';

  let shouldError = false;
  let errorForEndpoint: string | null = null;

  const matchesAddressEndpoint = (url: string) => url.startsWith('/user-profile/me/addresses');
  const resetAddressStore = () => {
    addressStore = deepClone(defaultAddressStore);
    addressScenario = 'default';
  };

  const listAddresses = () => {
    if (addressScenario === 'empty') {
      return [];
    }
    return deepClone(addressStore);
  };

  const findAddressByIndex = (index: number) => {
    return addressStore[index];
  };

  const mutateDefaultAddress = (index: number) => {
    addressStore = addressStore.map((address, idx) => ({
      ...address,
      isDefault: idx === index,
    }));
  };

  const shouldSimulateError = (url: string): boolean => {
    if (shouldError && (errorForEndpoint === null || url.includes(errorForEndpoint))) {
      return true;
    }

    if (addressScenario === 'error' && matchesAddressEndpoint(url)) {
      return true;
    }

    return false;
  };

  const getHandler = jest.fn().mockImplementation(async (url: string): Promise<any> => {
    await delay(10);

    if (shouldSimulateError(url)) {
      throw new Error('Mock HTTP error');
    }

    if (url === '/products') {
      const strapiProducts = productMockData.map(transformMockToStrapi);
      return {
        data: strapiProducts,
        meta: {
          pagination: {
            page: 1,
            pageSize: 25,
            pageCount: 1,
            total: strapiProducts.length,
          },
        },
      };
    }

    if (url.startsWith('/products/')) {
      const productId = url.split('/')[2];
      const product = productMockData.find((p: any) => p.id === productId);

      if (!product) {
        throw new Error('Product not found');
      }

      return {
        data: transformMockToStrapi(product),
      };
    }

    // httpClient.get returns response.data unwrapped, so return data directly
    if (url === '/user-profile/me/addresses') {
      return listAddresses();
    }

    if (url.startsWith('/user-profile/me/addresses/')) {
      const parts = url.split('/');
      const addressIndex = parseInt(parts[4], 10);
      const address = findAddressByIndex(addressIndex);

      if (!address) {
        throw new Error('Address not found');
      }

      return deepClone(address);
    }

    return { data: [] };
  });

  const postHandler = jest
    .fn()
    .mockImplementation(async (url: string, data?: any): Promise<any> => {
      await delay(10);

      if (shouldSimulateError(url)) {
        throw new Error('Mock HTTP error');
      }

      // httpClient.post returns response.data unwrapped
      if (url === '/user-profile/me/addresses') {
        const newIndex = addressStore.length;
        const newAddress = {
          ...data,
          id: newIndex,
        };

        addressStore = [...addressStore, newAddress];

        if (newAddress.isDefault) {
          mutateDefaultAddress(newIndex);
        }

        return deepClone(newAddress);
      }

      if (url === '/cart/migrate') {
        const mergedItems = Array.isArray(data?.guestItems) ? data.guestItems : [];
        return {
          mergedItems,
        };
      }

      if (url === '/orders') {
        // Mock order creation for payment integration tests
        const mockOrder = {
          id: `order-mock-${Date.now()}`,
          orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
          items: data?.items || [],
          shippingAddress: data?.shippingAddress,
          shippingMethod: data?.shippingMethod || 'delivery',
          shippingCost: data?.shippingCost || 0,
          subtotal: data?.subtotal || 0,
          discount: data?.discount || 0,
          total: data?.total || 0,
          status: 'pending_payment',
          createdAt: new Date().toISOString(),
        };
        return {
          data: mockOrder,
        };
      }

      return { data: {} };
    });

  const putHandler = jest.fn().mockImplementation(async (url: string, data?: any): Promise<any> => {
    await delay(10);

    if (shouldSimulateError(url)) {
      throw new Error('Mock HTTP error');
    }

    // httpClient.put returns response.data unwrapped
    if (url.endsWith('/default')) {
      const parts = url.split('/');
      const addressIndex = parseInt(parts[4], 10);
      mutateDefaultAddress(addressIndex);

      return listAddresses();
    }

    if (matchesAddressEndpoint(url)) {
      const parts = url.split('/');
      const addressIndex = parseInt(parts[4], 10);
      const existing = findAddressByIndex(addressIndex);

      if (!existing) {
        throw new Error('Address not found');
      }

      const updated = {
        ...existing,
        ...data,
      };

      addressStore = addressStore.map((address, idx) => (idx === addressIndex ? updated : address));

      if (updated.isDefault) {
        mutateDefaultAddress(addressIndex);
      }

      return deepClone(updated);
    }

    return { data: {} };
  });

  const deleteHandler = jest.fn().mockImplementation(async (url: string): Promise<any> => {
    await delay(10);

    if (shouldSimulateError(url)) {
      throw new Error('Mock HTTP error');
    }

    if (matchesAddressEndpoint(url)) {
      const parts = url.split('/');
      const addressIndex = parseInt(parts[4], 10);

      addressStore = addressStore.filter((_, idx) => idx !== addressIndex);

      // Re-index the addresses after deletion
      addressStore = addressStore.map((addr, idx) => ({ ...addr, id: idx }));

      if (!addressStore.some((address) => address.isDefault) && addressStore.length > 0) {
        mutateDefaultAddress(0);
      }

      return { success: true };
    }

    return { data: {} };
  });

  const controlMethods = {
    __setError: (error: boolean, endpoint?: string): void => {
      shouldError = error;
      errorForEndpoint = endpoint || null;
    },
    __setAddressScenario: (scenario: string): void => {
      addressScenario = scenario;
      if (scenario === 'default') {
        addressStore = deepClone(defaultAddressStore);
      }
      if (scenario === 'empty') {
        addressStore = [];
      }
    },
    __setMockAddresses: (addresses: any[]): void => {
      addressScenario = 'custom';
      addressStore = deepClone(addresses);
    },
    __getMockAddresses: () => {
      return listAddresses();
    },
    __resetAddressMock: (): void => {
      shouldError = false;
      errorForEndpoint = null;
      resetAddressStore();
    },
  } as const;

  const httpApi = {
    get: getHandler,
    post: postHandler,
    put: putHandler,
    patch: jest.fn(),
    delete: deleteHandler,
  };

  const defaultExport = {
    ...httpApi,
    ...controlMethods,
  };

  const secondaryExport = {
    ...httpApi,
    ...controlMethods,
  };

  return {
    __esModule: true,
    default: defaultExport,
    httpClient: secondaryExport,
  };
});

// Mock Expo modules - commented out as not used in current tests
// Uncomment if needed for future tests that use image picker
// jest.mock('expo-image-picker', () => ({
//   launchImageLibraryAsync: jest.fn(),
//   MediaTypeOptions: { Images: 'Images' },
//   requestMediaLibraryPermissionsAsync: jest.fn(() => ({ granted: true })),
// }));

jest.mock('expo-linking', () => ({
  openURL: jest.fn(),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  }),
  useLocalSearchParams: jest.fn(() => ({})),
  useGlobalSearchParams: jest.fn(() => ({})),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  },
  Link: ({ children }: any) => children,
  Stack: {
    Screen: ({ children }: any) => children,
  },
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn((component) => component),
    Directions: {},
  };
});

// Mock React Native SVG
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');

  const mockSvgComponent = (name: string) => {
    const component = React.forwardRef((props: any, ref: any) =>
      React.createElement(View, { ...props, ref, testID: `${name}-mock` })
    );
    component.displayName = `Mock${name}`;
    return component;
  };

  return {
    default: mockSvgComponent('Svg'),
    Svg: mockSvgComponent('Svg'),
    Circle: mockSvgComponent('Circle'),
    Ellipse: mockSvgComponent('Ellipse'),
    G: mockSvgComponent('G'),
    Text: mockSvgComponent('SvgText'),
    TSpan: mockSvgComponent('TSpan'),
    TextPath: mockSvgComponent('TextPath'),
    Path: mockSvgComponent('Path'),
    Polygon: mockSvgComponent('Polygon'),
    Polyline: mockSvgComponent('Polyline'),
    Line: mockSvgComponent('Line'),
    Rect: mockSvgComponent('Rect'),
    Use: mockSvgComponent('Use'),
    Image: mockSvgComponent('SvgImage'),
    Symbol: mockSvgComponent('Symbol'),
    Defs: mockSvgComponent('Defs'),
    LinearGradient: mockSvgComponent('LinearGradient'),
    RadialGradient: mockSvgComponent('RadialGradient'),
    Stop: mockSvgComponent('Stop'),
    ClipPath: mockSvgComponent('ClipPath'),
    Pattern: mockSvgComponent('Pattern'),
    Mask: mockSvgComponent('Mask'),
  };
});

// Silence console during tests
const originalError: typeof console.error = console.error;
beforeAll(() => {
  console.error = (...args: any[]): void => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') ||
        args[0].includes('Not implemented') ||
        args[0].includes('VirtualizedLists'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

afterEach(() => {
  cleanup();
});

// Setup custom matchers for Jest
setupCustomMatchers();

// Setup global test utilities
beforeEach(() => {
  // Reset all Zustand stores to initial state before each test
  resetAllStores();

  // Clear all mocks
  jest.clearAllMocks();
});

// Export test utilities for other tests to use
export const resetAllMocks = (): void => {
  jest.clearAllMocks();
};
