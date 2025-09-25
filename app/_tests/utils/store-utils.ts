/**
 * Store Utilities for Testing
 *
 * This file provides utilities for working with Zustand stores in tests.
 * Following TESTING_PRINCIPLES.md:
 * - Use real stores, not mocks
 * - Reset state between tests
 * - Helper functions to set up initial store states
 */

import { act } from '@testing-library/react-native';

// Import all the stores
import { useAuthStore } from '../../_stores/authStore';
import { useCartStore } from '../../_stores/cartStore';
import { useUserStore } from '../../_stores/userStore';
import { useFavoritesStore } from '../../_stores/favoritesStore';
import { useProductStore } from '../../_stores/productStore';
import { usePaymentStore } from '../../_stores/paymentStore';

// Import types for type safety
import type { User } from '../../_types/auth';
import type { CartItem } from '../../_stores/cartStore';
import type { UserAddress, UserPreferences } from '../../_stores/userStore';
import type { Product } from '../../_types/product';

// Import test data factories
import {
  userFactory,
  cartItemFactory,
  productFactory,
  addressFactory,
  preferencesFactory,
} from './test-data';

/**
 * Type definitions for store states
 */
type AuthStoreState = ReturnType<typeof useAuthStore.getState>;
type CartStoreState = ReturnType<typeof useCartStore.getState>;
type UserStoreState = ReturnType<typeof useUserStore.getState>;
type FavoritesStoreState = ReturnType<typeof useFavoritesStore.getState>;
type ProductStoreState = ReturnType<typeof useProductStore.getState>;
type PaymentStoreState = ReturnType<typeof usePaymentStore.getState>;

/**
 * Auth Store Utilities
 */
export const authStoreUtils = {
  /**
   * Resets the auth store to its initial state
   */
  reset: (): void => {
    act(() => {
      useAuthStore.setState({
        user: null,
        token: null,
        isLoggedIn: false,
        isLoading: false,
        isInitialized: true, // Keep initialized to avoid auth initialization in tests
        status: 'idle',
        error: null,
        isChangingPassword: false,
        isUploadingProfilePicture: false,
        isVerifyingEmail: false,
      });
    });
  },

  /**
   * Sets up a logged-in user state
   */
  setupLoggedInUser: (user?: User, token = 'test-token'): User => {
    const testUser = user || userFactory.create();

    act(() => {
      useAuthStore.setState({
        user: testUser,
        token,
        isLoggedIn: true,
        isLoading: false,
        isInitialized: true,
        status: 'succeeded',
        error: null,
      });
    });

    return testUser;
  },

  /**
   * Sets up a logged-out state
   */
  setupLoggedOutUser: (): void => {
    act(() => {
      useAuthStore.setState({
        user: null,
        token: null,
        isLoggedIn: false,
        isLoading: false,
        isInitialized: true,
        status: 'idle',
        error: null,
      });
    });
  },

  /**
   * Sets up a loading auth state
   */
  setupLoadingState: (): void => {
    act(() => {
      useAuthStore.setState({
        isLoading: true,
        status: 'loading',
        error: null,
      });
    });
  },

  /**
   * Sets up an error state
   */
  setupErrorState: (error = 'Authentication failed'): void => {
    act(() => {
      useAuthStore.setState({
        isLoading: false,
        status: 'failed',
        error,
      });
    });
  },

  /**
   * Gets the current auth state
   */
  getState: (): AuthStoreState => {
    return useAuthStore.getState();
  },

  /**
   * Waits for auth state to match a condition
   */
  waitFor: async (
    predicate: (state: AuthStoreState) => boolean,
    timeout = 5000
  ): Promise<AuthStoreState> => {
    return waitForStoreCondition(useAuthStore, predicate, timeout);
  },
};

/**
 * Cart Store Utilities
 */
export const cartStoreUtils = {
  /**
   * Resets the cart store to its initial state
   */
  reset: (): void => {
    act(() => {
      useCartStore.setState({
        items: [],
        isLoading: false,
        error: null,
        isGuestCart: true,
        lastSyncTimestamp: null,
        actionStatus: 'idle',
        pendingOperations: [],
      });
    });
  },

  /**
   * Sets up a cart with items
   */
  setupWithItems: (items?: CartItem[]): CartItem[] => {
    const cartItems = items || cartItemFactory.createMany(3);

    act(() => {
      useCartStore.setState({
        items: cartItems,
        isLoading: false,
        error: null,
        actionStatus: 'idle',
      });
    });

    return cartItems;
  },

  /**
   * Sets up an empty cart
   */
  setupEmpty: (): void => {
    act(() => {
      useCartStore.setState({
        items: [],
        isLoading: false,
        error: null,
        actionStatus: 'idle',
      });
    });
  },

  /**
   * Sets up a loading cart state
   */
  setupLoadingState: (): void => {
    act(() => {
      useCartStore.setState({
        isLoading: true,
        actionStatus: 'loading',
        error: null,
      });
    });
  },

  /**
   * Sets up a cart error state
   */
  setupErrorState: (error = 'Failed to update cart'): void => {
    act(() => {
      useCartStore.setState({
        isLoading: false,
        actionStatus: 'failed',
        error,
      });
    });
  },

  /**
   * Sets up authenticated cart
   */
  setupAuthenticatedCart: (items?: CartItem[]): void => {
    const cartItems = items || [];

    act(() => {
      useCartStore.setState({
        items: cartItems,
        isGuestCart: false,
        isLoading: false,
        error: null,
      });
    });
  },

  /**
   * Gets the current cart state
   */
  getState: (): CartStoreState => {
    return useCartStore.getState();
  },

  /**
   * Waits for cart state to match a condition
   */
  waitFor: async (
    predicate: (state: CartStoreState) => boolean,
    timeout = 5000
  ): Promise<CartStoreState> => {
    return waitForStoreCondition(useCartStore, predicate, timeout);
  },
};

