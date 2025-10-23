/**
 * Manual mock for authService
 */

const authService = {
  initialize: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
  loginWithGoogle: jest.fn(),
  loginWithApple: jest.fn(),
  logout: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  changePassword: jest.fn(),
  validateToken: jest.fn(),
  onAuthStateChanged: jest.fn(() => () => {}),
  getApiToken: jest.fn(),
};

// Add default export to fix router warnings
const utilityExport = {
  name: 'AuthServiceMock',
  version: '1.0.0',
  service: authService,
};

export default utilityExport;
