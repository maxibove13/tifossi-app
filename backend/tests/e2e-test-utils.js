/**
 * End-to-End Test Utilities for Tifossi Backend Migration
 *
 * This module provides comprehensive utilities for E2E testing, including
 * user journey helpers, data setup/teardown, assertion helpers, and
 * integration testing utilities for the Tifossi mobile app.
 */

const { TestDataGenerator } = require('./test-data-generator');
const { MockMercadoPagoService } = require('./mock-payment-service');
const { MockFirebaseAuth } = require('./mock-firebase-auth');

/**
 * E2E Test Suite Manager
 * Orchestrates complex end-to-end test scenarios
 */
class E2ETestManager {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:1337',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      screenshotOnFailure: config.screenshotOnFailure !== false,
      ...config,
    };

    this.testData = new TestDataGenerator();
    this.mockPayments = new MockMercadoPagoService();
    this.mockAuth = new MockFirebaseAuth();

    this.testSessions = new Map();
    this.cleanup = [];
  }

  /**
   * Initialize test environment for E2E testing
   */
  async initialize() {
    console.log('Initializing E2E test environment...');

    // Generate test data
    const dataset = this.testData.generateScenarioData('integration_testing');
    this.testProducts = dataset.products;
    this.testUsers = dataset.users;
    this.testOrders = dataset.orders;

    // Setup mock services
    await this.setupMockServices();

    console.log('E2E test environment initialized');
    return dataset;
  }

  /**
   * Setup mock services for testing
   */
  async setupMockServices() {
    // Configure mock payment service
    this.mockPayments.on('payment.created', (payment) => {
      console.log(`[E2E] Payment created: ${payment.id} - ${payment.status}`);
    });

    this.mockPayments.on('payment.updated', (payment) => {
      console.log(`[E2E] Payment updated: ${payment.id} - ${payment.status}`);
    });

    // Configure mock auth service
    this.mockAuth.on('user.signedIn', (data) => {
      console.log(`[E2E] User signed in: ${data.user.email}`);
    });

    this.mockAuth.on('user.created', (data) => {
      console.log(`[E2E] User created: ${data.user.email}`);
    });
  }

  /**
   * Create a new test session with isolated data
   */
  async createTestSession(sessionId, options = {}) {
    const session = {
      id: sessionId,
      startTime: new Date(),
      options,
      users: [],
      orders: [],
      payments: [],
      cleanup: [],
    };

    this.testSessions.set(sessionId, session);
    return session;
  }

  /**
   * Cleanup test session and associated data
   */
  async cleanupTestSession(sessionId) {
    const session = this.testSessions.get(sessionId);
    if (!session) return;

    // Run cleanup functions
    for (const cleanupFn of session.cleanup) {
      try {
        await cleanupFn();
      } catch (error) {
        console.warn(`[E2E] Cleanup error: ${error.message}`);
      }
    }

    // Remove test data
    session.users.forEach((user) => {
      this.mockAuth.users.delete(user.email);
    });

    session.payments.forEach((payment) => {
      this.mockPayments.payments.delete(payment.id);
    });

    this.testSessions.delete(sessionId);
    console.log(`[E2E] Test session ${sessionId} cleaned up`);
  }

  /**
   * Cleanup all test sessions
   */
  async cleanupAll() {
    const sessions = Array.from(this.testSessions.keys());
    for (const sessionId of sessions) {
      await this.cleanupTestSession(sessionId);
    }

    // Run global cleanup
    for (const cleanupFn of this.cleanup) {
      try {
        await cleanupFn();
      } catch (error) {
        console.warn(`[E2E] Global cleanup error: ${error.message}`);
      }
    }

    console.log('[E2E] All test sessions cleaned up');
  }
}

/**
 * User Journey Test Helpers
 * Pre-built test flows for common user scenarios
 */
class UserJourneyHelper {
  constructor(testManager) {
    this.testManager = testManager;
    this.mockAuth = testManager.mockAuth;
    this.mockPayments = testManager.mockPayments;
  }