/**
 * User Store Utilities
 */
export const userStoreUtils = {
  /**
   * Resets the user store to its initial state
   */
  reset: (): void => {
    act(() => {
      useUserStore.setState({
        profile: null,
        preferences: preferencesFactory.create(),
        addresses: [],
        isLoading: false,
        error: null,
        actionStatus: {
          updateProfile: 'idle',
          uploadProfilePicture: 'idle',
          changePassword: 'idle',
          fetchProfile: 'idle',
        },
      });
    });
  },

  /**
   * Sets up a user profile
   */
  setupProfile: (profile?: User): User => {
    const userProfile = profile || userFactory.create();

    act(() => {
      useUserStore.setState({
        profile: userProfile,
        isLoading: false,
        error: null,
      });
    });

    return userProfile;
  },

  /**
   * Sets up user addresses
   */
  setupAddresses: (addresses?: UserAddress[]): UserAddress[] => {
    const userAddresses = addresses || addressFactory.createMany(2);

    act(() => {
      useUserStore.setState({
        addresses: userAddresses,
        isLoading: false,
        error: null,
      });
    });

    return userAddresses;
  },

  /**
   * Sets up user preferences
   */
  setupPreferences: (preferences?: UserPreferences): UserPreferences => {
    const userPrefs = preferences || preferencesFactory.create();

    act(() => {
      useUserStore.setState({
        preferences: userPrefs,
        isLoading: false,
        error: null,
      });
    });

    return userPrefs;
  },

  /**
   * Gets the current user state
   */
  getState: (): UserStoreState => {
    return useUserStore.getState();
  },

  /**
   * Waits for user state to match a condition
   */
  waitFor: async (
    predicate: (state: UserStoreState) => boolean,
    timeout = 5000
  ): Promise<UserStoreState> => {
    return waitForStoreCondition(useUserStore, predicate, timeout);
  },
};

/**
 * Favorites Store Utilities
 */
export const favoritesStoreUtils = {
  /**
   * Resets the favorites store to its initial state
   */
  reset: (): void => {
    act(() => {
      useFavoritesStore.setState({
        productIds: [],
        isLoading: false,
        error: null,
        actionStatus: 'idle',
        lastSyncTimestamp: null,
        pendingOperations: [],
      });
    });
  },

  /**
   * Sets up favorites with specific product IDs
   */
  setupWithFavorites: (productIds: string[]): void => {
    act(() => {
      useFavoritesStore.setState({
        productIds: productIds,
        isLoading: false,
        error: null,
        actionStatus: 'idle',
      });
    });
  },

  /**
   * Sets up empty favorites
   */
  setupEmpty: (): void => {
    act(() => {
      useFavoritesStore.setState({
        productIds: [],
        isLoading: false,
        error: null,
        actionStatus: 'idle',
      });
    });
  },

  /**
   * Gets the current favorites state
   */
  getState: (): FavoritesStoreState => {
    return useFavoritesStore.getState();
  },

  /**
   * Waits for favorites state to match a condition
   */
  waitFor: async (
    predicate: (state: FavoritesStoreState) => boolean,
    timeout = 5000
  ): Promise<FavoritesStoreState> => {
    return waitForStoreCondition(useFavoritesStore, predicate, timeout);
  },
};

/**
 * Product Store Utilities
 */
export const productStoreUtils = {
  /**
   * Resets the product store to its initial state
   */
  reset: (): void => {
    act(() => {
      useProductStore.setState({
        products: [],
        productCache: {},
        isLoading: false,
        error: null,
        lastFetchTimestamp: null,
        cacheExpiryTime: 30 * 60 * 1000,
        actionStatus: {
          fetchProducts: 'idle',
          fetchProductById: 'idle',
          refresh: 'idle',
        },
      });
    });
  },

  /**
   * Sets up products in the store
   */
  setupWithProducts: (products?: Product[]): Product[] => {
    const testProducts = products || productFactory.createMany(5);

    // Build product cache for quick lookups
    const productCache: Record<string, Product> = {};
    testProducts.forEach((product) => {
      productCache[product.id] = product;
    });

    act(() => {
      useProductStore.setState({
        products: testProducts,
        productCache,
        isLoading: false,
        error: null,
        lastFetchTimestamp: Date.now(),
        actionStatus: {
          fetchProducts: 'success',
          fetchProductById: 'idle',
          refresh: 'idle',
        },
      });
    });

    return testProducts;
  },

  /**
   * Gets the current product state
   */
  getState: (): ProductStoreState => {
    return useProductStore.getState();
  },

  /**
   * Waits for product state to match a condition
   */
  waitFor: async (
    predicate: (state: ProductStoreState) => boolean,
    timeout = 5000
  ): Promise<ProductStoreState> => {
    return waitForStoreCondition(useProductStore, predicate, timeout);
  },
};

