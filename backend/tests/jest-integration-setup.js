/**
 * Jest Integration Setup for Tifossi Backend Testing
 * 
 * This module integrates all mock services and test utilities with the existing
 * Jest configuration, providing a seamless testing environment for the
 * Tifossi backend migration.
 */

const { TestDataGenerator } = require('./test-data-generator');
const { MockMercadoPagoService } = require('./mock-payment-service');
const { MockFirebaseAuth } = require('./mock-firebase-auth');
const { E2ETestManager } = require('./e2e-test-utils');
const { LoadTestConfig } = require('./load-test-config');

/**
 * Jest Test Environment Setup
 * Configures mock services and test utilities for Jest integration
 */
class JestTestEnvironment {
  constructor() {
    this.isInitialized = false;
    this.mockServices = {
      strapi: null,
      firebase: null,
      mercadopago: null
    };
    
    this.testManagers = {
      dataGenerator: null,
      e2eManager: null,
      loadTestConfig: null
    };

    this.testData = null;
    this.cleanup = [];
  }

  /**
   * Initialize test environment
   * Called by Jest beforeAll hook
   */
  async initialize(config = {}) {
    if (this.isInitialized) {
      return;
    }

    console.log('[Jest Setup] Initializing test environment...');

    const defaultConfig = {
      environment: 'test',
      generateTestData: true,
      mockServices: {
        firebase: { errorRate: 0, responseDelay: 50 },
        mercadopago: { errorRate: 0, responseDelay: 100 },
        strapi: { errorRate: 0, responseDelay: 100 }
      },
      testData: {
        products: 50,
        users: 25,
        orders: 100
      }
    };

    const finalConfig = { ...defaultConfig, ...config };

    // Initialize mock services
    await this.initializeMockServices(finalConfig.mockServices);

    // Initialize test managers
    await this.initializeTestManagers(finalConfig);

    // Generate test data if requested
    if (finalConfig.generateTestData) {
      await this.generateTestData(finalConfig.testData);
    }

    // Setup global test utilities
    this.setupGlobalUtilities();

    this.isInitialized = true;
    console.log('[Jest Setup] Test environment initialized successfully');
  }

  /**
   * Initialize all mock services
   */
  async initializeMockServices(serviceConfigs) {
    // Initialize Mock Firebase Auth
    this.mockServices.firebase = new MockFirebaseAuth(serviceConfigs.firebase);
    
    // Initialize Mock MercadoPago
    this.mockServices.mercadopago = new MockMercadoPagoService(serviceConfigs.mercadopago);

    // Setup service event listeners for debugging
    this.setupServiceEventListeners();

    console.log('[Jest Setup] Mock services initialized');
  }

  /**
   * Initialize test managers
   */
  async initializeTestManagers(config) {
    // Initialize test data generator
    this.testManagers.dataGenerator = new TestDataGenerator({
      products: config.testData,
      users: config.testData,
      orders: config.testData
    });

    // Initialize E2E test manager
    this.testManagers.e2eManager = new E2ETestManager({
      environment: config.environment,
      timeout: 30000
    });

    // Initialize load test configuration
    this.testManagers.loadTestConfig = new LoadTestConfig(config.environment);

    console.log('[Jest Setup] Test managers initialized');
  }

  /**
   * Generate test data for all services
   */
  async generateTestData(dataConfig) {
    console.log('[Jest Setup] Generating test data...');
    
    this.testData = this.testManagers.dataGenerator.generateCompleteDataset(dataConfig);
    
    // Populate mock services with test data
    await this.populateMockServices(this.testData);
    
    console.log('[Jest Setup] Test data generated and populated');
  }

  /**
   * Populate mock services with test data
   */
  async populateMockServices(testData) {
    // Populate Firebase Auth with test users
    testData.users.forEach(user => {
      if (!this.mockServices.firebase.users.has(user.email)) {
        this.mockServices.firebase.users.set(user.email, {
          uid: user.id,
          email: user.email,
          password: 'Test123!', // Default test password
          emailVerified: user.isEmailVerified !== false,
          displayName: user.name,
          photoURL: user.profilePicture,
          disabled: false,
          phoneNumber: user.phone || null,
          customClaims: { role: 'customer' },
          createdAt: user.createdAt,
          lastSignInTime: null,
          providerData: [{
            uid: user.email,
            displayName: user.name,
            email: user.email,
            photoURL: user.profilePicture,
            providerId: 'password'
          }]
        });
      }
    });

    console.log(`[Jest Setup] Populated ${testData.users.length} users in Firebase Auth mock`);
  }

