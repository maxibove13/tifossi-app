# MSW Mock Data Architecture

This directory contains comprehensive MSW (Mock Service Worker) handlers and realistic mock data for the Tifossi Expo app testing infrastructure.

## Overview

The mock data architecture follows the principle of **mocking only at the HTTP boundary** using MSW. This approach provides:

- Realistic network behavior with delays and error simulation
- Comprehensive API coverage for all Tifossi endpoints
- Realistic data that matches production schemas
- Uruguayan-specific data for authentic testing

## Architecture

```
app/_tests/mocks/
├── handlers.ts          # MSW handlers for all API endpoints
├── data/
│   ├── products.ts      # Product mock data (60+ products)
│   ├── users.ts         # User mock data with Uruguayan addresses
│   └── orders.ts        # Order mock data with various states
├── server.ts            # MSW server setup
├── mock-data.test.ts    # Data validation tests
└── README.md           # This documentation
```

## Mock Data

### Products (`/data/products.ts`)

- **60+ realistic products** covering Uruguayan football teams
- **Teams**: Nacional, Peñarol, Defensor, Wanderers, Danubio, etc.
- **Categories**: Apparel, Accessories, Footwear, Equipment
- **Features**: Discounts, stock levels, multiple images, sizes, colors
- **Special items**: Retro jerseys, limited editions, Uruguay national team

**Key Features:**

```typescript
interface MockProduct {
  id: string;
  attributes: {
    name: string;
    price: number;
    discountPrice?: number;
    shortDescription: { line1: string; line2: string };
    longDescription: string;
    category: string;
    team: string;
    sport: string;
    sizes: string[];
    colors: string[];
    stock: number;
    featured: boolean;
    isNew: boolean;
    images: { data: ImageData[] };
  };
}
```

### Users (`/data/users.ts`)

- **53 users** with authentic Uruguayan data
- **Addresses**: Realistic Montevideo and interior addresses
- **Phone numbers**: Valid Uruguayan format (+598)
- **Test users**: Predefined users for integration testing

**Key Features:**

```typescript
interface MockUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addresses: Address[];
  preferences: {
    favoriteTeams: string[];
    favoriteCategories: string[];
    newsletter: boolean;
    promotions: boolean;
  };
}
```

**Addresses include:**

- Montevideo neighborhoods: Pocitos, Punta Carretas, Centro, etc.
- Interior cities: Salto, Paysandú, Rivera, Maldonado
- Realistic street names and postal codes
- Multiple address types: home, work, other

### Orders (`/data/orders.ts`)

- **152 orders** with various states and realistic data
- **Statuses**: CREATED, PAID, PROCESSING, SHIPPED, DELIVERED, etc.
- **Payment methods**: MercadoPago, credit/debit cards, cash
- **Shipping**: Delivery and pickup options with realistic costs
- **Status history**: Complete order tracking information

**Key Features:**

```typescript
interface MockOrder {
  id: string;
  orderNumber: string; // Format: TIF-YYYYMMDD-XXXXXX
  status: OrderStatus;
  items: OrderItem[];
  user: UserInfo;
  shippingAddress: Address;
  shippingMethod: 'delivery' | 'pickup';
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  mpCollectionStatus?: string;
  statusHistory?: StatusEvent[];
}
```

## API Handlers (`/handlers.ts`)

### Product Endpoints

- `GET /api/products` - Product listing with pagination and filtering
- `GET /api/products/:id` - Individual product details
- `GET /api/products/search` - Product search with filters

### Authentication Endpoints

- `POST /api/auth/local` - Email/password authentication
- `POST /api/auth/local/register` - User registration
- `GET /api/users/me` - Current user profile
- `POST /api/auth/change-password` - Password change
- `POST /api/auth/send-email-confirmation` - Email verification
- `POST /api/upload` - Profile picture upload

### Cart Endpoints

- `GET /api/users/me` - Get cart (cart is a JSON field on user)
- `PUT /api/user-profile/me` - Sync cart (send `{ cart: [...] }`) - custom endpoint

### Order Endpoints

**Production API:**
- `POST /api/orders` - Create new order (authenticated)
- `GET /api/orders` - List user's orders (authenticated, auto-scoped to user)
- `GET /api/orders/:id` - Get order details (authenticated, own orders only)

**Mock-only (not in production):**
- `PUT /api/orders/:id/status` - Update order status (admin-only via Strapi panel)
- `PUT /api/orders/:id/cancel` - Cancel order (not yet implemented)
- `GET /api/orders/:id/tracking` - Order tracking (not yet implemented)

### Favorites Endpoints

- `GET /api/users/me?populate=favorites` - Get favorites (via user profile, built-in Strapi endpoint)
- `PUT /api/user-profile/me` - Sync favorites (send `{ favorites: { set: [...] } }`) - custom endpoint

### Address Endpoints

- `GET /user-profile/me/addresses` - Get user addresses
- `POST /user-profile/me/addresses` - Create new address
- `PUT /user-profile/me/addresses/:index` - Update address by index
- `DELETE /user-profile/me/addresses/:index` - Delete address by index
- `PUT /user-profile/me/addresses/:index/default` - Set default address

### Utility Endpoints

- `GET /api/health` - Health check
- `GET /api/simulate-error` - Error simulation for testing

## Features

### Realistic Network Behavior

- **Random delays**: 100-1200ms response times
- **Error simulation**: Configurable error rates (1-5%)
- **Timeout simulation**: Long delays for testing loading states
- **Auth validation**: Proper JWT token validation

