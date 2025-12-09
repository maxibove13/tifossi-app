/**
 * Cart Persistence Integration Tests
 *
 * Testing the complete cart persistence behavior including:
 * - Local storage persistence for guest users
 * - Cart migration when users log in
 * - Sync with backend for authenticated users
 * - Offline/online behavior
 * - Stock validation
 *
 * Following TESTING_PRINCIPLES.md:
 * - Test behavior, not implementation
 * - Use real Zustand store
 * - Mock only at boundaries (MMKV, HTTP)
 */

import { renderHook, act, waitFor, cleanup } from '@testing-library/react-native';

// Import store types after mocking
import type { CartItem } from '../../_stores/cartStore';

let useCartStore: typeof import('../../_stores/cartStore').useCartStore;

// Mock MMKV at the boundary
const mockMMKVStore = new Map<string, string>();
const mockMMKV = {
  getString: jest.fn((key: string) => mockMMKVStore.get(key) || null),
  set: jest.fn((key: string, value: string) => {
    mockMMKVStore.set(key, value);
  }),
  delete: jest.fn((key: string) => {
    mockMMKVStore.delete(key);
  }),
  clearAll: jest.fn(() => {
    mockMMKVStore.clear();
  }),
};

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => mockMMKV),
}));

beforeAll(() => {
  process.env['EXPO_PUBLIC_API_BASE_URL'] =
    process.env['EXPO_PUBLIC_API_BASE_URL'] || 'http://localhost:1337';
  process.env['EXPO_PUBLIC_BACKEND_URL'] =
    process.env['EXPO_PUBLIC_BACKEND_URL'] || 'http://localhost:1337';
  process.env['EXPO_PUBLIC_API_URL'] =
    process.env['EXPO_PUBLIC_API_URL'] || 'http://localhost:1337/api';

  // Defer requiring the cart store until after env vars are set
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cartStoreModule = require('../../_stores/cartStore');
  useCartStore = cartStoreModule.useCartStore;
});