  /**
   * Setup service event listeners for test debugging
   */
  setupServiceEventListeners() {
    // Firebase Auth events
    this.mockServices.firebase.on('user.signedIn', (data) => {
      console.log(`[Test Debug] Firebase: User signed in - ${data.user.email}`);
    });

    this.mockServices.firebase.on('user.created', (data) => {
      console.log(`[Test Debug] Firebase: User created - ${data.user.email}`);
    });

    // MercadoPago events
    this.mockServices.mercadopago.on('payment.created', (payment) => {
      console.log(`[Test Debug] MercadoPago: Payment created - ${payment.id} (${payment.transaction_amount} UYU)`);
    });

    this.mockServices.mercadopago.on('payment.updated', (payment) => {
      console.log(`[Test Debug] MercadoPago: Payment updated - ${payment.id} -> ${payment.status}`);
    });
  }

  /**
   * Setup global utilities available to all tests
   */
  setupGlobalUtilities() {
    // Make mock services globally available
    global.mockServices = this.mockServices;
    global.testManagers = this.testManagers;
    global.testData = this.testData;

    // Setup global test helpers
    global.testHelpers = {
      createTestUser: this.createTestUser.bind(this),
      authenticateTestUser: this.authenticateTestUser.bind(this),
      createTestPayment: this.createTestPayment.bind(this),
      createTestOrder: this.createTestOrder.bind(this),
      waitFor: this.waitFor.bind(this),
      resetServices: this.resetServices.bind(this)
    };

    console.log('[Jest Setup] Global utilities configured');
  }

  /**
   * Create a test user in Firebase Auth mock
   */
  async createTestUser(userData = {}) {
    const defaultUserData = {
      email: `test-${Date.now()}@tifossi.com`,
      password: 'Test123!',
      displayName: 'Test User'
    };

    const finalUserData = { ...defaultUserData, ...userData };

    try {
      const result = await this.mockServices.firebase.createUserWithEmailAndPassword(
        finalUserData.email,
        finalUserData.password,
        finalUserData.displayName
      );

      return {
        user: result.user,
        tokens: {
          idToken: result.idToken,
          refreshToken: result.refreshToken
        },
        credentials: finalUserData
      };
    } catch (error) {
      console.error('[Jest Setup] Failed to create test user:', error.message);
      throw error;
    }
  }

  /**
   * Authenticate a test user and return tokens
   */
  async authenticateTestUser(email, password = 'Test123!') {
    try {
      const result = await this.mockServices.firebase.signInWithEmailAndPassword(email, password);
      
      return {
        user: result.user,
        tokens: {
          idToken: result.idToken,
          refreshToken: result.refreshToken
        }
      };
    } catch (error) {
      console.error('[Jest Setup] Failed to authenticate test user:', error.message);
      throw error;
    }
  }

  /**
   * Create a test payment in MercadoPago mock
   */
  async createTestPayment(paymentData = {}) {
    const defaultPaymentData = {
      transaction_amount: 2500,
      currency_id: 'UYU',
      payment_method_id: 'visa',
      description: 'Test Payment',
      payer: {
        email: 'test@tifossi.com',
        first_name: 'Test',
        last_name: 'User'
      }
    };

    // Create a test card token first
    const cardToken = await this.mockServices.mercadopago.createCardToken({
      card_number: '4111111111111111',
      security_code: '123',
      expiration_month: '12',
      expiration_year: '2025',
      cardholder: {
        name: 'TEST USER'
      }
    });

    const finalPaymentData = {
      ...defaultPaymentData,
      ...paymentData,
      token: cardToken.id
    };

    try {
      const payment = await this.mockServices.mercadopago.createPayment(finalPaymentData);
      return payment;
    } catch (error) {
      console.error('[Jest Setup] Failed to create test payment:', error.message);
      throw error;
    }
  }

