import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import store types for provider setup
import { useAuthStore } from '../../_stores/authStore';
import { useCartStore } from '../../_stores/cartStore';
import { useUserStore } from '../../_stores/userStore';
import { useFavoritesStore } from '../../_stores/favoritesStore';
import { useProductStore } from '../../_stores/productStore';
import { usePaymentStore } from '../../_stores/paymentStore';

interface TestNavigatorProps {
  children: ReactElement;
}

/**
 * Test Navigator Component
 * Provides navigation context for testing components that require navigation
 * Uses a simple NavigationContainer since the app uses Expo Router
 */
const TestNavigator: React.FC<TestNavigatorProps> = ({ children }) => (
  <NavigationContainer>{children}</NavigationContainer>
);

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Whether to include navigation container in the wrapper
   * @default true
   */
  withNavigation?: boolean;

  /**
   * Whether to include QueryClient provider
   * @default true
   */
  withQueryClient?: boolean;

  /**
   * Custom QueryClient instance (creates a new one if not provided)
   */
  queryClient?: QueryClient;

  /**
   * Whether to include GestureHandlerRootView wrapper
   * @default true
   */
  withGestureHandler?: boolean;
}

/**
 * Creates a test-specific QueryClient with sensible defaults for testing
 */
const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
        staleTime: 0, // Always consider data stale in tests
        gcTime: 0, // Don't cache data in tests
      },
      mutations: {
        retry: false,
      },
    },
  });
};

/**
 * All-in-one test wrapper that includes all providers
 */
interface AllProvidersProps {
  children: ReactElement;
  withNavigation: boolean;
  withQueryClient: boolean;
  queryClient?: QueryClient;
  withGestureHandler: boolean;
}

const AllProviders: React.FC<AllProvidersProps> = ({
  children,
  withNavigation,
  withQueryClient,
  queryClient,
  withGestureHandler,
}) => {
  let component = children;

  // Wrap with navigation if requested
  if (withNavigation) {
    component = <TestNavigator>{component}</TestNavigator>;
  }

  // Wrap with QueryClient if requested
  if (withQueryClient) {
    const client = queryClient || createTestQueryClient();
    component = <QueryClientProvider client={client}>{component}</QueryClientProvider>;
  }

  // Wrap with GestureHandlerRootView if requested
  if (withGestureHandler) {
    component = <GestureHandlerRootView style={{ flex: 1 }}>{component}</GestureHandlerRootView>;
  }

  return component;
};

/**
 * Custom render function with all providers included by default
 *
 * This render function includes:
 * - NavigationContainer with test stack navigator
 * - QueryClientProvider with test-optimized settings
 * - GestureHandlerRootView for gesture support
 * - All Zustand stores (using real stores, not mocks)
 *
 * @param ui - Component to render
 * @param options - Render options
 * @returns RTL render result
 */
const customRender = (
  ui: ReactElement,
  {
    withNavigation = true,
    withQueryClient = true,
    queryClient,
    withGestureHandler = true,
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: ReactElement }) => (
    <AllProviders
      withNavigation={withNavigation}
      withQueryClient={withQueryClient}
      queryClient={queryClient}
      withGestureHandler={withGestureHandler}
    >
      {children}
    </AllProviders>
  );

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Renders a component with minimal providers (no navigation, no QueryClient)
 * Useful for testing pure UI components
 */
const renderWithoutProviders = (ui: ReactElement, options: RenderOptions = {}) => {
  return rtlRender(ui, options);
};

/**
 * Renders a component with only navigation provider
 * Useful for testing navigation-dependent components
 */
const renderWithNavigation = (ui: ReactElement) => {
  return customRender(ui, {
    withNavigation: true,
    withQueryClient: false,
    withGestureHandler: false,
  });
};

/**
 * Renders a component with only QueryClient provider
 * Useful for testing data fetching components
 */
const renderWithQueryClient = (ui: ReactElement, queryClient?: QueryClient) => {
  return customRender(ui, {
    withNavigation: false,
    withQueryClient: true,
    queryClient,
    withGestureHandler: false,
  });
};

/**
 * Store utilities for accessing store states in tests
 */
export const renderStoreUtils = {
  auth: {
    getState: () => useAuthStore.getState(),
    setState: (state: Partial<ReturnType<typeof useAuthStore.getState>>) =>
      useAuthStore.setState(state),
  },
  cart: {
    getState: () => useCartStore.getState(),
    setState: (state: Partial<ReturnType<typeof useCartStore.getState>>) =>
      useCartStore.setState(state),
  },
  user: {
    getState: () => useUserStore.getState(),
    setState: (state: Partial<ReturnType<typeof useUserStore.getState>>) =>
      useUserStore.setState(state),
  },
  favorites: {
    getState: () => useFavoritesStore.getState(),
    setState: (state: Partial<ReturnType<typeof useFavoritesStore.getState>>) =>
      useFavoritesStore.setState(state),
  },
  product: {
    getState: () => useProductStore.getState(),
    setState: (state: Partial<ReturnType<typeof useProductStore.getState>>) =>
      useProductStore.setState(state),
  },
  payment: {
    getState: () => usePaymentStore.getState(),
    setState: (state: Partial<ReturnType<typeof usePaymentStore.getState>>) =>
      usePaymentStore.setState(state),
  },
};

/**
 * Utility to wait for store updates
 * Useful when testing async store actions
 */
export const waitForStoreUpdate = async (
  storeGetter: () => any,
  predicate: (state: any) => boolean,
  timeout = 5000
): Promise<void> => {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkCondition = () => {
      if (predicate(storeGetter())) {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Store update timeout after ${timeout}ms`));
        return;
      }

      // Check again on next tick
      setTimeout(checkCondition, 10);
    };

    checkCondition();
  });
};

// Re-export everything from testing library except render
export {
  screen,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
  within,
  act,
  cleanup,
  renderHook,
  type RenderOptions,
  type RenderAPI,
} from '@testing-library/react-native';

// Export custom render as the default export
export {
  customRender as render,
  renderWithoutProviders,
  renderWithNavigation,
  renderWithQueryClient,
  createTestQueryClient,
  TestNavigator,
};
