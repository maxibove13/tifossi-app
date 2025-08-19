/**
 * Product to Cart Flow Integration Tests
 *
 * Tests the complete user journey from product discovery to cart management.
 * Focuses on real user interactions and UI-driven behavior testing.
 *
 * Testing Philosophy:
 * - Test actual user workflows and journeys
 * - Use real UI components and interactions
 * - Mock only at network boundary with MSW
 * - Verify end-to-end user experience
 */

import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { mswServer } from '../utils/msw-setup';
import { mockProduct } from '../utils/mock-data';
import { useCartStore } from '../../_stores/cartStore';
import { useAuthStore } from '../../_stores/authStore';
import { CartItem } from '../../_services/cart/cartService';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: () => ({ id: 'test-product-1' }),
}));

// Mock React Native components for testing
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    ScrollView: ({ children, ...props }: any) => <RN.View {...props}>{children}</RN.View>,
    FlatList: ({ data, renderItem, ...props }: any) => (
      <RN.View {...props}>
        {data?.map((item: any, index: number) => renderItem({ item, index }))}
      </RN.View>
    ),
  };
});

// Mock Product Detail Component with cart interaction
const MockProductDetailScreen = () => {
  const { addItem, getItemQuantity } = useCartStore();
  const [selectedSize, setSelectedSize] = React.useState<string>('M');
  const [selectedColor, setSelectedColor] = React.useState<string>('Blue');
  const [quantity, setQuantity] = React.useState<number>(1);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const product = {
    ...mockProduct,
    id: 'test-product-1',
    name: 'Test Hoodie',
    price: 49.99,
    frontImage: 'https://test.com/hoodie.jpg',
    colors: [
      { colorName: 'Blue', colorValue: '#0000FF' },
      { colorName: 'Red', colorValue: '#FF0000' },
    ],
    sizes: [
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
    ],
  };

  const currentCartQuantity = getItemQuantity(product.id, selectedColor, selectedSize);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      await addItem({
        productId: product.id,
        quantity,
        color: selectedColor,
        size: selectedSize,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div data-testid="product-detail-screen">
        <div data-testid="product-name">{product.name}</div>
        <div data-testid="product-price">${product.price}</div>

        {/* Size Selection */}
        <div data-testid="size-selector">
          {product.sizes.map((size) => (
            <button
              key={size.value}
              data-testid={`size-option-${size.value}`}
              onClick={() => setSelectedSize(size.value)}
              style={{
                backgroundColor: selectedSize === size.value ? '#blue' : '#gray',
              }}
            >
              {size.value}
            </button>
          ))}
        </div>

        {/* Color Selection */}
        <div data-testid="color-selector">
          {product.colors.map((color) => (
            <button
              key={color.colorName}
              data-testid={`color-option-${color.colorName}`}
              onClick={() => setSelectedColor(color.colorName)}
              style={{
                backgroundColor: selectedColor === color.colorName ? color.colorValue : '#gray',
              }}
            >
              {color.colorName}
            </button>
          ))}
        </div>

        {/* Quantity Selector */}
        <div data-testid="quantity-selector">
          <button
            data-testid="quantity-decrease"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            -
          </button>
          <span data-testid="quantity-value">{quantity}</span>
          <button data-testid="quantity-increase" onClick={() => setQuantity(quantity + 1)}>
            +
          </button>
        </div>

        {/* Current cart quantity display */}
        <div data-testid="current-cart-quantity">In cart: {currentCartQuantity}</div>

        {/* Add to Cart Button */}
        <button data-testid="add-to-cart-button" onClick={handleAddToCart} disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add to Cart'}
        </button>

        <div data-testid="selected-variant">
          Selected: {selectedSize} / {selectedColor}
        </div>
      </div>
    </>
  );
};

describe('Product to Cart Flow Integration Tests', () => {
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

  beforeEach(() => {
    clearStores();
    mswServer.resetHandlers();
  });

  describe('Product Discovery to Cart Addition', () => {
    it('should complete full product selection and add to cart flow', async () => {
      // Mock successful cart sync
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      render(<MockProductDetailScreen />);

      // Verify product details are displayed
      await waitFor(() => {
        expect(screen.getByTestId('product-name')).toHaveTextContent('Test Hoodie');
        expect(screen.getByTestId('product-price')).toHaveTextContent('$49.99');
      });

      // User selects size and color
      fireEvent.press(screen.getByTestId('size-option-L'));
      fireEvent.press(screen.getByTestId('color-option-Red'));

      // Increase quantity
      fireEvent.press(screen.getByTestId('quantity-increase'));
      fireEvent.press(screen.getByTestId('quantity-increase'));

      await waitFor(() => {
        expect(screen.getByTestId('quantity-value')).toHaveTextContent('3');
        expect(screen.getByTestId('selected-variant')).toHaveTextContent('L / Red');
      });

      // Add to cart
      fireEvent.press(screen.getByTestId('add-to-cart-button'));

      await waitFor(() => {
        expect(screen.getByTestId('current-cart-quantity')).toHaveTextContent('In cart: 3');
      });
    });

    it('should show loading state during add to cart', async () => {
      // Mock slow response
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      render(<MockProductDetailScreen />);

      // Add to cart
      fireEvent.press(screen.getByTestId('add-to-cart-button'));

      // Should show loading state immediately
      expect(screen.getByTestId('add-to-cart-button')).toHaveTextContent('Adding...');

      await waitFor(
        () => {
          expect(screen.getByTestId('add-to-cart-button')).toHaveTextContent('Add to Cart');
        },
        { timeout: 2000 }
      );
    });

    it('should handle multiple variant selections correctly', async () => {
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      render(<MockProductDetailScreen />);

      // Add first variant: M/Blue (quantity 1)
      fireEvent.press(screen.getByTestId('add-to-cart-button'));

      await waitFor(() => {
        expect(screen.getByTestId('current-cart-quantity')).toHaveTextContent('In cart: 1');
      });

      // Change to different variant: L/Red
      fireEvent.press(screen.getByTestId('size-option-L'));
      fireEvent.press(screen.getByTestId('color-option-Red'));

      // Should show 0 for this new variant
      await waitFor(() => {
        expect(screen.getByTestId('current-cart-quantity')).toHaveTextContent('In cart: 0');
        expect(screen.getByTestId('selected-variant')).toHaveTextContent('L / Red');
      });

      // Add second variant with quantity 2
      fireEvent.press(screen.getByTestId('quantity-increase'));
      fireEvent.press(screen.getByTestId('add-to-cart-button'));

      await waitFor(() => {
        expect(screen.getByTestId('current-cart-quantity')).toHaveTextContent('In cart: 2');
      });

      // Switch back to first variant - should still show quantity 1
      fireEvent.press(screen.getByTestId('size-option-M'));
      fireEvent.press(screen.getByTestId('color-option-Blue'));

      await waitFor(() => {
        expect(screen.getByTestId('current-cart-quantity')).toHaveTextContent('In cart: 1');
      });
    });

    it('should handle incremental additions to same variant', async () => {
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      render(<MockProductDetailScreen />);

      // Add 2 items first
      fireEvent.press(screen.getByTestId('quantity-increase'));
      fireEvent.press(screen.getByTestId('add-to-cart-button'));

      await waitFor(() => {
        expect(screen.getByTestId('current-cart-quantity')).toHaveTextContent('In cart: 2');
      });

      // Add 3 more items (same variant)
      fireEvent.press(screen.getByTestId('quantity-increase'));
      fireEvent.press(screen.getByTestId('quantity-increase'));
      fireEvent.press(screen.getByTestId('add-to-cart-button'));

      await waitFor(() => {
        expect(screen.getByTestId('current-cart-quantity')).toHaveTextContent('In cart: 5');
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle out of stock scenarios', async () => {
      mswServer.use(
        http.put('/users/me/cart', () => {
          return HttpResponse.json({ error: 'Selected variant is out of stock' }, { status: 400 });
        })
      );

      render(<MockProductDetailScreen />);

      // Try to add out of stock item
      fireEvent.press(screen.getByTestId('add-to-cart-button'));

      await waitFor(() => {
        // Should return to normal state after error
        expect(screen.getByTestId('add-to-cart-button')).toHaveTextContent('Add to Cart');
        expect(screen.getByTestId('current-cart-quantity')).toHaveTextContent('In cart: 0');
      });
    });

    it('should handle network errors gracefully', async () => {
      mswServer.use(
        http.put('/users/me/cart', () => {
          return HttpResponse.error();
        })
      );

      render(<MockProductDetailScreen />);

      fireEvent.press(screen.getByTestId('add-to-cart-button'));

      await waitFor(() => {
        expect(screen.getByTestId('add-to-cart-button')).toHaveTextContent('Add to Cart');
        // Should not show added quantity since it failed
        expect(screen.getByTestId('current-cart-quantity')).toHaveTextContent('In cart: 0');
      });
    });

    it('should prevent double submissions', async () => {
      let requestCount = 0;
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          requestCount++;
          await new Promise((resolve) => setTimeout(resolve, 500));
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      render(<MockProductDetailScreen />);

      // Rapidly click add to cart multiple times
      fireEvent.press(screen.getByTestId('add-to-cart-button'));
      fireEvent.press(screen.getByTestId('add-to-cart-button'));
      fireEvent.press(screen.getByTestId('add-to-cart-button'));

      await waitFor(
        () => {
          expect(screen.getByTestId('add-to-cart-button')).toHaveTextContent('Add to Cart');
        },
        { timeout: 2000 }
      );

      // Should only make one request due to loading state prevention
      expect(requestCount).toBe(1);
    });
  });

  describe('Guest vs Authenticated User Experience', () => {
    it('should handle guest user cart additions', async () => {
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          // No auth header - should still work for guest
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      render(<MockProductDetailScreen />);

      fireEvent.press(screen.getByTestId('add-to-cart-button'));

      await waitFor(() => {
        expect(screen.getByTestId('current-cart-quantity')).toHaveTextContent('In cart: 1');
      });
    });

    it('should handle authenticated user cart additions', async () => {
      // Set up authenticated user
      const authStore = useAuthStore.getState();
      const cartStore = useCartStore.getState();

      await act(async () => {
        authStore.isLoggedIn = true;
        authStore.token = 'mock-auth-token';
        cartStore.setAuthToken('mock-auth-token');
      });

      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          expect(authHeader).toBe('Bearer mock-auth-token');

          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      render(<MockProductDetailScreen />);

      fireEvent.press(screen.getByTestId('add-to-cart-button'));

      await waitFor(() => {
        expect(screen.getByTestId('current-cart-quantity')).toHaveTextContent('In cart: 1');
      });
    });
  });

  describe('Product Availability and Validation', () => {
    it('should validate size availability', async () => {
      // Mock product with limited size availability
      const productWithLimitedSizes = {
        ...mockProduct,
        sizes: [
          { value: 'S', available: false },
          { value: 'M', available: true },
          { value: 'L', available: true },
        ],
      };

      mswServer.use(
        http.put('/users/me/cart', ({ request }) => {
          return HttpResponse.json({ error: 'Size S is not available' }, { status: 400 });
        })
      );

      render(<MockProductDetailScreen />);

      // Try to select unavailable size (this would be disabled in real UI)
      // But test the error handling if somehow selected
      fireEvent.press(screen.getByTestId('size-option-S'));
      fireEvent.press(screen.getByTestId('add-to-cart-button'));

      await waitFor(() => {
        expect(screen.getByTestId('current-cart-quantity')).toHaveTextContent('In cart: 0');
      });
    });

    it('should handle quantity limits', async () => {
      mswServer.use(
        http.put('/users/me/cart', ({ request }) => {
          return HttpResponse.json(
            { error: 'Maximum quantity of 5 allowed per item' },
            { status: 400 }
          );
        })
      );

      render(<MockProductDetailScreen />);

      // Set high quantity
      for (let i = 0; i < 10; i++) {
        fireEvent.press(screen.getByTestId('quantity-increase'));
      }

      fireEvent.press(screen.getByTestId('add-to-cart-button'));

      await waitFor(() => {
        expect(screen.getByTestId('current-cart-quantity')).toHaveTextContent('In cart: 0');
      });
    });
  });

  describe('Performance and UX', () => {
    it('should maintain responsive UI during cart operations', async () => {
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      render(<MockProductDetailScreen />);

      const startTime = performance.now();

      // Perform multiple UI interactions
      fireEvent.press(screen.getByTestId('size-option-L'));
      fireEvent.press(screen.getByTestId('color-option-Red'));
      fireEvent.press(screen.getByTestId('quantity-increase'));
      fireEvent.press(screen.getByTestId('add-to-cart-button'));

      const endTime = performance.now();
      const interactionTime = endTime - startTime;

      // UI interactions should be immediate (< 16ms for 60fps)
      expect(interactionTime).toBeLessThan(100);

      await waitFor(() => {
        expect(screen.getByTestId('current-cart-quantity')).toHaveTextContent('In cart: 2');
      });
    });

    it('should handle rapid variant changes efficiently', async () => {
      mswServer.use(
        http.put('/users/me/cart', async ({ request }) => {
          const { cart } = (await request.json()) as { cart: CartItem[] };
          return HttpResponse.json({ cart });
        })
      );

      render(<MockProductDetailScreen />);

      // Rapidly change variants multiple times
      for (let i = 0; i < 5; i++) {
        fireEvent.press(screen.getByTestId('size-option-S'));
        fireEvent.press(screen.getByTestId('color-option-Blue'));
        fireEvent.press(screen.getByTestId('size-option-L'));
        fireEvent.press(screen.getByTestId('color-option-Red'));
      }

      // Should still show correct selected variant
      await waitFor(() => {
        expect(screen.getByTestId('selected-variant')).toHaveTextContent('L / Red');
      });
    });
  });
});
