# Tifossi State Management Specification

This document outlines the state management strategy for the Tifossi Expo application, based on a lean, two-layer model optimized for performance and maintainability.

## 1. Architecture Overview

We will adopt a two-layer state management architecture:

1.  **Server State:** Data originating from and owned by the backend (e.g., products, user profiles, orders, inventory). Managed by **TanStack Query**.
2.  **Client State:** Data relevant only to the current user session and device (e.g., shopping cart, favorites, authentication). Managed by **Zustand**.

This separation simplifies data flow, improves performance by leveraging specialized libraries, and provides clear ownership for different types of state.

## 2. Server State Management (TanStack Query)

-   **Responsibility:** Fetching, caching, synchronizing, and updating backend data.
-   **Library:** `@tanstack/react-query`
-   **Implementation:**
    -   API interaction logic (fetchers, adapters for REST/GraphQL/JSON-RPC) will reside in `app/_services/api/`. This isolates backend communication.
    -   Custom hooks (e.g., `useProducts`, `useUserProfile`, `useOrders`) will wrap TanStack Query's `useQuery` and `useMutation` hooks, providing a clean interface for components. These hooks will live in `hooks/`.
    -   Data fetching occurs automatically based on query keys and component lifecycle.
-   **Caching:**
    -   Leverage TanStack Query's built-in caching with a stale-while-revalidate strategy.
    -   **Products Catalogue:** Cache for 24 hours after initial fetch (`staleTime: 24 * 60 * 60 * 1000`).
    -   **User Profile/Orders/Addresses:** Always fetched on demand (no `staleTime`).
    -   TanStack Query's garbage collection (`gcTime`, default 5 minutes) will still remove unused query data from memory.

## 3. Client State Management (Zustand)

-   **Responsibility:** Managing key global state that needs to be shared across components.
-   **Library:** `zustand`
-   **Implementation:**
    -   State will be organized into focused stores located in `app/_stores/` (e.g., `cartStore.ts`, `favoritesStore.ts`, `authStore.ts`).
    -   Components access state via simple hooks provided by Zustand stores (`useCartStore(state => state.items)`).
    -   **Important Note:** Only use Zustand for state that truly needs to be global. For UI-specific state (form inputs, dropdowns, accordions), continue using local React state (useState/useReducer).
-   **Persistence:**
    -   Critical client state (Cart, Favorites) will be persisted locally using `react-native-mmkv` for fast, synchronous storage access.
    -   Zustand's `persist` middleware will be used with an MMKV storage adapter.
    -   **Authentication Tokens:** Store securely using `expo-secure-store`, following React Native security best practices. Access will be managed via a dedicated auth store/hook (e.g., `useAuthStore`).
-   **Background Synchronization:**
    -   Changes to cart and favorites should immediately update local state for responsive UI
    -   In parallel, trigger background API calls to sync with backend
    -   Handle conflict resolution if server returns different data

## 4. Search Implementation (Fuse.js)

-   **Responsibility:** Providing fast, client-side fuzzy search for the product catalogue (initially for < 5k products).
-   **Library:** `fuse.js`
-   **Implementation:**
    -   After the initial product data fetch (managed by TanStack Query), create a `Fuse.js` index in memory.
    -   A `useSearch` hook will encapsulate Fuse.js logic. It will accept a search query (debounced) and return filtered product results instantly.
    -   This avoids network requests for searching within the current catalogue.
-   **Scalability:** When the product count exceeds ~5k items, the implementation within the `useSearch` hook can be swapped to query a dedicated backend search service (e.g., Algolia, Meilisearch) without changing the component-level usage.

## 5. Data Flow Overview

| Feature             | State Layer       | Persistence            | Notes                                                                 |
| :------------------ | :---------------- | :--------------------- | :-------------------------------------------------------------------- |
| Product Catalogue   | TanStack Query    | Cache (24h)            | `GET /products` on launch, stale-while-revalidate.                    |
| Search / Filtering  | Fuse.js / Local React State | In-memory / None | Fuse index built from Query cache. Filter state in local useState. |
| Shopping Cart       | Zustand           | MMKV                   | Background sync with backend; immediate UI updates.                   |
| Favorites           | Zustand           | MMKV                   | Background sync with backend; immediate UI updates.                   |
| Auth Tokens         | Zustand           | Secure Store           | Managed by `useAuthStore`.                                            |
| Order History       | TanStack Query    | None                   | Fetched on demand when viewing profile/orders.                        |
| Shipping Addresses  | TanStack Query    | None                   | Fetched on demand, mutations update cache via invalidation.           |
| UI Interactions     | Local React State | None                   | Form inputs, dropdowns, modals, accordion states, etc.                |

