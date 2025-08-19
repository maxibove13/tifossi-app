/**
 * Jest setup file for Strapi tests
 */

const path = require('path');

// Global setup for all tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_CLIENT = 'sqlite';
  process.env.DATABASE_FILENAME = ':memory:';
  process.env.STRAPI_TELEMETRY_DISABLED = 'true';
  
  // Mock console methods to reduce test noise
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

// Global teardown
afterAll(async () => {
  // Cleanup after tests
  if (global.strapi) {
    await global.strapi.destroy();
  }
});

// Setup Strapi instance for integration tests
global.setupStrapi = async () => {
  if (!global.strapi) {
    const Strapi = require('@strapi/strapi');
    
    global.strapi = await Strapi({
      // Test-specific configuration
      appDir: path.resolve(__dirname, '..'),
      distDir: path.resolve(__dirname, '..', 'dist'),
    }).load();
  }
  
  return global.strapi;
};

// Cleanup Strapi instance
global.cleanupStrapi = async () => {
  if (global.strapi) {
    await global.strapi.destroy();
    global.strapi = null;
  }
};

// Test database cleanup
global.cleanupDatabase = async () => {
  if (global.strapi && global.strapi.db) {
    // Clear all test data
    const models = Object.keys(global.strapi.db.models);
    
    for (const model of models) {
      try {
        await global.strapi.db.query(model).deleteMany({});
      } catch (error) {
        // Ignore errors for system tables or constraints
        console.debug(`Could not clear ${model}:`, error.message);
      }
    }
  }
};

// Helper to create test user
global.createTestUser = async (userData = {}) => {
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'testpassword123',
    confirmed: true,
    blocked: false,
    ...userData,
  };
  
  return await global.strapi.plugins['users-permissions'].services.user.add(defaultUser);
};

// Helper to authenticate test requests
global.authenticateUser = async (user) => {
  const jwt = global.strapi.plugins['users-permissions'].services.jwt.issue({
    id: user.id,
  });
  
  return jwt;
};

// Mock external services for testing
global.mockExternalServices = () => {
  // Mock MercadoPago
  jest.mock('mercadopago', () => ({
    payment: {
      create: jest.fn(),
      get: jest.fn(),
    },
    preference: {
      create: jest.fn(),
      get: jest.fn(),
    },
  }));
  
  // Mock Cloudinary
  jest.mock('cloudinary', () => ({
    v2: {
      uploader: {
        upload: jest.fn(),
        destroy: jest.fn(),
      },
    },
  }));
  
  // Mock Nodemailer
  jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    }),
  }));
};