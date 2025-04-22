# Tifossi Client-Side State Management Implementation Plan

This document outlines the implementation plan for the complete client-side state management system for the Tifossi Expo app. It covers setting up Zustand for global client state (including Auth), TanStack Query for managing server state (with mock fetchers), and Fuse.js for client-side search, all using mocked backend interactions initially.

**References:**
-   `docs/state_management.md` (Overall Strategy)
-   `docs/local_state_management.md` (Pure Local State: Cart & Favorites)

## 1. Required Libraries

Ensure the following libraries are installed:

```bash
npm install zustand @tanstack/react-query react-native-mmkv expo-secure-store fuse.js
# or
yarn add zustand @tanstack/react-query react-native-mmkv expo-secure-store fuse.js
```

## 2. Project Structure Updates

Create the following directories if they don't exist:

```
app/
├── _services/
│   └── api/         # Mock API functions (e.g., mockApi.ts)
├── _stores/         # Zustand store slices (cartStore.ts, favoritesStore.ts, authStore.ts)
hooks/               # Custom hooks (useProducts.ts, useProduct.ts, useSearch.ts)
```

## 3. Mock API Service

Create a file for mock API functions to simulate backend responses.

```typescript
// In app/_services/api/mockApi.ts
import { products, getProductById } from '../../_data/products';
import { Product } from '../../_types/product';
import { CartItem } from '../../_stores/cartStore'; // Assuming type is exported from store
import { User } from '../../_stores/authStore'; // Assuming type is exported from store

const MOCK_DELAY = 500; // ms

// --- Product Mocks ---
export const mockFetchProducts = async (): Promise<Product[]> => {
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  console.log('[Mock API] Fetching all products');
  return products;
};

export const mockFetchProductById = async (id: string): Promise<Product | undefined> => {
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY / 2));
  console.log(`[Mock API] Fetching product by ID: ${id}`);
  return getProductById(id);
};

// --- Cart Mocks ---
export const mockSyncCart = async (items: CartItem[]): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  console.log('[Mock API] Syncing cart:', items);
  // Simulate potential backend conflict/update (optional)
  // if (Math.random() > 0.9) throw new Error("Cart sync failed");
  return true;
};

// --- Favorites Mocks ---
export const mockSyncFavorites = async (productIds: string[]): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  console.log('[Mock API] Syncing favorites:', productIds);
  return true;
};

// --- Auth Mocks ---
export const mockLogin = async (credentials: { email: string; password: string }): Promise<{ token: string; user: User }> => {
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY * 1.5));
  console.log('[Mock API] Attempting login:', credentials.email);
  if (credentials.email === 'test@tifossi.com' && credentials.password === 'password') {
    return {
      token: 'mock-jwt-token-12345',
      user: { id: 'user-001', name: 'Test User', email: credentials.email },
    };
  }
  throw new Error('Invalid credentials');
};

export const mockRegister = async (userData: { name: string; email: string; password: string }): Promise<{ token: string; user: User }> => {
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY * 2));
  console.log('[Mock API] Attempting registration:', userData.email);
  // Simulate success
  return {
    token: 'mock-jwt-token-67890',
    user: { id: 'user-002', name: userData.name, email: userData.email },
  };
  // Simulate failure (e.g., email exists)
  // throw new Error('Email already registered');
};

export const mockValidateToken = async (token: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  console.log('[Mock API] Validating token:', token);
  if (token.startsWith('mock-jwt-token-')) {
    // Simulate returning user data based on token
    const userId = token.includes('12345') ? 'user-001' : 'user-002';
    return {
      id: userId,
      name: userId === 'user-001' ? 'Test User' : 'New User',
      email: userId === 'user-001' ? 'test@tifossi.com' : 'register@tifossi.com',
    };
  }
  throw new Error('Invalid or expired token');
};

export const mockLogout = async (token: string | null): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY / 2));
  console.log('[Mock API] Logging out token:', token);
  return true;
}

// --- User Data Sync --- Simulate merging local/server state after login
export const mockSyncUserData = async (): Promise<boolean> => {
   await new Promise(resolve => setTimeout(resolve, MOCK_DELAY * 1.5));
   console.log('[Mock API] Syncing user data (cart/favorites) after login');
   // Here you could potentially fetch server cart/favorites and merge
   return true;
}

const mockApi = {
  fetchProducts: mockFetchProducts,
  fetchProductById: mockFetchProductById,
  syncCart: mockSyncCart,
  syncFavorites: mockSyncFavorites,
  login: mockLogin,
  register: mockRegister,
  validateToken: mockValidateToken,
  logout: mockLogout,
  syncUserData: mockSyncUserData,
};

export default mockApi;
```