## 6. Project Structure Updates

Introduce the following directories:

```
app/
├── _services/
│   └── api/         # API fetchers, adapters (e.g., restClient.ts, odooAdapter.ts)
├── _stores/         # Zustand store slices (e.g., cartStore.ts, authStore.ts)
hooks/               # Custom hooks, including TanStack Query wrappers (e.g., useProducts.ts)
```

Existing structures (`app/_components`, `app/_types`, etc.) remain as defined in `app_structure.md`.

## 7. TypeScript Domain Models

Define core domain models (e.g., `Product`, `CartItem`, `User`, `Address`) within `app/_types/`. These types should be shared across `_services/api`, `_stores`, hooks, and components to ensure consistency and type safety.

## 8. Implementation Plan

### 1. Cart State Implementation

```typescript
// In app/_stores/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const mmkvStorage = createJSONStorage(() => ({
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.delete(name),
}));

export interface CartItem {
  productId: string;
  quantity: number;
  color?: string;
  size?: string;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addItem: (item: CartItem) => void;
  updateItem: (productId: string, updates: Partial<CartItem>) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,
      
      addItem: (item) => {
        set({ isLoading: true });
        // Check if item exists with same product/color/size
        const { items } = get();
        const existingItem = items.find(i => 
          i.productId === item.productId && 
          i.color === item.color && 
          i.size === item.size
        );
        
        if (existingItem) {
          // Update existing item
          const updatedItems = items.map(i => 
            i === existingItem 
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
          set({ items: updatedItems, isLoading: false });
        } else {
          // Add new item
          set({ items: [...items, item], isLoading: false });
        }
        
        // Background sync with backend
        syncCartWithBackend(get().items).catch(error => {
          console.error('Failed to sync cart:', error);
          set({ error: 'Failed to sync cart with server' });
        });
      },
      
      updateItem: (productId, updates) => {
        // Implementation with background sync
        const { items } = get();
        const updatedItems = items.map(item => 
          item.productId === productId ? { ...item, ...updates } : item
        );
        
        set({ items: updatedItems });
        
        // Background sync
        syncCartWithBackend(updatedItems).catch(error => {
          console.error('Failed to sync cart update:', error);
          set({ error: 'Failed to update cart with server' });
        });
      },
      
      removeItem: (productId) => {
        // Implementation with background sync
        const { items } = get();
        const updatedItems = items.filter(item => item.productId !== productId);
        
        set({ items: updatedItems });
        
        // Background sync
        syncCartWithBackend(updatedItems).catch(error => {
          console.error('Failed to sync cart removal:', error);
          set({ error: 'Failed to update cart with server' });
        });
      },
      
      clearCart: () => {
        set({ items: [] });
        
        // Background sync
        syncCartWithBackend([]).catch(error => {
          console.error('Failed to sync cart clearing:', error);
          set({ error: 'Failed to clear cart on server' });
        });
      },
    }),
    {
      name: 'tifossi-cart',
      storage: mmkvStorage,
    }
  )
);

// Helper function to sync cart with backend
async function syncCartWithBackend(items: CartItem[]) {
  // This would be implemented once backend API is available
  // Example implementation:
  // await axios.post('/api/cart/sync', { items });
  
  // For now, just simulate a delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return true;
}
```

### 2. Favorites State Implementation

```typescript
// In app/_stores/favoritesStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
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
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      productIds: [],
      isLoading: false,
      error: null,
      
      // Add a product to favorites
      addFavorite: (productId) => {
        const { productIds } = get();
        if (!productIds.includes(productId)) {
          set({ productIds: [...productIds, productId] });
          
          // Background sync with backend
          syncFavoritesWithBackend([...productIds, productId]).catch(error => {
            console.error('Failed to sync favorites:', error);
            set({ error: 'Failed to sync favorites with server' });
          });
        }
      },
      
      // Remove a product from favorites
      removeFavorite: (productId) => {
        const { productIds } = get();
        const updatedIds = productIds.filter(id => id !== productId);
        set({ productIds: updatedIds });
        
        // Background sync with backend
        syncFavoritesWithBackend(updatedIds).catch(error => {
          console.error('Failed to sync favorites:', error);
          set({ error: 'Failed to sync favorites with server' });
        });
      },
      
      // Toggle a product in favorites
      toggleFavorite: (productId) => {
        const { productIds, addFavorite, removeFavorite } = get();
        if (productIds.includes(productId)) {
          removeFavorite(productId);
        } else {
          addFavorite(productId);
        }
      },
      
      // Check if a product is in favorites
      isFavorite: (productId) => {
        return get().productIds.includes(productId);
      },
    }),
    {
      name: 'tifossi-favorites',
      storage: mmkvStorage,
    }
  )
);

// Helper function to sync favorites with backend
async function syncFavoritesWithBackend(productIds: string[]) {
  // This would be implemented once backend API is available
  // Example implementation:
  // await axios.post('/api/favorites/sync', { productIds });
  
  // For now, just simulate a delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return true;
}
```

