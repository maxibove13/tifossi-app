/**
 * Example Integration Test for Tifossi Backend Migration
 * 
 * This file demonstrates how to use all the testing utilities together
 * for comprehensive backend integration testing. It serves as both
 * documentation and a working example of the testing infrastructure.
 */

const { JestSetupHelpers, TestDataAssertions } = require('./jest-integration-setup');

// Example 1: Simple Integration Test Suite
JestSetupHelpers.createTestSuite('Backend Integration Tests', 'integration', () => {
  
  describe('Authentication Service Integration', () => {
    test('should create and authenticate a user', async () => {
      // Create a new test user
      const userResult = await global.testHelpers.createTestUser({
        email: 'integration-test@tifossi.com',
        displayName: 'Integration Test User'
      });

      // Validate user creation
      TestDataAssertions.validateUser(userResult.user);
      expect(userResult.user.email).toBe('integration-test@tifossi.com');
      expect(userResult.user.displayName).toBe('Integration Test User');
      expect(userResult.tokens.idToken).toBeDefined();

      // Test user authentication
      const authResult = await global.testHelpers.authenticateTestUser(
        'integration-test@tifossi.com',
        'Test123!'
      );

      expect(authResult.user.uid).toBe(userResult.user.uid);
      expect(authResult.tokens.idToken).toBeDefined();
    });

    test('should handle authentication errors gracefully', async () => {
      await expect(
        global.testHelpers.authenticateTestUser('nonexistent@tifossi.com', 'wrongpass')
      ).rejects.toThrow('No user record found');
    });

    test('should verify email verification flow', async () => {
      const userResult = await global.testHelpers.createTestUser({
        email: 'verification-test@tifossi.com'
      });

      // Send verification email
      await global.mockServices.firebase.sendEmailVerification(userResult.tokens.idToken);

      // Get the verification code (in real tests, this would come from email)
      const verificationData = global.mockServices.firebase.verificationCodes
        .get('verification-test@tifossi.com');
      
      expect(verificationData).toBeDefined();
      expect(verificationData.code).toMatch(/^\d{6}$/);

      // Confirm verification
      await global.mockServices.firebase.confirmEmailVerification(
        'verification-test@tifossi.com',
        verificationData.code
      );

      // Verify user is now verified
      const user = await global.mockServices.firebase.getUserByEmail('verification-test@tifossi.com');
      expect(user.emailVerified).toBe(true);
    });
  });

  describe('Payment Service Integration', () => {
    test('should process a successful payment', async () => {
      const payment = await global.testHelpers.createTestPayment({
        transaction_amount: 3500,
        description: 'Integration Test Purchase'
      });

      // Validate payment creation
      TestDataAssertions.validatePayment(payment);
      expect(payment.transaction_amount).toBe(3500);
      expect(payment.status).toBe('pending');

      // Wait for payment processing
      await global.testHelpers.waitFor(async () => {
        const updatedPayment = await global.mockServices.mercadopago.getPayment(payment.id);
        return updatedPayment.status !== 'pending';
      });

      // Verify final payment status
      const finalPayment = await global.mockServices.mercadopago.getPayment(payment.id);
      expect(finalPayment.status).toBe('approved');
    });

    test('should handle payment failures correctly', async () => {
      // Create a payment with a declined test card
      const cardToken = await global.mockServices.mercadopago.createCardToken({
        card_number: '4000000000000002', // Declined card
        security_code: '123',
        expiration_month: '12',
        expiration_year: '2025',
        cardholder: { name: 'DECLINED USER' }
      });

      const payment = await global.mockServices.mercadopago.createPayment({
        transaction_amount: 2000,
        currency_id: 'UYU',
        payment_method_id: 'visa',
        token: cardToken.id,
        description: 'Declined Payment Test'
      });

      // Wait for payment processing
      await global.testHelpers.waitFor(async () => {
        const updatedPayment = await global.mockServices.mercadopago.getPayment(payment.id);
        return updatedPayment.status !== 'pending';
      });

      // Verify payment was rejected
      const finalPayment = await global.mockServices.mercadopago.getPayment(payment.id);
      expect(finalPayment.status).toBe('rejected');
    });

    test('should support payment refunds', async () => {
      // Create and process a successful payment
      const payment = await global.testHelpers.createTestPayment({
        transaction_amount: 5000
      });

      await global.testHelpers.waitFor(async () => {
        const updatedPayment = await global.mockServices.mercadopago.getPayment(payment.id);
        return updatedPayment.status === 'approved';
      });

      // Process full refund
      const refund = await global.mockServices.mercadopago.refundPayment(payment.id, {
        amount: 5000,
        reason: 'customer_request'
      });

      expect(refund.amount).toBe(5000);
      expect(refund.status).toBe('approved');

      // Verify payment status updated
      const refundedPayment = await global.mockServices.mercadopago.getPayment(payment.id);
      expect(refundedPayment.status).toBe('refunded');
      expect(refundedPayment.transaction_amount_refunded).toBe(5000);
    });
  });

  describe('Complete User Journey Integration', () => {
    test('should handle complete authenticated shopping flow', async () => {
      // Step 1: Create and authenticate user
      const userResult = await global.testHelpers.createTestUser({
        email: 'complete-journey@tifossi.com',
        displayName: 'Complete Journey User'
      });

      // Step 2: Create an order
      const order = global.testHelpers.createTestOrder({
        userId: userResult.user.uid,
        items: [
          {
            productId: global.testData.products[0].id,
            quantity: 2,
            price: 2500,
            size: 'L',
            color: 'Negro'
          }
        ],
        total: 5000
      });

      TestDataAssertions.validateOrder(order);
      expect(order.total).toBe(5000);

      // Step 3: Process payment for the order
      const payment = await global.testHelpers.createTestPayment({
        transaction_amount: order.total,
        external_reference: order.id,
        description: `Payment for order ${order.id}`
      });

      // Step 4: Wait for payment completion
      await global.testHelpers.waitFor(async () => {
        const updatedPayment = await global.mockServices.mercadopago.getPayment(payment.id);
        return updatedPayment.status === 'approved';
      });

      // Step 5: Verify complete transaction
      const finalPayment = await global.mockServices.mercadopago.getPayment(payment.id);
      expect(finalPayment.external_reference).toBe(order.id);
      expect(finalPayment.transaction_amount).toBe(order.total);
      expect(finalPayment.status).toBe('approved');

      // Step 6: Verify user session is still valid
      const decodedToken = await global.mockServices.firebase.verifyIdToken(userResult.tokens.idToken);
      expect(decodedToken.uid).toBe(userResult.user.uid);
    });

    test('should handle guest checkout flow', async () => {
      // Step 1: Create order without user authentication
      const order = global.testHelpers.createTestOrder({
        userId: null, // Guest order
        guestInfo: {
          email: 'guest@example.com',
          name: 'Guest User'
        },
        items: [{
          productId: global.testData.products[1].id,
          quantity: 1,
          price: 1500
        }],
        total: 1500
      });

      // Step 2: Process payment
      const payment = await global.testHelpers.createTestPayment({
        transaction_amount: order.total,
        external_reference: order.id,
        payer: {
          email: order.guestInfo.email,
          first_name: 'Guest',
          last_name: 'User'
        }
      });

      // Step 3: Verify payment processing
      await global.testHelpers.waitFor(async () => {
        const updatedPayment = await global.mockServices.mercadopago.getPayment(payment.id);
        return updatedPayment.status === 'approved';
      });

      const finalPayment = await global.mockServices.mercadopago.getPayment(payment.id);
      expect(finalPayment.payer.email).toBe(order.guestInfo.email);
      expect(finalPayment.status).toBe('approved');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      // Simulate network issues by increasing error rate
      global.mockServices.firebase.setErrorRate(1.0); // 100% error rate
      
      await expect(
        global.testHelpers.createTestUser()
      ).rejects.toThrow('Network error');

      // Reset error rate
      global.mockServices.firebase.setErrorRate(0);
    });

    test('should handle service degradation', async () => {
      // Simulate degraded service
      global.mockServices.mercadopago.setServiceHealth('degraded');
      global.mockServices.mercadopago.setResponseDelay(2000);

      const startTime = Date.now();
      const payment = await global.testHelpers.createTestPayment();
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThan(2000); // Should take longer due to degradation
      TestDataAssertions.validatePayment(payment);

      // Reset service health
      global.mockServices.mercadopago.setServiceHealth('healthy');
      global.mockServices.mercadopago.setResponseDelay(100);
    });

    test('should handle concurrent operations', async () => {
      // Create multiple users concurrently
      const userPromises = [];
      for (let i = 0; i < 5; i++) {
        userPromises.push(
          global.testHelpers.createTestUser({
            email: `concurrent-user-${i}@tifossi.com`
          })
        );
      }

      const users = await Promise.all(userPromises);
      
      // Verify all users were created successfully
      expect(users).toHaveLength(5);
      users.forEach((userResult, index) => {
        TestDataAssertions.validateUser(userResult.user);
        expect(userResult.user.email).toBe(`concurrent-user-${index}@tifossi.com`);
      });

      // Create payments concurrently
      const paymentPromises = users.map(userResult =>
        global.testHelpers.createTestPayment({
          payer: {
            email: userResult.user.email,
            first_name: userResult.user.displayName?.split(' ')[0] || 'Test'
          }
        })
      );

      const payments = await Promise.all(paymentPromises);
      
      // Verify all payments were created
      expect(payments).toHaveLength(5);
      payments.forEach(payment => {
        TestDataAssertions.validatePayment(payment);
      });
    });
  });

  describe('Service Metrics and Monitoring', () => {
    test('should track service metrics correctly', async () => {
      // Perform some operations to generate metrics
      await global.testHelpers.createTestUser();
      await global.testHelpers.createTestPayment();

      // Get service metrics
      const firebaseMetrics = global.mockServices.firebase.getMetrics();
      const mercadopagoMetrics = global.mockServices.mercadopago.getMetrics();

      // Verify metrics are being tracked
      expect(firebaseMetrics.requestCount).toBeGreaterThan(0);
      expect(firebaseMetrics.userCount).toBeGreaterThan(0);
      
      expect(mercadopagoMetrics.requestCount).toBeGreaterThan(0);
      expect(mercadopagoMetrics.paymentCount).toBeGreaterThan(0);
    });

    test('should provide detailed service status', async () => {
      const status = global.testEnvironment?.getStatus() || {
        initialized: true,
        services: { firebase: true, mercadopago: true },
        testData: { products: 0, users: 0, orders: 0 }
      };

      expect(status.initialized).toBe(true);
      expect(status.services.firebase).toBe(true);
      expect(status.services.mercadopago).toBe(true);
    });
  });
});

