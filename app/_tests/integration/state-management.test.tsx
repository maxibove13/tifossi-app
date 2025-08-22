/**
 * State Management Integration Tests
 * Tests state management through UI behavior with real stores and services
 *
 * TESTING PHILOSOPHY:
 * - Test state through UI interactions, not directly
 * - Use REAL stores with REAL services
 * - Mock ONLY external APIs with MSW
 * - Test state persistence and hydration
 * - Focus on user-visible state changes
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import { mswServer, mswHelpers } from '../utils/msw-setup';
import { mockProduct } from '../utils/mock-data';
import { useCartStore } from '../../_stores/cartStore';
import { useFavoritesStore } from '../../_stores/favoritesStore';
import { useAuthStore } from '../../_stores/authStore';
import { http, HttpResponse } from 'msw';

// Mock MMKV storage for testing
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
    getAllKeys: jest.fn().mockImplementation(() => Array.from(mockStorage.keys())),
  })),
}));

// Test Components that interact with stores
const ProductDetailTestScreen: React.FC<{ productId: string }> = ({ productId }) => {
  const addItem = useCartStore((state) => state.addItem);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavorite = useFavoritesStore((state) => state.isFavorite(productId));
  const cartItems = useCartStore((state) => state.items);
  const actionStatus = useCartStore((state) => state.actionStatus);

  const handleAddToCart = async () => {
    await addItem({
      productId,
      quantity: 1,
      color: 'black',
      size: 'M',
    });
  };

  const handleToggleFavorite = async () => {
    await toggleFavorite(productId);
  };

  return (
    <View testID="product-detail-screen">
      <Text testID="product-title">{mockProduct.title}</Text>
      <TouchableOpacity
        testID="add-to-cart-button"
        onPress={handleAddToCart}
        accessibilityLabel="Add to Cart"
        disabled={actionStatus === 'loading'}
      >
        <Text>{actionStatus === 'loading' ? 'Adding...' : 'Add to Cart'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="favorite-button"
        onPress={handleToggleFavorite}
        accessibilityState={{ selected: isFavorite }}
      >
        <Text>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</Text>
      </TouchableOpacity>
      <Text testID="cart-count">{cartItems.length} items in cart</Text>
      {actionStatus === 'succeeded' && <Text testID="add-success">Added to cart</Text>}
      {actionStatus === 'failed' && <Text testID="add-error">Failed to add to cart</Text>}
    </View>
  );
};

const CartTestScreen: React.FC = () => {
  const cartItems = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);

  return (
    <View testID="cart-screen">
      <Text testID="cart-title">Shopping Cart</Text>
      {cartItems.length === 0 ? (
        <Text testID="empty-cart">Your cart is empty</Text>
      ) : (
        cartItems.map((item, index) => (
          <View key={`${item.productId}-${item.color}-${item.size}`} testID={`cart-item-${index}`}>
            <Text testID={`item-title-${index}`}>{mockProduct.title}</Text>
            <Text testID={`item-quantity-${index}`}>Quantity: {item.quantity}</Text>
            <TouchableOpacity
              testID={`remove-item-${index}`}
              onPress={() => removeItem(item.productId, item.color, item.size)}
            >
              <Text>Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID={`increase-quantity-${index}`}
              onPress={() =>
                updateItemQuantity(item.productId, item.color, item.size, item.quantity + 1)
              }
            >
              <Text>+</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
};

const FavoritesTestScreen: React.FC = () => {
  const favoriteIds = useFavoritesStore((state) => state.productIds);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);

  return (
    <View testID="favorites-screen">
      <Text testID="favorites-title">My Favorites</Text>
      <Text testID="favorites-count">{favoriteIds.length} items</Text>
      {favoriteIds.length === 0 ? (
        <Text testID="empty-favorites">No favorites yet</Text>
      ) : (
        favoriteIds.map((productId, index) => (
          <View key={productId} testID={`favorite-item-${index}`}>
            <Text testID={`favorite-title-${index}`}>{mockProduct.title}</Text>
            <TouchableOpacity
              testID={`remove-favorite-${index}`}
              onPress={() => removeFavorite(productId)}
            >
              <Text>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
};

const LoginTestScreen: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);

  const handleLogin = async () => {
    await login({ email, password });
  };

  const handleLogout = async () => {
    await logout();
  };

  if (isLoggedIn && user) {
    return (
      <View testID="logged-in-view">
        <Text testID="user-email">{user.email}</Text>
        <TouchableOpacity testID="logout-button" onPress={handleLogout}>
          <Text>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View testID="login-screen">
      <Text testID="login-title">Login</Text>
      <TouchableOpacity testID="email-input" onPress={() => setEmail('user@test.com')}>
        <Text>Email: {email || 'Enter email'}</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="password-input" onPress={() => setPassword('password')}>
        <Text>Password: {password || 'Enter password'}</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="login-button" onPress={handleLogin}>
        <Text>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const AppTestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <View testID="app">{children}</View>;
};

// Test utilities
const setupTest = () => {
  mockStorage.clear();
  // Reset all stores to initial state
  useCartStore.getState().clearCart();
  useFavoritesStore.setState({ productIds: [], error: null });
  useAuthStore.getState().logout();
};

const simulateAppRestart = () => {
  // Simulate app restart by clearing memory state but keeping storage
  jest.resetModules();
  // The stores will rehydrate from MMKV storage
};

describe('State Management Integration Tests', () => {
  beforeAll(() => {
    mswHelpers.startServer();
  });

  afterAll(() => {
    mswHelpers.stopServer();
  });

  beforeEach(() => {
    setupTest();
    mswHelpers.resetHandlers();
  });

  describe('Cart State Persistence', () => {
    it('should persist cart across app restarts', async () => {
      // Add items to cart
      const { getByTestId, unmount } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="1" />
        </AppTestWrapper>
      );

      await act(async () => {
        fireEvent.press(getByTestId('add-to-cart-button'));
      });

      await waitFor(() => {
        expect(getByTestId('add-success')).toBeTruthy();
      });

      expect(getByTestId('cart-count')).toHaveTextContent('1 items in cart');

      // Simulate app restart
      unmount();
      simulateAppRestart();

      // Restart app and check cart
      const { getByTestId: getRestartedTestId } = render(
        <AppTestWrapper>
          <CartTestScreen />
        </AppTestWrapper>
      );

      await waitFor(() => {
        expect(getRestartedTestId('item-title-0')).toHaveTextContent(mockProduct.title);
      });
    });

    it('should handle cart persistence with multiple items', async () => {
      const { getByTestId, unmount } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="1" />
        </AppTestWrapper>
      );

      // Add multiple items
      await act(async () => {
        fireEvent.press(getByTestId('add-to-cart-button'));
        await waitFor(() => expect(getByTestId('add-success')).toBeTruthy());

        fireEvent.press(getByTestId('add-to-cart-button'));
        await waitFor(() => expect(getByTestId('cart-count')).toHaveTextContent('2 items in cart'));
      });

      // Simulate app restart
      unmount();
      simulateAppRestart();

      // Check persisted cart
      const { getByTestId: getRestartedTestId } = render(
        <AppTestWrapper>
          <CartTestScreen />
        </AppTestWrapper>
      );

      await waitFor(() => {
        expect(getRestartedTestId('item-quantity-0')).toHaveTextContent('Quantity: 2');
      });
    });
  });

  describe('Favorites State Synchronization', () => {
    it('should sync favorites between screens', async () => {
      // Add to favorites in product screen
      const { getByTestId: getProductTestId } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="1" />
        </AppTestWrapper>
      );

      await act(async () => {
        fireEvent.press(getProductTestId('favorite-button'));
      });

      await waitFor(() => {
        expect(getProductTestId('favorite-button')).toHaveProp('accessibilityState', {
          selected: true,
        });
      });

      // Navigate to favorites tab
      const { getByTestId: getFavoritesTestId } = render(
        <AppTestWrapper>
          <FavoritesTestScreen />
        </AppTestWrapper>
      );

      // Verify appears in favorites
      await waitFor(() => {
        expect(getFavoritesTestId('favorites-count')).toHaveTextContent('1 items');
        expect(getFavoritesTestId('favorite-title-0')).toHaveTextContent(mockProduct.title);
      });

      // Remove from favorites screen
      await act(async () => {
        fireEvent.press(getFavoritesTestId('remove-favorite-0'));
      });

      await waitFor(() => {
        expect(getFavoritesTestId('empty-favorites')).toBeTruthy();
      });

      // Go back to product screen
      const { getByTestId: getUpdatedProductTestId } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="1" />
        </AppTestWrapper>
      );

      // Verify unfavorited state
      expect(getUpdatedProductTestId('favorite-button')).toHaveProp('accessibilityState', {
        selected: false,
      });
    });

    it('should handle multiple favorites synchronization', async () => {
      // Add multiple products to favorites
      const { getByTestId: getProduct1TestId } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="1" />
        </AppTestWrapper>
      );

      const { getByTestId: getProduct2TestId } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="2" />
        </AppTestWrapper>
      );

      await act(async () => {
        fireEvent.press(getProduct1TestId('favorite-button'));
        fireEvent.press(getProduct2TestId('favorite-button'));
      });

      // Check favorites screen
      const { getByTestId: getFavoritesTestId } = render(
        <AppTestWrapper>
          <FavoritesTestScreen />
        </AppTestWrapper>
      );

      await waitFor(() => {
        expect(getFavoritesTestId('favorites-count')).toHaveTextContent('2 items');
      });
    });
  });

  describe('Optimistic Updates with Rollback', () => {
    it('should handle optimistic updates with API failure rollback', async () => {
      // Setup API to fail after delay
      mswServer.use(
        http.post(
          '/api/cart/items',
          () =>
            new Promise((resolve) =>
              setTimeout(
                () => resolve(HttpResponse.json({ error: 'Out of stock' }, { status: 400 })),
                500
              )
            )
        )
      );

      const { getByTestId } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="1" />
        </AppTestWrapper>
      );

      // Add to cart (optimistic)
      await act(async () => {
        fireEvent.press(getByTestId('add-to-cart-button'));
      });

      // Should show immediately (optimistic)
      await waitFor(() => {
        expect(getByTestId('cart-count')).toHaveTextContent('1 items in cart');
      });

      // After API fails, should rollback
      await waitFor(
        () => {
          expect(getByTestId('add-error')).toBeTruthy();
          expect(getByTestId('cart-count')).toHaveTextContent('0 items in cart');
        },
        { timeout: 2000 }
      );
    });

    it('should handle successful optimistic updates', async () => {
      // API succeeds by default
      const { getByTestId } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="1" />
        </AppTestWrapper>
      );

      await act(async () => {
        fireEvent.press(getByTestId('add-to-cart-button'));
      });

      // Should show immediately and remain after API success
      await waitFor(() => {
        expect(getByTestId('add-success')).toBeTruthy();
        expect(getByTestId('cart-count')).toHaveTextContent('1 items in cart');
      });
    });
  });

  describe('Auth State Management', () => {
    it('should maintain auth state across navigation', async () => {
      // Login
      const { getByTestId: getLoginTestId } = render(
        <AppTestWrapper>
          <LoginTestScreen />
        </AppTestWrapper>
      );

      await act(async () => {
        fireEvent.press(getLoginTestId('email-input'));
        fireEvent.press(getLoginTestId('password-input'));
        fireEvent.press(getLoginTestId('login-button'));
      });

      // Verify logged in
      await waitFor(() => {
        expect(getLoginTestId('user-email')).toHaveTextContent('user@test.com');
      });

      // Navigate through app (simulate navigation by rendering different screens)
      const { getByTestId: getCartTestId } = render(
        <AppTestWrapper>
          <CartTestScreen />
        </AppTestWrapper>
      );

      const { getByTestId: getProfileTestId } = render(
        <AppTestWrapper>
          <LoginTestScreen />
        </AppTestWrapper>
      );

      // Verify still logged in
      expect(getProfileTestId('user-email')).toHaveTextContent('user@test.com');

      // Logout
      await act(async () => {
        fireEvent.press(getProfileTestId('logout-button'));
      });

      // Verify logged out across app
      const { getByTestId: getLoggedOutTestId } = render(
        <AppTestWrapper>
          <LoginTestScreen />
        </AppTestWrapper>
      );

      await waitFor(() => {
        expect(getLoggedOutTestId('login-title')).toHaveTextContent('Login');
      });
    });
  });

  describe('Concurrent State Updates', () => {
    it('should handle concurrent cart operations', async () => {
      const { getByTestId } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="1" />
        </AppTestWrapper>
      );

      // Simulate rapid button presses
      await act(async () => {
        fireEvent.press(getByTestId('add-to-cart-button'));
        fireEvent.press(getByTestId('add-to-cart-button'));
        fireEvent.press(getByTestId('add-to-cart-button'));
      });

      // Wait for all operations to complete
      await waitFor(() => {
        expect(getByTestId('cart-count')).toHaveTextContent('3 items in cart');
      });

      // Verify final state in cart screen
      const { getByTestId: getCartTestId } = render(
        <AppTestWrapper>
          <CartTestScreen />
        </AppTestWrapper>
      );

      await waitFor(() => {
        expect(getCartTestId('item-quantity-0')).toHaveTextContent('Quantity: 3');
      });
    });

    it('should handle concurrent favorite operations', async () => {
      const { getByTestId: getProduct1TestId } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="1" />
        </AppTestWrapper>
      );

      const { getByTestId: getProduct2TestId } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="2" />
        </AppTestWrapper>
      );

      // Rapid favoriting
      await act(async () => {
        fireEvent.press(getProduct1TestId('favorite-button'));
        fireEvent.press(getProduct2TestId('favorite-button'));
        fireEvent.press(getProduct1TestId('favorite-button')); // Toggle off
        fireEvent.press(getProduct1TestId('favorite-button')); // Toggle on
      });

      // Wait for all to complete
      await waitFor(() => {
        expect(getProduct1TestId('favorite-button')).toHaveProp('accessibilityState', {
          selected: true,
        });
        expect(getProduct2TestId('favorite-button')).toHaveProp('accessibilityState', {
          selected: true,
        });
      });

      // Verify count is correct in favorites screen
      const { getByTestId: getFavoritesTestId } = render(
        <AppTestWrapper>
          <FavoritesTestScreen />
        </AppTestWrapper>
      );

      await waitFor(() => {
        expect(getFavoritesTestId('favorites-count')).toHaveTextContent('2 items');
      });
    });
  });

  describe('State Persistence and Hydration', () => {
    it('should restore user preferences after app restart', async () => {
      // Set up initial state with cart and favorites
      const { getByTestId: getProductTestId } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="1" />
        </AppTestWrapper>
      );

      await act(async () => {
        fireEvent.press(getProductTestId('add-to-cart-button'));
        fireEvent.press(getProductTestId('favorite-button'));
      });

      await waitFor(() => {
        expect(getProductTestId('add-success')).toBeTruthy();
        expect(getProductTestId('favorite-button')).toHaveProp('accessibilityState', {
          selected: true,
        });
      });

      // Simulate app restart (clear memory but keep storage)
      simulateAppRestart();

      // Restart app and check state restoration
      const { getByTestId: getRestoredCartTestId } = render(
        <AppTestWrapper>
          <CartTestScreen />
        </AppTestWrapper>
      );

      const { getByTestId: getRestoredFavoritesTestId } = render(
        <AppTestWrapper>
          <FavoritesTestScreen />
        </AppTestWrapper>
      );

      // Verify state restored
      await waitFor(() => {
        expect(getRestoredCartTestId('item-title-0')).toHaveTextContent(mockProduct.title);
        expect(getRestoredFavoritesTestId('favorites-count')).toHaveTextContent('1 items');
      });
    });

    it('should handle partial state restoration', async () => {
      // Add cart items
      const { getByTestId: getProductTestId } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="1" />
        </AppTestWrapper>
      );

      await act(async () => {
        fireEvent.press(getProductTestId('add-to-cart-button'));
      });

      await waitFor(() => {
        expect(getProductTestId('add-success')).toBeTruthy();
      });

      // Manually clear only favorites storage (simulate partial corruption)
      mockStorage.delete('tifossi-favorites-local');

      // Simulate app restart
      simulateAppRestart();

      // Check that cart persisted but favorites reset
      const { getByTestId: getRestoredCartTestId } = render(
        <AppTestWrapper>
          <CartTestScreen />
        </AppTestWrapper>
      );

      const { getByTestId: getRestoredFavoritesTestId } = render(
        <AppTestWrapper>
          <FavoritesTestScreen />
        </AppTestWrapper>
      );

      await waitFor(() => {
        expect(getRestoredCartTestId('item-title-0')).toHaveTextContent(mockProduct.title);
        expect(getRestoredFavoritesTestId('empty-favorites')).toBeTruthy();
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock storage to throw errors
      const originalSet = mockStorage.set;
      mockStorage.set = jest.fn().mockImplementation(() => {
        throw new Error('Storage full');
      });

      const { getByTestId } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="1" />
        </AppTestWrapper>
      );

      // Should still work in memory even if storage fails
      await act(async () => {
        fireEvent.press(getByTestId('add-to-cart-button'));
      });

      // Should show in UI (optimistic update)
      await waitFor(() => {
        expect(getByTestId('cart-count')).toHaveTextContent('1 items in cart');
      });

      // Restore storage for cleanup
      mockStorage.set = originalSet;
    });

    it('should retry failed operations', async () => {
      let callCount = 0;

      // Setup API to fail first time, succeed second time
      mswServer.use(
        http.post('/api/cart/items', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json({ error: 'Network error' }, { status: 500 });
          }
          return HttpResponse.json({ success: true });
        })
      );

      const { getByTestId } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="1" />
        </AppTestWrapper>
      );

      await act(async () => {
        fireEvent.press(getByTestId('add-to-cart-button'));
      });

      // Should fail first time
      await waitFor(() => {
        expect(getByTestId('add-error')).toBeTruthy();
      });

      // Trigger retry
      await act(async () => {
        fireEvent.press(getByTestId('add-to-cart-button'));
      });

      // Should succeed on retry
      await waitFor(() => {
        expect(getByTestId('add-success')).toBeTruthy();
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large state updates efficiently', async () => {
      const startTime = performance.now();

      // Add many items rapidly
      const { getByTestId } = render(
        <AppTestWrapper>
          <ProductDetailTestScreen productId="1" />
        </AppTestWrapper>
      );

      await act(async () => {
        // Add 20 items rapidly
        for (let i = 0; i < 20; i++) {
          fireEvent.press(getByTestId('add-to-cart-button'));
        }
      });

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      await waitFor(() => {
        expect(getByTestId('cart-count')).toHaveTextContent('20 items in cart');
      });

      // Should complete within reasonable time
      expect(operationTime).toBeLessThan(1000);
    });
  });
});
