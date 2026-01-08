/**
 * Favorites Store Tests
 * Testing real Zustand store implementation with network mocking
 * Following TESTING_PRINCIPLES.md: Test behavior, not implementation
 * Mock only at httpClient boundary (which is already mocked in setup.ts)
 */

import { renderHook, act, cleanup } from '@testing-library/react-native';
import { useFavoritesStore } from '../../_stores/favoritesStore';
import { useAuthStore } from '../../_stores/authStore';
import httpClient from '../../_services/api/httpClient';

// Get the mocked httpClient
const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('favoritesStore', () => {
  beforeEach(() => {
    // Reset store state
    useFavoritesStore.setState({
      productIds: [],
      items: [],
      isLoading: false,
      error: null,
      lastSyncTimestamp: null,
      actionStatus: 'idle',
      pendingOperations: [],
    });

    // Set auth store to logged-in state so favorites sync works
    useAuthStore.setState({
      isLoggedIn: true,
      token: 'mock-token',
    });

    // Reset mocks
    jest.clearAllMocks();

    // Setup default success response for favorites sync
    mockHttpClient.put.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    // Clean up any mounted components
    cleanup();
  });

  describe('Basic Operations', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useFavoritesStore());

      expect(result.current.productIds).toEqual([]);
      expect(result.current.items).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should add a product to favorites', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      await act(async () => {
        await result.current.addFavorite('product-1');
      });

      expect(result.current.productIds).toContain('product-1');
      expect(result.current.items).toContain('product-1');
      // The implementation uses apiManager.syncFavorites which calls:
      // httpClient.put('/user-profile/me', { favorites: { set: productIds } })
      expect(mockHttpClient.put).toHaveBeenCalledWith('/user-profile/me', {
        favorites: { set: ['product-1'] },
      });
    });

    it('should not add duplicate favorites', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      await act(async () => {
        await result.current.addFavorite('product-1');
      });

      // Clear mock to check it's not called again
      mockHttpClient.put.mockClear();

      await act(async () => {
        await result.current.addFavorite('product-1');
      });

      expect(result.current.productIds).toEqual(['product-1']);
      expect(mockHttpClient.put).not.toHaveBeenCalled();
    });

    it('should remove a product from favorites', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Add first
      await act(async () => {
        await result.current.addFavorite('product-1');
        await result.current.addFavorite('product-2');
      });

      // Clear mock
      mockHttpClient.put.mockClear();

      // Then remove
      await act(async () => {
        await result.current.removeFavorite('product-1');
      });

      expect(result.current.productIds).toEqual(['product-2']);
      // The implementation uses apiManager.syncFavorites which calls:
      // httpClient.put('/user-profile/me', { favorites: { set: productIds } })
      expect(mockHttpClient.put).toHaveBeenCalledWith('/user-profile/me', {
        favorites: { set: ['product-2'] },
      });
    });

    it('should not error when removing non-existent favorite', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      await act(async () => {
        await result.current.removeFavorite('non-existent');
      });

      expect(result.current.error).toBeNull();
      expect(mockHttpClient.put).not.toHaveBeenCalled();
    });
  });

  describe('Toggle Functionality', () => {
    it('should toggle favorite status', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Toggle on
      await act(async () => {
        await result.current.toggleFavorite('product-1');
      });
      expect(result.current.productIds).toContain('product-1');

      // Toggle off
      await act(async () => {
        await result.current.toggleFavorite('product-1');
      });
      expect(result.current.productIds).not.toContain('product-1');
    });

    it('should correctly identify if product is favorite', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      expect(result.current.isFavorite('product-1')).toBe(false);

      await act(async () => {
        await result.current.addFavorite('product-1');
      });

      expect(result.current.isFavorite('product-1')).toBe(true);
      expect(result.current.isFavorite('product-2')).toBe(false);
    });
  });

  describe('Server Sync', () => {
    it('should sync with server successfully', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Add some favorites first
      await act(async () => {
        await result.current.addFavorite('product-1');
        await result.current.addFavorite('product-2');
      });

      // Clear mock
      mockHttpClient.put.mockClear();

      await act(async () => {
        await result.current.syncWithServer();
      });

      // The implementation uses apiManager.syncFavorites which calls:
      // httpClient.put('/user-profile/me', { favorites: { set: productIds } })
      expect(mockHttpClient.put).toHaveBeenCalledWith('/user-profile/me', {
        favorites: { set: ['product-1', 'product-2'] },
      });
      expect(result.current.error).toBeNull();
    });

    it('should handle sync failure gracefully', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Mock failure
      mockHttpClient.put.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await result.current.syncWithServer();
      });

      expect(result.current.error).toBe('Failed to sync favorites with server.');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should rollback on failed add', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Mock failure
      mockHttpClient.put.mockRejectedValueOnce(new Error('API Error'));

      await act(async () => {
        await result.current.addFavorite('product-1');
      });

      expect(result.current.productIds).toEqual([]);
      expect(result.current.error).toBe('Failed to update favorites.');
    });

    it('should rollback on failed remove', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Add successfully first
      await act(async () => {
        await result.current.addFavorite('product-1');
      });

      // Now fail the remove
      mockHttpClient.put.mockRejectedValueOnce(new Error('API Error'));

      await act(async () => {
        await result.current.removeFavorite('product-1');
      });

      expect(result.current.productIds).toContain('product-1');
      expect(result.current.error).toBe('Failed to update favorites.');
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Set an error
      act(() => {
        useFavoritesStore.setState({ error: 'Some error' });
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('should set loading state during operations', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Mock a delayed response
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockHttpClient.put.mockReturnValueOnce(delayedPromise);

      // Start the operation
      act(() => {
        result.current.addFavorite('product-1');
      });

      // Check loading state is true while operation is pending
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ success: true });
        await delayedPromise;
      });

      // Check loading state is false after operation completes
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Retry Failed Operations', () => {
    it('should retry failed operations successfully', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      await act(async () => {
        await result.current.retryFailedOperations();
      });

      expect(result.current.actionStatus).toBe('succeeded');
      expect(result.current.pendingOperations).toEqual([]);
      expect(result.current.lastSyncTimestamp).toBeTruthy();
    });
  });

  describe('Multiple Operations', () => {
    it('should handle multiple products', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      const products = ['product-1', 'product-2', 'product-3', 'product-4'];

      for (const productId of products) {
        await act(async () => {
          await result.current.addFavorite(productId);
        });
      }

      expect(result.current.productIds).toHaveLength(4);
      expect(result.current.productIds).toEqual(expect.arrayContaining(products));
    });

    it('should handle mixed add/remove operations', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      await act(async () => {
        await result.current.addFavorite('product-1');
        await result.current.addFavorite('product-2');
        await result.current.addFavorite('product-3');
      });

      await act(async () => {
        await result.current.removeFavorite('product-2');
        await result.current.addFavorite('product-4');
        await result.current.removeFavorite('product-1');
      });

      expect(result.current.productIds).toEqual(['product-3', 'product-4']);
    });
  });

  describe('Optimistic Updates', () => {
    it('should apply optimistic updates immediately', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Mock a delayed response
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockHttpClient.put.mockReturnValueOnce(delayedPromise);

      // Start the operation (but don't await it)
      act(() => {
        result.current.addFavorite('product-1');
      });

      // Check optimistic update applied immediately (before promise resolves)
      expect(result.current.productIds).toContain('product-1');

      // Now complete the operation
      await act(async () => {
        resolvePromise!({ success: true });
        await delayedPromise;
      });

      // Should still have the product
      expect(result.current.productIds).toContain('product-1');
    });

    it('should rollback optimistic updates on failure', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Start with one item
      await act(async () => {
        await result.current.addFavorite('product-1');
      });

      // Now try to add another that will fail
      mockHttpClient.put.mockRejectedValueOnce(new Error('Failed'));

      await act(async () => {
        await result.current.addFavorite('product-2');
      });

      // Should rollback to just product-1
      expect(result.current.productIds).toEqual(['product-1']);
      expect(result.current.productIds).not.toContain('product-2');
    });
  });

  describe('State Consistency', () => {
    it('should keep productIds and items in sync', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      await act(async () => {
        await result.current.addFavorite('product-1');
        await result.current.addFavorite('product-2');
      });

      expect(result.current.productIds).toEqual(result.current.items);

      await act(async () => {
        await result.current.removeFavorite('product-1');
      });

      expect(result.current.productIds).toEqual(result.current.items);
      expect(result.current.items).toEqual(['product-2']);
    });
  });
});
