import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import mockApi from '../_services/api/mockApi';

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

  // Actions
  addFavorite: (productId: string) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  syncWithServer: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      productIds: [],
      isLoading: false,
      error: null,

      addFavorite: async (productId) => {
        const previousIds = get().productIds;
        if (previousIds.includes(productId)) return; // Already favorite

        // Optimistic update
        set({ productIds: [...previousIds, productId] });

        try {
          set({ isLoading: true, error: null });
          await mockApi.syncFavorites(get().productIds);
          set({ isLoading: false });
        } catch (e) {
          console.error('Failed to sync favorite add:', e);
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
          await mockApi.syncFavorites(get().productIds);
          set({ isLoading: false });
        } catch (e) {
          console.error('Failed to sync favorite remove:', e);
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
        console.log('Attempting to sync favorites post-login');
        const currentIds = get().productIds;
        try {
          set({ isLoading: true, error: null });
          await mockApi.syncFavorites(currentIds);
          set({ isLoading: false });
        } catch (e) {
          console.error('Post-login favorites sync failed:', e);
          set({ isLoading: false, error: 'Failed to sync favorites after login.' });
        }
      },
    }),
    {
      name: 'tifossi-favorites-local',
      storage: mmkvStorage,
    }
  )
);

const utilityExport = {
  name: 'FavoritesStore',
  version: '1.0.0',
};

export default utilityExport;
