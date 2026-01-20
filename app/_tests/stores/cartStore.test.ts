/**
 * Cart Store Tests
 * Testing real Zustand store implementation with network mocking
 * Following TESTING_PRINCIPLES.md: Test behavior, not implementation
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCartStore } from '../../_stores/cartStore';

// Import the mocked module to get references
import httpClient from '../../_services/api/httpClient';

// Mock MMKV at the boundary
const mockMMKVStore = new Map<string, string>();

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn((key) => mockMMKVStore.get(key) || null),
    set: jest.fn((key, value) => {
      mockMMKVStore.set(key, value);
    }),
    delete: jest.fn((key) => {
      mockMMKVStore.delete(key);
    }),
    clearAll: jest.fn(() => {
      mockMMKVStore.clear();
    }),
  })),
}));

// Mock httpClient at the network boundary - use auto-mock then customize
jest.mock('../../_services/api/httpClient', () => {
  const mockFns = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockFns,
    httpClient: mockFns,
  };
});
const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('cartStore', () => {
  beforeEach(() => {
    // Clear storage and reset store state
    mockMMKVStore.clear();
    useCartStore.setState({
      items: [],
      isLoading: false,
      error: null,
      isGuestCart: true,
      lastSyncTimestamp: null,
      actionStatus: 'idle',
      pendingOperations: [],
    });

    // Reset all mocks
    jest.clearAllMocks();

    // Default successful response
    mockHttpClient.post.mockResolvedValue({ success: true });
    mockHttpClient.delete.mockResolvedValue({ success: true });
    mockHttpClient.get.mockResolvedValue({ data: [] });
  });

  describe('addItem', () => {
    it('should add a new item to the cart', async () => {
      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 2,
          color: 'red',
          size: 'M',
          price: 99.99,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0]).toEqual({
          productId: '1',
          quantity: 2,
          color: 'red',
          size: 'M',
          price: 99.99,
        });
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should update quantity if item already exists', async () => {
      const { result } = renderHook(() => useCartStore());

      // Add item first time
      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 2,
          color: 'red',
          size: 'M',
          price: 99.99,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      // Add same item again
      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 3,
          color: 'red',
          size: 'M',
          price: 99.99,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].quantity).toBe(5); // 2 + 3
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should treat items with different colors as separate items', async () => {
      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 1,
          color: 'red',
          size: 'M',
          price: 99.99,
        });
      });

      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 1,
          color: 'blue',
          size: 'M',
          price: 99.99,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });
    });

    it('should handle different product sizes and colors', async () => {
      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 1,
          color: 'red',
          size: 'M',
          price: 99.99,
        });
      });

      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 2,
          color: 'red',
          size: 'L',
          price: 99.99,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
        expect(result.current.getTotalItems()).toBe(3); // 1 + 2
      });
    });
  });

  describe('updateItemQuantity', () => {
    it('should update quantity of existing item', async () => {
      const { result } = renderHook(() => useCartStore());

      // Add item first
      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 2,
          color: 'red',
          size: 'M',
          price: 99.99,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      // Update quantity
      await act(async () => {
        await result.current.updateItemQuantity('1', 'red', 'M', 5);
      });

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(5);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should remove item if quantity is set to 0', async () => {
      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 2,
          color: 'red',
          size: 'M',
          price: 99.99,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      await act(async () => {
        await result.current.updateItemQuantity('1', 'red', 'M', 0);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0);
      });
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const { result } = renderHook(() => useCartStore());

      // Add two items
      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 2,
          color: 'red',
          size: 'M',
          price: 99.99,
        });
      });

      await act(async () => {
        await result.current.addItem({
          productId: '2',
          quantity: 1,
          color: 'blue',
          size: 'L',
          price: 99.99,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      // Remove first item
      await act(async () => {
        await result.current.removeItem('1', 'red', 'M');
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].productId).toBe('2');
      });
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', async () => {
      const { result } = renderHook(() => useCartStore());

      // Add multiple items
      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 2,
          color: 'red',
          size: 'M',
          price: 99.99,
        });
      });

      await act(async () => {
        await result.current.addItem({
          productId: '2',
          quantity: 1,
          color: 'blue',
          size: 'L',
          price: 99.99,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      // Clear cart
      await act(async () => {
        await result.current.clearCart();
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('getItemQuantity', () => {
    it('should return quantity for existing item', async () => {
      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 5,
          color: 'red',
          size: 'M',
          price: 99.99,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      const quantity = result.current.getItemQuantity('1', 'red', 'M');
      expect(quantity).toBe(5);
    });

    it('should return 0 for non-existent item', () => {
      const { result } = renderHook(() => useCartStore());

      const quantity = result.current.getItemQuantity('999', 'red', 'M');
      expect(quantity).toBe(0);
    });
  });

  describe('computed values', () => {
    it('should calculate total price correctly', async () => {
      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 2,
          price: 100,
          discountedPrice: 80,
        });
      });

      await act(async () => {
        await result.current.addItem({
          productId: '2',
          quantity: 1,
          price: 50,
          // No discount price
        });
      });

      await waitFor(() => {
        // First item: 2 * 80 (discount price) = 160
        // Second item: 1 * 50 = 50
        // Total: 210
        expect(result.current.getTotalPrice()).toBe(210);
        expect(result.current.getSubtotal()).toBe(250); // 2*100 + 1*50
        expect(result.current.getDiscountTotal()).toBe(40); // (100-80)*2
      });
    });

    it('should calculate total items correctly', async () => {
      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 2,
          color: 'red',
          size: 'M',
          price: 99.99,
        });
      });

      await act(async () => {
        await result.current.addItem({
          productId: '2',
          quantity: 3,
          color: 'blue',
          size: 'L',
          price: 99.99,
        });
      });

      await act(async () => {
        await result.current.addItem({
          productId: '3',
          quantity: 1,
          color: 'green',
          size: 'S',
          price: 99.99,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(3);
      });

      const totalItems = result.current.getTotalItems();
      expect(totalItems).toBe(6); // 2 + 3 + 1
    });

    it('should return 0 for empty cart', () => {
      const { result } = renderHook(() => useCartStore());

      const totalItems = result.current.getTotalItems();
      expect(totalItems).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useCartStore());

      // Set error state
      act(() => {
        useCartStore.setState({ error: 'Some error' });
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('persistence', () => {
    it('should store items in the cart state', async () => {
      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 2,
          color: 'red',
          size: 'M',
          price: 99.99,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      // Test that cart state persists across operations
      await act(async () => {
        await result.current.addItem({
          productId: '2',
          quantity: 1,
          color: 'blue',
          size: 'L',
          price: 99.99,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
        expect(result.current.getTotalItems()).toBe(3); // 2 + 1
      });
    });
  });

  describe('edge cases', () => {
    it('should handle items with optional color and size', async () => {
      const { result } = renderHook(() => useCartStore());

      // Add item without color or size
      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 1,
          price: 99.99,
        });
      });

      // Add same item with color
      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 1,
          color: 'red',
          price: 99.99,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2); // Treated as different items
        expect(result.current.getItemQuantity('1', undefined, undefined)).toBe(1);
        expect(result.current.getItemQuantity('1', 'red', undefined)).toBe(1);
      });
    });

    it('should handle large quantities', async () => {
      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.addItem({
          productId: '1',
          quantity: 100,
          color: 'red',
          size: 'M',
          price: 99.99,
        });
      });

      await waitFor(() => {
        // Should be clamped to maximum of 99
        expect(result.current.getTotalItems()).toBe(99);
      });

      // Update to an even larger quantity
      await act(async () => {
        await result.current.updateItemQuantity('1', 'red', 'M', 500);
      });

      await waitFor(() => {
        // Should still be clamped to maximum of 99
        expect(result.current.items[0].quantity).toBe(99);
        expect(result.current.getTotalItems()).toBe(99);
      });
    });

    it('should handle multiple operations in sequence', async () => {
      const { result } = renderHook(() => useCartStore());

      // Add multiple items
      for (let i = 1; i <= 5; i++) {
        await act(async () => {
          await result.current.addItem({
            productId: i.toString(),
            quantity: i,
            color: 'red',
            size: 'M',
            price: 99.99,
          });
        });
      }

      await waitFor(() => {
        expect(result.current.items).toHaveLength(5);
        expect(result.current.getTotalItems()).toBe(15); // 1+2+3+4+5
      });

      // Remove some items
      await act(async () => {
        await result.current.removeItem('2', 'red', 'M');
        await result.current.removeItem('4', 'red', 'M');
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(3);
        expect(result.current.getTotalItems()).toBe(9); // 1+3+5
      });

      // Clear everything
      await act(async () => {
        await result.current.clearCart();
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0);
        expect(result.current.getTotalItems()).toBe(0);
      });
    });
  });

  describe('validateCartItems', () => {
    it('should remove items for deleted products', async () => {
      const { result } = renderHook(() => useCartStore());

      // Add items to cart
      await act(async () => {
        await result.current.addItem({
          productId: 'valid-product-1',
          quantity: 2,
          color: 'red',
          size: 'M',
          price: 100,
        });
        await result.current.addItem({
          productId: 'deleted-product',
          quantity: 1,
          color: 'blue',
          size: 'L',
          price: 50,
        });
        await result.current.addItem({
          productId: 'valid-product-2',
          quantity: 3,
          color: 'green',
          size: 'S',
          price: 75,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(3);
      });

      // Mock API response: only valid products exist
      mockHttpClient.get.mockResolvedValue({
        data: [{ documentId: 'valid-product-1' }, { documentId: 'valid-product-2' }],
      });

      // Validate cart
      let removedItems: any[];
      await act(async () => {
        removedItems = await result.current.validateCartItems();
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
        expect(result.current.items.map((i) => i.productId)).toEqual([
          'valid-product-1',
          'valid-product-2',
        ]);
      });

      expect(removedItems!).toHaveLength(1);
      expect(removedItems![0].productId).toBe('deleted-product');
    });

    it('should not modify cart if all products exist', async () => {
      const { result } = renderHook(() => useCartStore());

      await act(async () => {
        await result.current.addItem({
          productId: 'product-1',
          quantity: 2,
          price: 100,
        });
        await result.current.addItem({
          productId: 'product-2',
          quantity: 1,
          price: 50,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      // Mock API response: all products exist
      mockHttpClient.get.mockResolvedValue({
        data: [{ documentId: 'product-1' }, { documentId: 'product-2' }],
      });

      let removedItems: any[];
      await act(async () => {
        removedItems = await result.current.validateCartItems();
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      expect(removedItems!).toHaveLength(0);
    });

    it('should return empty array for empty cart', async () => {
      const { result } = renderHook(() => useCartStore());

      let removedItems: any[];
      await act(async () => {
        removedItems = await result.current.validateCartItems();
      });

      expect(removedItems!).toHaveLength(0);
      // httpClient.get should NOT be called when cart is empty
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should deduplicate product IDs when checking', async () => {
      const { result } = renderHook(() => useCartStore());

      // Add multiple items with same productId (different variants)
      await act(async () => {
        await result.current.addItem({
          productId: 'product-1',
          quantity: 1,
          color: 'red',
          size: 'M',
          price: 100,
        });
        await result.current.addItem({
          productId: 'product-1',
          quantity: 2,
          color: 'blue',
          size: 'L',
          price: 100,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      mockHttpClient.get.mockResolvedValue({
        data: [{ documentId: 'product-1' }],
      });

      await act(async () => {
        await result.current.validateCartItems();
      });

      // httpClient.get should be called with URL containing only one product ID filter
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('filters[documentId][$in][0]=product-1')
      );
      // Should NOT have a second filter index
      expect(mockHttpClient.get).not.toHaveBeenCalledWith(
        expect.stringContaining('filters[documentId][$in][1]')
      );
    });
  });
});
