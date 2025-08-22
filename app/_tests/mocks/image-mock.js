/**
 * Image Mock for Jest Tests
 * This mock handles all image file imports (png, jpg, jpeg, gif) in tests
 */

// Mock image that returns a simple object with common image properties
const ImageMock = {
  uri: 'test-image-uri',
  width: 100,
  height: 100,
  default: 'test-image-uri'
};

// Export default mock for require() statements
module.exports = ImageMock;

// Named export for ES6 imports
module.exports.default = ImageMock;