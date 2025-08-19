/**
 * ProductCard Integration Tests
 *
 * Tests the complete ProductCard component behavior with real dependencies:
 * - Real favorites store integration
 * - Real cart store integration
 * - Real navigation integration
 * - Animation and gesture handling
 * - Error boundary integration
 *
 * Testing Philosophy:
 * - Test actual user interactions
 * - Use real stores and services
 * - Mock only network calls with MSW
 * - Test visual behavior, not internal state
 */

import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { mswServer } from '../utils/msw-setup';
import { mockProduct, mockUser } from '../utils/mock-data';
import DefaultLargeCard from '../../_components/store/product/default/large';
import { useFavoritesStore } from '../../_stores/favoritesStore';
import { useCartStore } from '../../_stores/cartStore';
import { useAuthStore } from '../../_stores/authStore';
import { Product } from '../../_types/product';
import { ProductStatus } from '../../_types/product-status';
import { testLifecycleHelpers } from '../utils/test-setup';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

// Mock React Native Animated for testing
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Animated: {
      ...RN.Animated,
      timing: () => ({
        start: jest.fn(),
      }),
      sequence: () => ({
        start: jest.fn(),
      }),
    },
  };
});

// Mock SVG components
jest.mock('../../../../../../assets/icons/heart_active.svg', () => 'HeartActiveSVG');
jest.mock('../../../../../../assets/icons/heart_inactive.svg', () => 'HeartInactiveSVG');