/**
 * Payment Store Utilities
 */
export const paymentStoreUtils = {
  /**
   * Resets the payment store to its initial state
   */
  reset: (): void => {
    act(() => {
      usePaymentStore.setState({
        currentOrderNumber: null,
        currentOrderId: null,
        isLoading: false,
        error: null,
      });
    });
  },

  /**
   * Sets up a current order
   */
  setupCurrentOrder: (orderNumber?: string, orderId?: string): void => {
    act(() => {
      usePaymentStore.setState({
        currentOrderNumber: orderNumber || 'TEST-001',
        currentOrderId: orderId || 'order-test-id',
        isLoading: false,
        error: null,
      });
    });
  },

  /**
   * Sets up processing payment state
   */
  setupProcessingState: (): void => {
    act(() => {
      usePaymentStore.setState({
        isLoading: true,
        error: null,
      });
    });
  },

  /**
   * Gets the current payment state
   */
  getState: (): PaymentStoreState => {
    return usePaymentStore.getState();
  },

  /**
   * Waits for payment state to match a condition
   */
  waitFor: async (
    predicate: (state: PaymentStoreState) => boolean,
    timeout = 5000
  ): Promise<PaymentStoreState> => {
    return waitForStoreCondition(usePaymentStore, predicate, timeout);
  },
};

/**
 * Utility to reset all stores to their initial state
 * Useful in beforeEach test setup
 */
export const resetAllStores = (): void => {
  authStoreUtils.reset();
  cartStoreUtils.reset();
  userStoreUtils.reset();
  favoritesStoreUtils.reset();
  productStoreUtils.reset();
  paymentStoreUtils.reset();
};

/**
 * Utility to setup a complete test scenario with authenticated user and cart
 */
export const setupAuthenticatedUserWithCart = (options?: {
  user?: User;
  cartItems?: CartItem[];
  addresses?: UserAddress[];
}): {
  user: User;
  cartItems: CartItem[];
  addresses: UserAddress[];
} => {
  const user = authStoreUtils.setupLoggedInUser(options?.user);
  const cartItems = cartStoreUtils.setupWithItems(options?.cartItems);
  const addresses = userStoreUtils.setupAddresses(options?.addresses);

  // Setup authenticated cart
  cartStoreUtils.setupAuthenticatedCart(cartItems);

  // Setup user profile
  userStoreUtils.setupProfile(user);

  return { user, cartItems, addresses };
};

/**
 * Utility to setup a guest user scenario
 */
export const setupGuestUser = (
  cartItems?: CartItem[]
): {
  cartItems: CartItem[];
} => {
  authStoreUtils.setupLoggedOutUser();
  const items = cartStoreUtils.setupWithItems(cartItems);

  return { cartItems: items };
};

/**
 * Generic utility to wait for any store state to match a condition
 */
export const waitForStoreCondition = async <T>(
  useStore: { getState: () => T },
  predicate: (state: T) => boolean,
  timeout = 5000
): Promise<T> => {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkCondition = () => {
      const state = useStore.getState();

      if (predicate(state)) {
        resolve(state);
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Store condition timeout after ${timeout}ms`));
        return;
      }

      // Check again on next tick
      setTimeout(checkCondition, 10);
    };

    checkCondition();
  });
};

/**
 * Utility to wait for multiple store conditions
 */
export const waitForMultipleStoreConditions = async (
  conditions: {
    store: { getState: () => any };
    predicate: (state: any) => boolean;
    name: string;
  }[],
  timeout = 5000
): Promise<void> => {
  const promises = conditions.map(({ store, predicate, name }) =>
    waitForStoreCondition(store, predicate, timeout).catch((error) => {
      throw new Error(`${name}: ${error.message}`);
    })
  );

  await Promise.all(promises);
};

/**
 * Utility to subscribe to store changes for debugging
 */
export const debugStore = <T>(
  useStore: { getState: () => T; subscribe: (listener: (state: T) => void) => () => void },
  storeName: string,
  filter?: (state: T) => any
): (() => void) => {
  return useStore.subscribe((state) => {
    const logData = filter ? filter(state) : state;
    console.log(`[${storeName}]:`, logData);
  });
};

// Export all utilities as a single object for convenience
export const storeUtils = {
  auth: authStoreUtils,
  cart: cartStoreUtils,
  user: userStoreUtils,
  favorites: favoritesStoreUtils,
  product: productStoreUtils,
  payment: paymentStoreUtils,
  resetAll: resetAllStores,
  setupAuthenticatedUserWithCart,
  setupGuestUser,
  waitForCondition: waitForStoreCondition,
  waitForMultipleConditions: waitForMultipleStoreConditions,
  debug: debugStore,
};
