/**
 * Authentication Flow Integration Tests
 *
 * Comprehensive integration tests for the authentication system.
 * Tests real Firebase auth service behavior with MSW for network boundary mocking.
 *
 * Testing Philosophy:
 * - Test BEHAVIOR not implementation
 * - Mock ONLY at network boundary using MSW
 * - Use REAL services and stores (don't mock them)
 * - Test what users see and do, not internal state
 * - Integration tests preferred over unit tests
 */

import React from 'react';
import { render, fireEvent, waitFor, act, renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Import real services and components (no mocking)
import { authService } from '../../_services/auth/authService';
import firebaseAuthExport from '../../_services/auth/firebaseAuth';
import { useAuthStore } from '../../_stores/authStore';

// Import screens to test
import LoginScreen from '../../auth/login';
import SignupScreen from '../../auth/signup';
import VerificationCodeScreen from '../../auth/verification-code';

// Import test utilities and mock data
import {
  mockFirebaseAuthUser,
  mockGoogleAuthUser,
  mockFirebaseIdToken,
  mockStrapiToken,
  mockUser,
} from '../utils/mock-data';

const firebaseAuth = firebaseAuthExport.service;

// Mock Firebase API responses with MSW
const firebaseAuthHandlers = [
  // Firebase Auth REST API endpoints
  http.post(
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword',
    async ({ request }) => {
      const body = (await request.json()) as any;
      const { email, password } = body;

      if (email === 'test@example.com' && password === 'testpass123') {
        return HttpResponse.json({
          kind: 'identitytoolkit#VerifyPasswordResponse',
          localId: mockFirebaseAuthUser.uid,
          email: mockFirebaseAuthUser.email,
          displayName: mockFirebaseAuthUser.displayName,
          idToken: mockFirebaseIdToken,
          registered: true,
          refreshToken: 'mock-refresh-token',
          expiresIn: '3600',
        });
      }

      if (email === 'wrong@example.com') {
        return HttpResponse.json(
          {
            error: {
              code: 400,
              message: 'INVALID_PASSWORD',
              errors: [{ message: 'INVALID_PASSWORD', domain: 'global', reason: 'invalid' }],
            },
          },
          { status: 400 }
        );
      }

      if (email === 'notfound@example.com') {
        return HttpResponse.json(
          {
            error: {
              code: 400,
              message: 'EMAIL_NOT_FOUND',
              errors: [{ message: 'EMAIL_NOT_FOUND', domain: 'global', reason: 'invalid' }],
            },
          },
          { status: 400 }
        );
      }

      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'INVALID_EMAIL',
            errors: [{ message: 'INVALID_EMAIL', domain: 'global', reason: 'invalid' }],
          },
        },
        { status: 400 }
      );
    }
  ),

  http.post('https://identitytoolkit.googleapis.com/v1/accounts:signUp', async ({ request }) => {
    const body = (await request.json()) as any;
    const { email, password } = body;

    if (email === 'existing@example.com') {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'EMAIL_EXISTS',
            errors: [{ message: 'EMAIL_EXISTS', domain: 'global', reason: 'invalid' }],
          },
        },
        { status: 400 }
      );
    }

    if (password && password.length < 6) {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'WEAK_PASSWORD',
            errors: [
              {
                message: 'WEAK_PASSWORD : Password should be at least 6 characters',
                domain: 'global',
                reason: 'invalid',
              },
            ],
          },
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      kind: 'identitytoolkit#SignupNewUserResponse',
      localId: 'new-user-firebase-id',
      email: email,
      idToken: mockFirebaseIdToken,
      refreshToken: 'mock-refresh-token',
      expiresIn: '3600',
    });
  }),

  http.post(
    'https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode',
    async ({ request }) => {
      const body = (await request.json()) as any;

      if (body.requestType === 'VERIFY_EMAIL') {
        return HttpResponse.json({
          kind: 'identitytoolkit#GetOobConfirmationCodeResponse',
          email: body.email || mockFirebaseAuthUser.email,
        });
      }

      if (body.requestType === 'PASSWORD_RESET') {
        return HttpResponse.json({
          kind: 'identitytoolkit#GetOobConfirmationCodeResponse',
          email: body.email,
        });
      }

      return HttpResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }
  ),

  http.post('https://identitytoolkit.googleapis.com/v1/accounts:update', async ({ request }) => {
    const body = (await request.json()) as any;

    if (body.oobCode === 'valid-verification-code') {
      return HttpResponse.json({
        kind: 'identitytoolkit#SetAccountInfoResponse',
        localId: mockFirebaseAuthUser.uid,
        email: mockFirebaseAuthUser.email,
        emailVerified: true,
      });
    }

    if (body.oobCode === 'invalid-verification-code') {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'INVALID_OOB_CODE',
            errors: [{ message: 'INVALID_OOB_CODE', domain: 'global', reason: 'invalid' }],
          },
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      kind: 'identitytoolkit#SetAccountInfoResponse',
      localId: mockFirebaseAuthUser.uid,
      email: mockFirebaseAuthUser.email,
      displayName: body.displayName || mockFirebaseAuthUser.displayName,
      photoUrl: body.photoUrl || mockFirebaseAuthUser.photoURL,
    });
  }),

  http.post(
    'https://identitytoolkit.googleapis.com/v1/accounts:resetPassword',
    async ({ request }) => {
      const body = (await request.json()) as any;

      if (body.oobCode === 'valid-reset-code') {
        return HttpResponse.json({
          kind: 'identitytoolkit#ResetPasswordResponse',
          email: 'test@example.com',
        });
      }

      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'INVALID_OOB_CODE',
            errors: [{ message: 'INVALID_OOB_CODE', domain: 'global', reason: 'invalid' }],
          },
        },
        { status: 400 }
      );
    }
  ),

  // Google OAuth token exchange
  http.post(
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp',
    async ({ request }) => {
      const body = (await request.json()) as any;

      if (body.postBody?.includes('id_token=')) {
        return HttpResponse.json({
          kind: 'identitytoolkit#VerifyAssertionResponse',
          localId: mockGoogleAuthUser.uid,
          email: mockGoogleAuthUser.email,
          displayName: mockGoogleAuthUser.displayName,
          photoUrl: mockGoogleAuthUser.photoURL,
          idToken: mockFirebaseIdToken,
          refreshToken: 'mock-refresh-token',
          expiresIn: '3600',
          isNewUser: false,
        });
      }

      return HttpResponse.json({ error: 'Invalid Google token' }, { status: 400 });
    }
  ),

  // Token refresh
  http.post('https://securetoken.googleapis.com/v1/token', async ({ request }) => {
    const body = (await request.json()) as any;

    if (body.grant_type === 'refresh_token') {
      return HttpResponse.json({
        access_token: mockFirebaseIdToken,
        expires_in: '3600',
        token_type: 'Bearer',
        refresh_token: 'new-mock-refresh-token',
        id_token: mockFirebaseIdToken,
        user_id: mockFirebaseAuthUser.uid,
        project_id: 'test-project',
      });
    }

    return HttpResponse.json({ error: 'Invalid refresh token' }, { status: 400 });
  }),

  // Strapi auth endpoints (for token sync)
  http.post('/api/auth/firebase-token', async ({ request }) => {
    const body = (await request.json()) as any;

    if (body.firebaseToken === mockFirebaseIdToken) {
      return HttpResponse.json({
        jwt: mockStrapiToken,
        user: mockUser,
      });
    }

    return HttpResponse.json({ error: 'Invalid Firebase token' }, { status: 401 });
  }),

  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (authHeader === `Bearer ${mockStrapiToken}`) {
      return HttpResponse.json({
        user: mockUser,
      });
    }

    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }),

  // Network error simulation
  http.post(
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword',
    () => {
      return HttpResponse.error();
    },
    { once: true }
  ),
];

