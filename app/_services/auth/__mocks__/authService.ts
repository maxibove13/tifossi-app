/**
 * Manual mock for authService
 */

const authService = {
  initialize: jest.fn(),
  login: jest.fn().mockResolvedValue({
    token: 'mock-token',
    user: { id: '1', email: 'test@test.com', name: 'Test', isEmailVerified: true },
    needsEmailVerification: false,
  }),
  register: jest.fn().mockResolvedValue({
    user: { id: '1', email: 'test@test.com', name: 'Test', isEmailVerified: false },
    needsEmailVerification: true,
  }),
  loginWithGoogle: jest.fn().mockResolvedValue({
    token: 'mock-token',
    user: { id: '1', email: 'test@test.com', name: 'Test', isEmailVerified: true },
    needsEmailVerification: false,
  }),
  loginWithApple: jest.fn().mockResolvedValue({
    token: 'mock-token',
    user: { id: '1', email: 'test@test.com', name: 'Test', isEmailVerified: true },
    needsEmailVerification: false,
  }),
  logout: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  changePassword: jest.fn(),
  validateToken: jest.fn(),
  confirmPasswordReset: jest.fn(),
  onAuthStateChanged: jest.fn(() => () => {}),
  getApiToken: jest.fn(),
  reportPendingOrphan: jest.fn().mockResolvedValue(undefined),
  cleanup: jest.fn(),
  deleteAccount: jest.fn().mockResolvedValue({ success: true }),
};

export default authService;
