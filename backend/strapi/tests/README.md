# Strapi Backend Testing Documentation

## Current Test Status

As of March 2026, the Strapi backend has the following test structure:

### Test Files (7 files)

- **smoke.test.js** - Basic configuration and structure tests
- **orders.test.js** - Order API structure tests (integration tests skipped)
- **mercadopago-webhook.test.js** - Webhook validation helpers and config tests
- **health.test.js** - Health endpoint tests (requires full Strapi instance)
- **products.test.js** - Product API tests (requires full Strapi instance)
- **delete-account.test.js** - Account deletion tests
- **user-profile.test.js** - User profile tests

### ⏸️ Skipped Tests (25 tests)

- Integration tests requiring full Strapi instance
- Payment flow tests requiring MercadoPago sandbox
- Database operation tests

## Test Philosophy

Following the principles in `/docs/TESTING_PRINCIPLES.md`:

- **Focus on revenue-critical paths** - Orders, payments, webhooks
- **Pragmatic approach** - Start with smoke tests, add integration tests as needed
- **Mock only at boundaries** - Use real Strapi when possible, mock external services

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/smoke.test.js

# Run in watch mode
npm test -- --watch
```

## Test Configuration

### Environment Setup

Tests use SQLite in-memory database for speed:

- `DATABASE_CLIENT=sqlite`
- `DATABASE_FILENAME=:memory:`
- `NODE_ENV=test`

### Mocked Utilities

The `jest.setup.js` file provides:

- `global.env` - Mimics Strapi's env helper
- `global.setupStrapi` - Creates test Strapi instance (not currently used)
- `global.cleanupStrapi` - Safely tears down Strapi
- `global.createTestUser` - Helper for auth tests
- `global.authenticateUser` - JWT generation helper

## Known Issues

### 1. Integration Tests Require Full Strapi

The `health.test.js` and `products.test.js` files are currently disabled because they require:

- Full Strapi instance initialization
- Database migrations
- Plugin initialization
- HTTP server startup

**Solution**: These tests are valuable but need proper Strapi test harness setup.

### 2. MercadoPago Webhook Tests

Most webhook tests are skipped because they require:

- Actual webhook endpoint implementation
- MercadoPago webhook secret configuration
- Database operations for order updates

**Solution**: Implement when webhook endpoint is created.

## Adding New Tests

### Revenue-Critical Tests (Priority 1)

Add tests for anything that could lose money:

```javascript
describe('Revenue Critical Feature', () => {
  it('should prevent money loss scenario', () => {
    // Test that prices can't be tampered
    // Test that payments are validated
    // Test that inventory is protected
  });
});
```

### Smoke Tests (Quick Wins)

Add basic structure tests that don't need Strapi:

```javascript
it('should have required API files', () => {
  const fs = require('fs');
  const path = require('path');

  const apiPath = path.join(__dirname, '..', 'src', 'api', 'feature');
  expect(fs.existsSync(apiPath)).toBe(true);
});
```

### Integration Tests (When Needed)

For testing actual API endpoints:

```javascript
describe('API Integration', () => {
  let strapi;

  beforeAll(async () => {
    strapi = await setupStrapi();
  });

  afterAll(async () => {
    await cleanupStrapi();
  });

  it('should handle API request', async () => {
    const response = await request(strapi.server.httpServer).get('/api/endpoint').expect(200);
  });
});
```

## Future Improvements

### Phase 1: Enable Existing Integration Tests

1. Fix Strapi instance initialization in tests
2. Enable `health.test.js` and `products.test.js`
3. Add proper database setup/teardown

### Phase 2: Add Revenue-Critical Coverage

1. Implement actual order creation tests
2. Add payment processing tests with mock MercadoPago
3. Test inventory management during checkout
4. Test cart-to-order conversion

### Phase 3: Add Security Tests

1. Test webhook signature validation
2. Test authentication requirements
3. Test authorization (users see only their orders)
4. Test input validation and sanitization

### Phase 4: Performance Tests

1. Test concurrent order creation
2. Test database query optimization
3. Test API response times
4. Load testing for checkout flow

## Continuous Integration

Tests are configured to run in CI with:

- SQLite for fast execution
- Mocked external services
- Focus on smoke tests for quick feedback

For production-like testing:

- Use PostgreSQL database
- Real MercadoPago sandbox
- Full integration test suite

## Best Practices

1. **Keep tests fast** - Use SQLite, mock external services
2. **Test behavior, not implementation** - Focus on outcomes
3. **Follow the money** - Prioritize revenue-critical paths
4. **Document skipped tests** - Explain why and when to enable
5. **Use descriptive test names** - Should explain what and why

## Contact

For questions about testing:

1. Review `/docs/TESTING_PRINCIPLES.md`
2. Check existing test patterns
3. Follow pragmatic approach - ship with confidence, not perfection