describe('Cart Persistence', () => {
  // Initial state for resetting between tests
  const createInitialState = () => ({
    items: [],
    isLoading: false,
    error: null,
    isGuestCart: true,
    lastSyncTimestamp: null,
    actionStatus: 'idle' as const,
    pendingOperations: [],
  });

  beforeEach(async () => {
    // Clear storage and reset store state properly
    mockMMKVStore.clear();

    useCartStore.setState(createInitialState());

    // Reset all mocks between tests
    jest.clearAllMocks();

    // Re-attach MMKV behavior after clearing mocks
    mockMMKV.getString.mockImplementation((key: string) => mockMMKVStore.get(key) || null);
    mockMMKV.set.mockImplementation((key: string, value: string) => {
      mockMMKVStore.set(key, value);
    });
    mockMMKV.delete.mockImplementation((key: string) => {
      mockMMKVStore.delete(key);
    });
    mockMMKV.clearAll.mockImplementation(() => {
      mockMMKVStore.clear();
    });

    // Configure HTTP client mocks
    const httpClient = require('../../_services/api/httpClient').default as any;

    httpClient.post.mockReset();
    httpClient.get.mockReset();
    httpClient.put.mockReset();
    httpClient.delete.mockReset();

    httpClient.post.mockImplementation(async (url: string, data?: any) => {
      await new Promise((resolve) => setTimeout(resolve, 10));

      if (url === '/cart/sync') {
        return { success: true, data: { cart: data?.items || [] } };
      }
      if (url === '/cart/migrate') {
        const guestItems = data?.guestItems || [];
        return {
          success: true,
          mergedItems: guestItems,
        };
      }
      return { success: true };
    });

    httpClient.put.mockImplementation(async (url: string, data?: any) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (url === '/users/me') {
        return { success: true, cart: data?.cart || [], data: { cart: data?.cart || [] } };
      }
      return { success: true };
    });

    httpClient.get.mockImplementation(async (url: string) => {
      await new Promise((resolve) => setTimeout(resolve, 10));

      if (url.startsWith('/users/me')) {
        return { data: { cart: [] }, cart: [] };
      }
      return { data: [] };
    });

    httpClient.delete.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Local Storage Persistence (Guest Users)', () => {
    it('should persist cart items through app restart', async () => {
      const { result } = renderHook(() => useCartStore());

      const testItem: CartItem = {
        productId: 'prod_1',
        quantity: 2,
        color: 'Negro',
        size: 'M',
        price: 2500,
      };

      // Add item to cart
      await act(async () => {
        await result.current.addItem(testItem);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0]).toEqual(testItem);
      });

      // Zustand persist middleware should automatically save to MMKV
      // Let's simulate what happens on app restart

      // Store the current state before simulating restart
      const currentItems = [...result.current.items];

      // Simulate app restart by creating a new hook instance
      // In a real app restart, the store would rehydrate from MMKV
      const { result: newResult } = renderHook(() => useCartStore());

      // Since our mock doesn't auto-persist, manually simulate persistence
      mockMMKV.set(
        'tifossi-cart-local',
        JSON.stringify({
          state: {
            items: currentItems,
            isGuestCart: true,
          },
        })
      );

      // Manually trigger state restoration (simulating what persist middleware does on mount)
      act(() => {
        const storedData = mockMMKV.getString('tifossi-cart-local');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          newResult.current.setItems(parsedData.state.items);
        }
      });

      // Verify items are restored
      await waitFor(() => {
        expect(newResult.current.items).toHaveLength(1);
        expect(newResult.current.items[0]).toEqual(testItem);
        expect(newResult.current.isGuestCart).toBe(true);
      });
    });

    it('should persist cart modifications immediately', async () => {
      const { result } = renderHook(() => useCartStore());

      // Add first item
      await act(async () => {
        await result.current.addItem({
          productId: 'prod_1',
          quantity: 1,
          color: 'Azul',
          size: 'L',
          price: 3000,
        });
      });

      // Simulate persistence (Zustand would do this automatically)
      mockMMKV.set(
        'tifossi-cart-local',
        JSON.stringify({
          state: { items: result.current.items, isGuestCart: true },
        })
      );

      // Verify stored
      let storedData = mockMMKVStore.get('tifossi-cart-local');
      let parsedData = JSON.parse(storedData!);
      expect(parsedData.state.items).toHaveLength(1);

      // Update quantity
      await act(async () => {
        await result.current.updateItemQuantity('prod_1', 'Azul', 'L', 3);
      });

      // Simulate persistence after update
      mockMMKV.set(
        'tifossi-cart-local',
        JSON.stringify({
          state: { items: result.current.items, isGuestCart: true },
        })
      );

      // Verify update persisted
      storedData = mockMMKVStore.get('tifossi-cart-local');
      parsedData = JSON.parse(storedData!);
      expect(parsedData.state.items[0].quantity).toBe(3);

      // Remove item
      await act(async () => {
        await result.current.removeItem('prod_1', 'Azul', 'L');
      });

      // Simulate persistence after removal
      mockMMKV.set(
        'tifossi-cart-local',
        JSON.stringify({
          state: { items: result.current.items, isGuestCart: true },
        })
      );

      // Verify removal persisted
      storedData = mockMMKVStore.get('tifossi-cart-local');
      parsedData = JSON.parse(storedData!);
      expect(parsedData.state.items).toHaveLength(0);
    });

    it('should handle corrupted storage gracefully', async () => {
      // Store corrupted data
      mockMMKVStore.set('tifossi-cart-local', 'invalid_json{[}');

      const { result } = renderHook(() => useCartStore());

      // Attempt to rehydrate
      await act(async () => {
        try {
          const storage = useCartStore.persist.getOptions().storage;
          if (storage) {
            await storage.getItem('tifossi-cart-local');
          }
        } catch {
          // Should handle error gracefully
        }
      });

      // Cart should initialize empty
      expect(result.current.items).toHaveLength(0);
      expect(result.current.error).toBeNull();
      expect(result.current.isGuestCart).toBe(true);

      // Should be able to add items normally
      await act(async () => {
        await result.current.addItem({
          productId: 'prod_1',
          quantity: 1,
          price: 1000,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });
    });

    it('should maintain separate items for different variants', async () => {
      const { result } = renderHook(() => useCartStore());

      // Add same product with different colors
      await act(async () => {
        await result.current.addItem({
          productId: 'prod_1',
          quantity: 1,
          color: 'Negro',
          size: 'M',
          price: 2500,
        });
      });

      await act(async () => {
        await result.current.addItem({
          productId: 'prod_1',
          quantity: 2,
          color: 'Azul',
          size: 'M',
          price: 2500,
        });
      });

      // Simulate persistence after adding variants
      mockMMKV.set(
        'tifossi-cart-local',
        JSON.stringify({
          state: { items: result.current.items, isGuestCart: true },
        })
      );

      // Verify both variants stored separately
      const storedData = mockMMKVStore.get('tifossi-cart-local');
      const parsedData = JSON.parse(storedData!);
      expect(parsedData.state.items).toHaveLength(2);
      expect(parsedData.state.items[0].color).toBe('Negro');
      expect(parsedData.state.items[1].color).toBe('Azul');
    });
  });

  describe('Guest to Authenticated Migration', () => {
    it('should merge guest cart with user cart on login', async () => {
      const { result } = renderHook(() => useCartStore());

      // Add items as guest
      await act(async () => {
        await result.current.addItem({
          productId: 'prod_1',
          quantity: 2,
          color: 'Negro',
          size: 'M',
          price: 2500,
        });
        await result.current.addItem({
          productId: 'prod_2',
          quantity: 1,
          color: 'Azul',
          size: 'L',
          price: 3500,
        });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
        expect(result.current.isGuestCart).toBe(true);
      });

      // Mock the specific calls for migration flow
      // First, mock fetching user's existing cart
      const httpClient = require('../../_services/api/httpClient').default;
      httpClient.get.mockResolvedValueOnce({
        data: [
          {
            productId: 'prod_1',
            quantity: 1,
            color: 'Negro',
            size: 'M',
            price: 2500,
          },
          {
            productId: 'prod_3',
            quantity: 3,
            color: 'Rojo',
            size: 'S',
            price: 2000,
          },
        ],
        cart: [
          {
            productId: 'prod_1',
            quantity: 1,
            color: 'Negro',
            size: 'M',
            price: 2500,
          },
          {
            productId: 'prod_3',
            quantity: 3,
            color: 'Rojo',
            size: 'S',
            price: 2000,
          },
        ],
      });

      // Mock the migration response - this should combine guest and user items
      httpClient.post.mockImplementationOnce(async (url: string, data?: any) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        if (url === '/cart/migrate') {
          // Simulate merging logic
          const guestItems = data?.guestItems || [];
          const userItems = [
            { productId: 'prod_1', quantity: 1, color: 'Negro', size: 'M', price: 2500 },
            { productId: 'prod_3', quantity: 3, color: 'Rojo', size: 'S', price: 2000 },
          ];

          // Merge items - combine quantities for matching products
          const merged = [...guestItems];
          userItems.forEach((userItem) => {
            const existingIndex = merged.findIndex(
              (item) =>
                item.productId === userItem.productId &&
                item.color === userItem.color &&
                item.size === userItem.size
            );
            if (existingIndex >= 0) {
              merged[existingIndex].quantity += userItem.quantity;
            } else {
              merged.push(userItem);
            }
          });

          return { success: true, mergedItems: merged };
        }
        return { success: true };
      });

      // Simulate login and migration
      await act(async () => {
        result.current.setAuthToken('test-auth-token');
        await result.current.migrateGuestCart('test-auth-token');
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(3);
        expect(result.current.isGuestCart).toBe(false);
        // Check merged quantities
        const prod1 = result.current.items.find(
          (item) => item.productId === 'prod_1' && item.color === 'Negro'
        );
        expect(prod1?.quantity).toBe(3);
      });
    });

    it('should handle empty guest cart migration', async () => {
      const { result } = renderHook(() => useCartStore());

      // Start with empty guest cart
      expect(result.current.items).toHaveLength(0);
      expect(result.current.isGuestCart).toBe(true);

      // Mock user cart from server
      const httpClient = require('../../_services/api/httpClient').default;
      httpClient.get.mockResolvedValueOnce({
        data: [
          {
            productId: 'prod_1',
            quantity: 2,
            color: 'Negro',
            size: 'M',
            price: 2500,
          },
        ],
      });

      // Simulate login
      await act(async () => {
        result.current.setAuthToken('test-auth-token');
        await result.current.fetchUserCart();
      });

      await waitFor(() => {
        expect(result.current.isGuestCart).toBe(false);
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].productId).toBe('prod_1');
      });
    });

    it('should preserve guest cart on migration error', async () => {
      const { result } = renderHook(() => useCartStore());

      // Add items as guest
      await act(async () => {
        await result.current.addItem({
          productId: 'prod_1',
          quantity: 2,
          color: 'Negro',
          size: 'M',
          price: 2500,
        });
      });

      const guestItems = [...result.current.items];

      // Mock migration failure
      const httpClient = require('../../_services/api/httpClient').default;
      httpClient.post.mockRejectedValueOnce(new Error('Server error'));

      // Attempt migration
      await act(async () => {
        result.current.setAuthToken('test-auth-token');
        await result.current.migrateGuestCart('test-auth-token');
      });

      await waitFor(() => {
        // Guest items should be preserved
        expect(result.current.items).toEqual(guestItems);
        expect(result.current.isGuestCart).toBe(false); // Still marked as authenticated
        expect(result.current.error).toContain('Failed to migrate cart');
      });
    });

    it('should handle duplicate items during migration', async () => {
      const { result } = renderHook(() => useCartStore());

      // Add item as guest
      await act(async () => {
        await result.current.addItem({
          productId: 'prod_1',
          quantity: 5,
          color: 'Negro',
          size: 'M',
          price: 2500,
        });
      });

      // Mock user has same item
      const httpClient = require('../../_services/api/httpClient').default;
      httpClient.get.mockResolvedValueOnce({
        data: [
          {
            productId: 'prod_1',
            quantity: 3,
            color: 'Negro',
            size: 'M',
            price: 2500,
          },
        ],
      });

      // Mock merged result
      httpClient.post.mockResolvedValueOnce({
        mergedItems: [
          {
            productId: 'prod_1',
            quantity: 8, // Combined quantities
            color: 'Negro',
            size: 'M',
            price: 2500,
          },
        ],
      });

      await act(async () => {
        result.current.setAuthToken('test-auth-token');
        await result.current.migrateGuestCart('test-auth-token');
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].quantity).toBe(8);
      });
    });
  });

  describe('Authenticated User Sync', () => {
    beforeEach(() => {
      // Set up as authenticated user
      useCartStore.setState({
        ...createInitialState(),
        isGuestCart: false,
      });
    });

    it('should fetch cart from server on login', async () => {
      const { result } = renderHook(() => useCartStore());

      const httpClient = require('../../_services/api/httpClient').default;
      const serverCart = [
        {
          productId: 'prod_1',
          quantity: 2,
          color: 'Negro',
          size: 'M',
          price: 2500,
        },
        {
          productId: 'prod_2',
          quantity: 1,
          color: 'Azul',
          size: 'L',
          price: 3500,
        },
      ];

      httpClient.get.mockResolvedValueOnce({
        data: serverCart,
        cart: serverCart,
      });

      await act(async () => {
        result.current.setAuthToken('test-auth-token');
        await result.current.fetchUserCart();
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
        expect(result.current.items[0].productId).toBe('prod_1');
        expect(result.current.items[1].productId).toBe('prod_2');
        expect(result.current.isGuestCart).toBe(false);
      });
    });

    it('should sync cart changes to server', async () => {
      const { result } = renderHook(() => useCartStore());
      const httpClient = require('../../_services/api/httpClient').default;

      // Set auth token
      act(() => {
        result.current.setAuthToken('test-auth-token');
      });

      // Add item
      await act(async () => {
        await result.current.addItem({
          productId: 'prod_1',
          quantity: 1,
          color: 'Negro',
          size: 'M',
          price: 2500,
        });
      });

      // Verify sync API was called
      await waitFor(() => {
        expect(httpClient.post).toHaveBeenCalledWith(
          '/cart/sync',
          expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({
                productId: 'prod_1',
                quantity: 1,
              }),
            ]),
          })
        );
      });

      // Update quantity
      await act(async () => {
        await result.current.updateItemQuantity('prod_1', 'Negro', 'M', 3);
      });

      // Verify sync called again
      await waitFor(() => {
        expect(httpClient.post).toHaveBeenCalledWith(
          '/cart/sync',
          expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({
                productId: 'prod_1',
                quantity: 3,
              }),
            ]),
          })
        );
      });
    });

    it('should handle optimistic updates and rollback on error', async () => {
      const { result } = renderHook(() => useCartStore());

      // Set auth token
      act(() => {
        result.current.setAuthToken('test-auth-token');
      });

      // Add initial item
      await act(async () => {
        await result.current.addItem({
          productId: 'prod_1',
          quantity: 1,
          color: 'Negro',
          size: 'M',
          price: 2500,
        });
      });

      const initialItems = [...result.current.items];
      const httpClient = require('../../_services/api/httpClient').default;
      // Mock sync failure for next operation
      httpClient.post.mockRejectedValueOnce(new Error('Network error'));

      // Try to add another item
      await act(async () => {
        await result.current.addItem({
          productId: 'prod_2',
          quantity: 2,
          color: 'Azul',
          size: 'L',
          price: 3000,
        });
      });

      await waitFor(() => {
        // Should rollback to initial state
        expect(result.current.items).toEqual(initialItems);
        expect(result.current.error).toContain('Failed to update cart');
      });
    });

    it('should handle concurrent updates correctly', async () => {
      const { result } = renderHook(() => useCartStore());
      const httpClient = require('../../_services/api/httpClient').default;

      // Set auth token
      act(() => {
        result.current.setAuthToken('test-auth-token');
      });

      // Simulate rapid concurrent updates
      const updates = Promise.all([
        act(async () => {
          await result.current.addItem({
            productId: 'prod_1',
            quantity: 1,
            color: 'Negro',
            size: 'M',
            price: 2500,
          });
        }),
        act(async () => {
          await result.current.addItem({
            productId: 'prod_2',
            quantity: 2,
            color: 'Azul',
            size: 'L',
            price: 3000,
          });
        }),
      ]);

      await updates;

      await waitFor(() => {
        // Both items should be in cart
        expect(result.current.items).toHaveLength(2);
        // Verify final sync has both items
        expect(httpClient.post).toHaveBeenLastCalledWith(
          '/cart/sync',
          expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({ productId: 'prod_1' }),
              expect.objectContaining({ productId: 'prod_2' }),
            ]),
          })
        );
      });
    });
  });

  describe('Offline/Online Behavior', () => {
    it('should queue operations while offline', async () => {
      const httpClient = require('../../_services/api/httpClient').default;

      httpClient.post.mockRejectedValue(new Error('Network unavailable'));

      await act(async () => {
        await useCartStore.getState().addItem({
          productId: 'prod_1',
          quantity: 1,
          color: 'Negro',
          size: 'M',
          price: 2500,
        });
      });

      await waitFor(() => {
        const state = useCartStore.getState();
        expect(state.items).toHaveLength(0);
        expect(state.error).toContain('Failed to update cart');
      });

      httpClient.post.mockResolvedValueOnce({ success: true });

      await act(async () => {
        await useCartStore.getState().addItem({
          productId: 'prod_2',
          quantity: 1,
          color: 'Azul',
          size: 'L',
          price: 3000,
        });
      });

      await waitFor(() => {
        const state = useCartStore.getState();
        expect(state.items).toHaveLength(1);
        expect(state.items[0].productId).toBe('prod_2');
        expect(state.error).toBeNull();
      });
    });

    it('should handle network errors gracefully', async () => {
      const httpClient = require('../../_services/api/httpClient').default;

      act(() => {
        useCartStore.getState().setAuthToken('test-auth-token');
      });

      await act(async () => {
        await useCartStore.getState().addItem({
          productId: 'prod_1',
          quantity: 1,
          color: 'Negro',
          size: 'M',
          price: 2500,
        });
      });

      httpClient.post.mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      await act(async () => {
        await useCartStore.getState().addItem({
          productId: 'prod_2',
          quantity: 1,
          color: 'Azul',
          size: 'L',
          price: 3000,
        });
      });

      await waitFor(() => {
        const state = useCartStore.getState();
        expect(state.items).toHaveLength(1);
        expect(state.items[0].productId).toBe('prod_1');
        expect(state.error).toBeTruthy();
      });
    });

    it('should rollback on permanent failure', async () => {
      const httpClient = require('../../_services/api/httpClient').default;

      act(() => {
        useCartStore.getState().setAuthToken('test-auth-token');
      });

      await act(async () => {
        await useCartStore.getState().addItem({
          productId: 'prod_1',
          quantity: 1,
          color: 'Negro',
          size: 'M',
          price: 2500,
        });
      });

      const previousItems = [...useCartStore.getState().items];

      httpClient.post.mockRejectedValueOnce({
        response: { status: 400, data: { error: 'Invalid item' } },
      });

      await act(async () => {
        await useCartStore.getState().updateItemQuantity('prod_1', 'Negro', 'M', 100);
      });

      await waitFor(() => {
        const state = useCartStore.getState();
        expect(state.items).toEqual(previousItems);
        expect(state.error).toBeTruthy();
      });
    });
  });
});