  /**
   * Complete guest checkout journey
   */
  async guestCheckoutJourney(sessionId, journeyConfig = {}) {
    const config = {
      productId: 'prod_test_001',
      quantity: 2,
      size: 'M',
      color: 'Negro',
      paymentMethod: 'visa',
      shippingAddress: this.generateTestAddress(),
      ...journeyConfig,
    };

    const session = this.testManager.testSessions.get(sessionId);
    const journey = {
      id: `guest_checkout_${Date.now()}`,
      steps: [],
      startTime: new Date(),
      config,
    };

    try {
      // Step 1: Browse products
      journey.steps.push(await this.browseProducts(sessionId));

      // Step 2: Add to cart
      journey.steps.push(
        await this.addToCart(sessionId, {
          productId: config.productId,
          quantity: config.quantity,
          size: config.size,
          color: config.color,
        })
      );

      // Step 3: View cart
      journey.steps.push(await this.viewCart(sessionId));

      // Step 4: Proceed to checkout
      journey.steps.push(await this.proceedToCheckout(sessionId, 'guest'));

      // Step 5: Enter shipping information
      journey.steps.push(await this.enterShippingInfo(sessionId, config.shippingAddress));

      // Step 6: Select payment method
      journey.steps.push(await this.selectPaymentMethod(sessionId, config.paymentMethod));

      // Step 7: Complete payment
      journey.steps.push(
        await this.completePayment(sessionId, {
          paymentMethod: config.paymentMethod,
          amount: 2500 * config.quantity,
        })
      );

      // Step 8: Verify order confirmation
      journey.steps.push(await this.verifyOrderConfirmation(sessionId));

      journey.success = true;
      journey.endTime = new Date();
      journey.duration = journey.endTime - journey.startTime;

      console.log(`[E2E] Guest checkout journey completed successfully in ${journey.duration}ms`);
      return journey;
    } catch (error) {
      journey.success = false;
      journey.error = error;
      journey.endTime = new Date();
      journey.duration = journey.endTime - journey.startTime;

      console.error(`[E2E] Guest checkout journey failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Complete authenticated user journey
   */
  async authenticatedUserJourney(sessionId, journeyConfig = {}) {
    const config = {
      userEmail: 'test@tifossi.com',
      userPassword: 'Test123!',
      useExistingUser: true,
      addToFavorites: true,
      useSavedAddress: true,
      ...journeyConfig,
    };

    const session = this.testManager.testSessions.get(sessionId);
    const journey = {
      id: `auth_user_journey_${Date.now()}`,
      steps: [],
      startTime: new Date(),
      config,
    };

    try {
      // Step 1: User login/registration
      if (config.useExistingUser) {
        journey.steps.push(
          await this.loginUser(sessionId, {
            email: config.userEmail,
            password: config.userPassword,
          })
        );
      } else {
        journey.steps.push(
          await this.registerUser(sessionId, {
            email: config.userEmail,
            password: config.userPassword,
            displayName: 'Test User',
          })
        );
      }

      // Step 2: Browse products with personalization
      journey.steps.push(await this.browseProducts(sessionId, { personalized: true }));

      // Step 3: Add items to favorites (if enabled)
      if (config.addToFavorites) {
        journey.steps.push(
          await this.addToFavorites(sessionId, ['prod_test_001', 'prod_test_002'])
        );
      }

      // Step 4: Add favorited item to cart
      journey.steps.push(
        await this.addToCart(sessionId, {
          productId: 'prod_test_001',
          quantity: 1,
        })
      );

      // Step 5: Proceed to authenticated checkout
      journey.steps.push(await this.proceedToCheckout(sessionId, 'authenticated'));

      // Step 6: Use saved address or enter new one
      if (config.useSavedAddress) {
        journey.steps.push(await this.selectSavedAddress(sessionId));
      } else {
        journey.steps.push(await this.enterShippingInfo(sessionId, this.generateTestAddress()));
      }

      // Step 7: Complete payment with saved preferences
      journey.steps.push(
        await this.completePayment(sessionId, {
          paymentMethod: 'visa',
          amount: 2500,
          savePaymentMethod: true,
        })
      );

      // Step 8: Verify order is linked to user account
      journey.steps.push(await this.verifyUserOrderHistory(sessionId));

      journey.success = true;
      journey.endTime = new Date();
      journey.duration = journey.endTime - journey.startTime;

      console.log(`[E2E] Authenticated user journey completed in ${journey.duration}ms`);
      return journey;
    } catch (error) {
      journey.success = false;
      journey.error = error;
      journey.endTime = new Date();
      journey.duration = journey.endTime - journey.startTime;

      console.error(`[E2E] Authenticated user journey failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Product discovery and search journey
   */
  async productDiscoveryJourney(sessionId, journeyConfig = {}) {
    const config = {
      searchTerm: 'camiseta',
      category: 'football',
      priceRange: [1000, 5000],
      expectedResults: 5,
      ...journeyConfig,
    };

    const journey = {
      id: `product_discovery_${Date.now()}`,
      steps: [],
      startTime: new Date(),
      config,
    };

    try {
      // Step 1: Text search
      journey.steps.push(await this.searchProducts(sessionId, config.searchTerm));

      // Step 2: Apply category filter
      journey.steps.push(
        await this.applyProductFilters(sessionId, {
          category: config.category,
        })
      );

      // Step 3: Apply price filter
      journey.steps.push(
        await this.applyProductFilters(sessionId, {
          priceMin: config.priceRange[0],
          priceMax: config.priceRange[1],
        })
      );

      // Step 4: Sort results
      journey.steps.push(await this.sortProducts(sessionId, 'price_asc'));

      // Step 5: View product details
      journey.steps.push(await this.viewProductDetails(sessionId, 'first_result'));

      // Step 6: View related products
      journey.steps.push(await this.viewRelatedProducts(sessionId));

      journey.success = true;
      journey.endTime = new Date();
      journey.duration = journey.endTime - journey.startTime;

      return journey;
    } catch (error) {
      journey.success = false;
      journey.error = error;
      journey.endTime = new Date();
      journey.duration = journey.endTime - journey.startTime;

      throw error;
    }
  }

  // Individual step implementations

  async browseProducts(sessionId, options = {}) {
    const startTime = Date.now();

    // Simulate API call to fetch products
    const products = this.testManager.testProducts.slice(0, 20);

    const step = {
      name: 'browse_products',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { products: products.length, personalized: options.personalized || false },
      success: true,
    };

    return step;
  }

  async addToCart(sessionId, itemData) {
    const startTime = Date.now();

    // Validate product exists
    const product = this.testManager.testProducts.find((p) => p.id === itemData.productId);
    if (!product) {
      throw new Error(`Product ${itemData.productId} not found`);
    }

    // Simulate cart addition
    const session = this.testManager.testSessions.get(sessionId);
    if (!session.cart) session.cart = [];

    session.cart.push({
      productId: itemData.productId,
      quantity: itemData.quantity || 1,
      size: itemData.size,
      color: itemData.color,
      price: product.discountedPrice || product.price,
      addedAt: new Date().toISOString(),
    });

    return {
      name: 'add_to_cart',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: itemData,
      success: true,
    };
  }

  async viewCart(sessionId) {
    const startTime = Date.now();
    const session = this.testManager.testSessions.get(sessionId);

    const cartData = {
      items: session.cart || [],
      itemCount: (session.cart || []).length,
      subtotal: (session.cart || []).reduce((sum, item) => sum + item.price * item.quantity, 0),
    };

    return {
      name: 'view_cart',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: cartData,
      success: true,
    };
  }

  async proceedToCheckout(sessionId, checkoutType) {
    const startTime = Date.now();
    const session = this.testManager.testSessions.get(sessionId);

    if (!session.cart || session.cart.length === 0) {
      throw new Error('Cannot proceed to checkout with empty cart');
    }

    // Calculate totals
    const subtotal = session.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxes = Math.floor(subtotal * 0.22); // 22% IVA Uruguay
    const shipping = subtotal > 5000 ? 0 : 400; // Free shipping over $5000
    const total = subtotal + taxes + shipping;

    session.checkout = {
      type: checkoutType,
      subtotal,
      taxes,
      shipping,
      total,
      items: session.cart,
      startedAt: new Date().toISOString(),
    };

    return {
      name: 'proceed_to_checkout',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { checkoutType, total },
      success: true,
    };
  }

  async enterShippingInfo(sessionId, shippingAddress) {
    const startTime = Date.now();
    const session = this.testManager.testSessions.get(sessionId);

    if (!session.checkout) {
      throw new Error('No active checkout session');
    }

    session.checkout.shippingAddress = shippingAddress;

    return {
      name: 'enter_shipping_info',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { address: shippingAddress },
      success: true,
    };
  }

  async selectPaymentMethod(sessionId, paymentMethod) {
    const startTime = Date.now();
    const session = this.testManager.testSessions.get(sessionId);

    if (!session.checkout) {
      throw new Error('No active checkout session');
    }

    session.checkout.paymentMethod = paymentMethod;

    return {
      name: 'select_payment_method',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { paymentMethod },
      success: true,
    };
  }

  async completePayment(sessionId, paymentData) {
    const startTime = Date.now();
    const session = this.testManager.testSessions.get(sessionId);

    if (!session.checkout) {
      throw new Error('No active checkout session');
    }

    // Create card token
    const cardToken = await this.mockPayments.createCardToken({
      card_number: '4111111111111111',
      security_code: '123',
      expiration_month: '12',
      expiration_year: '2025',
      cardholder: {
        name: 'TEST USER',
      },
    });

    // Process payment
    const payment = await this.mockPayments.createPayment({
      transaction_amount: paymentData.amount,
      currency_id: 'UYU',
      payment_method_id: paymentData.paymentMethod,
      token: cardToken.id,
      description: 'Tifossi E2E Test Purchase',
      payer: {
        email: 'test@tifossi.com',
        first_name: 'Test',
        last_name: 'User',
      },
    });

    session.payments.push(payment);
    session.checkout.paymentId = payment.id;
    session.checkout.completedAt = new Date().toISOString();

    // Wait for payment processing
    await this.waitForPaymentProcessing(payment.id);

    return {
      name: 'complete_payment',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { paymentId: payment.id, amount: paymentData.amount },
      success: true,
    };
  }

  async verifyOrderConfirmation(sessionId) {
    const startTime = Date.now();
    const session = this.testManager.testSessions.get(sessionId);

    if (!session.checkout || !session.checkout.paymentId) {
      throw new Error('No completed payment to verify');
    }

    // Check payment status
    const payment = await this.mockPayments.getPayment(session.checkout.paymentId);

    if (payment.status !== 'approved') {
      throw new Error(`Payment not approved: ${payment.status}`);
    }

    // Create order record
    const order = {
      id: `order_${Date.now()}`,
      paymentId: payment.id,
      total: session.checkout.total,
      status: 'confirmed',
      items: session.checkout.items,
      createdAt: new Date().toISOString(),
    };

    session.orders.push(order);

    return {
      name: 'verify_order_confirmation',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { orderId: order.id, status: order.status },
      success: true,
    };
  }

  async loginUser(sessionId, credentials) {
    const startTime = Date.now();
    const session = this.testManager.testSessions.get(sessionId);

    const result = await this.mockAuth.signInWithEmailAndPassword(
      credentials.email,
      credentials.password
    );

    session.user = result.user;
    session.authTokens = {
      idToken: result.idToken,
      refreshToken: result.refreshToken,
    };

    return {
      name: 'login_user',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { email: credentials.email, uid: result.user.uid },
      success: true,
    };
  }

  async registerUser(sessionId, userData) {
    const startTime = Date.now();
    const session = this.testManager.testSessions.get(sessionId);

    const result = await this.mockAuth.createUserWithEmailAndPassword(
      userData.email,
      userData.password,
      userData.displayName
    );

    session.user = result.user;
    session.authTokens = {
      idToken: result.idToken,
      refreshToken: result.refreshToken,
    };

    // Add to cleanup
    session.cleanup.push(() => {
      this.mockAuth.users.delete(userData.email);
    });

    return {
      name: 'register_user',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { email: userData.email, uid: result.user.uid },
      success: true,
    };
  }

  async addToFavorites(sessionId, productIds) {
    const startTime = Date.now();
    const session = this.testManager.testSessions.get(sessionId);

    if (!session.user) {
      throw new Error('User must be authenticated to add favorites');
    }

    if (!session.favorites) session.favorites = [];
    session.favorites.push(...productIds);

    return {
      name: 'add_to_favorites',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { productIds, count: productIds.length },
      success: true,
    };
  }

  async searchProducts(sessionId, searchTerm) {
    const startTime = Date.now();

    // Simulate search
    const results = this.testManager.testProducts.filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
      name: 'search_products',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { searchTerm, resultCount: results.length },
      success: true,
    };
  }

  async applyProductFilters(sessionId, filters) {
    const startTime = Date.now();

    // Simulate filter application
    let filteredProducts = this.testManager.testProducts;

    if (filters.category) {
      filteredProducts = filteredProducts.filter((p) => p.categoryId === filters.category);
    }

    if (filters.priceMin || filters.priceMax) {
      filteredProducts = filteredProducts.filter((p) => {
        const price = p.discountedPrice || p.price;
        return (
          (!filters.priceMin || price >= filters.priceMin) &&
          (!filters.priceMax || price <= filters.priceMax)
        );
      });
    }

    return {
      name: 'apply_product_filters',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { filters, resultCount: filteredProducts.length },
      success: true,
    };
  }

  async sortProducts(sessionId, sortBy) {
    const startTime = Date.now();

    // Simulate sorting logic
    return {
      name: 'sort_products',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { sortBy },
      success: true,
    };
  }

  async viewProductDetails(sessionId, productIdentifier) {
    const startTime = Date.now();

    let product;
    if (productIdentifier === 'first_result') {
      product = this.testManager.testProducts[0];
    } else {
      product = this.testManager.testProducts.find((p) => p.id === productIdentifier);
    }

    if (!product) {
      throw new Error(`Product not found: ${productIdentifier}`);
    }

    return {
      name: 'view_product_details',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { productId: product.id, title: product.title },
      success: true,
    };
  }

  async viewRelatedProducts(sessionId) {
    const startTime = Date.now();

    // Simulate related products fetch
    const relatedProducts = this.testManager.testProducts.slice(1, 6);

    return {
      name: 'view_related_products',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { count: relatedProducts.length },
      success: true,
    };
  }

  async selectSavedAddress(sessionId) {
    const startTime = Date.now();
    const session = this.testManager.testSessions.get(sessionId);

    if (!session.user) {
      throw new Error('User must be authenticated to use saved addresses');
    }

    const savedAddress = this.generateTestAddress();
    session.checkout.shippingAddress = savedAddress;

    return {
      name: 'select_saved_address',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { address: savedAddress },
      success: true,
    };
  }

  async verifyUserOrderHistory(sessionId) {
    const startTime = Date.now();
    const session = this.testManager.testSessions.get(sessionId);

    if (!session.user) {
      throw new Error('User must be authenticated to check order history');
    }

    return {
      name: 'verify_user_order_history',
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      data: { orderCount: session.orders.length },
      success: true,
    };
  }

  // Utility methods

  async waitForPaymentProcessing(paymentId, timeout = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const payment = await this.mockPayments.getPayment(paymentId);
      if (payment.status !== 'pending') {
        return payment;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error('Payment processing timeout');
  }

  generateTestAddress() {
    return {
      name: 'Test User',
      street: 'Av. 18 de Julio 1234',
      city: 'Montevideo',
      postalCode: '11200',
      country: 'Uruguay',
      phone: '+598 99 123 456',
    };
  }
}

/**
 * Test Assertion Helpers
 * Specialized assertions for E2E testing
 */
class E2EAssertionHelper {
  static assertJourneySuccess(journey) {
    if (!journey.success) {
      throw new Error(`Journey failed: ${journey.error?.message || 'Unknown error'}`);
    }

    // Check that all steps completed successfully
    const failedSteps = journey.steps.filter((step) => !step.success);
    if (failedSteps.length > 0) {
      throw new Error(`Journey had ${failedSteps.length} failed steps`);
    }
  }

  static assertJourneyPerformance(journey, maxDuration) {
    if (journey.duration > maxDuration) {
      throw new Error(`Journey took too long: ${journey.duration}ms > ${maxDuration}ms`);
    }
  }

  static assertPaymentSuccess(payment) {
    if (payment.status !== 'approved') {
      throw new Error(`Payment not approved: ${payment.status} - ${payment.status_detail}`);
    }
  }

  static assertUserAuthenticated(session) {
    if (!session.user || !session.authTokens) {
      throw new Error('User not properly authenticated');
    }
  }

  static assertCartNotEmpty(session) {
    if (!session.cart || session.cart.length === 0) {
      throw new Error('Cart is empty');
    }
  }

  static assertOrderCreated(session) {
    if (!session.orders || session.orders.length === 0) {
      throw new Error('No orders created');
    }
  }

  static assertDataIntegrity(session) {
    // Check that payment amount matches order total
    if (session.checkout && session.payments.length > 0) {
      const payment = session.payments[session.payments.length - 1];
      if (payment.transaction_amount !== session.checkout.total) {
        throw new Error('Payment amount does not match order total');
      }
    }
  }
}

/**
 * Performance Monitoring Helper
 * Tracks performance metrics during E2E tests
 */
class E2EPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      pageLoad: 3000,
      apiResponse: 500,
      paymentProcessing: 10000,
      searchResponse: 1000,
    };
  }

