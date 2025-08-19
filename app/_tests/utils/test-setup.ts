/**
 * Additional Test Setup Utilities
 * Extended setup for specific testing scenarios
 */

import { ReactTestInstance } from 'react-test-renderer';
import { RenderAPI } from '@testing-library/react-native';

// Custom testing utilities
export interface CustomTestUtils {
  findByTestId: (testId: string) => ReactTestInstance;
  queryByTestId: (testId: string) => ReactTestInstance | null;
  findAllByTestId: (testId: string) => ReactTestInstance[];
}

// Mock navigation helpers
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => false),
  getId: jest.fn(() => 'test-id'),
  getParent: jest.fn(),
  getState: jest.fn(() => ({
    key: 'test-key',
    index: 0,
    routeNames: ['Test'],
    routes: [{ key: 'test-route', name: 'Test' }],
  })),
  setParams: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
};

// Mock route object
export const mockRoute = {
  key: 'test-key',
  name: 'Test',
  params: {},
};

// Performance measurement utilities
export const performanceHelpers = {
  startMeasure: (name: string) => {
    performance.mark(`${name}-start`);
  },
  endMeasure: (name: string) => {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  },
  getMeasurements: (name: string) => {
    return performance.getEntriesByName(name, 'measure');
  },
  clearMeasurements: () => {
    performance.clearMarks();
    performance.clearMeasures();
  },
};

// Animation testing helpers
export const animationHelpers = {
  flushMicrotasksQueue: () => {
    return new Promise((resolve) => setImmediate(resolve));
  },
  advanceTimersByTime: (time: number) => {
    jest.advanceTimersByTime(time);
  },
  runAllTimers: () => {
    jest.runAllTimers();
  },
  useRealTimers: () => {
    jest.useRealTimers();
  },
  useFakeTimers: () => {
    jest.useFakeTimers();
  },
};

// Store testing helpers
export const storeTestHelpers = {
  createMockStore: (initialState: any = {}) => ({
    getState: jest.fn(() => initialState),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    replaceReducer: jest.fn(),
  }),

  mockZustandStore: (initialState: any = {}) => {
    const state = { ...initialState };
    return {
      ...state,
      setState: jest.fn((updater) => {
        if (typeof updater === 'function') {
          Object.assign(state, updater(state));
        } else {
          Object.assign(state, updater);
        }
      }),
      getState: jest.fn(() => state),
      subscribe: jest.fn(),
      destroy: jest.fn(),
    };
  },
};

// API testing helpers
export const apiTestHelpers = {
  createMockResponse: (data: any, status = 200, ok = true) => ({
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    ok,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(),
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
  }),

  mockFetchSuccess: (data: any) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(apiTestHelpers.createMockResponse(data));
  },

  mockFetchError: (error: string, status = 500) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      apiTestHelpers.createMockResponse({ error }, status, false)
    );
  },

  mockFetchNetworkError: () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));
  },
};

// Accessibility testing helpers
export const accessibilityHelpers = {
  checkAccessibilityProps: (element: ReactTestInstance) => {
    const props = element.props;
    return {
      hasAccessibilityLabel: !!props.accessibilityLabel,
      hasAccessibilityHint: !!props.accessibilityHint,
      hasAccessibilityRole: !!props.accessibilityRole,
      hasTestID: !!props.testID,
      isAccessible: props.accessible !== false,
    };
  },

  findElementsWithoutAccessibility: (rendered: RenderAPI) => {
    // This would need to be implemented based on specific requirements
    // Returns elements that might need accessibility improvements
    return [];
  },
};

// Component testing helpers
export const componentTestHelpers = {
  triggerPress: async (element: ReactTestInstance) => {
    const onPress = element.props.onPress;
    if (onPress) {
      await onPress();
    }
  },

  triggerLongPress: async (element: ReactTestInstance) => {
    const onLongPress = element.props.onLongPress;
    if (onLongPress) {
      await onLongPress();
    }
  },

  changeText: async (element: ReactTestInstance, text: string) => {
    const onChangeText = element.props.onChangeText;
    if (onChangeText) {
      await onChangeText(text);
    }
  },

  submitEditing: async (element: ReactTestInstance) => {
    const onSubmitEditing = element.props.onSubmitEditing;
    if (onSubmitEditing) {
      await onSubmitEditing({ nativeEvent: { text: element.props.value || '' } });
    }
  },
};

// Error boundary testing helpers
export const errorBoundaryHelpers = {
  throwError: (error: Error) => {
    // Simulate a component error
    throw error;
  },

  createErrorComponent: (shouldThrow = true) => {
    return () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return null;
    };
  },
};

// Test data generators
export const testDataGenerators = {
  generateProduct: (overrides: any = {}) => ({
    id: 'test-product-1',
    name: 'Test Product',
    price: 99.99,
    description: 'Test product description',
    imageUrl: 'https://test.com/image.jpg',
    category: 'test-category',
    inStock: true,
    ...overrides,
  }),

  generateUser: (overrides: any = {}) => ({
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'https://test.com/avatar.jpg',
    ...overrides,
  }),

  generateOrder: (overrides: any = {}) => ({
    id: 'test-order-1',
    userId: 'test-user-1',
    items: [testDataGenerators.generateProduct()],
    total: 99.99,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides,
  }),
};

// Wait for async operations
export const waitForAsync = async (timeout = 1000) => {
  return new Promise((resolve) => setTimeout(resolve, timeout));
};

// Setup and teardown helpers
export const testLifecycleHelpers = {
  setupTest: () => {
    // Common setup logic
    jest.clearAllMocks();
    performanceHelpers.clearMeasurements();
  },

  teardownTest: () => {
    // Common cleanup logic
    jest.clearAllTimers();
    jest.clearAllMocks();
  },
};
