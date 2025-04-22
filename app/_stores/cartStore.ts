import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import mockApi, { CartItem } from '../_services/api/mockApi';

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
  syncWithServer: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

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
          await mockApi.syncCart(get().items);
          set({ isLoading: false });
        } catch (e) {
          console.error('Failed to sync cart addition:', e);
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
          await mockApi.syncCart(get().items);
          set({ isLoading: false });
        } catch (e) {
          console.error('Failed to sync cart update:', e);
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
          await mockApi.syncCart(get().items);
          set({ isLoading: false });
        } catch (e) {
          console.error('Failed to sync cart removal:', e);
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
          await mockApi.syncCart([]);
          set({ isLoading: false });
        } catch (e) {
          console.error('Failed to sync cart clear:', e);
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

      syncWithServer: async () => {
        console.log('Attempting to sync cart post-login');
        const currentItems = get().items;
        try {
          set({ isLoading: true, error: null });
          await mockApi.syncCart(currentItems);
          set({ isLoading: false });
        } catch (e) {
          console.error('Post-login cart sync failed:', e);
          set({ isLoading: false, error: 'Failed to sync cart after login.' });
        }
      },
    }),
    {
      name: 'tifossi-cart-local',
      storage: mmkvStorage,
    }
  )
);

const utilityExport = {
  name: 'CartStore',
  version: '1.0.0',
};

export default utilityExport;
