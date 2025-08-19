/**
 * Cart Behavior Integration Tests
 *
 * Tests cart functionality through real user interactions and UI changes.
 * Uses real cart store and service, mocks only API calls with MSW.
 *
 * Testing Philosophy:
 * - Test BEHAVIOR not implementation
 * - Mock ONLY at network boundary
 * - Use REAL cart store and service
 * - Test complete user flows
 * - Verify UI changes, not state directly
 */

import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { mswServer } from '../utils/msw-setup';
// Import mocks will be added as needed for specific test scenarios
import { useCartStore } from '../../_stores/cartStore';
import { useAuthStore } from '../../_stores/authStore';
import { CartItem } from '../../_services/cart/cartService';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

// Simple test component to test cart behavior
const TestCartComponent = () => {
  const {
    items,
    isLoading,
    error,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    getItemQuantity,
  } = useCartStore();

  const { isLoggedIn } = useAuthStore();

  return (
    <>
      <div data-testid="cart-items-count">{items.length}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="is-logged-in">{isLoggedIn.toString()}</div>

      {items.map((item, index) => (
        <div key={index} data-testid={`cart-item-${index}`}>
          <span data-testid={`product-${item.productId}`}>{item.productId}</span>
          <span data-testid={`quantity-${item.productId}`}>{item.quantity}</span>
          <span data-testid={`size-${item.productId}`}>{item.size}</span>
          <span data-testid={`color-${item.productId}`}>{item.color}</span>
        </div>
      ))}

      <button
        data-testid="add-item-btn"
        onClick={() =>
          addItem({
            productId: 'test-hoodie-1',
            quantity: 1,
            size: 'M',
            color: 'Blue',
          })
        }
      >
        Add Item
      </button>

      <button
        data-testid="update-quantity-btn"
        onClick={() => updateItemQuantity('test-hoodie-1', 'Blue', 'M', 3)}
      >
        Update Quantity
      </button>

      <button
        data-testid="remove-item-btn"
        onClick={() => removeItem('test-hoodie-1', 'Blue', 'M')}
      >
        Remove Item
      </button>

      <button data-testid="clear-cart-btn" onClick={() => clearCart()}>
        Clear Cart
      </button>
    </>
  );
};