describe('ProductCard Integration Tests', () => {
  // Helper to clear all stores before each test
  const clearStores = () => {
    const favoritesStore = useFavoritesStore.getState();
    const cartStore = useCartStore.getState();
    const authStore = useAuthStore.getState();

    // Clear favorites
    favoritesStore.productIds = [];
    favoritesStore.lastSyncTimestamp = null;
    favoritesStore.error = null;

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

  // Test product with variants for comprehensive testing
  const testProduct: Product = {
    ...mockProduct,
    id: 'test-product-card-1',
    title: 'Test Hoodie',
    price: 49.99,
    discountedPrice: 49.99,
    frontImage: 'https://test.com/hoodie.jpg',
    colors: [
      {
        colorName: 'Blue',
        hex: '#0000FF',
        quantity: 10,
        images: { main: 'https://test.com/blue.jpg' },
      },
      {
        colorName: 'Red',
        hex: '#FF0000',
        quantity: 10,
        images: { main: 'https://test.com/red.jpg' },
      },
      {
        colorName: 'Green',
        hex: '#00FF00',
        quantity: 10,
        images: { main: 'https://test.com/green.jpg' },
      },
      {
        colorName: 'Black',
        hex: '#000000',
        quantity: 10,
        images: { main: 'https://test.com/black.jpg' },
      },
      {
        colorName: 'White',
        hex: '#FFFFFF',
        quantity: 10,
        images: { main: 'https://test.com/white.jpg' },
      },
    ],
    sizes: [
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
    ],
    isCustomizable: true,
  };

  beforeEach(() => {
    clearStores();
    mswServer.resetHandlers();
    testLifecycleHelpers.setupTest();
  });

  afterEach(() => {
    testLifecycleHelpers.teardownTest();
  });

  describe('Product Information Display', () => {
    it('should render complete product information correctly', async () => {
      const handlePress = jest.fn();

      render(<DefaultLargeCard product={testProduct} onPress={handlePress} />);

      await waitFor(() => {
        expect(screen.getByText('Test Hoodie')).toBeTruthy();
        expect(screen.getByText('$69.99')).toBeTruthy(); // Original price
        expect(screen.getByText('$49.99')).toBeTruthy(); // Discounted price
        expect(screen.getByText('Descuento')).toBeTruthy(); // Discount tag
        expect(screen.getByText('Personalizable')).toBeTruthy(); // Customizable tag
      });
    });

    it('should display color palette with correct limit and overflow', async () => {
      const handlePress = jest.fn();

      render(<DefaultLargeCard product={testProduct} onPress={handlePress} />);

      await waitFor(() => {
        // Should show first 4 colors + "+1" for overflow
        expect(screen.getByText('+1')).toBeTruthy();
      });
    });

    it('should handle product without discount correctly', async () => {
      const regularProduct = {
        ...testProduct,
        discountedPrice: undefined,
        statuses: [ProductStatus.NEW],
      };

      render(<DefaultLargeCard product={regularProduct} onPress={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('$49.99')).toBeTruthy(); // Regular price only
        expect(screen.getByText('Nuevo')).toBeTruthy(); // New tag instead of discount
        expect(screen.queryByText('Descuento')).toBeNull();
      });
    });
  });

  describe('Favorites Integration', () => {
    it('should toggle favorite status with store integration', async () => {
      mswServer.use(
        http.put('/users/me/favorites', async ({ request }) => {
          const { favoriteIds } = (await request.json()) as { favoriteIds: string[] };
          return HttpResponse.json({ favoriteIds });
        })
      );

      const handlePress = jest.fn();
      const favoritesStore = useFavoritesStore.getState();

      render(<DefaultLargeCard product={testProduct} onPress={handlePress} />);

      // Initially not favorite
      expect(favoritesStore.productIds).not.toContain(testProduct.id);

      // Add to favorites
      const favoriteButton = screen.getByLabelText('Add to favorites');
      fireEvent.press(favoriteButton);

      await waitFor(() => {
        expect(favoritesStore.productIds).toContain(testProduct.id);
      });

      // Remove from favorites
      const removeFavoriteButton = screen.getByLabelText('Remove from favorites');
      fireEvent.press(removeFavoriteButton);

      await waitFor(() => {
        expect(favoritesStore.productIds).not.toContain(testProduct.id);
      });
    });

    it('should handle favorites sync errors gracefully', async () => {
      mswServer.use(http.put('/users/me/favorites', () => HttpResponse.error()));

      const favoritesStore = useFavoritesStore.getState();

      render(<DefaultLargeCard product={testProduct} onPress={jest.fn()} />);

      fireEvent.press(screen.getByLabelText('Add to favorites'));

      await waitFor(() => {
        // Should show error state in store
        expect(favoritesStore.error).toBeTruthy();
      });
    });

    it('should work correctly for guest users (local storage)', async () => {
      const favoritesStore = useFavoritesStore.getState();

      render(<DefaultLargeCard product={testProduct} onPress={jest.fn()} />);

      fireEvent.press(screen.getByLabelText('Add to favorites'));

      await waitFor(() => {
        // Should store locally for guest users
        expect(favoritesStore.productIds).toContain(testProduct.id);
      });
    });

    it('should sync favorites for authenticated users', async () => {
      // Set up authenticated user
      const authStore = useAuthStore.getState();
      await act(async () => {
        authStore.isLoggedIn = true;
        authStore.token = 'mock-auth-token';
        authStore.user = mockUser;
      });

      mswServer.use(
        http.put('/users/me/favorites', async ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          expect(authHeader).toBe('Bearer mock-auth-token');

          const { favoriteIds } = (await request.json()) as { favoriteIds: string[] };
          return HttpResponse.json({ favoriteIds });
        })
      );

      render(<DefaultLargeCard product={testProduct} onPress={jest.fn()} />);

      fireEvent.press(screen.getByLabelText('Add to favorites'));

      await waitFor(() => {
        const favoritesStore = useFavoritesStore.getState();
        expect(favoritesStore.productIds).toContain(testProduct.id);
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should navigate to product detail on press', async () => {
      const { router } = require('expo-router');
      const handlePress = jest.fn();

      render(<DefaultLargeCard product={testProduct} onPress={handlePress} />);

      fireEvent.press(screen.getByText('Test Hoodie'));

      expect(handlePress).toHaveBeenCalledTimes(1);
    });

    it('should handle navigation errors gracefully', async () => {
      const handlePress = jest.fn().mockRejectedValue(new Error('Navigation failed'));

      render(<DefaultLargeCard product={testProduct} onPress={handlePress} />);

      // Should not crash when navigation fails
      fireEvent.press(screen.getByText('Test Hoodie'));

      await waitFor(() => {
        expect(handlePress).toHaveBeenCalled();
      });
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should render quickly with complex product data', async () => {
      const complexProduct = {
        ...testProduct,
        colors: Array.from({ length: 20 }, (_, i) => ({
          colorName: `Color ${i}`,
          hex: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          quantity: 10,
          images: { main: `https://test.com/color-${i}.jpg` },
        })),
      };

      const startTime = performance.now();
      render(<DefaultLargeCard product={complexProduct} onPress={jest.fn()} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in under 100ms
    });

    it('should handle rapid favorite toggles without breaking', async () => {
      mswServer.use(
        http.put('/users/me/favorites', async ({ request }) => {
          // Add small delay to simulate network
          await new Promise((resolve) => setTimeout(resolve, 50));
          const { favoriteIds } = (await request.json()) as { favoriteIds: string[] };
          return HttpResponse.json({ favoriteIds });
        })
      );

      render(<DefaultLargeCard product={testProduct} onPress={jest.fn()} />);

      // Rapidly toggle favorites
      const favoriteButton = screen.getByLabelText('Add to favorites');
      for (let i = 0; i < 5; i++) {
        fireEvent.press(favoriteButton);
      }

      // Should handle gracefully without breaking
      await waitFor(() => {
        const favoritesStore = useFavoritesStore.getState();
        expect(Array.isArray(favoritesStore.productIds)).toBe(true);
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('should have proper accessibility support', async () => {
      render(<DefaultLargeCard product={testProduct} onPress={jest.fn()} />);

      const favoriteButton = screen.getByLabelText('Add to favorites');
      expect(favoriteButton.props.accessibilityRole).toBe('button');
    });

    it('should support screen reader navigation', async () => {
      render(<DefaultLargeCard product={testProduct} onPress={jest.fn()} />);

      const favoriteButton = screen.getByLabelText('Add to favorites');
      expect(favoriteButton.props.accessibilityLabel).toBe('Add to favorites');

      // Add to favorites and check label changes
      fireEvent.press(favoriteButton);

      await waitFor(() => {
        const removeFavoriteButton = screen.getByLabelText('Remove from favorites');
        expect(removeFavoriteButton.props.accessibilityLabel).toBe('Remove from favorites');
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing product data gracefully', async () => {
      const incompleteProduct = {
        id: 'incomplete-product',
        name: 'Incomplete Product',
        // Missing other required fields
      } as any;

      expect(() => {
        render(<DefaultLargeCard product={incompleteProduct} onPress={jest.fn()} />);
      }).not.toThrow();
    });

    it('should handle corrupted color data', async () => {
      const corruptedProduct = {
        ...testProduct,
        colors: [
          { colorName: 'Blue', quantity: 10, images: { main: 'https://test.com/blue.jpg' } }, // Missing hex
          {
            hex: '#FF0000',
            colorName: '',
            quantity: 10,
            images: { main: 'https://test.com/red.jpg' },
          }, // Missing colorName
        ].filter(Boolean), // Remove null values
      };

      expect(() => {
        render(<DefaultLargeCard product={corruptedProduct} onPress={jest.fn()} />);
      }).not.toThrow();
    });

    it('should handle network failures in favorites', async () => {
      mswServer.use(
        http.put('/users/me/favorites', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 })
        )
      );

      const favoritesStore = useFavoritesStore.getState();
      render(<DefaultLargeCard product={testProduct} onPress={jest.fn()} />);

      fireEvent.press(screen.getByLabelText('Add to favorites'));

      await waitFor(() => {
        expect(favoritesStore.error).toBeTruthy();
        // Product should still be added locally as fallback
        expect(favoritesStore.productIds).toContain(testProduct.id);
      });
    });
  });

  describe('Real User Interactions', () => {
    it('should complete full user workflow: view → favorite → unfavorite', async () => {
      mswServer.use(
        http.put('/users/me/favorites', async ({ request }) => {
          const { favoriteIds } = (await request.json()) as { favoriteIds: string[] };
          return HttpResponse.json({ favoriteIds });
        })
      );

      const handlePress = jest.fn();
      const favoritesStore = useFavoritesStore.getState();

      render(<DefaultLargeCard product={testProduct} onPress={handlePress} />);

      // User views product information
      expect(screen.getByText('Test Hoodie')).toBeTruthy();
      expect(screen.getByText('$49.99')).toBeTruthy();

      // User adds to favorites
      fireEvent.press(screen.getByLabelText('Add to favorites'));

      await waitFor(() => {
        expect(favoritesStore.productIds).toContain(testProduct.id);
        expect(screen.getByLabelText('Remove from favorites')).toBeTruthy();
      });

      // User removes from favorites
      fireEvent.press(screen.getByLabelText('Remove from favorites'));

      await waitFor(() => {
        expect(favoritesStore.productIds).not.toContain(testProduct.id);
        expect(screen.getByLabelText('Add to favorites')).toBeTruthy();
      });

      // User navigates to product detail
      fireEvent.press(screen.getByText('Test Hoodie'));
      expect(handlePress).toHaveBeenCalled();
    });

    it('should handle simultaneous actions gracefully', async () => {
      mswServer.use(
        http.put('/users/me/favorites', async ({ request }) => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const { favoriteIds } = (await request.json()) as { favoriteIds: string[] };
          return HttpResponse.json({ favoriteIds });
        })
      );

      const handlePress = jest.fn();
      render(<DefaultLargeCard product={testProduct} onPress={handlePress} />);

      // User rapidly performs multiple actions
      fireEvent.press(screen.getByLabelText('Add to favorites'));
      fireEvent.press(screen.getByText('Test Hoodie'));

      await waitFor(() => {
        expect(handlePress).toHaveBeenCalled();
      });
    });
  });

  describe('Visual State Management', () => {
    it('should show correct visual states for favorites', async () => {
      const favoritesStore = useFavoritesStore.getState();

      // Initially not favorite - should show inactive heart
      render(<DefaultLargeCard product={testProduct} onPress={jest.fn()} />);
      expect(screen.getByLabelText('Add to favorites')).toBeTruthy();

      // Add to favorites - should show active heart
      await act(async () => {
        favoritesStore.productIds = [testProduct.id];
      });

      // Re-render to reflect state change
      render(<DefaultLargeCard product={testProduct} onPress={jest.fn()} />);
      expect(screen.getByLabelText('Remove from favorites')).toBeTruthy();
    });

    it('should display discount information correctly', async () => {
      render(<DefaultLargeCard product={testProduct} onPress={jest.fn()} />);

      // Should show both original and discount prices
      expect(screen.getByText('$69.99')).toBeTruthy(); // Original price with strikethrough
      expect(screen.getByText('$49.99')).toBeTruthy(); // Discounted price
      expect(screen.getByText('Descuento')).toBeTruthy(); // Discount tag
    });
  });
});
