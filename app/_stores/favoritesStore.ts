import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import apiManager from '../_services/api';

// Setup MMKV storage
const storage = new MMKV({ id: 'favorites-storage' });
const mmkvStorage = createJSONStorage(() => ({
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.delete(name),
}));

interface FavoritesState {
  productIds: string[];
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

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      productIds: [],
      isLoading: false,
      error: null,
      lastSyncTimestamp: null,
      actionStatus: 'idle',
      pendingOperations: [],

      addFavorite: async (productId) => {
        const previousIds = get().productIds;
        if (previousIds.includes(productId)) return; // Already favorite

        // Optimistic update
        set({ productIds: [...previousIds, productId] });

        try {
          set({ isLoading: true, error: null });

          const success = await apiManager.syncFavorites(get().productIds);
          if (success) {
            set({ isLoading: false });
          } else {
            throw new Error('Failed to sync favorites');
          }
        } catch (e) {
          set({
            productIds: previousIds,
            isLoading: false,
            error: 'Failed to update favorites.',
          });
        }
      },

      removeFavorite: async (productId) => {
        const previousIds = get().productIds;
        if (!previousIds.includes(productId)) return; // Not a favorite

        // Optimistic update
        set({ productIds: previousIds.filter((id) => id !== productId) });

        try {
          set({ isLoading: true, error: null });

          const success = await apiManager.syncFavorites(get().productIds);
          if (success) {
            set({ isLoading: false });
          } else {
            throw new Error('Failed to sync favorites');
          }
        } catch (e) {
          set({
            productIds: previousIds,
            isLoading: false,
            error: 'Failed to update favorites.',
          });
        }
      },

      toggleFavorite: async (productId) => {
        const { productIds, addFavorite, removeFavorite } = get();

        if (productIds.includes(productId)) {
          await removeFavorite(productId);
        } else {
          await addFavorite(productId);
        }
      },

      isFavorite: (productId) => {
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
        } catch (e) {
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
    }),
    {
      name: 'tifossi-favorites-local',
      storage: mmkvStorage,
      partialize: (state) => ({
        productIds: state.productIds,
        // Don't persist loading states or errors
      }),
      onRehydrateStorage: () => (state) => {
        // Reset transient state after hydration
        if (state) {
          state.isLoading = false;
          state.error = null;
        }
      },
    }
  )
);

const utilityExport = {
  name: 'FavoritesStore',
  version: '1.0.0',
};

export default utilityExport;