### Comprehensive Error Scenarios

- **404 errors**: Non-existent resources
- **401 errors**: Authentication required
- **400 errors**: Validation failures
- **500 errors**: Server errors
- **Network timeouts**: Connection issues

### Uruguayan-Specific Data

- **Football teams**: All major Uruguayan clubs
- **Addresses**: Real Montevideo neighborhoods and interior cities
- **Phone numbers**: Valid +598 format
- **Payment methods**: MercadoPago, local cards, cash options
- **Shipping zones**: Montevideo vs interior pricing

## Testing Integration

### Predefined Test Users

```typescript
// Available for integration testing
const testCredentials = [
  { email: 'test@tifossi.com', password: 'password123' },
  { email: 'admin@tifossi.com', password: 'admin123' },
  { email: 'user@tifossi.com', password: 'user123' },
];
```

### Test Orders

- `test_order_1`: Delivered order for testing tracking
- `test_order_2`: Processing order for testing status updates

### Mock Server Setup

```typescript
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Important: Mock Response Format

**httpClient returns unwrapped data:**

The httpClient wrapper automatically returns `response.data`, so when mocking httpClient directly:

```typescript
// ✅ CORRECT - httpClient mock returns data directly
mockHttpClient.get.mockResolvedValue([{ id: 1, name: 'Address' }]);
mockHttpClient.post.mockResolvedValue({ order: { id: 'ORDER_1' } });

// ❌ WRONG - Don't wrap in {data: ...}
mockHttpClient.get.mockResolvedValue({ data: [{ id: 1, name: 'Address' }] });
```

**This differs from MSW handlers** which mock the HTTP layer and should return full responses:

```typescript
// MSW handlers return full HTTP responses
http.get('/api/products', () => {
  return HttpResponse.json({
    data: products  // ✅ Correct for MSW
  });
});
```

## Usage Examples

### Basic Product Testing

```typescript
// Fetch products
const response = await fetch('/api/products');
const data = await response.json();
expect(data.data).toHaveLength(10); // Default page size

// Search products
const searchResponse = await fetch('/api/products?filters[$or][0][title][$containsi]=nacional');
const searchData = await searchResponse.json();
```

### Authentication Testing

```typescript
// Login with test user
const loginResponse = await fetch('/api/auth/local', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'test@tifossi.com',
    password: 'password123',
  }),
});

const { jwt, user } = await loginResponse.json();

// Use JWT for authenticated requests
const userResponse = await fetch('/api/users/me', {
  headers: { Authorization: `Bearer ${jwt}` },
});
```

### Order Testing

```typescript
// Create order
const orderResponse = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwt}`,
  },
  body: JSON.stringify({
    items: [{ productId: '1', quantity: 2 }],
    shippingAddress: {
      /* address data */
    },
    shippingMethod: 'delivery',
  }),
});
```

## Data Validation

The mock data includes comprehensive validation tests in `mock-data.test.ts`:

- **Structure validation**: All required fields present
- **Data integrity**: Relationships between entities
- **Format validation**: Email, phone, date formats
- **Business rules**: Pricing, stock, order totals
- **Regional authenticity**: Uruguayan-specific data

## Performance

- **Generated at startup**: All data pre-generated for consistent performance
- **Memory efficient**: Optimized data structures
- **Fast lookups**: Indexed by ID for O(1) access
- **Realistic delays**: Configurable network simulation

## Maintenance

### Adding New Products

```typescript
// In data/products.ts
productMockData.push({
  id: 'new-product-id',
  attributes: {
    name: 'New Product Name',
    price: 99.99,
    // ... other required fields
  },
});
```

### Adding New Endpoints

```typescript
// In handlers.ts
http.get('/api/new-endpoint', async ({ request }) => {
  await addDelay(200, 500);
  // Handle auth if needed
  // Return appropriate response
});
```

### Updating Test Data

```typescript
// Add new test scenarios
const newTestUser = {
  id: 999,
  email: 'newtest@tifossi.com',
  // ... other fields
};
userMockData.push(newTestUser);
```

## Troubleshooting

### Common Issues

1. **Import errors**: Ensure MSW is installed and configured
2. **Network errors**: Check handler URLs match API endpoints
3. **Data mismatches**: Validate mock data structure matches app types
4. **Authentication failures**: Verify JWT token handling

### Debugging

Enable MSW logging:

```typescript
// In server.ts
const server = setupServer(...handlers);

// Log all requests in development
if (process.env.NODE_ENV === 'development') {
  server.events.on('request:start', ({ request }) => {
    console.log('MSW intercepted:', request.method, request.url);
  });
}
```

## Best Practices

1. **Keep data realistic**: Use authentic Uruguayan data
2. **Test edge cases**: Include error scenarios and empty states
3. **Maintain relationships**: Ensure data consistency between entities
4. **Update regularly**: Keep mock data in sync with real API changes
5. **Document changes**: Update this README when adding new features

## Future Enhancements

- **Dynamic data**: Runtime data modification for advanced testing
- **Scenario presets**: Predefined test scenarios (high stock, no stock, etc.)
- **Performance metrics**: Response time tracking and optimization
- **API versioning**: Support for multiple API versions
- **Real-time updates**: WebSocket mocking for live data

---

This mock data architecture provides a solid foundation for comprehensive testing of the Tifossi Expo app, ensuring reliable and realistic test environments that closely mirror production behavior.
