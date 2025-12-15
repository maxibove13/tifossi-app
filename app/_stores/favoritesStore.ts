import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import apiManager from '../_services/api';

// Lazy-initialize MMKV to prevent crashes on real devices
// Native modules can't be instantiated during bundle evaluation
let _storage: MMKV | null = null;
const getStorage = () => {
  if (!_storage) {
    _storage = new MMKV({ id: 'favorites-storage' });
  }
  return _storage;
};

const mmkvStorage = createJSONStorage(() => ({
  getItem: (name) => getStorage().getString(name) ?? null,
  setItem: (name, value) => getStorage().set(name, value),
  removeItem: (name) => getStorage().delete(name),
}));

interface FavoritesState {
  productIds: string[];
  items: string[];
  isLoading: boolean;
  error: string | null;
  lastSyncTimestamp: number | null;
  actionStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  pendingOperations: string[];

  // Actions
  addFavorite: (productId: string) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  syncWithServer: () => Promise<void>;
  clearError: () => void;
  retryFailedOperations: () => Promise<void>;
}

// Disable persistence in test environment to avoid async issues
const isTestEnvironment = typeof jest !== 'undefined';

const createStoreContent = (set: any, get: any): FavoritesState => ({
  productIds: [],
  items: [],
  isLoading: false,
  error: null,
  lastSyncTimestamp: null,
  actionStatus: 'idle' as const,
  pendingOperations: [],

  addFavorite: async (productId: string) => {
    const previousIds = get().productIds;
    if (previousIds.includes(productId)) return; // Already favorite

    // Optimistic update
    const updatedIds = [...previousIds, productId];
    set({ productIds: updatedIds, items: updatedIds });

    try {
      set({ isLoading: true, error: null });

      const success = await apiManager.syncFavorites(get().productIds);
      if (success) {
        set({ isLoading: false });
      } else {
        throw new Error('Failed to sync favorites');
      }
    } catch {
      set({
        productIds: previousIds,
        items: previousIds,
        isLoading: false,
        error: 'Failed to update favorites.',
      });
    }
  },

  removeFavorite: async (productId: string) => {
    const previousIds = get().productIds;
    if (!previousIds.includes(productId)) return; // Not a favorite

    // Optimistic update
    const updatedIds = previousIds.filter((id: string) => id !== productId);
    set({ productIds: updatedIds, items: updatedIds });

    try {
      set({ isLoading: true, error: null });

      const success = await apiManager.syncFavorites(get().productIds);
      if (success) {
        set({ isLoading: false });
      } else {
        throw new Error('Failed to sync favorites');
      }
    } catch {
      set({
        productIds: previousIds,
        items: previousIds,
        isLoading: false,
        error: 'Failed to update favorites.',
      });
    }
  },

  toggleFavorite: async (productId: string) => {
    const { productIds, addFavorite, removeFavorite } = get();

    if (productIds.includes(productId)) {
      await removeFavorite(productId);
    } else {
      await addFavorite(productId);
    }
  },

  isFavorite: (productId: string) => {
    return get().productIds.includes(productId);
  },

  syncWithServer: async () => {
    try {
      set({ isLoading: true, error: null });

      // Sync current favorites with server
      const success = await apiManager.syncFavorites(get().productIds);
      if (success) {
        set({ isLoading: false });
      } else {
        throw new Error('Failed to sync favorites with server');
      }
    } catch {
      set({
        isLoading: false,
        error: 'Failed to sync favorites with server.',
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  retryFailedOperations: async () => {
    set({ actionStatus: 'loading' });
    try {
      // Mock implementation for failed operations retry
      await new Promise((resolve) => setTimeout(resolve, 100));
      set({
        actionStatus: 'succeeded',
        pendingOperations: [],
        lastSyncTimestamp: Date.now(),
      });
    } catch {
      set({ actionStatus: 'failed' });
    }
  },
});

export const useFavoritesStore = create<FavoritesState>()(
  isTestEnvironment
    ? createStoreContent
    : persist(createStoreContent, {
        name: 'tifossi-favorites-local',
        storage: mmkvStorage,
        partialize: (state) => ({
          productIds: state.productIds,
          items: state.items,
          // Don't persist loading states or errors
        }),
        onRehydrateStorage: () => (state) => {
          // Reset transient state after hydration
          if (state) {
            state.isLoading = false;
            state.error = null;
            state.items = state.productIds;
          }
        },
      })
);

const utilityExport = {
  name: 'FavoritesStore',
  version: '1.0.0',
};

export default utilityExport;
