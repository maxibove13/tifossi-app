# Test Utilities for Tifossi Expo App

This directory contains comprehensive test utilities that make writing tests easier, more consistent, and more realistic. The utilities follow the principles outlined in `TESTING_PRINCIPLES.md`.

## Quick Start

```typescript
import { render, productFactory, storeUtils } from '@/_tests/utils';

// Create test data
const product = productFactory.create();

// Setup store state
storeUtils.auth.setupLoggedInUser();

// Render component with providers
const { getByText } = render(<ProductCard product={product} />);

// Use custom matchers
expect(product).toBeValidProduct();
```

## Core Utilities

### 1. Render Utils (`render-utils.tsx`)

Custom render function that provides all necessary providers for components.

**Default Providers Included:**

- NavigationContainer with test stack navigator
- QueryClientProvider with test-optimized settings
- GestureHandlerRootView for gesture support
- All Zustand stores (using real stores, not mocks)

```typescript
import { render, renderWithNavigation, renderWithoutProviders } from '@/_tests/utils';

// Full render with all providers (default)
const { getByText } = render(<MyComponent />);

// Render with only navigation
const { getByText } = renderWithNavigation(<MyComponent />);

// Minimal render without providers
const { getByText } = renderWithoutProviders(<MyComponent />);

// Custom configuration
const { getByText } = render(<MyComponent />, {
  withNavigation: true,
  withQueryClient: false,
  initialRouteName: 'product',
});
```

### 2. Test Data Factories (`test-data.ts`)

Factory functions to generate realistic test data.

```typescript
import { productFactory, userFactory, cartItemFactory } from '@/_tests/utils';

// Create realistic products
const product = productFactory.create();
const products = productFactory.createMany(5);
const saleProduct = productFactory.createOnSale();
const outOfStockProduct = productFactory.createOutOfStock();

// Create users with different scenarios
const user = userFactory.create();
const unverifiedUser = userFactory.createUnverified();
const appleUser = userFactory.createWithApple();

// Create cart items
const cartItem = cartItemFactory.create();
const cartItems = cartItemFactory.fromProducts([product]);
```

**Available Factories:**

- `productFactory` - Products with realistic names, prices, colors, sizes
- `userFactory` - Users with realistic names, emails, providers
- `cartItemFactory` - Cart items with proper product references
- `categoryFactory` - Product categories
- `addressFactory` - User addresses (Uruguayan format)
- `preferencesFactory` - User preferences
- `productCardFactory` - Product card data

### 3. Store Utils (`store-utils.ts`)

Utilities for managing Zustand store state in tests.

```typescript
import { storeUtils, setupAuthenticatedUserWithCart } from '@/_tests/utils';

// Reset all stores (done automatically in beforeEach)
storeUtils.resetAll();

// Manage auth store
const user = storeUtils.auth.setupLoggedInUser();
storeUtils.auth.setupLoggedOutUser();
storeUtils.auth.setupLoadingState();
storeUtils.auth.setupErrorState('Login failed');

// Manage cart store
const items = storeUtils.cart.setupWithItems();
storeUtils.cart.setupEmpty();
storeUtils.cart.setupAuthenticatedCart();

// Setup complete scenarios
const { user, cartItems, addresses } = setupAuthenticatedUserWithCart();
const { cartItems } = setupGuestUser();

// Wait for async store updates
await storeUtils.auth.waitFor((state) => state.isLoggedIn === true);
```

**Available Store Utils:**

- `authStoreUtils` - Authentication state management
- `cartStoreUtils` - Shopping cart state management
- `userStoreUtils` - User profile and preferences
- `favoritesStoreUtils` - Product favorites
- `productStoreUtils` - Product catalog and search
- `paymentStoreUtils` - Payment methods and processing

### 4. Custom Matchers (`custom-matchers.ts`)

Jest matchers for domain-specific assertions.

```typescript
// Product matchers
expect(product).toBeValidProduct();
expect(product.price).toBeValidPrice();
expect(product).toBeInStock();
expect(product).toHaveProductStatus('sale');
expect(product).toHaveDiscountPercentage(25);

// Cart matchers
expect(cartItem).toBeValidCartItem();
expect(cartItem).toHaveCartQuantity(2);
expect({ productId: 'prod_123' }).toBeInCart(cartItems);

// User matchers
expect(user).toBeValidUser();
expect(user).toBeVerifiedUser();
expect(user).toHaveProvider('apple');

// Auth state matchers
expect(authState).toBeLoggedIn();
expect(authState).toBeLoggedOut();
expect(authState).toHaveAuthError();

// Cart state matchers
expect(cartState).toBeEmptyCart();
expect(cartState).toHaveCartItems(3);

// General state matchers
expect(state).toBeLoading();
expect(state).toHaveError('Network error');
expect(state).toBeSuccessState();
```

## Best Practices

### 1. Use Realistic Test Data

```typescript
// ✅ Good - Uses factory with realistic data
const product = productFactory.create();

// ❌ Bad - Unrealistic test data
const product = { id: 'test', name: 'foo', price: 123 };
```

