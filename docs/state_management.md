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
- **HTTP Client:** Centralized in `app/_services/api/httpClient.ts`
- **Key Mock Endpoints:**
  - `fetchProducts`: Returns all products with configurable delay
  - `fetchProductById`: Returns a single product by ID
  - `syncCart`: Simulates cart synchronization with backend
  - `syncFavorites`: Simulates favorites synchronization
  - `fetchFavorites`: Fetches user favorites from server
  - `login/register/validateToken`: Auth-related mock methods

**Note:** The application is prepared for future migration to TanStack Query when a real backend becomes available.

### 2.1 HTTP Client Layer

The application uses a centralized HTTP client (`httpClient.ts`) that provides:

- **Automatic auth token injection**: Adds Bearer tokens to protected endpoints
- **Public endpoint detection**: Skips auth tokens for public endpoints to prevent 401 errors
- **URL validation**: Prevents common mistakes like double `/api/api/...` paths or absolute URLs
- **Strapi compatibility**: Custom params serializer for Strapi's array parameter format
- **Timeout management**: Configurable request timeouts (10 seconds default)
- **Error handling**: Automatic 401 handling (clears invalid tokens)

**Public Paths Configuration:**
Public endpoints are defined in `publicPaths.ts` and include:
- Product catalog (`/products`, `/categories`)
- Authentication (`/auth/local`)
- Store locations (`/store-locations`)
- App settings (`/app-settings`)

**Usage:**
```typescript
import { httpClient } from '@/_services/api/httpClient';

// Public endpoint - no auth token sent
const products = await httpClient.get('/products');

// Protected endpoint - auth token automatically added
const profile = await httpClient.get('/users/me');
```

## 3. Client State Management (Zustand)

### 3.1 Implementation Overview

- **Library:** `zustand` with `persist` middleware
- **Store Location:** `app/_stores/` directory
- **Current Stores:**
  - `cartStore.ts`: Shopping cart management
  - `favoritesStore.ts`: Product favorites management
  - `authStore.ts`: Authentication state
  - `paymentStore.ts`: Payment/checkout UI state

### 3.2 Store Implementations

#### Cart Store (`cartStore.ts`)

- **Persistence:** MMKV storage with custom ID
- **Key Features:**
  - Optimistic updates with error rollback
  - Item variant handling (size, color)
  - Quantity management with auto-removal
  - Guest users: Local-only persistence (MMKV), no server sync
  - Authenticated users: Server sync via `PUT /user-profile/me` with `{ cart: items }`
  - Cart migration on login: Merges guest cart with server cart client-side

#### Favorites Store (`favoritesStore.ts`)

- **Persistence:** MMKV storage with custom ID
- **Key Features:**
  - Simple productId tracking
  - Toggle/add/remove operations
  - Optimistic updates with error handling
  - Guest users: Local-only persistence (MMKV), deferred sync via `pendingOperations`
  - Authenticated users: Server sync via `PUT /user-profile/me` with `{ favorites: { set: productIds } }` (Strapi relation format)
  - **Deferred sync pattern:** When user is not authenticated, sync operations add `'sync'` to `pendingOperations` instead of failing. The `storeSynchronizer` triggers pending syncs when the user logs in.
  - **Server initialization:** `fetchFromServer()` fetches favorites via `GET /user-profile/me` and replaces local state with server state on login
  - **Duplicate prevention:** Product IDs are normalized (deduplicated via `Set`) at multiple points: when adding/removing locally, before syncing with server (with automatic drift detection and correction), when fetching from server, and when hydrating from local storage. The backend also deduplicates IDs before persistence.

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

#### Payment Store (`paymentStore.ts`)