## 4. Zustand Store Implementation

Implement the Zustand stores, now incorporating calls to the `mockApi` for asynchronous actions.

### a) Cart Store (`app/_stores/cartStore.ts`)

Update the `cartStore` from `local_state_management.md` to include mock API calls.

```typescript
// In app/_stores/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import mockApi from '../_services/api/mockApi'; // Import mock API
// import { Product } from '../_types/product'; // Keep Product type if needed elsewhere

const storage = new MMKV({ id: 'cart-storage' }); // Ensure unique ID if needed
const mmkvStorage = createJSONStorage(() => ({ /* ... MMKV adapter ... */ }));

export interface CartItem { /* ... definition ... */ }

interface CartState {
  items: CartItem[];
  isLoading: boolean; // Add loading/error states
  error: string | null;
  addItem: (item: CartItem) => Promise<void>; // Make actions async
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
  getItemQuantity: ( /* ... */ ) => number;
  // Add potential action for syncing after login
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
          const existingItemIndex = /* ... find index ... */ ;
          if (existingItemIndex > -1) { /* ... update existing ... */ }
          else { return { items: [...state.items, itemToAdd] }; }
          return { items: updatedItems }; 
        });

        try {
          set({ isLoading: true, error: null });
          await mockApi.syncCart(get().items);
          set({ isLoading: false });
        } catch (e) {
          console.error("Failed to sync cart addition:", e);
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
           if (newQuantity <= 0) { /* ... filter item ... */ }
           else { /* ... map and update quantity ... */ }
           return { items: updatedItems };
        });

        try {
          set({ isLoading: true, error: null });
          await mockApi.syncCart(get().items);
          set({ isLoading: false });
        } catch (e) {
          console.error("Failed to sync cart update:", e);
          set({ items: previousItems, isLoading: false, error: 'Failed to update cart.' });
        }
      },

      removeItem: async (productId, color, size) => {
        const previousItems = get().items;
         // Optimistic UI update
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.productId === productId && item.color === color && item.size === size)
          ),
        }));

         try {
          set({ isLoading: true, error: null });
          await mockApi.syncCart(get().items);
          set({ isLoading: false });
        } catch (e) {
          console.error("Failed to sync cart removal:", e);
          set({ items: previousItems, isLoading: false, error: 'Failed to update cart.' });
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
          console.error("Failed to sync cart clear:", e);
          set({ items: previousItems, isLoading: false, error: 'Failed to clear cart.' });
        }
      },

      getItemQuantity: (/* ... implementation ... */) => { /* ... */ },
      
      // Example sync function called after login
      syncWithServer: async () => {
          console.log("Attempting to sync cart post-login (placeholder)");
          // In a real scenario, this would fetch the server cart
          // and merge it with the local cart.
          // For now, we can just re-sync the current local cart.
          const currentItems = get().items;
          try {
              set({ isLoading: true, error: null });
              await mockApi.syncCart(currentItems);
              set({ isLoading: false });
          } catch (e) {
              console.error("Post-login cart sync failed:", e);
              set({ isLoading: false, error: "Failed to sync cart after login." });
          }
      }
    }),
    {
      name: 'tifossi-cart-local',
      storage: mmkvStorage,
       // Optionally, define merge strategy if needed later
      // merge: (persistedState, currentState) => { ... }
    }
  )
);
```

### b) Favorites Store (`app/_stores/favoritesStore.ts`)

Update the `favoritesStore` similarly.