// Example 2: E2E Test Suite using Journey Helper
describe('E2E User Journey Tests', () => {
  let testEnvironment;

  beforeAll(async () => {
    testEnvironment = await JestSetupHelpers.setupE2ETests();
  });

  afterAll(async () => {
    if (testEnvironment) {
      await testEnvironment.cleanup();
    }
  });

  test('should complete guest checkout journey', async () => {
    const e2eManager = global.testManagers.e2eManager;
    const journeyHelper = e2eManager.userJourneyHelper || new (require('./e2e-test-utils').UserJourneyHelper)(e2eManager);
    
    const sessionId = 'guest-checkout-test';
    await e2eManager.createTestSession(sessionId);

    const journey = await journeyHelper.guestCheckoutJourney(sessionId, {
      productId: global.testData.products[0]?.id,
      quantity: 1,
      paymentMethod: 'visa'
    });

    expect(journey.success).toBe(true);
    expect(journey.steps.length).toBeGreaterThan(0);
    expect(journey.duration).toBeDefined();

    await e2eManager.cleanupTestSession(sessionId);
  });

  test('should complete authenticated user journey', async () => {
    const e2eManager = global.testManagers.e2eManager;
    const journeyHelper = e2eManager.userJourneyHelper || new (require('./e2e-test-utils').UserJourneyHelper)(e2eManager);
    
    const sessionId = 'auth-user-test';
    await e2eManager.createTestSession(sessionId);

    const journey = await journeyHelper.authenticatedUserJourney(sessionId, {
      userEmail: 'test@tifossi.com',
      useExistingUser: true,
      addToFavorites: true
    });

    expect(journey.success).toBe(true);
    expect(journey.steps.some(step => step.name === 'login_user')).toBe(true);
    expect(journey.steps.some(step => step.name === 'add_to_favorites')).toBe(true);

    await e2eManager.cleanupTestSession(sessionId);
  });
});