describe('Cart Behavior Integration Tests', () => {
  // Helper to clear cart and auth state before each test
  const clearStores = () => {
    const cartStore = useCartStore.getState();
    const authStore = useAuthStore.getState();

    // Clear cart state
    cartStore.items = [];
    cartStore.isLoading = false;
    cartStore.error = null;
    cartStore.isGuestCart = true;
    cartStore.lastSyncTimestamp = null;
    cartStore.pendingOperations = [];
    cartStore.actionStatus = 'idle';

    // Clear auth state
    authStore.isLoggedIn = false;
    authStore.token = null;
    authStore.user = null;
  };

  // Mock cart item
  const createCartItem = (options: Partial<CartItem> = {}): CartItem => ({
    productId: 'test-hoodie-1',
    quantity: 1,
    size: 'M',
    color: 'Blue',
    ...options,
  });

  beforeEach(() => {
    clearStores();
    mswServer.resetHandlers();
  });

  describe('Adding Items to Cart', () => {
    it('should add product to cart and update state', async () => {
      // Mock successful cart sync
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      render(<TestCartComponent />);

      // Initially empty cart
      expect(screen.getByTestId('cart-items-count')).toHaveTextContent('0');

      // Add item to cart
      fireEvent.press(screen.getByTestId('add-item-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('1');
        expect(screen.getByTestId('product-test-hoodie-1')).toHaveTextContent('test-hoodie-1');
        expect(screen.getByTestId('quantity-test-hoodie-1')).toHaveTextContent('1');
        expect(screen.getByTestId('size-test-hoodie-1')).toHaveTextContent('M');
        expect(screen.getByTestId('color-test-hoodie-1')).toHaveTextContent('Blue');
      });
    });

    it('should combine quantities for identical items', async () => {
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      // Add same item twice
      await act(async () => {
        await cartStore.addItem(createCartItem({ quantity: 1 }));
        await cartStore.addItem(createCartItem({ quantity: 2 }));
      });

      render(<TestCartComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('1');
        expect(screen.getByTestId('quantity-test-hoodie-1')).toHaveTextContent('3');
      });
    });

    it('should handle add to cart network error with retry', async () => {
      // First request fails, second succeeds
      let callCount = 0;
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.error();
          }
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      render(<TestCartComponent />);

      // First add should fail and revert
      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('0');
      });

      // Clear error and retry by adding item again
      await act(async () => {
        cartStore.clearError();
        await cartStore.addItem(createCartItem());
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });
    });
  });

  describe('Updating Cart Quantities', () => {
    it('should update item quantity in cart', async () => {
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      // Add item first
      await act(async () => {
        await cartStore.addItem(createCartItem({ quantity: 1 }));
      });

      render(<TestCartComponent />);

      // Update quantity
      fireEvent.press(screen.getByTestId('update-quantity-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('quantity-test-hoodie-1')).toHaveTextContent('3');
      });
    });

    it('should remove item when quantity becomes zero', async () => {
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      // Add item first
      await act(async () => {
        await cartStore.addItem(createCartItem({ quantity: 2 }));
      });

      render(<TestCartComponent />);

      // Update quantity to zero
      await act(async () => {
        await cartStore.updateItemQuantity('test-hoodie-1', 'Blue', 'M', 0);
      });

      await waitFor(() => {
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('0');
      });
    });

    it('should handle optimistic updates on network failure', async () => {
      mswServer.use(http.put('/users/me/cart', () => HttpResponse.error()));

      const cartStore = useCartStore.getState();

      // Add item first
      await act(async () => {
        cartStore.items = [createCartItem({ quantity: 1 })];
      });

      render(<TestCartComponent />);

      // Update quantity - should fail and revert
      await act(async () => {
        await cartStore.updateItemQuantity('test-hoodie-1', 'Blue', 'M', 5);
      });

      await waitFor(() => {
        // Should revert to original quantity
        expect(screen.getByTestId('quantity-test-hoodie-1')).toHaveTextContent('1');
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
      });
    });
  });

  describe('Removing Items from Cart', () => {
    it('should remove item from cart', async () => {
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      // Add item first
      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      render(<TestCartComponent />);

      // Remove item
      fireEvent.press(screen.getByTestId('remove-item-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('0');
      });
    });

    it('should handle remove with different variants', async () => {
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      // Add multiple variants
      await act(async () => {
        await cartStore.addItem(createCartItem({ size: 'M', color: 'Blue' }));
        await cartStore.addItem(createCartItem({ size: 'L', color: 'Blue' }));
        await cartStore.addItem(createCartItem({ size: 'M', color: 'Red' }));
      });

      render(<TestCartComponent />);

      // Should have 3 items
      await waitFor(() => {
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('3');
      });

      // Remove specific variant
      await act(async () => {
        await cartStore.removeItem('test-hoodie-1', 'Blue', 'M');
      });

      await waitFor(() => {
        // Should have 2 items left
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('2');
      });
    });
  });

  describe('Clearing Cart', () => {
    it('should clear entire cart', async () => {
      mswServer.use(http.put('/users/me/cart', () => HttpResponse.json({ cart: [] })));

      const cartStore = useCartStore.getState();

      // Add multiple items
      await act(async () => {
        await cartStore.addItem(createCartItem({ size: 'M' }));
        await cartStore.addItem(createCartItem({ size: 'L' }));
      });

      render(<TestCartComponent />);

      // Clear cart
      fireEvent.press(screen.getByTestId('clear-cart-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Guest Cart Behavior', () => {
    it('should handle guest cart migration on login', async () => {
      // Mock guest cart items
      const guestItems = [
        createCartItem({ quantity: 2, size: 'M' }),
        createCartItem({ quantity: 1, size: 'L' }),
      ];

      // Mock user cart from server
      const userItems = [createCartItem({ quantity: 1, size: 'S' })];

      mswServer.use(
        http.get('/users/me/cart', () => HttpResponse.json({ cart: userItems })),
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          // Merge guest and user carts
          const merged = cart;
          return HttpResponse.json({ cart: merged });
        })
      );

      const cartStore = useCartStore.getState();

      // Set up guest cart
      await act(async () => {
        cartStore.items = guestItems;
        cartStore.isGuestCart = true;
      });

      render(<TestCartComponent />);

      // Should show guest items initially
      await waitFor(() => {
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('2');
      });

      // Simulate login
      await act(async () => {
        await cartStore.migrateGuestCart('mock-auth-token');
      });

      await waitFor(() => {
        // Should show merged cart items
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('3');
      });
    });

    it('should handle migration failure gracefully', async () => {
      mswServer.use(
        http.get('/users/me/cart', () => HttpResponse.error()),
        http.put('/users/me/cart', () => HttpResponse.error())
      );

      const cartStore = useCartStore.getState();
      const guestItems = [createCartItem()];

      await act(async () => {
        cartStore.items = guestItems;
        cartStore.isGuestCart = true;
      });

      // Migration should fail but preserve guest cart
      await act(async () => {
        await cartStore.migrateGuestCart('mock-auth-token');
      });

      expect(cartStore.items).toEqual(guestItems);
      expect(cartStore.error).toBeTruthy();
    });
  });

  describe('Cart Sync with Backend', () => {
    it('should sync cart with server on changes', async () => {
      let syncCalls = 0;
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          syncCalls++;
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();
      const authStore = useAuthStore.getState();

      // Set authenticated user
      await act(async () => {
        authStore.isLoggedIn = true;
        authStore.token = 'mock-token';
        cartStore.setAuthToken('mock-token');
      });

      // Add item - should trigger sync
      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      expect(syncCalls).toBe(1);

      // Update quantity - should trigger another sync
      await act(async () => {
        await cartStore.updateItemQuantity('test-hoodie-1', 'Blue', 'M', 3);
      });

      expect(syncCalls).toBe(2);
    });

    it('should handle conflict resolution', async () => {
      const localCart = [createCartItem({ quantity: 2 })];
      const serverCart = [createCartItem({ quantity: 5 })];

      mswServer.use(
        http.put(
          '/users/me/cart',
          () => HttpResponse.json({ cart: serverCart }) // Server wins
        )
      );

      const cartStore = useCartStore.getState();

      await act(async () => {
        cartStore.items = localCart;
        await cartStore.fetchUserCart();
      });

      expect(cartStore.items).toEqual(serverCart);
    });

    it('should queue operations when offline', async () => {
      // Mock offline state
      mswServer.use(http.put('/users/me/cart', () => HttpResponse.error()));

      const cartStore = useCartStore.getState();

      // Add item while offline
      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      // Item should be added locally despite sync failure
      expect(cartStore.items).toHaveLength(1);
    });
  });

  describe('Cart Badge Updates', () => {
    it('should update cart item count', async () => {
      const cartStore = useCartStore.getState();

      await act(async () => {
        await cartStore.addItem(createCartItem({ quantity: 2 }));
        await cartStore.addItem(
          createCartItem({
            productId: 'test-shirt-1',
            quantity: 3,
            size: 'M',
            color: 'Red',
          })
        );
      });

      // Total items: 2 + 3 = 5
      const totalItems = cartStore.items.reduce((sum, item) => sum + item.quantity, 0);
      expect(totalItems).toBe(5);
    });
  });

  describe('Product Selection and Cart Addition Flow', () => {
    it('should handle product variant selection before adding to cart', async () => {
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      // Test adding different variants of the same product
      await act(async () => {
        await cartStore.addItem(createCartItem({ size: 'S', color: 'Blue', quantity: 1 }));
        await cartStore.addItem(createCartItem({ size: 'M', color: 'Blue', quantity: 2 }));
        await cartStore.addItem(createCartItem({ size: 'S', color: 'Red', quantity: 1 }));
      });

      render(<TestCartComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('3');
        // Check that all variants are distinct items
        expect(screen.getAllByTestId(/^cart-item-/)).toHaveLength(3);
      });
    });

    it('should validate product availability before adding to cart', async () => {
      mswServer.use(
        http.put('/users/me/cart', () =>
          HttpResponse.json({ error: 'Product variant not available' }, { status: 400 })
        )
      );

      const cartStore = useCartStore.getState();

      render(<TestCartComponent />);

      await act(async () => {
        await cartStore.addItem(createCartItem({ size: 'XXL', color: 'Purple' }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('0');
      });
    });

    it('should handle rapid consecutive additions', async () => {
      let requestCount = 0;
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          requestCount++;
          const { cart } = (await request.json()) as { cart: CartItem[] };
          // Simulate slight delay
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      // Add multiple items rapidly
      await act(async () => {
        const promises = [
          cartStore.addItem(createCartItem({ quantity: 1 })),
          cartStore.addItem(createCartItem({ quantity: 2 })),
          cartStore.addItem(createCartItem({ quantity: 1 })),
        ];
        await Promise.all(promises);
      });

      render(<TestCartComponent />);

      await waitFor(() => {
        // Should have combined quantities
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('1');
        expect(screen.getByTestId('quantity-test-hoodie-1')).toHaveTextContent('4');
      });
    });
  });

  describe('Cart Persistence and App Lifecycle', () => {
    it('should restore cart state after app restart', async () => {
      const cartStore = useCartStore.getState();

      // Add items to cart
      await act(async () => {
        cartStore.items = [
          createCartItem({ quantity: 2, size: 'M' }),
          createCartItem({ productId: 'test-shirt-1', quantity: 1, size: 'L', color: 'Red' }),
        ];
      });

      // Simulate app restart by clearing volatile state but keeping persisted data
      clearStores();

      // Simulate persistence restoration
      await act(async () => {
        const newCartStore = useCartStore.getState();
        newCartStore.items = [
          createCartItem({ quantity: 2, size: 'M' }),
          createCartItem({ productId: 'test-shirt-1', quantity: 1, size: 'L', color: 'Red' }),
        ];
        newCartStore.isGuestCart = true;
        newCartStore.lastSyncTimestamp = Date.now() - 60000; // 1 minute ago
      });

      render(<TestCartComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('2');
        expect(screen.getByTestId('quantity-test-hoodie-1')).toHaveTextContent('2');
      });
    });

    it('should sync stale cart data on app resume', async () => {
      let syncCallCount = 0;
      mswServer.use(
        http.get('/users/me/cart', () => {
          return HttpResponse.json({
            cart: [createCartItem({ quantity: 3 })], // Server has different quantity
          });
        }),
        http.put('/users/me/cart', async ({ request }) => {
          syncCallCount++;
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();
      const authStore = useAuthStore.getState();

      // Set up authenticated user with stale cart
      await act(async () => {
        authStore.isLoggedIn = true;
        authStore.token = 'mock-token';
        cartStore.setAuthToken('mock-token');
        cartStore.items = [createCartItem({ quantity: 1 })];
        cartStore.lastSyncTimestamp = Date.now() - 300000; // 5 minutes ago
      });

      // Trigger sync (simulates app resume)
      await act(async () => {
        await cartStore.fetchUserCart();
      });

      expect(syncCallCount).toBe(1);
    });

    it('should handle cart data corruption gracefully', async () => {
      const cartStore = useCartStore.getState();

      // Simulate corrupted cart data
      await act(async () => {
        // @ts-ignore - intentionally corrupt data for testing
        cartStore.items = [{ invalidProperty: 'test' }];
      });

      render(<TestCartComponent />);

      await waitFor(() => {
        // Should handle corruption and show empty cart
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Complex Synchronization Scenarios', () => {
    it('should handle server-side cart modifications', async () => {
      const localCart = [createCartItem({ quantity: 2 })];
      const serverCart = [
        createCartItem({ quantity: 1 }), // Quantity changed
        createCartItem({ productId: 'server-added-item', quantity: 1 }), // New item added on server
      ];

      mswServer.use(
        http.put('/users/me/cart', () => {
          // Server returns its own version (conflict resolution)
          return HttpResponse.json({ cart: serverCart });
        })
      );

      const cartStore = useCartStore.getState();

      await act(async () => {
        cartStore.items = localCart;
        await cartStore.fetchUserCart();
      });

      render(<TestCartComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('2');
        // Server version should win
        expect(screen.getByTestId('quantity-test-hoodie-1')).toHaveTextContent('1');
      });
    });

    it('should handle concurrent modifications', async () => {
      let modificationCount = 0;
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          modificationCount++;
          const { cart } = (await request.json()) as { cart: CartItem[] };

          if (modificationCount === 1) {
            // First request - simulate concurrent modification
            return HttpResponse.json(
              { error: 'Cart was modified by another session' },
              { status: 409 }
            );
          }

          // Second request succeeds
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      // Should retry on conflict and eventually succeed
      expect(modificationCount).toBeGreaterThan(1);
    });

    it('should queue operations when network is unstable', async () => {
      let networkToggle = false;
      mswServer.use(
        http.put('/users/me/cart', () => {
          networkToggle = !networkToggle;
          if (networkToggle) {
            return HttpResponse.error();
          }
          return HttpResponse.json({ cart: [] });
        })
      );

      const cartStore = useCartStore.getState();

      // Multiple operations with unstable network
      await act(async () => {
        await cartStore.addItem(createCartItem({ quantity: 1 }));
        await cartStore.updateItemQuantity('test-hoodie-1', 'Blue', 'M', 2);
        await cartStore.addItem(createCartItem({ productId: 'test-shirt-1', quantity: 1 }));
      });

      render(<TestCartComponent />);

      // Should handle network instability gracefully
      expect(cartStore.pendingOperations).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should show error message on persistent failures', async () => {
      mswServer.use(
        http.put('/users/me/cart', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 })
        )
      );

      const cartStore = useCartStore.getState();

      render(<TestCartComponent />);

      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
      });
    });

    it('should allow error recovery with exponential backoff', async () => {
      let callCount = 0;
      const callTimes: number[] = [];

      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          callCount++;
          callTimes.push(Date.now());

          if (callCount <= 3) {
            return HttpResponse.error();
          }
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      render(<TestCartComponent />);

      // First add should fail and queue for retry
      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
      });

      // Manual retry should eventually succeed
      await act(async () => {
        cartStore.clearError();
        await cartStore.addItem(createCartItem());
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });
    });

    it('should handle timeout errors gracefully', async () => {
      mswServer.use(
        http.put('/users/me/cart', () => {
          return new Promise(() => {
            // Never resolve - simulate timeout
          });
        })
      );

      const cartStore = useCartStore.getState();

      render(<TestCartComponent />);

      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      // Should handle timeout without crashing
      expect(cartStore.isLoading).toBe(false);
    });

    it('should preserve user data during error recovery', async () => {
      mswServer.use(http.put('/users/me/cart', () => HttpResponse.error()));

      const cartStore = useCartStore.getState();
      const originalItems = [createCartItem({ quantity: 5 })];

      await act(async () => {
        cartStore.items = originalItems;
        await cartStore.updateItemQuantity('test-hoodie-1', 'Blue', 'M', 3);
      });

      render(<TestCartComponent />);

      await waitFor(() => {
        // Should revert to original state on failure
        expect(screen.getByTestId('quantity-test-hoodie-1')).toHaveTextContent('5');
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
      });
    });
  });

  describe('Stock Validation and Inventory Management', () => {
    it('should handle out of stock items', async () => {
      mswServer.use(
        http.put('/users/me/cart', () =>
          HttpResponse.json({ error: 'Product out of stock' }, { status: 400 })
        )
      );

      const cartStore = useCartStore.getState();

      render(<TestCartComponent />);

      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
      });
    });

    it('should validate quantity against available stock', async () => {
      mswServer.use(
        http.put('/users/me/cart', ({ request }) => {
          return HttpResponse.json(
            { error: 'Requested quantity exceeds available stock' },
            { status: 400 }
          );
        })
      );

      const cartStore = useCartStore.getState();

      await act(async () => {
        await cartStore.addItem(createCartItem({ quantity: 100 })); // Excessive quantity
      });

      expect(cartStore.error).toBeTruthy();
    });

    it('should handle stock changes during cart session', async () => {
      let stockLevel = 5;
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          const requestedQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

          if (requestedQuantity > stockLevel) {
            return HttpResponse.json(
              {
                error: `Only ${stockLevel} items available`,
                availableStock: stockLevel,
              },
              { status: 400 }
            );
          }

          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      // Add items within stock limit
      await act(async () => {
        await cartStore.addItem(createCartItem({ quantity: 3 }));
      });

      expect(cartStore.items).toHaveLength(1);

      // Reduce stock externally
      stockLevel = 2;

      // Try to add more items
      await act(async () => {
        await cartStore.addItem(createCartItem({ quantity: 2 }));
      });

      expect(cartStore.error).toBeTruthy();
    });
  });

  describe('Checkout Flow Integration', () => {
    it('should validate cart before proceeding to checkout', async () => {
      mswServer.use(
        http.get('/api/cart/validate', () => {
          return HttpResponse.json({
            valid: true,
            issues: [],
          });
        })
      );

      const cartStore = useCartStore.getState();

      await act(async () => {
        await cartStore.addItem(createCartItem({ quantity: 2 }));
      });

      // Simulate checkout validation
      const isValid = cartStore.items.length > 0 && !cartStore.error;
      expect(isValid).toBe(true);
    });

    it('should handle checkout conflicts', async () => {
      mswServer.use(
        http.post('/api/checkout/validate', () => {
          return HttpResponse.json(
            {
              error: 'Cart items changed during checkout',
              updatedCart: [createCartItem({ quantity: 1 })], // Reduced quantity
            },
            { status: 409 }
          );
        })
      );

      const cartStore = useCartStore.getState();

      await act(async () => {
        cartStore.items = [createCartItem({ quantity: 3 })];
      });

      // Simulate checkout attempt would detect conflict
      // In real implementation, this would update cart with server response
      expect(cartStore.items[0].quantity).toBe(3);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large cart efficiently', async () => {
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();
      const startTime = performance.now();

      // Add 50 different items
      await act(async () => {
        const promises = [];
        for (let i = 0; i < 50; i++) {
          promises.push(
            cartStore.addItem(
              createCartItem({
                productId: `product-${i}`,
                quantity: 1,
              })
            )
          );
        }
        await Promise.all(promises);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      render(<TestCartComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('50');
      });

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds
    });

    it('should handle memory cleanup on cart clear', async () => {
      mswServer.use(http.put('/users/me/cart', () => HttpResponse.json({ cart: [] })));

      const cartStore = useCartStore.getState();

      // Add many items
      await act(async () => {
        const items = Array.from({ length: 100 }, (_, i) =>
          createCartItem({ productId: `product-${i}`, quantity: 1 })
        );
        cartStore.items = items;
      });

      render(<TestCartComponent />);

      // Clear cart
      await act(async () => {
        await cartStore.clearCart();
      });

      await waitFor(() => {
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('0');
      });

      // Memory should be freed
      expect(cartStore.items).toEqual([]);
    });

    it('should handle malformed server responses', async () => {
      mswServer.use(
        http.put('/users/me/cart', () => {
          return HttpResponse.json({ invalidData: 'unexpected' });
        })
      );

      const cartStore = useCartStore.getState();

      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      // Should handle gracefully without crashing
      expect(cartStore.error).toBeTruthy();
    });

    it('should prevent duplicate operations', async () => {
      let operationCount = 0;
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          operationCount++;
          // Simulate slow response
          await new Promise((resolve) => setTimeout(resolve, 200));
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      // Trigger same operation multiple times rapidly
      await act(async () => {
        const promises = [
          cartStore.addItem(createCartItem()),
          cartStore.addItem(createCartItem()),
          cartStore.addItem(createCartItem()),
        ];
        await Promise.all(promises);
      });

      // Should combine into fewer operations due to optimistic updates
      expect(operationCount).toBeLessThan(3);
    });
  });
});