### 3. Auth State Implementation

```typescript
// In app/_stores/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  name: string;
  email: string;
  // Other user profile fields
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  // Initialize auth state from secure storage
  initialize: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        // Validate token with backend
        // const user = await validateToken(token);
        const user = await mockValidateToken(token);
        set({ 
          token, 
          user, 
          isAuthenticated: true,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      set({ 
        token: null, 
        user: null, 
        isAuthenticated: false,
        isLoading: false,
        error: 'Session expired. Please login again.'
      });
    }
  },
  
  // Login user
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      // Replace with actual API call
      const { token, user } = await mockLoginApi(credentials);
      
      // Store token securely
      await SecureStore.setItemAsync('auth_token', token);
      
      set({ 
        user,
        token,
        isAuthenticated: true,
        isLoading: false 
      });
      
      // Sync cart and favorites with backend
      // This would merge local data with server data
      await syncUserData();
      
    } catch (error) {
      console.error('Login failed:', error);
      set({ 
        error: 'Invalid credentials. Please try again.',
        isLoading: false 
      });
    }
  },
  
  // Logout user
  logout: async () => {
    set({ isLoading: true });
    try {
      // Call logout API if needed
      // await logoutApi(get().token);
      
      // Clear secure storage
      await SecureStore.deleteItemAsync('auth_token');
      
      set({ 
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if API call fails
      await SecureStore.deleteItemAsync('auth_token');
      set({ 
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },
  
  // Register new user
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      // Replace with actual API call
      const { token, user } = await mockRegisterApi(userData);
      
      // Store token securely
      await SecureStore.setItemAsync('auth_token', token);
      
      set({ 
        user,
        token,
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      console.error('Registration failed:', error);
      set({ 
        error: 'Registration failed. Please try again.',
        isLoading: false 
      });
    }
  },
}));

// Mock API functions - replace with actual implementations
async function mockLoginApi(credentials) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    token: 'mock-auth-token',
    user: {
      id: '123',
      name: 'Test User',
      email: credentials.email,
    }
  };
}

async function mockRegisterApi(userData) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    token: 'mock-auth-token',
    user: {
      id: '123',
      name: userData.name,
      email: userData.email,
    }
  };
}

async function mockValidateToken(token) {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
  };
}

// Helper function to sync user data after login
async function syncUserData() {
  // This would merge local cart/favorites with server data
  // Example:
  // const serverCart = await fetchUserCart();
  // const serverFavorites = await fetchUserFavorites();
  // useCartStore.getState().mergeWithServer(serverCart);
  // useFavoritesStore.getState().mergeWithServer(serverFavorites);
}
```

### 4. Product Data Implementation

```typescript
// In hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { Product } from '../app/_types/product';
import { getProductById, products } from '../app/_data/products'; // Replace with API call later

// Temporary implementation using local data
const fetchProducts = async (): Promise<Product[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return products;
};

const fetchProductById = async (id: string): Promise<Product | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return getProductById(id);
};

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id as string),
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}
```

## 9. Component Integration Examples

### Cart Screen Integration

```tsx
// In app/(tabs)/cart.tsx
import { useCartStore } from '../../app/_stores/cartStore';
import { useProducts } from '../../hooks/useProducts';

export default function CartScreen() {
  // Local component state (UI-specific)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  
  // Global state
  const cartItems = useCartStore(state => state.items);
  const { updateItem, removeItem } = useCartStore();
  const { data: products, isLoading } = useProducts();
  
  // Combine cart items with product details
  const cartWithProducts = React.useMemo(() => {
    if (!products) return [];
    
    return cartItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return null;
      
      return {
        ...product,
        quantity: item.quantity,
        selectedSize: item.size,
        color: item.color
      };
    }).filter(Boolean);
  }, [cartItems, products]);
  
  // The rest of the component remains the same...
}
```