  startTimer(operationId) {
    this.metrics.set(operationId, {
      startTime: Date.now(),
      endTime: null,
      duration: null,
    });
  }

  endTimer(operationId) {
    const metric = this.metrics.get(operationId);
    if (!metric) {
      throw new Error(`No timer found for operation: ${operationId}`);
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    return metric;
  }

  checkThreshold(operationId, thresholdKey) {
    const metric = this.metrics.get(operationId);
    const threshold = this.thresholds[thresholdKey];

    if (!metric || !threshold) return false;

    return metric.duration <= threshold;
  }

  getReport() {
    const report = {
      totalOperations: this.metrics.size,
      averageDuration: 0,
      thresholdViolations: 0,
      operations: [],
    };

    let totalDuration = 0;

    for (const [operationId, metric] of this.metrics.entries()) {
      if (metric.duration) {
        totalDuration += metric.duration;

        const operation = {
          id: operationId,
          duration: metric.duration,
          thresholdViolations: [],
        };

        // Check against all thresholds
        for (const [thresholdKey, thresholdValue] of Object.entries(this.thresholds)) {
          if (metric.duration > thresholdValue) {
            operation.thresholdViolations.push({
              threshold: thresholdKey,
              limit: thresholdValue,
              actual: metric.duration,
            });
            report.thresholdViolations++;
          }
        }

        report.operations.push(operation);
      }
    }

    report.averageDuration =
      report.totalOperations > 0 ? totalDuration / report.totalOperations : 0;

    return report;
  }

  reset() {
    this.metrics.clear();
  }
}

module.exports = {
  E2ETestManager,
  UserJourneyHelper,
  E2EAssertionHelper,
  E2EPerformanceMonitor,
};

// Export default manager
module.exports.default = E2ETestManager;
