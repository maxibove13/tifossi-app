const { device, expect, element, by, waitFor } = require('detox');

// Global timeout for all tests
jasmine.DEFAULT_TIMEOUT_INTERVAL = 300000;

// Custom matchers for better error messages
expect.extend({
  toBeVisibleOnScreen: async (received) => {
    try {
      await waitFor(received).toBeVisible().withTimeout(10000);
      return {
        pass: true,
        message: () => 'Element is visible on screen',
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Element is not visible on screen: ${error.message}`,
      };
    }
  },

  toExistOnScreen: async (received) => {
    try {
      await waitFor(received).toExist().withTimeout(10000);
      return {
        pass: true,
        message: () => 'Element exists on screen',
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Element does not exist on screen: ${error.message}`,
      };
    }
  },
});

// Global setup before each test
beforeEach(async () => {
  try {
    await device.reloadReactNative();
  } catch (error) {
    console.warn('Failed to reload React Native:', error.message);
  }
});

// Global teardown after each test
afterEach(async () => {
  // Take screenshot on test failure
  if (jasmine.currentTest && jasmine.currentTest.failedExpectations.length > 0) {
    await device.takeScreenshot(`${jasmine.currentTest.fullName}_failure`);
  }
});

// Utility functions
global.testUtils = {
  // Wait for app to be ready
  waitForApp: async () => {
    await waitFor(element(by.id('app-container')))
      .toBeVisible()
      .withTimeout(30000);
  },

  // Navigate to a specific tab
  navigateToTab: async (tabTestId) => {
    await element(by.id(tabTestId)).tap();
    await waitFor(element(by.id(tabTestId)))
      .toBeVisible()
      .withTimeout(5000);
  },

  // Login with test user
  loginTestUser: async (email = 'test@tifossi.com', password = 'testpass123') => {
    // Navigate to login screen if not already there
    try {
      await element(by.id('login-button')).tap();
    } catch (error) {
      // Already on login screen or logged in
    }

    // Fill login form
    await element(by.id('email-input')).typeText(email);
    await element(by.id('password-input')).typeText(password);
    await element(by.id('submit-login')).tap();

    // Wait for login to complete
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
  },

  // Logout current user
  logout: async () => {
    await element(by.id('profile-tab')).tap();
    await element(by.id('logout-button')).tap();

    // Wait for logout to complete
    await waitFor(element(by.id('auth-screen')))
      .toBeVisible()
      .withTimeout(5000);
  },

  // Add product to cart
  addProductToCart: async (productTestId) => {
    await element(by.id(productTestId)).tap();
    await waitFor(element(by.id('product-detail-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('add-to-cart-button')).tap();

    // Wait for success feedback
    await waitFor(element(by.text('Added to cart')))
      .toBeVisible()
      .withTimeout(3000);
  },

  // Search for products
  searchProducts: async (query) => {
    await element(by.id('search-input')).typeText(query);
    await element(by.id('search-submit')).tap();

    // Wait for search results
    await waitFor(element(by.id('search-results')))
      .toBeVisible()
      .withTimeout(5000);
  },

  // Clear app data (for test isolation)
  clearAppData: async () => {
    if (device.getPlatform() === 'ios') {
      await device.uninstallApp();
      await device.installApp();
    } else {
      await device.resetContentAndSettings();
    }
  },

  // Take screenshot with custom name
  takeScreenshot: async (name) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await device.takeScreenshot(`${name}_${timestamp}`);
  },

  // Scroll to element
  scrollToElement: async (elementMatcher, scrollViewTestId = 'main-scroll-view') => {
    await waitFor(elementMatcher)
      .toBeVisible()
      .whileElement(by.id(scrollViewTestId))
      .scroll(300, 'down');
  },

  // Wait for loading to complete
  waitForLoading: async (loadingTestId = 'loading-indicator') => {
    try {
      await waitFor(element(by.id(loadingTestId)))
        .not.toBeVisible()
        .withTimeout(10000);
    } catch (error) {
      // Loading indicator might not exist, continue
      console.warn('Loading indicator not found or did not disappear:', error.message);
    }
  },

  // Handle network conditions
  setNetworkCondition: async (condition = 'good') => {
    // This would integrate with network mocking if available
    console.log(`Setting network condition to: ${condition}`);
  },

  // Mock API responses
  mockApiResponse: async (endpoint, response) => {
    // This would integrate with API mocking if available
    console.log(`Mocking ${endpoint} with response:`, response);
  },
};

console.log('Detox E2E environment initialized');
console.log(`Platform: ${device.getPlatform()}`);
console.log(`Device name: ${device.name || 'Unknown'}`);