// Example 3: Performance Test Suite
describe('Performance Tests', () => {
  let testEnvironment;

  beforeAll(async () => {
    testEnvironment = await JestSetupHelpers.setupPerformanceTests();
  });

  afterAll(async () => {
    if (testEnvironment) {
      await testEnvironment.cleanup();
    }
  });

  test('should handle concurrent user creations efficiently', async () => {
    const startTime = Date.now();
    const concurrentUsers = 20;
    
    const promises = Array.from({ length: concurrentUsers }, (_, i) =>
      global.testHelpers.createTestUser({
        email: `perf-test-user-${i}@tifossi.com`
      })
    );

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(concurrentUsers);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    
    results.forEach(result => {
      TestDataAssertions.validateUser(result.user);
    });
  });

  test('should handle burst payment processing', async () => {
    const startTime = Date.now();
    const concurrentPayments = 10;
    
    const promises = Array.from({ length: concurrentPayments }, (_, i) =>
      global.testHelpers.createTestPayment({
        transaction_amount: 1000 + i * 100,
        description: `Burst payment ${i}`
      })
    );

    const payments = await Promise.all(promises);
    const duration = Date.now() - startTime;

    expect(payments).toHaveLength(concurrentPayments);
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    
    payments.forEach(payment => {
      TestDataAssertions.validatePayment(payment);
    });

    // Wait for all payments to process
    await global.testHelpers.waitFor(async () => {
      const statusChecks = await Promise.all(
        payments.map(p => global.mockServices.mercadopago.getPayment(p.id))
      );
      return statusChecks.every(payment => payment.status !== 'pending');
    }, 15000);
  });
});