```typescript
// In app/_stores/favoritesStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import mockApi from '../_services/api/mockApi';

const storage = new MMKV({ id: 'favorites-storage' });
const mmkvStorage = createJSONStorage(() => ({ /* ... MMKV adapter ... */ }));

interface FavoritesState {
  productIds: string[];
  isLoading: boolean;
  error: string | null;
  addFavorite: (productId: string) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  toggleFavorite: (productId: string) => Promise<void>; // Keep sync logic inside add/remove
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

        set({ productIds: [...previousIds, productId] }); // Optimistic

        try {
          set({ isLoading: true, error: null });
          await mockApi.syncFavorites(get().productIds);
          set({ isLoading: false });
        } catch (e) {
          console.error("Failed to sync favorite add:", e);
          set({ productIds: previousIds, isLoading: false, error: 'Failed to update favorites.'});
        }
      },

      removeFavorite: async (productId) => {
        const previousIds = get().productIds;
        if (!previousIds.includes(productId)) return; // Not a favorite

        set({ productIds: previousIds.filter((id) => id !== productId) }); // Optimistic

        try {
          set({ isLoading: true, error: null });
          await mockApi.syncFavorites(get().productIds);
          set({ isLoading: false });
        } catch (e) {
          console.error("Failed to sync favorite remove:", e);
          set({ productIds: previousIds, isLoading: false, error: 'Failed to update favorites.'});
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

      isFavorite: (productId) => get().productIds.includes(productId),

      syncWithServer: async () => {
        console.log("Attempting to sync favorites post-login (placeholder)");
        const currentIds = get().productIds;
        try {
            set({ isLoading: true, error: null });
            await mockApi.syncFavorites(currentIds);
            set({ isLoading: false });
        } catch (e) {
            console.error("Post-login favorites sync failed:", e);
            set({ isLoading: false, error: "Failed to sync favorites after login." });
        }
      }
    }),
    {
      name: 'tifossi-favorites-local',
      storage: mmkvStorage,
    }
  )
);
```

### c) Auth Store (`app/_stores/authStore.ts`)

Create the `authStore` using `expo-secure-store`.

```typescript
// In app/_stores/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import mockApi from '../_services/api/mockApi';
import { useCartStore } from './cartStore'; // To trigger sync after login
import { useFavoritesStore } from './favoritesStore';

const AUTH_TOKEN_KEY = 'tifossi_auth_token';

// Define User type (consider moving to app/_types)
export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Loading state for login/register/init
  isInitialized: boolean; // Tracks if initial token load attempted
  error: string | null;

  initializeAuth: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  initializeAuth: async () => {
    if (get().isInitialized) return; // Prevent multiple initializations

    set({ isLoading: true });
    try {
      const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (storedToken) {
        // Validate token with mock API
        const user = await mockApi.validateToken(storedToken);
        set({
          user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
        // Trigger post-login sync for other stores
        await useCartStore.getState().syncWithServer();
        await useFavoritesStore.getState().syncWithServer();

      } else {
        set({ isLoading: false, isInitialized: true });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY); // Clear invalid token
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: 'Session invalid. Please login.',
      });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await mockApi.login(credentials);
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
        // Trigger post-login sync for other stores
        await useCartStore.getState().syncWithServer();
        await useFavoritesStore.getState().syncWithServer();
    } catch (error: any) {
      console.error('Login failed:', error);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Login failed. Please try again.',
      });
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await mockApi.register(userData);
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      // Clear potentially guest cart/favorites before sync? Or merge?
      // Depends on business logic. For now, just sync.
      await useCartStore.getState().syncWithServer();
      await useFavoritesStore.getState().syncWithServer();
    } catch (error: any) {
      console.error('Registration failed:', error);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Registration failed. Please try again.',
      });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    const currentToken = get().token;
    try {
      await mockApi.logout(currentToken);
    } catch (e) {
       console.error("Mock logout API call failed (continuing local logout):", e);
    } finally {
       await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
       // Optionally clear cart/favorites on logout?
       // useCartStore.getState().clearCart();
       // useFavoritesStore.getState().clearFavorites(); // Need clearFavorites action
       set({
         user: null,
         token: null,
         isAuthenticated: false,
         isLoading: false,
         error: null
       });
    }
  },
}));

// Initialize auth state when the store is first imported/used
// This should ideally be called once at app startup.
// useAuthStore.getState().initializeAuth();
```
**Note:** The `initializeAuth` function should be called once when the app loads, typically in your root layout component (`app/_layout.tsx`).

## 5. TanStack Query Setup (with Mocks)

### a) Query Client and Provider

Set up the TanStack Query client and provider in your root layout.