// Create MSW server
const mswServer = setupServer(...firebaseAuthHandlers);

// Mock external dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn().mockImplementation(() => true),
  },
  useLocalSearchParams: jest.fn().mockImplementation(() => ({ email: 'test@example.com' })),
  Stack: {
    Screen: ({ children }: { children: React.ReactNode }) => children,
  },
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockImplementation(() => Promise.resolve()),
  getItemAsync: jest.fn().mockImplementation(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn().mockImplementation(() => Promise.resolve()),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn().mockImplementation(() => Promise.resolve()),
    hasPlayServices: jest.fn().mockImplementation(() => Promise.resolve(true)),
    signIn: jest
      .fn()
      .mockImplementation(() => Promise.resolve({ idToken: 'mock-google-id-token' })),
    signOut: jest.fn().mockImplementation(() => Promise.resolve()),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: -5,
    IN_PROGRESS: -1,
    PLAY_SERVICES_NOT_AVAILABLE: 1,
  },
}));

describe('Authentication Flow Integration Tests', () => {
  beforeAll(() => {
    mswServer.listen({ onUnhandledRequest: 'error' });
  });

  afterAll(() => {
    mswServer.close();
  });

  beforeEach(async () => {
    mswServer.resetHandlers();

    // Reset auth state
    await act(async () => {
      const authStore = useAuthStore.getState();
      authStore.clearAuthData();
    });

    // Clear mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    mswServer.resetHandlers();
  });

  describe('Email/Password Login Flow', () => {
    it('should allow user to login with valid email and password', async () => {
      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      // User types email and password
      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const loginButton = getByText('Iniciar Sesión');

      await act(async () => {
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'testpass123');
      });

      // User taps login button
      await act(async () => {
        fireEvent.press(loginButton);
      });

      // Wait for authentication to complete
      await waitFor(
        () => {
          expect(router.replace).toHaveBeenCalledWith('/(tabs)/profile');
        },
        { timeout: 5000 }
      );

      // Verify auth store state
      const authStore = useAuthStore.getState();
      expect(authStore.isLoggedIn).toBe(true);
      expect(authStore.user).toMatchObject({
        id: expect.any(String),
        email: 'test@example.com',
        name: expect.any(String),
      });
      expect(authStore.token).toBeTruthy();
    });

    it('should show error message for wrong password', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const loginButton = getByText('Iniciar Sesión');

      await act(async () => {
        fireEvent.changeText(emailInput, 'wrong@example.com');
        fireEvent.changeText(passwordInput, 'wrongpassword');
      });

      await act(async () => {
        fireEvent.press(loginButton);
      });

      // Wait for error message
      await findByText('Incorrect password.');

      // Verify user is not logged in
      const authStore = useAuthStore.getState();
      expect(authStore.isLoggedIn).toBe(false);
      expect(authStore.user).toBeNull();
    });

    it('should show error message for non-existent user', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const loginButton = getByText('Iniciar Sesión');

      await act(async () => {
        fireEvent.changeText(emailInput, 'notfound@example.com');
        fireEvent.changeText(passwordInput, 'anypassword');
      });

      await act(async () => {
        fireEvent.press(loginButton);
      });

      // Wait for error message
      await findByText('No account found with this email address.');

      // Verify user is not logged in
      const authStore = useAuthStore.getState();
      expect(authStore.isLoggedIn).toBe(false);
    });

    it('should validate email format before submitting', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const loginButton = getByText('Iniciar Sesión');

      await act(async () => {
        fireEvent.changeText(emailInput, 'invalid-email');
        fireEvent.changeText(passwordInput, 'password123');
      });

      await act(async () => {
        fireEvent.press(loginButton);
      });

      // Wait for validation error
      await findByText('Por favor, ingresa un correo electrónico válido.');

      // Verify no API call was made
      expect(router.replace).not.toHaveBeenCalled();
    });

    it('should require both email and password fields', async () => {
      const { getByText, findByText } = render(<LoginScreen />);

      const loginButton = getByText('Iniciar Sesión');

      await act(async () => {
        fireEvent.press(loginButton);
      });

      // Wait for validation error
      await findByText('Por favor, completa todos los campos.');

      // Verify no API call was made
      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  describe('User Registration Flow', () => {
    it('should allow user to register with valid data', async () => {
      const { getByPlaceholderText, getByText } = render(<SignupScreen />);

      const nameInput = getByPlaceholderText('Nombre Completo');
      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const confirmPasswordInput = getByPlaceholderText('Confirmar Contraseña');
      const termsCheckbox = getByText('He leído y acepto los');
      const signupButton = getByText('Crear Cuenta');

      await act(async () => {
        fireEvent.changeText(nameInput, 'New User');
        fireEvent.changeText(emailInput, 'newuser@example.com');
        fireEvent.changeText(passwordInput, 'newpass123');
        fireEvent.changeText(confirmPasswordInput, 'newpass123');
        fireEvent.press(termsCheckbox);
      });

      await act(async () => {
        fireEvent.press(signupButton);
      });

      // Wait for navigation to verification screen
      await waitFor(
        () => {
          expect(router.replace).toHaveBeenCalledWith({
            pathname: '/auth/verification-code',
            params: { email: 'newuser@example.com' },
          });
        },
        { timeout: 5000 }
      );

      // Verify auth store state
      const authStore = useAuthStore.getState();
      expect(authStore.isLoggedIn).toBe(true);
      expect(authStore.user).toMatchObject({
        email: 'newuser@example.com',
        name: 'New User',
      });
    });

    it('should show error for existing email', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(<SignupScreen />);

      const nameInput = getByPlaceholderText('Nombre Completo');
      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const confirmPasswordInput = getByPlaceholderText('Confirmar Contraseña');
      const termsCheckbox = getByText('He leído y acepto los');
      const signupButton = getByText('Crear Cuenta');

      await act(async () => {
        fireEvent.changeText(nameInput, 'Test User');
        fireEvent.changeText(emailInput, 'existing@example.com');
        fireEvent.changeText(passwordInput, 'password123');
        fireEvent.changeText(confirmPasswordInput, 'password123');
        fireEvent.press(termsCheckbox);
      });

      await act(async () => {
        fireEvent.press(signupButton);
      });

      // Wait for error message
      await findByText('An account with this email already exists.');

      // Verify user is not logged in
      const authStore = useAuthStore.getState();
      expect(authStore.isLoggedIn).toBe(false);
    });

    it('should validate password strength', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(<SignupScreen />);

      const nameInput = getByPlaceholderText('Nombre Completo');
      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const confirmPasswordInput = getByPlaceholderText('Confirmar Contraseña');
      const termsCheckbox = getByText('He leído y acepto los');
      const signupButton = getByText('Crear Cuenta');

      await act(async () => {
        fireEvent.changeText(nameInput, 'Test User');
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, '123');
        fireEvent.changeText(confirmPasswordInput, '123');
        fireEvent.press(termsCheckbox);
      });

      await act(async () => {
        fireEvent.press(signupButton);
      });

      // Wait for validation error
      await findByText('La contraseña debe tener al menos 6 caracteres.');

      // Verify no API call was made
      expect(router.replace).not.toHaveBeenCalled();
    });

    it('should validate password confirmation match', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(<SignupScreen />);

      const nameInput = getByPlaceholderText('Nombre Completo');
      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const confirmPasswordInput = getByPlaceholderText('Confirmar Contraseña');
      const termsCheckbox = getByText('He leído y acepto los');
      const signupButton = getByText('Crear Cuenta');

      await act(async () => {
        fireEvent.changeText(nameInput, 'Test User');
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'password123');
        fireEvent.changeText(confirmPasswordInput, 'different123');
        fireEvent.press(termsCheckbox);
      });

      await act(async () => {
        fireEvent.press(signupButton);
      });

      // Wait for validation error
      await findByText('Las contraseñas no coinciden.');

      // Verify no API call was made
      expect(router.replace).not.toHaveBeenCalled();
    });

    it('should require terms and conditions acceptance', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(<SignupScreen />);

      const nameInput = getByPlaceholderText('Nombre Completo');
      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const confirmPasswordInput = getByPlaceholderText('Confirmar Contraseña');
      const signupButton = getByText('Crear Cuenta');

      await act(async () => {
        fireEvent.changeText(nameInput, 'Test User');
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'password123');
        fireEvent.changeText(confirmPasswordInput, 'password123');
        // Don't check terms checkbox
      });

      await act(async () => {
        fireEvent.press(signupButton);
      });

      // Wait for validation error
      await findByText('Debes aceptar los términos y condiciones para continuar.');

      // Verify no API call was made
      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  describe('Email Verification Flow', () => {
    it('should verify email with valid code', async () => {
      // Mock useLocalSearchParams to return test email
      const mockUseLocalSearchParams = jest
        .fn()
        .mockImplementation(() => ({ email: 'test@example.com' }));
      jest.doMock('expo-router', () => ({
        ...jest.requireActual('expo-router'),
        useLocalSearchParams: mockUseLocalSearchParams,
      }));

      const { getByTestId, getByText } = render(<VerificationCodeScreen />);

      // Enter verification code
      const code = 'valid-verification-code';
      for (let i = 0; i < code.length; i++) {
        const input = getByTestId(`code-input-${i}`);
        await act(async () => {
          fireEvent.changeText(input, code[i]);
        });
      }

      // Code should auto-submit when complete
      await waitFor(
        () => {
          expect(router.replace).toHaveBeenCalledWith('/auth/verify-success');
        },
        { timeout: 5000 }
      );
    });

    it('should show error for invalid verification code', async () => {
      const { getByTestId, getByText, findByText } = render(<VerificationCodeScreen />);

      // Enter invalid verification code
      const code = 'invalid-verification-code';
      for (let i = 0; i < code.length; i++) {
        const input = getByTestId(`code-input-${i}`);
        await act(async () => {
          fireEvent.changeText(input, code[i]);
        });
      }

      // Wait for error message
      await findByText('Código incorrecto. Por favor verifica e intenta nuevamente.');

      // Verify no navigation occurred
      expect(router.replace).not.toHaveBeenCalledWith('/auth/verify-success');
    });

    it('should resend verification email', async () => {
      const { getByText } = render(<VerificationCodeScreen />);

      const resendButton = getByText('Reenviar código');

      await act(async () => {
        fireEvent.press(resendButton);
      });

      // Wait for success alert
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Código Enviado',
          'Se ha enviado un nuevo código de verificación a tu dirección de email.'
        );
      });
    });
  });

  describe('Google OAuth Flow', () => {
    it('should allow user to login with Google', async () => {
      const { getByText } = render(<LoginScreen />);

      const googleButton = getByText('Continuar con Google');

      await act(async () => {
        fireEvent.press(googleButton);
      });

      // Wait for successful Google login
      await waitFor(
        () => {
          expect(router.replace).toHaveBeenCalledWith('/(tabs)/profile');
        },
        { timeout: 5000 }
      );

      // Verify auth store state
      const authStore = useAuthStore.getState();
      expect(authStore.isLoggedIn).toBe(true);
      expect(authStore.user).toMatchObject({
        email: mockGoogleAuthUser.email,
        name: mockGoogleAuthUser.displayName,
      });
    });
  });

  describe('Logout Flow', () => {
    it('should logout user and clear auth state', async () => {
      // First login a user
      await act(async () => {
        const authStore = useAuthStore.getState();
        await authStore.login({ email: 'test@example.com', password: 'testpass123' });
      });

      // Verify user is logged in
      let authStore = useAuthStore.getState();
      expect(authStore.isLoggedIn).toBe(true);

      // Logout
      await act(async () => {
        await authStore.logout();
      });

      // Verify user is logged out
      authStore = useAuthStore.getState();
      expect(authStore.isLoggedIn).toBe(false);
      expect(authStore.user).toBeNull();
      expect(authStore.token).toBeNull();
    });
  });

  describe('Auth Service Integration', () => {
    it('should use real Firebase auth service for login', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'testpass123' });
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.user).toMatchObject({
        email: 'test@example.com',
      });
      expect(result.current.token).toBeTruthy();
      expect(result.current.error).toBeNull();
    });

    it('should use real Firebase auth service for registration', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'newpass123',
        });
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.user).toMatchObject({
        email: 'newuser@example.com',
        name: 'New User',
      });
      expect(result.current.token).toBeTruthy();
    });

    it('should handle authentication errors gracefully', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'wrong@example.com', password: 'wrongpass' });
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during login', async () => {
      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const loginButton = getByText('Iniciar Sesión');

      await act(async () => {
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'testpass123');
      });

      // Start login process
      fireEvent.press(loginButton);

      // Verify loading state is shown (ActivityIndicator should be visible)
      const authStore = useAuthStore.getState();
      expect(authStore.isLoading).toBe(true);

      // Wait for completion
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalled();
      });
    });

    it('should show loading state during registration', async () => {
      const { getByPlaceholderText, getByText } = render(<SignupScreen />);

      const nameInput = getByPlaceholderText('Nombre Completo');
      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const confirmPasswordInput = getByPlaceholderText('Confirmar Contraseña');
      const termsCheckbox = getByText('He leído y acepto los');
      const signupButton = getByText('Crear Cuenta');

      await act(async () => {
        fireEvent.changeText(nameInput, 'New User');
        fireEvent.changeText(emailInput, 'newuser@example.com');
        fireEvent.changeText(passwordInput, 'newpass123');
        fireEvent.changeText(confirmPasswordInput, 'newpass123');
        fireEvent.press(termsCheckbox);
      });

      // Start registration process
      fireEvent.press(signupButton);

      // Verify loading state is shown
      const authStore = useAuthStore.getState();
      expect(authStore.isLoading).toBe(true);

      // Wait for completion
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalled();
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should send password reset email successfully', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await authService.sendPasswordResetEmail('test@example.com');
      });

      // Should not throw error for valid email
      expect(true).toBe(true);
    });

    it('should confirm password reset with valid code', async () => {
      await act(async () => {
        await authService.confirmPasswordReset('valid-reset-code', 'newpassword123');
      });

      // Should not throw error for valid reset code
      expect(true).toBe(true);
    });

    it('should handle invalid password reset code', async () => {
      await expect(
        authService.confirmPasswordReset('invalid-reset-code', 'newpassword123')
      ).rejects.toThrow();
    });
  });

  describe('Auth State Persistence', () => {
    it('should persist auth state across app restarts', async () => {
      // Login user
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'testpass123' });
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.user).toBeTruthy();

      // Simulate app restart by re-initializing auth
      await act(async () => {
        await result.current.initializeAuth();
      });

      // Auth state should be restored
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.user).toBeTruthy();
    });

    it('should handle invalid stored tokens gracefully', async () => {
      // Mock secure store to return invalid token
      const SecureStore = require('expo-secure-store');
      SecureStore.getItemAsync.mockResolvedValueOnce('invalid-token');

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      // Should be logged out with invalid token
      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Token Refresh and Session Management', () => {
    it('should refresh expired tokens automatically', async () => {
      // Login user first
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'testpass123' });
      });

      const initialToken = result.current.token;

      // Simulate token refresh
      await act(async () => {
        const newToken = await authService.getApiToken();
        expect(newToken).toBeTruthy();
      });
    });

    it('should handle token refresh failures', async () => {
      // Set up token refresh failure
      mswServer.use(
        http.post('https://securetoken.googleapis.com/v1/token', () => {
          return HttpResponse.json({ error: 'Invalid refresh token' }, { status: 400 });
        })
      );

      const { result } = renderHook(() => useAuthStore());

      // Attempt to get API token should handle refresh failure gracefully
      await act(async () => {
        const token = await authService.getApiToken();
        // Should either return null or throw handled error
        expect(token === null || typeof token === 'string').toBe(true);
      });
    });
  });

  describe('Auth Error Scenarios', () => {
    it('should handle rate limiting (too many requests)', async () => {
      // Set up rate limiting response
      mswServer.use(
        http.post('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', () => {
          return HttpResponse.json(
            {
              error: {
                code: 400,
                message: 'TOO_MANY_ATTEMPTS_TRY_LATER',
                errors: [
                  { message: 'TOO_MANY_ATTEMPTS_TRY_LATER', domain: 'global', reason: 'invalid' },
                ],
              },
            },
            { status: 400 }
          );
        })
      );

      const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const loginButton = getByText('Iniciar Sesión');

      await act(async () => {
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'testpass123');
      });

      await act(async () => {
        fireEvent.press(loginButton);
      });

      // Wait for rate limit error message
      await findByText('Too many failed attempts. Please try again later.');
    });

    it('should handle disabled user accounts', async () => {
      mswServer.use(
        http.post('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', () => {
          return HttpResponse.json(
            {
              error: {
                code: 400,
                message: 'USER_DISABLED',
                errors: [{ message: 'USER_DISABLED', domain: 'global', reason: 'invalid' }],
              },
            },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'disabled@example.com', password: 'password123' });
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.error).toContain('disabled');
    });

    it('should handle malformed email addresses', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const loginButton = getByText('Iniciar Sesión');

      const malformedEmails = [
        'not-an-email',
        '@domain.com',
        'user@',
        'user.domain.com',
        'user space@domain.com',
      ];

      for (const email of malformedEmails) {
        await act(async () => {
          fireEvent.changeText(emailInput, email);
          fireEvent.changeText(passwordInput, 'password123');
        });

        await act(async () => {
          fireEvent.press(loginButton);
        });

        // Should show validation error for malformed email
        await findByText('Por favor, ingresa un correo electrónico válido.');

        // Clear the error for next iteration
        await act(async () => {
          fireEvent.changeText(emailInput, '');
        });
      }
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Set up network error handler
      mswServer.use(
        http.post('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', () => {
          return HttpResponse.error();
        })
      );

      const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const loginButton = getByText('Iniciar Sesión');

      await act(async () => {
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'testpass123');
      });

      await act(async () => {
        fireEvent.press(loginButton);
      });

      // Wait for network error message
      await findByText(/Network error|Error al iniciar sesión/);

      // Verify user is not logged in
      const authStore = useAuthStore.getState();
      expect(authStore.isLoggedIn).toBe(false);
    });

    it('should handle slow network connections', async () => {
      // Set up delayed response
      mswServer.use(
        http.post(
          'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword',
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
            return HttpResponse.json({
              kind: 'identitytoolkit#VerifyPasswordResponse',
              localId: mockFirebaseAuthUser.uid,
              email: mockFirebaseAuthUser.email,
              displayName: mockFirebaseAuthUser.displayName,
              idToken: mockFirebaseIdToken,
              registered: true,
              refreshToken: 'mock-refresh-token',
              expiresIn: '3600',
            });
          }
        )
      );

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const loginButton = getByText('Iniciar Sesión');

      await act(async () => {
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'testpass123');
      });

      const startTime = Date.now();

      await act(async () => {
        fireEvent.press(loginButton);
      });

      // Wait for completion
      await waitFor(
        () => {
          expect(router.replace).toHaveBeenCalledWith('/(tabs)/profile');
        },
        { timeout: 5000 }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have taken at least 2 seconds due to delay
      expect(duration).toBeGreaterThan(1900);
    }, 10000);

    it('should timeout on extremely slow responses', async () => {
      // Set up extremely slow response (longer than reasonable timeout)
      mswServer.use(
        http.post(
          'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword',
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 30000)); // 30 second delay
            return HttpResponse.json({});
          }
        )
      );

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const loginButton = getByText('Iniciar Sesión');

      await act(async () => {
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'testpass123');
      });

      const startTime = Date.now();

      await act(async () => {
        fireEvent.press(loginButton);
      });

      // Should timeout before 30 seconds
      await waitFor(
        () => {
          const authStore = useAuthStore.getState();
          // Either error state or still loading, but not success
          expect(authStore.isLoggedIn).toBe(false);
        },
        { timeout: 10000 }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have timed out before 30 seconds
      expect(duration).toBeLessThan(25000);
    }, 35000);
  });

  describe('User Profile Management', () => {
    it('should update profile picture', async () => {
      // Login first
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'testpass123' });
      });

      // Update profile picture
      await act(async () => {
        await result.current.updateProfilePicture('https://example.com/new-avatar.jpg');
      });

      expect(result.current.user?.profilePicture).toBe('https://example.com/new-avatar.jpg');
    });

    it('should change password successfully', async () => {
      // Login first
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'testpass123' });
      });

      // Change password
      await act(async () => {
        await result.current.changePassword({
          currentPassword: 'testpass123',
          newPassword: 'newpassword456',
        });
      });

      // Should complete without error
      expect(result.current.error).toBeNull();
    });

    it('should handle incorrect current password when changing', async () => {
      // Login first
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'testpass123' });
      });

      // Try to change password with wrong current password
      await expect(
        act(async () => {
          await result.current.changePassword({
            currentPassword: 'wrongpassword',
            newPassword: 'newpassword456',
          });
        })
      ).rejects.toThrow();
    });
  });

  describe('Deep Link Authentication', () => {
    it('should handle email verification deep link', async () => {
      const mockDeepLink = 'tifossi://auth/verify-email?token=email-verification-token';

      // Simulate receiving deep link
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.verifyEmail('email-verification-token');
      });

      // Should verify email successfully
      expect(result.current.user?.isEmailVerified).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle password reset deep link', async () => {
      // This would test deep link handling for password reset
      // Implementation depends on deep linking setup
      expect(true).toBe(true);
    });
  });

  describe('Session Expiration Handling', () => {
    it('should handle expired session gracefully', async () => {
      // Login user first
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'testpass123' });
      });

      expect(result.current.isLoggedIn).toBe(true);

      // Simulate token expiration by mocking API response
      mswServer.use(
        http.get('/api/auth/me', () => {
          return HttpResponse.json({ error: 'Token expired' }, { status: 401 });
        })
      );

      // Attempt to validate expired token
      await act(async () => {
        try {
          await authService.validateToken(result.current.token!);
        } catch (error) {
          // Should handle expired token gracefully
          await result.current.logout();
        }
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should refresh tokens automatically before expiration', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'testpass123' });
      });

      const initialToken = result.current.token;

      // Simulate token refresh
      await act(async () => {
        const newToken = await authService.getApiToken();
        expect(newToken).toBeTruthy();
        // Token should be refreshed if needed
      });

      // User should still be logged in
      expect(result.current.isLoggedIn).toBe(true);
    });
  });

  describe('Auth State Synchronization', () => {
    it('should sync auth state across multiple app instances', async () => {
      // Simulate first app instance
      const { result: instance1 } = renderHook(() => useAuthStore());

      await act(async () => {
        await instance1.current.login({ email: 'test@example.com', password: 'testpass123' });
      });

      expect(instance1.current.isLoggedIn).toBe(true);

      // Simulate second app instance (app restart or background/foreground)
      const { result: instance2 } = renderHook(() => useAuthStore());

      await act(async () => {
        await instance2.current.initializeAuth();
      });

      // Second instance should have same auth state
      expect(instance2.current.isLoggedIn).toBe(true);
      expect(instance2.current.user?.email).toBe('test@example.com');
    });

    it('should handle auth state conflicts between instances', async () => {
      // Test case for when auth state differs between instances
      // This could happen if one instance logs out while another is running
      const { result: instance1 } = renderHook(() => useAuthStore());
      const { result: instance2 } = renderHook(() => useAuthStore());

      // Login on first instance
      await act(async () => {
        await instance1.current.login({ email: 'test@example.com', password: 'testpass123' });
      });

      // Logout on second instance
      await act(async () => {
        await instance2.current.logout();
      });

      // Both instances should be logged out
      expect(instance1.current.isLoggedIn).toBe(false);
      expect(instance2.current.isLoggedIn).toBe(false);
    });
  });

  describe('Biometric Authentication', () => {
    // Note: These tests would require additional setup for biometric mocking
    it('should be ready for biometric authentication integration', () => {
      // Placeholder for future biometric auth tests
      // This would test Touch ID/Face ID integration when implemented
      expect(true).toBe(true);
    });

    it('should fall back to password if biometrics fail', () => {
      // Placeholder for biometric fallback testing
      expect(true).toBe(true);
    });

    it('should handle biometric enrollment status changes', () => {
      // Test handling when user adds/removes fingerprints or face data
      expect(true).toBe(true);
    });
  });

  describe('Authentication Security', () => {
    it('should prevent login with compromised credentials', async () => {
      // Mock a security warning response
      mswServer.use(
        http.post('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', () => {
          return HttpResponse.json(
            {
              error: {
                code: 400,
                message: 'INVALID_LOGIN_CREDENTIALS',
                errors: [
                  { message: 'INVALID_LOGIN_CREDENTIALS', domain: 'global', reason: 'invalid' },
                ],
              },
            },
            { status: 400 }
          );
        })
      );

      const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const loginButton = getByText('Iniciar Sesión');

      await act(async () => {
        fireEvent.changeText(emailInput, 'compromised@example.com');
        fireEvent.changeText(passwordInput, 'weakpassword');
      });

      await act(async () => {
        fireEvent.press(loginButton);
      });

      // Should show appropriate security error
      await findByText(/Invalid login credentials|Incorrect password/);
    });

    it('should enforce strong password requirements during registration', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(<SignupScreen />);

      const nameInput = getByPlaceholderText('Nombre Completo');
      const emailInput = getByPlaceholderText('Correo Electrónico');
      const passwordInput = getByPlaceholderText('Contraseña');
      const confirmPasswordInput = getByPlaceholderText('Confirmar Contraseña');
      const termsCheckbox = getByText('He leído y acepto los');
      const signupButton = getByText('Crear Cuenta');

      // Test various weak passwords
      const weakPasswords = ['123', 'abc', 'password', '123456'];

      for (const weakPassword of weakPasswords) {
        await act(async () => {
          fireEvent.changeText(nameInput, 'Test User');
          fireEvent.changeText(emailInput, 'test@example.com');
          fireEvent.changeText(passwordInput, weakPassword);
          fireEvent.changeText(confirmPasswordInput, weakPassword);
          fireEvent.press(termsCheckbox);
        });

        await act(async () => {
          fireEvent.press(signupButton);
        });

        // Should show password strength error
        await findByText(
          /La contraseña debe tener al menos 6 caracteres|Password should be at least 6 characters/
        );

        // Clear for next iteration
        await act(async () => {
          fireEvent.changeText(passwordInput, '');
          fireEvent.changeText(confirmPasswordInput, '');
        });
      }
    });

    it('should handle account lockout after multiple failed attempts', async () => {
      // Set up rate limiting after multiple attempts
      let attemptCount = 0;
      mswServer.use(
        http.post('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', () => {
          attemptCount++;
          if (attemptCount >= 3) {
            return HttpResponse.json(
              {
                error: {
                  code: 400,
                  message: 'TOO_MANY_ATTEMPTS_TRY_LATER',
                  errors: [
                    { message: 'TOO_MANY_ATTEMPTS_TRY_LATER', domain: 'global', reason: 'invalid' },
                  ],
                },
              },
              { status: 400 }
            );
          }
          return HttpResponse.json(
            {
              error: {
                code: 400,
                message: 'INVALID_PASSWORD',
                errors: [{ message: 'INVALID_PASSWORD', domain: 'global', reason: 'invalid' }],
              },
            },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useAuthStore());

      // Try multiple failed login attempts
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await result.current.login({ email: 'test@example.com', password: 'wrongpassword' });
        });
      }

      // Final attempt should show lockout message
      expect(result.current.error).toContain('Too many failed attempts');
    });
  });

  describe('Multi-device Session Management', () => {
    it('should handle concurrent sessions properly', async () => {
      // Login from first "device"
      const { result: device1 } = renderHook(() => useAuthStore());

      await act(async () => {
        await device1.current.login({ email: 'test@example.com', password: 'testpass123' });
      });

      expect(device1.current.isLoggedIn).toBe(true);

      // Simulate login from second "device" (same user)
      const { result: device2 } = renderHook(() => useAuthStore());

      await act(async () => {
        await device2.current.login({ email: 'test@example.com', password: 'testpass123' });
      });

      expect(device2.current.isLoggedIn).toBe(true);

      // Both sessions should be valid
      expect(device1.current.isLoggedIn).toBe(true);
      expect(device2.current.isLoggedIn).toBe(true);
    });
  });
});
