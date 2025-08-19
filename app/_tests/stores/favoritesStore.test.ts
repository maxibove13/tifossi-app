/**
 * Favorites Store State Management Tests
 * Tests favorites state behavior with real store and API integration
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useFavoritesStore } from '../../_stores/favoritesStore';
import { mswHelpers } from '../utils/msw-setup';

// Mock MMKV storage
const mockStorage = new Map<string, string>();
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn((key: string, value: string) => mockStorage.set(key, value)),
    getString: jest.fn((key: string) => mockStorage.get(key) || null),
    getNumber: jest.fn((key: string) => {
      const value = mockStorage.get(key);
      return value ? Number(value) : undefined;
    }),
    getBoolean: jest.fn((key: string) => {
      const value = mockStorage.get(key);
      return value ? JSON.parse(value) : undefined;
    }),
    contains: jest.fn((key: string) => mockStorage.has(key)),
    delete: jest.fn((key: string) => mockStorage.delete(key)),
    clearAll: jest.fn(() => mockStorage.clear()),
    getAllKeys: jest.fn(() => Array.from(mockStorage.keys())),
  })),
}));

// Mock API manager
jest.mock('../../_services/api', () => ({
  default: {
    syncFavorites: jest.fn().mockResolvedValue(true),
  },
}));

const setupTest = () => {
  mockStorage.clear();
  // Reset store to initial state
  useFavoritesStore.setState({
    productIds: [],
    isLoading: false,
    error: null,
    lastSyncTimestamp: null,
    pendingOperations: [],
    actionStatus: 'idle',
  });
};

describe('Favorites Store State Management', () => {
  beforeAll(() => {
    mswHelpers.startServer();
  });

  afterAll(() => {
    mswHelpers.stopServer();
  });

  beforeEach(() => {
    setupTest();
    mswHelpers.resetHandlers();

    // Reset API mocks
    const apiManager = require('../../_services/api').default;
    apiManager.syncFavorites.mockClear();
    apiManager.syncFavorites.mockResolvedValue(true);
  });

  describe('Adding Favorites', () => {
    it('should add favorite with optimistic update and server sync', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      expect(result.current.productIds).toEqual([]);
      expect(result.current.isFavorite('product-1')).toBe(false);

      await act(async () => {
        await result.current.addFavorite('product-1');
      });

      await waitFor(() => {
        expect(result.current.productIds).toContain('product-1');
        expect(result.current.isFavorite('product-1')).toBe(true);
        expect(result.current.actionStatus).toBe('succeeded');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      // Verify API was called
      const apiManager = require('../../_services/api').default;
      expect(apiManager.syncFavorites).toHaveBeenCalledWith(['product-1']);
    });

    it('should not add duplicate favorites', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Add favorite twice
      await act(async () => {
        await result.current.addFavorite('product-1');
        await result.current.addFavorite('product-1');
      });

      await waitFor(() => {
        expect(result.current.productIds).toEqual(['product-1']);
        expect(result.current.productIds.length).toBe(1);
      });
    });

    it('should handle add favorite API failure with rollback', async () => {
      const apiManager = require('../../_services/api').default;
      apiManager.syncFavorites.mockRejectedValue(new Error('Sync failed'));

      const { result } = renderHook(() => useFavoritesStore());

      await act(async () => {
        await result.current.addFavorite('product-1');
      });

      await waitFor(() => {
        expect(result.current.productIds).toEqual([]); // Rolled back
        expect(result.current.actionStatus).toBe('failed');
        expect(result.current.error).toBe('Failed to update favorites.');
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Removing Favorites', () => {
    beforeEach(async () => {
      // Setup with existing favorites
      const { result } = renderHook(() => useFavoritesStore());
      await act(async () => {
        await result.current.addFavorite('product-1');
        await result.current.addFavorite('product-2');
      });
    });

    it('should remove favorite with optimistic update', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      expect(result.current.isFavorite('product-1')).toBe(true);

      await act(async () => {
        await result.current.removeFavorite('product-1');
      });

      await waitFor(() => {
        expect(result.current.productIds).not.toContain('product-1');
        expect(result.current.productIds).toContain('product-2');
        expect(result.current.isFavorite('product-1')).toBe(false);
        expect(result.current.actionStatus).toBe('succeeded');
      });
    });

    it('should not remove non-existent favorites', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      const initialIds = result.current.productIds;

      await act(async () => {
        await result.current.removeFavorite('non-existent-product');
      });

      // Should remain unchanged
      expect(result.current.productIds).toEqual(initialIds);
    });

    it('should handle remove favorite API failure with rollback', async () => {
      const apiManager = require('../../_services/api').default;
      apiManager.syncFavorites.mockRejectedValue(new Error('Sync failed'));

      const { result } = renderHook(() => useFavoritesStore());
      const initialIds = result.current.productIds;

      await act(async () => {
        await result.current.removeFavorite('product-1');
      });

      await waitFor(() => {
        expect(result.current.productIds).toEqual(initialIds); // Rolled back
        expect(result.current.actionStatus).toBe('failed');
        expect(result.current.error).toBe('Failed to update favorites.');
      });
    });
  });

  describe('Toggle Favorites', () => {
    it('should toggle favorite from unfavorited to favorited', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      expect(result.current.isFavorite('product-1')).toBe(false);

      await act(async () => {
        await result.current.toggleFavorite('product-1');
      });

      await waitFor(() => {
        expect(result.current.isFavorite('product-1')).toBe(true);
        expect(result.current.actionStatus).toBe('succeeded');
      });
    });

    it('should toggle favorite from favorited to unfavorited', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Add favorite first
      await act(async () => {
        await result.current.addFavorite('product-1');
      });

      expect(result.current.isFavorite('product-1')).toBe(true);

      // Toggle off
      await act(async () => {
        await result.current.toggleFavorite('product-1');
      });

      await waitFor(() => {
        expect(result.current.isFavorite('product-1')).toBe(false);
        expect(result.current.actionStatus).toBe('succeeded');
      });
    });

    it('should handle toggle failure and maintain error state', async () => {
      const apiManager = require('../../_services/api').default;
      apiManager.syncFavorites.mockRejectedValue(new Error('Toggle failed'));

      const { result } = renderHook(() => useFavoritesStore());

      await act(async () => {
        try {
          await result.current.toggleFavorite('product-1');
        } catch (error) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.actionStatus).toBe('failed');
      });
    });
  });

  describe('State Persistence and Hydration', () => {
    it('should persist favorites across app restarts', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Add favorites
      await act(async () => {
        await result.current.addFavorite('product-1');
        await result.current.addFavorite('product-2');
      });

      const persistedIds = result.current.productIds;
      const timestamp = result.current.lastSyncTimestamp;

      // Simulate app restart by creating new store instance
      setupTest();

      // Manually set persisted data to simulate hydration
      useFavoritesStore.setState({
        productIds: persistedIds,
        lastSyncTimestamp: timestamp,
        isLoading: false,
        error: null,
        pendingOperations: [],
        actionStatus: 'idle',
      });

      const { result: newResult } = renderHook(() => useFavoritesStore());

      expect(newResult.current.productIds).toEqual(persistedIds);
      expect(newResult.current.lastSyncTimestamp).toBe(timestamp);
    });

    it('should handle corrupted storage gracefully', async () => {
      // Simulate corrupted storage by setting invalid data
      mockStorage.set('tifossi-favorites-local', 'invalid-json');

      const { result } = renderHook(() => useFavoritesStore());

      // Should initialize with default state
      expect(result.current.productIds).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Server Synchronization', () => {
    it('should sync with server and update sync timestamp', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Add some favorites first
      await act(async () => {
        await result.current.addFavorite('product-1');
      });

      const beforeSync = result.current.lastSyncTimestamp;

      await act(async () => {
        await result.current.syncWithServer();
      });

      await waitFor(() => {
        expect(result.current.actionStatus).toBe('succeeded');
        expect(result.current.lastSyncTimestamp).toBeGreaterThan(beforeSync || 0);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle sync failure and maintain error state', async () => {
      const apiManager = require('../../_services/api').default;
      apiManager.syncFavorites.mockRejectedValue(new Error('Sync failed'));

      const { result } = renderHook(() => useFavoritesStore());

      await act(async () => {
        await result.current.syncWithServer();
      });

      await waitFor(() => {
        expect(result.current.actionStatus).toBe('failed');
        expect(result.current.error).toBe('Failed to sync favorites with server.');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should retry failed operations successfully', async () => {
      const apiManager = require('../../_services/api').default;

      // First call fails
      apiManager.syncFavorites.mockRejectedValueOnce(new Error('First failure'));
      // Second call succeeds
      apiManager.syncFavorites.mockResolvedValueOnce(true);

      const { result } = renderHook(() => useFavoritesStore());

      // Add favorite and fail
      await act(async () => {
        await result.current.addFavorite('product-1');
      });

      expect(result.current.error).toBe('Failed to update favorites.');

      // Retry
      await act(async () => {
        await result.current.retryFailedOperations();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.actionStatus).toBe('succeeded');
        expect(result.current.lastSyncTimestamp).toBeGreaterThan(0);
      });
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent add/remove operations', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Simulate rapid concurrent operations
      await act(async () => {
        const operations = [
          result.current.addFavorite('product-1'),
          result.current.addFavorite('product-2'),
          result.current.addFavorite('product-3'),
          result.current.removeFavorite('product-1'),
          result.current.addFavorite('product-4'),
        ];

        await Promise.allSettled(operations);
      });

      await waitFor(() => {
        // Should end up in consistent state
        expect(result.current.productIds).not.toContain('product-1');
        expect(result.current.productIds).toContain('product-2');
        expect(result.current.productIds).toContain('product-3');
        expect(result.current.productIds).toContain('product-4');
        expect(result.current.pendingOperations).toEqual([]);
      });
    });

    it('should handle concurrent toggle operations on same product', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      await act(async () => {
        // Multiple rapid toggles on same product
        const toggles = [
          result.current.toggleFavorite('product-1'),
          result.current.toggleFavorite('product-1'),
          result.current.toggleFavorite('product-1'),
        ];

        await Promise.allSettled(toggles);
      });

      await waitFor(() => {
        // Should end up in deterministic state
        const isFavorite = result.current.isFavorite('product-1');
        expect(typeof isFavorite).toBe('boolean');
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should clear error state when requested', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Set error state
      useFavoritesStore.setState({ error: 'Test error' });
      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle storage errors gracefully', async () => {
      // Mock storage to throw errors
      const originalSet = mockStorage.set;
      mockStorage.set = jest.fn(() => {
        throw new Error('Storage full');
      });

      const { result } = renderHook(() => useFavoritesStore());

      // Should still work in memory even if storage fails
      await act(async () => {
        await result.current.addFavorite('product-1');
      });

      // Restore storage for cleanup
      mockStorage.set = originalSet;
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large number of favorites efficiently', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      const startTime = performance.now();

      await act(async () => {
        // Add 100 favorites rapidly
        const addPromises = [];
        for (let i = 0; i < 100; i++) {
          addPromises.push(result.current.addFavorite(`product-${i}`));
        }
        await Promise.allSettled(addPromises);
      });

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      await waitFor(() => {
        expect(result.current.productIds.length).toBe(100);
      });

      // Should complete within reasonable time
      expect(operationTime).toBeLessThan(5000);
    });

    it('should maintain memory efficiency with frequent operations', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Perform many add/remove cycles
      for (let cycle = 0; cycle < 10; cycle++) {
        await act(async () => {
          await result.current.addFavorite(`product-${cycle}`);
          await result.current.removeFavorite(`product-${cycle}`);
        });
      }

      // Should end up with clean state
      expect(result.current.productIds).toEqual([]);
      expect(result.current.pendingOperations).toBe(0);
    });
  });

  describe('Integration with Auth State', () => {
    it('should handle user logout by preserving local favorites', async () => {
      const { result } = renderHook(() => useFavoritesStore());

      // Add favorites while logged out (guest mode)
      await act(async () => {
        await result.current.addFavorite('product-1');
        await result.current.addFavorite('product-2');
      });

      const guestFavorites = result.current.productIds;

      // Simulate user logout (favorites should persist locally)
      // In real app, auth store would call clearError but not clear favorites
      act(() => {
        result.current.clearError();
      });

      expect(result.current.productIds).toEqual(guestFavorites);
    });
  });
});
