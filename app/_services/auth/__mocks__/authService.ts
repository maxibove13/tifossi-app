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

export default authService;