  /**
   * Create a test order
   */
  createTestOrder(orderData = {}) {
    const products = this.testData?.products || [];
    const randomProduct = products[Math.floor(Math.random() * products.length)];

    const defaultOrderData = {
      id: `test-order-${Date.now()}`,
      items: [{
        productId: randomProduct?.id || 'prod_test_001',
        quantity: 1,
        price: randomProduct?.price || 2500,
        size: 'M',
        color: 'Negro'
      }],
      total: randomProduct?.price || 2500,
      currency: 'UYU',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    return { ...defaultOrderData, ...orderData };
  }

  /**
   * Wait for condition with timeout
   */
  async waitFor(conditionFn, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await conditionFn()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Wait condition timed out after ${timeout}ms`);
  }

  /**
   * Reset all mock services to initial state
   */
  resetServices() {
    if (this.mockServices.firebase) {
      this.mockServices.firebase.reset();
    }
    
    if (this.mockServices.mercadopago) {
      this.mockServices.mercadopago.reset();
    }

    console.log('[Jest Setup] All services reset');
  }

  /**
   * Cleanup test environment
   * Called by Jest afterAll hook
   */
  async cleanup() {
    console.log('[Jest Setup] Cleaning up test environment...');

    // Run custom cleanup functions
    for (const cleanupFn of this.cleanup) {
      try {
        await cleanupFn();
      } catch (error) {
        console.warn(`[Jest Setup] Cleanup error: ${error.message}`);
      }
    }

    // Reset mock services
    this.resetServices();

    // Clear global references
    delete global.mockServices;
    delete global.testManagers;
    delete global.testData;
    delete global.testHelpers;

    this.isInitialized = false;
    console.log('[Jest Setup] Test environment cleaned up');
  }

  /**
   * Add custom cleanup function
   */
  addCleanup(cleanupFn) {
    this.cleanup.push(cleanupFn);
  }

  /**
   * Get current test environment status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      services: {
        firebase: !!this.mockServices.firebase,
        mercadopago: !!this.mockServices.mercadopago
      },
      testData: {
        products: this.testData?.products?.length || 0,
        users: this.testData?.users?.length || 0,
        orders: this.testData?.orders?.length || 0
      },
      metrics: {
        firebase: this.mockServices.firebase?.getMetrics(),
        mercadopago: this.mockServices.mercadopago?.getMetrics()
      }
    };
  }
}

/**
 * Test Configuration Profiles
 * Pre-configured setups for different types of tests
 */
const TestProfiles = {
  unit: {
    environment: 'test',
    generateTestData: false,
    mockServices: {
      firebase: { errorRate: 0, responseDelay: 10 },
      mercadopago: { errorRate: 0, responseDelay: 10 }
    }
  },

  integration: {
    environment: 'test',
    generateTestData: true,
    mockServices: {
      firebase: { errorRate: 0, responseDelay: 50 },
      mercadopago: { errorRate: 0, responseDelay: 100 }
    },
    testData: {
      products: 100,
      users: 50,
      orders: 200
    }
  },

  e2e: {
    environment: 'test',
    generateTestData: true,
    mockServices: {
      firebase: { errorRate: 0.01, responseDelay: 200 },
      mercadopago: { errorRate: 0.02, responseDelay: 500 }
    },
    testData: {
      products: 500,
      users: 200,
      orders: 1000
    }
  },

  performance: {
    environment: 'test',
    generateTestData: true,
    mockServices: {
      firebase: { errorRate: 0.05, responseDelay: 100 },
      mercadopago: { errorRate: 0.05, responseDelay: 300 }
    },
    testData: {
      products: 1000,
      users: 500,
      orders: 2000
    }
  }
};

/**
 * Jest Setup Helper Functions
 * Convenience functions for common Jest setup patterns
 */
const JestSetupHelpers = {
  /**
   * Setup for unit tests
   */
  setupUnitTests: async () => {
    const environment = new JestTestEnvironment();
    await environment.initialize(TestProfiles.unit);
    return environment;
  },

  /**
   * Setup for integration tests
   */
  setupIntegrationTests: async () => {
    const environment = new JestTestEnvironment();
    await environment.initialize(TestProfiles.integration);
    return environment;
  },

  /**
   * Setup for E2E tests
   */
  setupE2ETests: async () => {
    const environment = new JestTestEnvironment();
    await environment.initialize(TestProfiles.e2e);
    return environment;
  },

  /**
   * Setup for performance tests
   */
  setupPerformanceTests: async () => {
    const environment = new JestTestEnvironment();
    await environment.initialize(TestProfiles.performance);
    return environment;
  },

  /**
   * Create test suite with automatic setup/cleanup
   */
  createTestSuite: (suiteName, testProfile, testFn) => {
    describe(suiteName, () => {
      let testEnvironment;

      beforeAll(async () => {
        testEnvironment = new JestTestEnvironment();
        await testEnvironment.initialize(TestProfiles[testProfile] || testProfile);
      });

      afterAll(async () => {
        if (testEnvironment) {
          await testEnvironment.cleanup();
        }
      });

      beforeEach(() => {
        // Reset services between tests
        if (testEnvironment && testEnvironment.isInitialized) {
          testEnvironment.resetServices();
        }
      });

      testFn(testEnvironment);
    });
  }
};

/**
 * Test Data Assertions
 * Validation helpers for test data integrity
 */
const TestDataAssertions = {
  validateUser: (user) => {
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(user.name).toBeDefined();
  },

  validateProduct: (product) => {
    expect(product).toBeDefined();
    expect(product.id).toBeDefined();
    expect(product.title).toBeDefined();
    expect(product.price).toBeGreaterThan(0);
    expect(product.categoryId).toBeDefined();
  },

  validateOrder: (order) => {
    expect(order).toBeDefined();
    expect(order.id).toBeDefined();
    expect(order.items).toBeInstanceOf(Array);
    expect(order.items.length).toBeGreaterThan(0);
    expect(order.total).toBeGreaterThan(0);
  },

  validatePayment: (payment) => {
    expect(payment).toBeDefined();
    expect(payment.id).toBeDefined();
    expect(payment.status).toBeDefined();
    expect(payment.transaction_amount).toBeGreaterThan(0);
  }
};

// Create and export global test environment instance
const globalTestEnvironment = new JestTestEnvironment();

module.exports = {
  JestTestEnvironment,
  TestProfiles,
  JestSetupHelpers,
  TestDataAssertions,
  globalTestEnvironment
};

// Export default environment
module.exports.default = globalTestEnvironment;