# Tifossi State Management Specification

This document outlines the state management implementation for the Tifossi Expo application, based on a lean, client-side model optimized for performance and maintainability.

## 1. Architecture Overview

The application uses a two-layer state management architecture:

1. **Server State:** Data originating from and owned by the backend (currently mocked via mockApi).
2. **Client State:** Data relevant to the current user session and device (cart, favorites, authentication), implemented with **Zustand**.

Key implementation patterns:
- Optimistic updates with error rollback
- Local persistence via MMKV storage
- Secure token storage with expo-secure-store

## 2. Server State Management (Mock Implementation)

- **Current Implementation:** Using local mock data through `mockApi.ts`
- **API Interface:** Located in `app/_services/api/mockApi.ts`
- **Key Mock Endpoints:**
  - `fetchProducts`: Returns all products with configurable delay
  - `fetchProductById`: Returns a single product by ID
  - `syncCart`: Simulates cart synchronization with backend
  - `syncFavorites`: Simulates favorites synchronization
  - `login/register/validateToken`: Auth-related mock methods

**Note:** The application is prepared for future migration to TanStack Query when a real backend becomes available.

## 3. Client State Management (Zustand)

### 3.1 Implementation Overview
- **Library:** `zustand` with `persist` middleware
- **Store Location:** `app/_stores/` directory
- **Current Stores:** 
  - `cartStore.ts`: Shopping cart management
  - `favoritesStore.ts`: Product favorites management
  - `authStore.ts`: Authentication state

### 3.2 Store Implementations

#### Cart Store (`cartStore.ts`)
- **Persistence:** MMKV storage with custom ID
- **Key Features:**
  - Optimistic updates with error rollback
  - Item variant handling (size, color)
  - Quantity management with auto-removal
  - Server synchronization support

#### Favorites Store (`favoritesStore.ts`)
- **Persistence:** MMKV storage with custom ID
- **Key Features:**
  - Simple productId tracking
  - Toggle/add/remove operations
  - Optimistic updates with error handling
  - Server synchronization support

#### Auth Store (`authStore.ts`)
- **Persistence:** SecureStore for token storage
- **Key Features:**
  - Token-based authentication
  - Login/register/logout flows
  - Password reset request handling
  - Session restoration on app launch
  - Authentication status tracking
  - Error handling for auth operations
  - Triggers cart/favorites sync after login
  - Development toggle for testing authenticated state

## 4. Search Implementation 

**Current Implementation:** Basic filtering via `useSearch` hook in `hooks/useSearch.ts`
- Implements client-side filtering of product data
- Supports text search with case insensitivity
- Future plan: Replace with Fuse.js or server-side search when needed

## 5. Current Data Flow

| Feature             | State Management  | Persistence            | Implementation Notes                                                   |
| :------------------ | :---------------- | :--------------------- | :--------------------------------------------------------------------- |
| Product Catalogue   | Local Data        | None (static data)     | Imported from `app/_data/products.ts`                                  |
| Search / Filtering  | Local React State | None                   | Client-side filtering via `useSearch` and `useProductFilters` hooks    |
| Shopping Cart       | Zustand           | MMKV                   | Optimistic updates with `useCartStore`, sync with mockApi              |
| Favorites           | Zustand           | MMKV                   | Optimistic updates with `useFavoritesStore`, sync with mockApi         |
| Auth Tokens         | Zustand           | SecureStore            | Managed by `useAuthStore`, sync triggers other stores                  |
| UI Interactions     | Local React State | None                   | Component-local state using useState/useReducer                        |

## 6. Current Project Structure

The state management files are organized in the following structure:

```
app/
├── _services/
│   └── api/
│       └── mockApi.ts     # Mock API implementation with simulated delays
├── _stores/               # Zustand stores
│   ├── authStore.ts       # Authentication state
│   ├── cartStore.ts       # Shopping cart state
│   ├── favoritesStore.ts  # Favorites state
│   └── localStorageAdapter.ts  # MMKV adapter utilities
hooks/                     # Custom hooks for state access
    ├── useFavoriteStatus.ts    # Favorites status hook
    ├── useProductFilters.ts    # Product filtering hook
    ├── useProducts.ts          # Product data access hook
    └── useSearch.ts            # Search functionality hook
```

## 7. TypeScript Type System

Key types currently implemented:
- `Product`: Full product model in `app/_types/product.ts`
- `CartItem`: Cart item interface in `app/_services/api/mockApi.ts`
- `User`: User model in `app/_services/api/mockApi.ts`
- `ProductFilters`: Filter interface in `hooks/useProductFilters.ts`

## 8. Implementation Status

### 8.1 Completed Features

- ✅ Cart state with MMKV persistence
- ✅ Cart item variant management (size, color)
- ✅ Cart operations (add, update, remove)
- ✅ Favorites state with MMKV persistence 
- ✅ Authentication state with SecureStore token storage
- ✅ Auth session restoration
- ✅ Cross-store coordination (auth triggers other stores)
- ✅ Optimistic updates with error rollback

### 8.2 Planned Features

- 📋 Server state management with TanStack Query
- 📋 Background synchronization service
- 📋 Enhanced offline support
- 📋 Advanced cart features (quantity limits, product availability checks)
- 📋 Multi-device synchronization capabilities
- 📋 Real-time product updates with push notifications
- 📋 Search history and recommendations
- 📋 User preferences storage
- 📋 Performance optimizations for large catalogs
- 📋 Analytics integration for user behavior tracking

## 9. Next Steps

1. **Migrate to TanStack Query**: Replace mock implementations with real API integrations
2. **Optimize Performance**: Implement selective re-rendering strategies and component memoization
3. **Enhance Error Handling**: Develop comprehensive error recovery flows
4. **Offline Capabilities**: Add robust offline functionality with data synchronization
5. **User Experience Improvements**: Implement cross-device sync and session restoration
6. **Monitoring and Analytics**: Integrate state-based user behavior tracking and performance metrics