import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import httpClient from '../_services/api/httpClient';

export interface CartItem {
  productId: string;
  quantity: number;
  color?: string;
  size?: string;
}

// Setup MMKV storage
const storage = new MMKV({ id: 'cart-storage' });
const mmkvStorage = createJSONStorage(() => ({
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.delete(name),
}));

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  isGuestCart: boolean;
  lastSyncTimestamp: number | null;
  actionStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  pendingOperations: string[];

  // Actions
  addItem: (item: CartItem) => Promise<void>;
  updateItemQuantity: (
    productId: string,
    color: string | undefined,
    size: string | undefined,
    newQuantity: number
  ) => Promise<void>;
  removeItem: (
    productId: string,
    color: string | undefined,
    size: string | undefined
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemQuantity: (
    productId: string,
    color: string | undefined,
    size: string | undefined
  ) => number;
  migrateGuestCart: (authToken: string) => Promise<void>;
  setAuthToken: (token: string | null) => void;
  fetchUserCart: () => Promise<void>;
  clearError: () => void;

  // Test utility methods
  setItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,
      isGuestCart: true,
      lastSyncTimestamp: null,
      actionStatus: 'idle',
      pendingOperations: [],

      setAuthToken: (token) => {
        set({ isGuestCart: !token });
      },

      fetchUserCart: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await httpClient.get('/cart');
          const items = response.data || [];
          set({ items, isLoading: false, isGuestCart: false });
        } catch (e) {
          set({
            isLoading: false,
            error: 'Failed to fetch cart from server.',
          });
        }
      },

      addItem: async (itemToAdd) => {
        const previousItems = get().items;

        // Optimistic UI update
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) =>
              item.productId === itemToAdd.productId &&
              item.color === itemToAdd.color &&
              item.size === itemToAdd.size
          );

          if (existingItemIndex > -1) {
            // Item exists, update quantity
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + itemToAdd.quantity,
            };
            return { items: updatedItems };
          } else {
            // Add new item
            return { items: [...state.items, itemToAdd] };
          }
        });

        try {
          set({ isLoading: true, error: null });

          await httpClient.post('/cart/sync', { items: get().items });
          set({ isLoading: false });
        } catch (e) {
          set({
            items: previousItems, // Revert optimistic update
            isLoading: false,
            error: 'Failed to update cart.',
          });
        }
      },

      updateItemQuantity: async (productId, color, size, newQuantity) => {
        const previousItems = get().items;

        // Optimistic UI update
        set((state) => {
          if (newQuantity <= 0) {
            // If quantity is zero or less, remove the item
            return {
              items: state.items.filter(
                (item) =>
                  !(item.productId === productId && item.color === color && item.size === size)
              ),
            };
          } else {
            // Update quantity for the specific item variant
            return {
              items: state.items.map((item) =>
                item.productId === productId && item.color === color && item.size === size
                  ? { ...item, quantity: newQuantity }
                  : item
              ),
            };
          }
        });

        try {
          set({ isLoading: true, error: null });

          await httpClient.post('/cart/sync', { items: get().items });
          set({ isLoading: false });
        } catch (e) {
          set({
            items: previousItems,
            isLoading: false,
            error: 'Failed to update cart.',
          });
        }
      },

      removeItem: async (productId, color, size) => {
        const previousItems = get().items;

        // Optimistic UI update
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.productId === productId && item.color === color && item.size === size)
          ),
        }));

        try {
          set({ isLoading: true, error: null });
          await httpClient.post('/cart/sync', { items: get().items });
          set({ isLoading: false });
        } catch (e) {
          set({
            items: previousItems,
            isLoading: false,
            error: 'Failed to update cart.',
          });
        }
      },

      clearCart: async () => {
        const previousItems = get().items;
        set({ items: [] }); // Optimistic update

        try {
          set({ isLoading: true, error: null });
          await httpClient.delete('/cart');
          set({ items: [], isLoading: false });
        } catch (e) {
          set({
            items: previousItems,
            isLoading: false,
            error: 'Failed to clear cart.',
          });
        }
      },

      getItemQuantity: (productId, color, size) => {
        const item = get().items.find(
          (i) => i.productId === productId && i.color === color && i.size === size
        );
        return item ? item.quantity : 0;
      },

      migrateGuestCart: async (_authToken) => {
        const guestItems = get().items;

        try {
          set({ isLoading: true, error: null });
          const response = await httpClient.post('/cart/migrate', { guestItems });
          set({
            items: response.mergedItems || [],
            isLoading: false,
            isGuestCart: false,
            error: null,
          });
        } catch (e) {
          set({
            isLoading: false,
            error: 'Failed to migrate cart after login.',
            isGuestCart: false, // Still mark as authenticated even if migration failed
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Test utility methods
      setItems: (items: CartItem[]) => {
        set({ items });
      },
    }),
    {
      name: 'tifossi-cart-local',
      storage: mmkvStorage,
      partialize: (state) => ({
        items: state.items,
        isGuestCart: state.isGuestCart,
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
  name: 'CartStore',
  version: '1.0.0',
};

export default utilityExport;
