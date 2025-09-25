/**
 * Test Utils Index
 *
 * Central export point for all test utilities
 */

// Render utilities
export * from './render-utils';

// Test data factories
export * from './test-data';

// Store utilities
export * from './store-utils';

// Custom matchers
export * from './custom-matchers';

// Default export for convenience
export default {
  render: require('./render-utils').render,
  factories: require('./test-data').factories,
  storeUtils: require('./store-utils').storeUtils,
  renderStoreUtils: require('./render-utils').renderStoreUtils,
  setupCustomMatchers: require('./custom-matchers').setupCustomMatchers,
};
