/**
 * Unit tests for Cart Store (Zustand)
 */

import { act } from '@testing-library/react-native';
import { testLifecycleHelpers } from '../utils/test-setup';
import { mockProduct } from '../utils/mock-data';

// Mock the actual cart store - adjust import path as needed
const createMockCartStore = () => {
  const initialState = {
    items: [] as any[],
    total: 0,
    itemCount: 0,
    isLoading: false,
    error: null as string | null,
  };

  let state = { ...initialState };

  return {
    getState: () => state,

    // Actions
    addItem: jest.fn((product: any, quantity = 1) => {
      const existingItem = state.items.find((item) => item.productId === product.id);

      if (existingItem) {
        state.items = state.items.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        state.items = [
          ...state.items,
          {
            id: `cart-item-${Date.now()}`,
            productId: product.id,
            product,
            quantity,
            price: product.price,
          },
        ];
      }

      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.total = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }),

    removeItem: jest.fn((itemId: string) => {
      state.items = state.items.filter((item) => item.id !== itemId);
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.total = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }),

    updateItemQuantity: jest.fn((itemId: string, quantity: number) => {
      if (quantity <= 0) {
        state.items = state.items.filter((item) => item.id !== itemId);
      } else {
        state.items = state.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
      }
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.total = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }),

    clearCart: jest.fn(() => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
      state.error = null;
    }),

    setLoading: jest.fn((loading: boolean) => {
      state.isLoading = loading;
    }),

    setError: jest.fn((error: string | null) => {
      state.error = error;
    }),

    // Reset for testing
    reset: () => {
      state = { ...initialState };
    },
  };
};