### Product Card with Favorites

```tsx
// In a product card component
import { useFavoritesStore } from '../../app/_stores/favoritesStore';

export default function ProductCard({ product, onPress }) {
  // Use global favorites state
  const isFavorite = useFavoritesStore(state => state.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore(state => state.toggleFavorite);
  
  // Local component state for animation
  const [animating, setAnimating] = useState(false);
  
  const handleFavoritePress = (e) => {
    e.stopPropagation();
    setAnimating(true);
    toggleFavorite(product.id);
  };
  
  // The rest of the component remains the same...
}
```

## 10. Performance Considerations

-   Use performant list components (`@shopify/flash-list` or tuned `FlatList`) for displaying product lists.
-   Memoize components where appropriate (`React.memo`).
-   Leverage Expo Router for bundle splitting (e.g., lazy-loading checkout flow).
-   Optimize image loading and rendering.
-   Use selective Zustand state selectors to prevent unnecessary re-renders.

## 11. Offline Handling (Minimal)

This strategy focuses on graceful failure rather than full offline capabilities.

-   **Goal:** Prevent crashes and inform the user when offline.
-   **TanStack Query (Queries):**
    -   Utilize `staleTime` to serve cached data when available.
    -   Network Errors (`isError` is true, error indicates network issue):
        -   If cached `data` exists: Show data + non-intrusive offline indicator (e.g., small banner/toast). Disable network-dependent actions.
        -   If no cached `data`: Display an error component within the UI indicating data cannot load, suggesting checking the connection.
-   **TanStack Query (Mutations):**
    -   Network Errors (`onError` callback triggered by network issue):
        -   Notify user with a clear error message (e.g., toast: "Action failed, check connection").
        -   Revert any optimistic UI updates.
        -   No automatic retry queue; user must retry manually when online.

## 12. Error Handling Strategy

-   **TanStack Query (Queries):**
    -   **Fetch Errors:** Use `isError` and `error` properties from `useQuery`.
    -   **Logging:** Log all errors to a monitoring service (e.g., Sentry).
    -   **Network Errors:** Handle as per Section 11.
    -   **Server/Other Errors:** Display user-friendly messages. Avoid showing technical details.
    -   **Retry:** Leverage default TanStack Query retries for transient issues.
-   **Zustand Persistence (MMKV/SecureStore):**
    -   Wrap storage operations in try/catch within the adapter/middleware.
    -   **Load Failure:** If critical state fails to load, default to an empty/initial state.
    -   **Save Failure:** Log the error. Notify only for significant data loss.
-   **UI Rendering Errors:**
    -   Use React `ErrorBoundary` components around major UI sections to prevent app crashes.

## 13. Required Libraries

| Purpose             | Library                     | Notes                               |
| :------------------ | :-------------------------- | :---------------------------------- |
| Server State        | `@tanstack/react-query`     | Handles backend data lifecycle.     |
| Client State        | `zustand`                   | Manages global state.               |
| Client Persistence  | `react-native-mmkv`         | Fast local storage for Zustand.     |
| Secure Storage      | `expo-secure-store`         | For sensitive data like auth tokens.|
| Client-side Search  | `fuse.js`                   | Fast, fuzzy search for catalogues.  |
| Performant Lists    | `@shopify/flash-list`       | Optimized list rendering.           |
| Navigation          | `expo-router`               | File-based routing, code splitting. |
| HTTP Client         | `axios` or `fetch`          | For making API requests.            |

## 14. Migration Strategy

1. **Phased Implementation:**
   - Start with cart and favorites stores (most visible to users)
   - Add authentication state management
   - Introduce TanStack Query for product data

2. **For Each Component:**
   - Identify what state should be global vs. local
   - Replace mock data with real Zustand store usage
   - Keep UI-specific state local with useState/useReducer

3. **Background Synchronization:**
   - Implement optimistic updates for a responsive feel
   - Add background sync with proper error handling
   - Create mechanisms to reconcile local and server state

## 15. Conclusion

This state management architecture focuses on a clean separation between global state that needs to be shared (cart, favorites, auth) and local component state. Zustand will be used only for truly global state, while local React state (useState/useReducer) will continue to handle component-specific UI concerns.

By implementing background synchronization, we ensure the UI remains responsive while maintaining data consistency with the backend. This approach provides a solid foundation for the Tifossi app that balances simplicity, performance, and maintainability.