```tsx
// In app/_layout.tsx (or your root component)
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router'; // Or your navigation root
import { useAuthStore } from './_stores/authStore';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes default stale time
      gcTime: 1000 * 60 * 60 * 1, // 1 hour garbage collection time
    },
  },
});

export default function RootLayout() {
  // Initialize Auth state on app load
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Optional: Show a loading screen until auth is initialized
  if (!isInitialized) {
    // return <SplashScreen />; // Or some loading indicator
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* Your existing providers (Theme, etc.) */} 
      <Slot /> 
    </QueryClientProvider>
  );
}
```

### b) Mocked Query Hooks

Create custom hooks that use `useQuery` with the mock API fetchers.

```typescript
// In hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import mockApi from '../app/_services/api/mockApi'; // Adjust path
import { Product } from '../app/_types/product'; // Adjust path

export const productQueryKeys = {
  all: ['products'] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
};

export function useProducts() {
  return useQuery<Product[], Error>({
    queryKey: productQueryKeys.all,
    queryFn: mockApi.fetchProducts,
    staleTime: 1000 * 60 * 60 * 24, // Cache products for 24 hours (example)
  });
}

export function useProduct(productId: string | undefined) {
  return useQuery<Product | undefined, Error>({
    queryKey: productQueryKeys.detail(productId!), // Add non-null assertion or handle undefined
    queryFn: () => mockApi.fetchProductById(productId!),
    enabled: !!productId, // Only run query if productId is defined
    staleTime: 1000 * 60 * 60 * 24, // Cache product details too
  });
}
```

## 6. Fuse.js Search Implementation

Create a hook for client-side searching using Fuse.js, powered by the data from `useProducts`.

```typescript
// In hooks/useSearch.ts
import { useState, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import { useProducts } from './useProducts'; // Adjust path
import { Product } from '../app/_types/product'; // Adjust path

const fuseOptions: Fuse.IFuseOptions<Product> = {
  keys: [
    'title',
    'shortDescription.line1',
    'shortDescription.line2',
    'longDescription',
    'categoryId', // Allow searching by category name
    'tagIds', // Allow searching by tag names (might need mapping)
  ],
  includeScore: true,
  threshold: 0.4, // Adjust sensitivity (0=exact, 1=anything)
  minMatchCharLength: 2,
};

export function useSearch() {
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [fuseInstance, setFuseInstance] = useState<Fuse<Product> | null>(null);

  // Create Fuse instance when products load/change
  useEffect(() => {
    if (products.length > 0) {
      setFuseInstance(new Fuse(products, fuseOptions));
    }
  }, [products]);

  // Perform search when searchTerm or fuseInstance changes
  const searchResults = useMemo(() => {
    if (!fuseInstance || !searchTerm) {
      return []; // Return empty array if no search term or data
    }
    return fuseInstance.search(searchTerm).map(result => result.item);
  }, [searchTerm, fuseInstance]);

  return {
    searchTerm,
    setSearchTerm, // Expose setter to update search term from UI
    searchResults,
    isLoading: isLoadingProducts, // Indicate if initial product data is loading
    hasSearched: searchTerm.length > 0,
  };
}
```

## 7. Integration and Usage

-   Wrap the application root with `QueryClientProvider` as shown above.
-   Call `useAuthStore.getState().initializeAuth()` once at app startup.
-   Use the Zustand store hooks (`useCartStore`, `useFavoritesStore`, `useAuthStore`) in components to access global state and actions.
-   Use the TanStack Query hooks (`useProducts`, `useProduct`) to fetch (mocked) server data.
-   Use the `useSearch` hook in search interfaces to get filtered results.
-   Use React's local state (`useState`, `useReducer`) for component-specific UI state.

## 8. Next Steps (Beyond this Plan)

-   **Backend Integration:** Replace functions in `app/_services/api/mockApi.ts` with actual API calls to the chosen backend (Odoo, Shopify, Custom).
-   **Server State Management (`server_state_management.md`):**
    -   Implement proper TanStack Query mutation functions (`useMutation`) for updating backend data (e.g., updating cart, logging in).
    -   Define cache invalidation strategies to keep client and server state synchronized after mutations.
    -   Implement error handling and retry logic for real network requests.
-   **Refine Types:** Ensure all types (`Product`, `User`, `CartItem`, etc.) are consistently defined in `app/_types/` and used across stores, hooks, and API layers.