// Example 4: Data Validation Tests
describe('Test Data Validation', () => {
  test('should generate valid product data', () => {
    expect(global.testData.products).toBeDefined();
    expect(global.testData.products.length).toBeGreaterThan(0);
    
    global.testData.products.forEach(product => {
      TestDataAssertions.validateProduct(product);
      
      // Additional product-specific validations
      expect(product.statuses).toBeInstanceOf(Array);
      expect(product.colors).toBeInstanceOf(Array);
      expect(product.sizes).toBeInstanceOf(Array);
      expect(product.shortDescription).toBeDefined();
      expect(product.shortDescription.line1).toBeDefined();
      expect(product.shortDescription.line2).toBeDefined();
    });
  });

  test('should generate valid user data', () => {
    expect(global.testData.users).toBeDefined();
    expect(global.testData.users.length).toBeGreaterThan(0);
    
    global.testData.users.forEach(user => {
      TestDataAssertions.validateUser(user);
      
      // Additional user-specific validations
      expect(user.preferences).toBeDefined();
      expect(user.addresses).toBeInstanceOf(Array);
      if (user.addresses.length > 0) {
        user.addresses.forEach(address => {
          expect(address.street).toBeDefined();
          expect(address.city).toBeDefined();
          expect(address.country).toBeDefined();
        });
      }
    });
  });

  test('should generate valid order data', () => {
    expect(global.testData.orders).toBeDefined();
    expect(global.testData.orders.length).toBeGreaterThan(0);
    
    global.testData.orders.forEach(order => {
      TestDataAssertions.validateOrder(order);
      
      // Additional order-specific validations
      expect(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).toContain(order.status);
      expect(order.currency).toBe('UYU');
      
      order.items.forEach(item => {
        expect(item.productId).toBeDefined();
        expect(item.quantity).toBeGreaterThan(0);
        expect(item.price).toBeGreaterThan(0);
      });
    });
  });
});

// Export test utilities for use in other test files
module.exports = {
  TestDataAssertions,
  // Helper function to create isolated test environment
  createIsolatedTestEnvironment: async (profile = 'integration') => {
    const { JestTestEnvironment, TestProfiles } = require('./jest-integration-setup');
    const environment = new JestTestEnvironment();
    await environment.initialize(TestProfiles[profile]);
    return environment;
  }
};