### 2. Use Real Stores, Not Mocks

```typescript
// ✅ Good - Uses real store with test utilities
storeUtils.auth.setupLoggedInUser();
expect(storeUtils.auth.getState()).toBeLoggedIn();

// ❌ Bad - Mocks the store
jest.mock('@/stores/authStore');
```

### 3. Reset State Between Tests

This is done automatically in `setup.ts`, but you can also do it manually:

```typescript
beforeEach(() => {
  storeUtils.resetAll();
});
```

### 4. Use Custom Matchers for Better Test Messages

```typescript
// ✅ Good - Clear what's being tested
expect(product).toBeValidProduct();

// ❌ Bad - Generic assertion
expect(typeof product).toBe('object');
```

### 5. Test Async Store Updates

```typescript
// ✅ Good - Wait for specific condition
await storeUtils.cart.waitFor((state) => state.items.length > 0);

// ❌ Bad - Arbitrary wait
await new Promise((resolve) => setTimeout(resolve, 1000));
```

## Common Patterns

### Testing Component with Authentication

```typescript
it('should show user-specific content when logged in', () => {
  const user = storeUtils.auth.setupLoggedInUser();

  const { getByText } = render(<UserProfile />);

  expect(getByText(user.name!)).toBeTruthy();
});
```

### Testing Cart Functionality

```typescript
it('should add product to cart', async () => {
  const product = productFactory.createForCart();
  storeUtils.cart.setupEmpty();

  const { getByText } = render(<ProductCard product={product} />);

  fireEvent.press(getByText('Add to Cart'));

  await storeUtils.cart.waitFor(state => state.items.length === 1);
  expect(storeUtils.cart.getState()).toHaveCartItems(1);
});
```

### Testing Complete User Flows

```typescript
it('should complete checkout flow', async () => {
  const { user, cartItems } = setupAuthenticatedUserWithCart();

  const { getByText } = render(<CheckoutScreen />);

  // User goes through checkout
  fireEvent.press(getByText('Proceed to Payment'));

  await waitFor(() => {
    expect(getByText('Order Confirmed')).toBeTruthy();
  });
});
```

### Testing Error States

```typescript
it('should handle auth errors', () => {
  storeUtils.auth.setupErrorState('Invalid credentials');

  const { getByText } = render(<LoginForm />);

  expect(getByText('Invalid credentials')).toBeTruthy();
});
```

## File Structure

```
app/_tests/utils/
├── README.md                  # This documentation
├── index.ts                   # Main export file
├── render-utils.tsx           # Custom render function with providers
├── test-data.ts              # Test data factories
├── store-utils.ts            # Store state management utilities
├── custom-matchers.ts        # Custom Jest matchers
└── example-usage.test.tsx    # Example usage and documentation tests
```

## Integration with Existing Setup

These utilities integrate seamlessly with the existing test setup:

- **`setup.ts`** - Automatically sets up custom matchers and resets stores
- **`jest.config.js`** - Configured to use these utilities
- **MSW** - Works with MSW for API mocking at the boundary

## Advanced Usage

### Debugging Store State

```typescript
// Add logging for store changes during tests
const unsubscribe = storeUtils.debug(useCartStore, 'CartStore', (state) => ({
  itemCount: state.items.length,
  total: state.total,
}));

// Don't forget to unsubscribe
afterAll(() => unsubscribe());
```

### Deterministic Test Data

```typescript
import { deterministicRandom, resetIdCounter } from '@/_tests/utils';

// Create predictable test data for snapshot tests
resetIdCounter(1000);
const product = productFactory.create({
  title: deterministicRandom.choice(['Product A', 'Product B'], 0),
  price: deterministicRandom.price(1000, 5000, 0),
});
```

### Custom Store Conditions

```typescript
// Wait for multiple store conditions
await storeUtils.waitForMultipleConditions([
  {
    store: useAuthStore,
    predicate: (state) => state.isLoggedIn,
    name: 'AuthStore login',
  },
  {
    store: useCartStore,
    predicate: (state) => state.items.length > 0,
    name: 'CartStore items',
  },
]);
```

## Migration from Existing Tests

To migrate existing tests to use these utilities:

1. **Replace render imports:**

   ```typescript
   // Old
   import { render } from '@testing-library/react-native';

   // New
   import { render } from '@/_tests/utils';
   ```

2. **Replace test data creation:**

   ```typescript
   // Old
   const product = { id: 'test', name: 'Test Product', price: 100 };

   // New
   const product = productFactory.create();
   ```

3. **Replace store mocks with real stores:**

   ```typescript
   // Old
   jest.mock('@/stores/authStore');

   // New
   storeUtils.auth.setupLoggedInUser();
   ```

4. **Use custom matchers:**

   ```typescript
   // Old
   expect(product.price).toBeGreaterThan(0);

   // New
   expect(product).toBeValidProduct();
   ```

These utilities make tests more maintainable, realistic, and easier to write while following the established testing principles.