describe('Cart Store', () => {
  let cartStore: ReturnType<typeof createMockCartStore>;

  beforeEach(() => {
    testLifecycleHelpers.setupTest();
    cartStore = createMockCartStore();
  });

  afterEach(() => {
    testLifecycleHelpers.teardownTest();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = cartStore.getState();

      expect(state.items).toEqual([]);
      expect(state.total).toBe(0);
      expect(state.itemCount).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Adding Items', () => {
    it('should add new item to cart', () => {
      act(() => {
        cartStore.addItem(mockProduct, 1);
      });

      const state = cartStore.getState();

      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toMatchObject({
        productId: mockProduct.id,
        product: mockProduct,
        quantity: 1,
        price: mockProduct.price,
      });
      expect(state.itemCount).toBe(1);
      expect(state.total).toBe(mockProduct.price);
    });

    it('should increase quantity when adding existing item', () => {
      act(() => {
        cartStore.addItem(mockProduct, 1);
        cartStore.addItem(mockProduct, 2);
      });

      const state = cartStore.getState();

      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(3);
      expect(state.itemCount).toBe(3);
      expect(state.total).toBe(mockProduct.price * 3);
    });

    it('should add multiple different products', () => {
      const secondProduct = { ...mockProduct, id: 'product-2', price: 50 };

      act(() => {
        cartStore.addItem(mockProduct, 1);
        cartStore.addItem(secondProduct, 2);
      });

      const state = cartStore.getState();

      expect(state.items).toHaveLength(2);
      expect(state.itemCount).toBe(3);
      expect(state.total).toBe(mockProduct.price + secondProduct.price * 2);
    });

    it('should handle adding with zero quantity', () => {
      act(() => {
        cartStore.addItem(mockProduct, 0);
      });

      const state = cartStore.getState();

      expect(state.items).toHaveLength(0);
      expect(state.itemCount).toBe(0);
      expect(state.total).toBe(0);
    });
  });

  describe('Removing Items', () => {
    beforeEach(() => {
      act(() => {
        cartStore.addItem(mockProduct, 2);
      });
    });

    it('should remove item from cart', () => {
      const state = cartStore.getState();
      const itemId = state.items[0].id;

      act(() => {
        cartStore.removeItem(itemId);
      });

      const updatedState = cartStore.getState();

      expect(updatedState.items).toHaveLength(0);
      expect(updatedState.itemCount).toBe(0);
      expect(updatedState.total).toBe(0);
    });

    it('should handle removing non-existent item', () => {
      act(() => {
        cartStore.removeItem('non-existent-id');
      });

      const state = cartStore.getState();

      expect(state.items).toHaveLength(1);
      expect(state.itemCount).toBe(2);
      expect(state.total).toBe(mockProduct.price * 2);
    });
  });

  describe('Updating Item Quantity', () => {
    beforeEach(() => {
      act(() => {
        cartStore.addItem(mockProduct, 2);
      });
    });

    it('should update item quantity', () => {
      const state = cartStore.getState();
      const itemId = state.items[0].id;

      act(() => {
        cartStore.updateItemQuantity(itemId, 5);
      });

      const updatedState = cartStore.getState();

      expect(updatedState.items[0].quantity).toBe(5);
      expect(updatedState.itemCount).toBe(5);
      expect(updatedState.total).toBe(mockProduct.price * 5);
    });

    it('should remove item when quantity is set to zero', () => {
      const state = cartStore.getState();
      const itemId = state.items[0].id;

      act(() => {
        cartStore.updateItemQuantity(itemId, 0);
      });

      const updatedState = cartStore.getState();

      expect(updatedState.items).toHaveLength(0);
      expect(updatedState.itemCount).toBe(0);
      expect(updatedState.total).toBe(0);
    });

    it('should remove item when quantity is negative', () => {
      const state = cartStore.getState();
      const itemId = state.items[0].id;

      act(() => {
        cartStore.updateItemQuantity(itemId, -1);
      });

      const updatedState = cartStore.getState();

      expect(updatedState.items).toHaveLength(0);
      expect(updatedState.itemCount).toBe(0);
      expect(updatedState.total).toBe(0);
    });

    it('should handle updating non-existent item', () => {
      act(() => {
        cartStore.updateItemQuantity('non-existent-id', 10);
      });

      const state = cartStore.getState();

      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2); // Should remain unchanged
    });
  });

  describe('Clearing Cart', () => {
    beforeEach(() => {
      act(() => {
        cartStore.addItem(mockProduct, 2);
        cartStore.setError('Test error');
      });
    });

    it('should clear all items from cart', () => {
      act(() => {
        cartStore.clearCart();
      });

      const state = cartStore.getState();

      expect(state.items).toEqual([]);
      expect(state.total).toBe(0);
      expect(state.itemCount).toBe(0);
      expect(state.error).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('should update loading state', () => {
      act(() => {
        cartStore.setLoading(true);
      });

      expect(cartStore.getState().isLoading).toBe(true);

      act(() => {
        cartStore.setLoading(false);
      });

      expect(cartStore.getState().isLoading).toBe(false);
    });
  });

  describe('Error State', () => {
    it('should update error state', () => {
      const errorMessage = 'Failed to add item to cart';

      act(() => {
        cartStore.setError(errorMessage);
      });

      expect(cartStore.getState().error).toBe(errorMessage);

      act(() => {
        cartStore.setError(null);
      });

      expect(cartStore.getState().error).toBeNull();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple operations correctly', () => {
      const product1 = mockProduct;
      const product2 = { ...mockProduct, id: 'product-2', price: 75 };

      act(() => {
        // Add multiple products
        cartStore.addItem(product1, 2);
        cartStore.addItem(product2, 1);
        cartStore.addItem(product1, 1); // Should increase quantity
      });

      let state = cartStore.getState();

      expect(state.items).toHaveLength(2);
      expect(state.itemCount).toBe(4); // 3 + 1
      expect(state.total).toBe(product1.price * 3 + product2.price * 1);

      // Update quantity
      const product1ItemId = state.items.find((item) => item.productId === product1.id)?.id;

      act(() => {
        cartStore.updateItemQuantity(product1ItemId!, 1);
      });

      state = cartStore.getState();

      expect(state.itemCount).toBe(2); // 1 + 1
      expect(state.total).toBe(product1.price + product2.price);

      // Remove one product
      const product2ItemId = state.items.find((item) => item.productId === product2.id)?.id;

      act(() => {
        cartStore.removeItem(product2ItemId!);
      });

      state = cartStore.getState();

      expect(state.items).toHaveLength(1);
      expect(state.itemCount).toBe(1);
      expect(state.total).toBe(product1.price);
    });
  });

  describe('Performance', () => {
    it('should handle large number of items efficiently', () => {
      const startTime = performance.now();

      act(() => {
        // Add 100 different products
        for (let i = 0; i < 100; i++) {
          const product = { ...mockProduct, id: `product-${i}`, price: i + 1 };
          cartStore.addItem(product, 1);
        }
      });

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      const state = cartStore.getState();

      expect(state.items).toHaveLength(100);
      expect(operationTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Data Integrity', () => {
    it('should maintain correct totals after operations', () => {
      act(() => {
        cartStore.addItem(mockProduct, 3);
      });

      const state = cartStore.getState();
      const expectedTotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const expectedCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

      expect(state.total).toBe(expectedTotal);
      expect(state.itemCount).toBe(expectedCount);
    });

    it('should not mutate original product data', () => {
      const originalProduct = { ...mockProduct };

      act(() => {
        cartStore.addItem(mockProduct, 1);
      });

      expect(mockProduct).toEqual(originalProduct);
    });
  });
});