- **Persistence:** None (transient UI state only)
- **Key Features:**
  - Current order tracking (orderNumber, orderId)
  - Selected store location for pickup orders
  - **Selected delivery address:**
    - `selectedAddress`: Stores the Address object for logged-in user delivery
    - Set via shipping-address screen when user selects an address
    - Used by payment-selection to get shipping address without URL params
  - **Guest checkout data (`GuestCheckoutData`):**
    - Unified interface containing both contact info and optional delivery address fields
    - Contact fields (always required): `firstName`, `lastName`, `email`, `phoneNumber`
    - Address fields (optional, for delivery): `addressLine1`, `addressLine2`, `city`, `state`, `postalCode`, `country`
    - For pickup orders: Only contact fields are populated
    - For delivery orders: Both contact and address fields are populated
  - **Checkout flow navigation (`originProductId` and `closeCheckoutFlow`):**
    - `originProductId`: Tracks which product initiated the checkout flow
    - `setOriginProductId`: Called when entering checkout from product detail
    - `closeCheckoutFlow()`: Clears all payment state and navigates back to origin product (if set) or home
    - Used by close buttons in checkout screens for intelligent back-navigation
  - **"Comprar ahora" (Buy Now) flow:**
    - `PendingBuyNowItem`: Stores product info for direct purchase without adding to cart
    - Allows users to back out of checkout without polluting their cart
    - Cleared automatically via `clearPaymentState()` when leaving checkout
    - `payment-selection.tsx` validates and includes ONLY `pendingBuyNowItem` in order creation (completely separate from cart - industry standard "Buy Now" behavior)
    - `payment-result.tsx` uses a ref to track if the order was a Buy Now order BEFORE clearing `pendingBuyNowItem`, ensuring cart is only cleared for regular cart checkouts (not Buy Now orders)
    - `cart.tsx` clears `pendingBuyNowItem` when starting cart checkout to prevent stale items from abandoned buy-now flows
    - `OverlayCheckoutShipping` restores size/quantity from `pendingBuyNowItem` when returning from checkout screens
  - **Shipping selection return flow (`shouldShowShippingSelectionOnReturn`):**
    - Single boolean flag used by BOTH "add-to-cart" and "buy-now" checkout flows
    - Set before navigating to checkout by: `OverlayProductAdding`, `OverlayCheckoutShipping`, and `SwipeableEdge.handleReturnShippingSelect`
    - Checked by `SwipeableEdge`'s `useFocusEffect` to show shipping selection overlay when user navigates back from checkout
    - Reset to `false` after overlay is displayed to prevent duplicate shows
    - Simplifies previous logic that used separate tracking mechanisms for each flow
  - Loading and error state for payment processing UI

### 3.3 Store Synchronization (`storeSynchronizer.ts`)

The store synchronizer coordinates cross-store operations on authentication events.

- **Purpose:** Triggers deferred sync operations when user authentication state changes
- **Key Features:**
  - Subscribes to auth store token changes
  - When a token is set (user logs in):
    1. Calls `fetchFromServer()` on favorites store to initialize with server state
    2. Checks if favorites store has pending operations
    3. Automatically triggers `syncWithServer()` on favorites store if `'sync'` is in `pendingOperations`
  - Enables offline-first behavior: users can modify favorites while logged out, and changes sync automatically upon login

## 4. Search Implementation

**Current Implementation:** Basic filtering via `useSearch` hook in `hooks/useSearch.ts`

- Implements client-side filtering of product data
- Supports text search with case insensitivity
- Future plan: Replace with Fuse.js or server-side search when needed

## 5. Current Data Flow

| Feature            | State Management  | Persistence        | Implementation Notes                                                          |
| :----------------- | :---------------- | :----------------- | :---------------------------------------------------------------------------- |
| Product Catalogue  | Local Data        | None (static data) | Imported from `app/_data/products.ts`                                         |
| Search / Filtering | Local React State | None               | Client-side filtering via `useSearch` and `useProductFilters` hooks           |
| Shopping Cart      | Zustand           | MMKV               | Guest: local-only. Auth: syncs via `PUT /user-profile/me` (cart is JSON field)       |
| Favorites          | Zustand           | MMKV               | Guest: local-only with deferred sync. Auth: syncs via `PUT /user-profile/me`. Pending syncs trigger on login via storeSynchronizer |
| Auth Tokens        | Zustand           | SecureStore        | Managed by `useAuthStore`, login triggers cart/favorites sync                 |
| Payment UI         | Zustand           | None               | Transient checkout state: guest data, pending buy-now items, order tracking   |
| UI Interactions    | Local React State | None               | Component-local state using useState/useReducer                               |

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
│   ├── paymentStore.ts    # Payment/checkout UI state
│   └── storeSynchronizer.ts # Cross-store coordination on auth events
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
- ✅ Favorites fetch from server on login
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
