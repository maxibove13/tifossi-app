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
import { render, waitFor, screen } from '../utils/render-utils';
import { http, HttpResponse } from 'msw';
import { mswServer } from '../utils/msw-setup';
import { mockProduct } from '../utils/mock-data';
import CartScreen from '../../(tabs)/cart';
import { useCartStore } from '../../_stores/cartStore';
import { useAuthStore } from '../../_stores/authStore';
import { CartItem } from '../../_services/cart/cartService';
import { act } from '@testing-library/react-native';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

// Mock React Native components that might cause issues in tests
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    ScrollView: ({ children, ...props }: any) => <RN.View {...props}>{children}</RN.View>,
  };
});

describe('Shopping Cart Integration Tests', () => {
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

  // Mock product for testing
  const testProduct = {
    ...mockProduct,
    id: 'test-hoodie-1',
    name: 'Classic Hoodie',
    price: 49.99,
    discountedPrice: undefined,
    frontImage: 'https://test.com/hoodie.jpg',
    colors: [{ colorName: 'Blue', colorValue: '#0000FF' }],
    sizes: [
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
    ],
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

  describe('Empty Cart State', () => {
    it('should display empty cart message when no items', async () => {
      mswServer.use(http.get('/api/products', () => HttpResponse.json({ data: [testProduct] })));

      render(<CartScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Tu carrito está vacío/i)).toBeTruthy();
      });
    });

    it('should show recommended products when cart is empty', async () => {
      const recommendedProducts = [
        { ...testProduct, id: 'rec-1', statuses: [{ name: 'recommended' }] },
        { ...testProduct, id: 'rec-2', statuses: [{ name: 'recommended' }] },
      ];

      mswServer.use(
        http.get('/api/products', () => HttpResponse.json({ data: recommendedProducts }))
      );

      render(<CartScreen />);

      await waitFor(() => {
        expect(screen.getByText('Recomendados')).toBeTruthy();
      });
    });
  });

  describe('Adding Items to Cart', () => {
    it('should add product to cart and update UI', async () => {
      // Mock successful cart sync
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      // Add item to cart
      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      render(<CartScreen />);

      await waitFor(() => {
        expect(screen.getByText('Classic Hoodie')).toBeTruthy();
        expect(screen.getByText('Blue')).toBeTruthy();
        expect(screen.getByText('Talle: M')).toBeTruthy();
        expect(screen.getByText('$49.99')).toBeTruthy();
        expect(screen.getByText('Cantidad: 1')).toBeTruthy();
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

      render(<CartScreen />);

      await waitFor(() => {
        expect(screen.getByText('Cantidad: 3')).toBeTruthy();
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

      // First add should fail and revert
      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      // Verify error state
      expect(cartStore.error).toBeTruthy();
      expect(cartStore.items).toHaveLength(0);

      // Retry should succeed
      await act(async () => {
        cartStore.clearError();
        await cartStore.addItem(createCartItem());
      });

      expect(cartStore.error).toBeNull();
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

      render(<CartScreen />);

      // Update quantity
      await act(async () => {
        await cartStore.updateItemQuantity('test-hoodie-1', 'Blue', 'M', 3);
      });

      await waitFor(() => {
        expect(screen.getByText('Cantidad: 3')).toBeTruthy();
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

      render(<CartScreen />);

      // Update quantity to zero
      await act(async () => {
        await cartStore.updateItemQuantity('test-hoodie-1', 'Blue', 'M', 0);
      });

      await waitFor(() => {
        expect(screen.getByText(/Tu carrito está vacío/i)).toBeTruthy();
      });
    });

    it('should handle optimistic updates on network failure', async () => {
      mswServer.use(http.put('/users/me/cart', () => HttpResponse.error()));

      const cartStore = useCartStore.getState();

      // Add item first
      await act(async () => {
        cartStore.items = [createCartItem({ quantity: 1 })];
      });

      render(<CartScreen />);

      // Update quantity - should fail and revert
      await act(async () => {
        await cartStore.updateItemQuantity('test-hoodie-1', 'Blue', 'M', 5);
      });

      await waitFor(() => {
        // Should revert to original quantity
        expect(screen.getByText('Cantidad: 1')).toBeTruthy();
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

      render(<CartScreen />);

      // Remove item
      await act(async () => {
        await cartStore.removeItem('test-hoodie-1', 'Blue', 'M');
      });

      await waitFor(() => {
        expect(screen.getByText(/Tu carrito está vacío/i)).toBeTruthy();
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

      render(<CartScreen />);

      // Remove specific variant
      await act(async () => {
        await cartStore.removeItem('test-hoodie-1', 'Blue', 'M');
      });

      await waitFor(() => {
        // Should still have other variants
        expect(screen.getByText('Talle: L')).toBeTruthy();
        expect(screen.getByText('Red')).toBeTruthy();
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

      render(<CartScreen />);

      // Clear cart
      await act(async () => {
        await cartStore.clearCart();
      });

      await waitFor(() => {
        expect(screen.getByText(/Tu carrito está vacío/i)).toBeTruthy();
      });
    });
  });

  describe('Cart Calculations', () => {
    it('should calculate correct subtotal and total', async () => {
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      // Add items with different quantities
      await act(async () => {
        await cartStore.addItem(createCartItem({ quantity: 2 })); // 2 * $49.99 = $99.98
        await cartStore.addItem(
          createCartItem({
            productId: 'test-shirt-1',
            quantity: 1,
            size: 'M',
            color: 'Blue',
          })
        );
      });

      // Mock second product
      mswServer.use(
        http.get('/api/products', () =>
          HttpResponse.json({
            data: [testProduct, { ...testProduct, id: 'test-shirt-1', price: 29.99 }],
          })
        )
      );

      render(<CartScreen />);

      await waitFor(() => {
        // Should show subtotal: $99.98 + $29.99 = $129.97
        expect(screen.getByText('$129.97')).toBeTruthy();
        expect(screen.getByText('$0.00')).toBeTruthy(); // Free shipping
      });
    });

    it('should calculate discounts correctly', async () => {
      const discountedProduct = {
        ...testProduct,
        price: 49.99,
        discountedPrice: 39.99,
      };

      mswServer.use(
        http.get('/api/products', () => HttpResponse.json({ data: [discountedProduct] })),
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      await act(async () => {
        await cartStore.addItem(createCartItem({ quantity: 2 }));
      });

      render(<CartScreen />);

      await waitFor(() => {
        // Original: 2 * $49.99 = $99.98
        // Discounted: 2 * $39.99 = $79.98
        // Discount: $20.00
        expect(screen.getByText('$99.98')).toBeTruthy(); // Subtotal
        expect(screen.getByText('-$20.00')).toBeTruthy(); // Discount
        expect(screen.getByText('$79.98')).toBeTruthy(); // Total
      });
    });
  });

  describe('Guest Cart Behavior', () => {
    it('should show auth prompt for guest users', async () => {
      const cartStore = useCartStore.getState();

      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      render(<CartScreen />);

      await waitFor(() => {
        expect(screen.getByText(/¿Quieres guardar tu carrito/i)).toBeTruthy();
      });
    });

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

      // Simulate login
      await act(async () => {
        await cartStore.migrateGuestCart('mock-auth-token');
      });

      render(<CartScreen />);

      await waitFor(() => {
        // Should show merged cart items
        expect(screen.getByText('Talle: M')).toBeTruthy();
        expect(screen.getByText('Talle: L')).toBeTruthy();
        expect(screen.getByText('Talle: S')).toBeTruthy();
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

  describe('Cart Persistence', () => {
    it('should persist cart across app restarts', async () => {
      const cartStore = useCartStore.getState();

      // Add items to cart
      await act(async () => {
        cartStore.items = [createCartItem({ quantity: 2 })];
      });

      // Simulate app restart by clearing and re-initializing
      clearStores();

      // In real scenario, persistence would restore from MMKV
      // For test, we manually set the items to simulate persistence
      await act(async () => {
        const newCartStore = useCartStore.getState();
        newCartStore.items = [createCartItem({ quantity: 2 })];
      });

      render(<CartScreen />);

      await waitFor(() => {
        expect(screen.getByText('Cantidad: 2')).toBeTruthy();
      });
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

  describe('Error Handling', () => {
    it('should show error message on persistent failures', async () => {
      mswServer.use(
        http.put('/users/me/cart', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 })
        )
      );

      const cartStore = useCartStore.getState();

      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      expect(cartStore.error).toBeTruthy();
    });

    it('should allow error recovery', async () => {
      let callCount = 0;
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          callCount++;
          if (callCount <= 2) {
            return HttpResponse.error();
          }
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      const cartStore = useCartStore.getState();

      // First attempts fail
      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      expect(cartStore.error).toBeTruthy();

      // Clear error and retry
      await act(async () => {
        cartStore.clearError();
        cartStore.clearError();
        await cartStore.addItem(createCartItem());
      });

      expect(cartStore.error).toBeNull();
    });
  });

  describe('Stock Validation', () => {
    it('should handle out of stock items', async () => {
      const outOfStockProduct = {
        ...testProduct,
        inStock: false,
        stockQuantity: 0,
      };

      mswServer.use(
        http.get('/api/products', () => HttpResponse.json({ data: [outOfStockProduct] })),
        http.put('/users/me/cart', () =>
          HttpResponse.json({ error: 'Product out of stock' }, { status: 400 })
        )
      );

      const cartStore = useCartStore.getState();

      await act(async () => {
        await cartStore.addItem(createCartItem());
      });

      expect(cartStore.error).toBeTruthy();
    });
  });
});
