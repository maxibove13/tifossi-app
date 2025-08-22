/**
 * Authentication Integration Tests
 *
 * Tests the complete authentication flow with real dependencies:
 * - Real auth store integration
 * - Firebase authentication mocking
 * - Form validation and error handling
 * - Navigation flow after authentication
 * - Google OAuth integration
 * - User session management
 *
 * Testing Philosophy:
 * - Test complete auth workflows
 * - Use real auth store and validation
 * - Mock Firebase SDK and network calls
 * - Test visual feedback and state changes
 */

import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { mswServer } from '../utils/msw-setup';
import { mockUser, mockFirebaseAuthUser, mockGoogleAuthUser } from '../utils/mock-data';
import LoginScreen from '../../auth/login';
import { useAuthStore } from '../../_stores/authStore';
import { testLifecycleHelpers } from '../utils/test-setup';

// Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: mockCanGoBack,
  },
  Stack: {
    Screen: ({ options }: { options?: Record<string, unknown> }) => (
      <div data-testid="stack-screen" {...options} />
    ),
  },
}));

// React Native component mocking is handled in setup.ts

// SVG components are now handled by jest.config.js moduleNameMapper

// Mock Firebase SDK
const mockSignInWithEmailAndPassword = jest.fn();
const mockSignInWithPopup = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockSignOut = jest.fn();

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn().mockImplementation(() => ({})),
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  signInWithPopup: mockSignInWithPopup,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
  signOut: mockSignOut,
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
  onAuthStateChanged: jest.fn().mockImplementation((_auth, _callback) => {
    // Return unsubscribe function
    return () => {};
  }),
}));

describe('Authentication Integration Tests', () => {
  // Helper to clear auth store before each test
  const clearAuthStore = () => {
    const authStore = useAuthStore.getState();

    authStore.isLoggedIn = false;
    authStore.user = null;
    authStore.token = null;
    authStore.isLoading = false;
    authStore.error = null;
    authStore.isInitialized = true;
  };

  beforeEach(() => {
    clearAuthStore();
    mswServer.resetHandlers();
    testLifecycleHelpers.setupTest();

    // Clear all mocks
    mockPush.mockClear();
    mockReplace.mockClear();
    mockBack.mockClear();
    mockCanGoBack.mockClear();
    mockSignInWithEmailAndPassword.mockClear();
    mockSignInWithPopup.mockClear();
    mockCreateUserWithEmailAndPassword.mockClear();
    mockSendPasswordResetEmail.mockClear();
    mockSignOut.mockClear();
  });

  afterEach(() => {
    testLifecycleHelpers.teardownTest();
  });

  describe('Login Screen Rendering', () => {
    it('should render login form correctly', async () => {
      render(<LoginScreen />);

      expect(screen.getByText('Iniciar Sesión')).toBeTruthy();
      expect(screen.getByPlaceholderText('Correo Electrónico')).toBeTruthy();
      expect(screen.getByPlaceholderText('Contraseña')).toBeTruthy();
      expect(screen.getByText('Iniciar Sesión')).toBeTruthy();
      expect(screen.getByText('Continuar con Google')).toBeTruthy();
      expect(screen.getByText('¿No tienes cuenta? Regístrate')).toBeTruthy();
      expect(screen.getByText('¿Olvidaste tu contraseña?')).toBeTruthy();
    });

    it('should handle close button navigation', async () => {
      mockCanGoBack.mockReturnValue(true);

      render(<LoginScreen />);

      const closeButton = screen.getByTestId('close-button');
      fireEvent.press(closeButton);

      expect(mockBack).toHaveBeenCalled();
    });

    it('should handle close button when no back navigation available', async () => {
      mockCanGoBack.mockReturnValue(false);

      render(<LoginScreen />);

      const closeButton = screen.getByTestId('close-button');
      fireEvent.press(closeButton);

      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      render(<LoginScreen />);

      const loginButton = screen.getByText('Iniciar Sesión');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Por favor, completa todos los campos.')).toBeTruthy();
      });
    });

    it('should validate email format', async () => {
      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('Correo Electrónico');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const loginButton = screen.getByText('Iniciar Sesión');

      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Por favor, ingresa un correo electrónico válido.')).toBeTruthy();
      });
    });

    it('should clear error when user starts typing', async () => {
      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('Correo Electrónico');
      const loginButton = screen.getByText('Iniciar Sesión');

      // Trigger validation error
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Por favor, completa todos los campos.')).toBeTruthy();
      });

      // Error should clear when user starts typing
      fireEvent.changeText(emailInput, 'user@example.com');

      await waitFor(() => {
        expect(screen.queryByText('Por favor, completa todos los campos.')).toBeNull();
      });
    });
  });

  describe('Email/Password Authentication', () => {
    it('should successfully login with valid credentials', async () => {
      // Mock successful Firebase authentication
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseAuthUser,
      });

      // Mock successful Strapi token exchange
      mswServer.use(
        http.post('/api/auth/firebase', async ({ request }) => {
          const { firebaseToken: _firebaseToken } = (await request.json()) as {
            firebaseToken: string;
          };
          expect(_firebaseToken).toBeTruthy();
          return HttpResponse.json({
            jwt: 'mock-strapi-token',
            user: mockUser,
          });
        })
      );

      const authStore = useAuthStore.getState();
      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('Correo Electrónico');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const loginButton = screen.getByText('Iniciar Sesión');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      // Should show loading state
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();

      await waitFor(() => {
        expect(authStore.isLoggedIn).toBe(true);
        expect(authStore.user).toEqual(mockUser);
        expect(authStore.token).toBe('mock-strapi-token');
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)/profile');
      });
    });

    it('should handle invalid credentials error', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/invalid-credential',
        message: 'The supplied auth credential is incorrect, malformed or has expired.',
      });

      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('Correo Electrónico');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const loginButton = screen.getByText('Iniciar Sesión');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Error al iniciar sesión/)).toBeTruthy();
      });
    });

    it('should handle user not found error', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/user-not-found',
        message: 'There is no user record corresponding to this identifier.',
      });

      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('Correo Electrónico');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const loginButton = screen.getByText('Iniciar Sesión');

      fireEvent.changeText(emailInput, 'nonexistent@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Error al iniciar sesión/)).toBeTruthy();
      });
    });

    it('should handle network errors', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/network-request-failed',
        message: 'A network error has occurred.',
      });

      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('Correo Electrónico');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const loginButton = screen.getByText('Iniciar Sesión');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Error al iniciar sesión/)).toBeTruthy();
      });
    });

    it('should handle Strapi authentication failure', async () => {
      // Firebase succeeds but Strapi fails
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseAuthUser,
      });

      mswServer.use(
        http.post('/api/auth/firebase', () =>
          HttpResponse.json({ error: 'User not found in Strapi' }, { status: 404 })
        )
      );

      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('Correo Electrónico');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const loginButton = screen.getByText('Iniciar Sesión');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Error al iniciar sesión/)).toBeTruthy();
      });
    });
  });

  describe('Google OAuth Authentication', () => {
    it('should successfully login with Google', async () => {
      mockSignInWithPopup.mockResolvedValue({
        user: mockGoogleAuthUser,
      });

      mswServer.use(
        http.post('/api/auth/firebase', async ({ request }) => {
          const { firebaseToken: _firebaseToken } = (await request.json()) as {
            firebaseToken: string;
          };
          return HttpResponse.json({
            jwt: 'mock-strapi-token',
            user: {
              ...mockUser,
              email: 'googleuser@gmail.com',
              name: 'Google Test User',
            },
          });
        })
      );

      const authStore = useAuthStore.getState();
      render(<LoginScreen />);

      const googleButton = screen.getByText('Continuar con Google');
      fireEvent.press(googleButton);

      expect(screen.getByTestId('loading-indicator')).toBeTruthy();

      await waitFor(() => {
        expect(authStore.isLoggedIn).toBe(true);
        expect(authStore.user?.email).toBe('googleuser@gmail.com');
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)/profile');
      });
    });

    it('should handle Google authentication cancellation', async () => {
      mockSignInWithPopup.mockRejectedValue({
        code: 'auth/popup-closed-by-user',
        message: 'The popup has been closed by the user before finalizing the operation.',
      });

      render(<LoginScreen />);

      const googleButton = screen.getByText('Continuar con Google');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(screen.getByText(/Error al iniciar sesión con Google/)).toBeTruthy();
      });
    });

    it('should handle Google authentication network error', async () => {
      mockSignInWithPopup.mockRejectedValue({
        code: 'auth/network-request-failed',
        message: 'A network error has occurred.',
      });

      render(<LoginScreen />);

      const googleButton = screen.getByText('Continuar con Google');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(screen.getByText(/Error al iniciar sesión con Google/)).toBeTruthy();
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should navigate to signup screen', async () => {
      render(<LoginScreen />);

      const signupLink = screen.getByText('¿No tienes cuenta? Regístrate');
      fireEvent.press(signupLink);

      expect(mockPush).toHaveBeenCalledWith('/auth/signup');
    });

    it('should navigate to forgot password screen', async () => {
      render(<LoginScreen />);

      const forgotPasswordLink = screen.getByText('¿Olvidaste tu contraseña?');
      fireEvent.press(forgotPasswordLink);

      expect(mockPush).toHaveBeenCalledWith('/auth/forgot-password');
    });

    it('should disable navigation buttons during authentication', async () => {
      mockSignInWithEmailAndPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('Correo Electrónico');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const loginButton = screen.getByText('Iniciar Sesión');
      const signupLink = screen.getByText('¿No tienes cuenta? Regístrate');
      const forgotPasswordLink = screen.getByText('¿Olvidaste tu contraseña?');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      // Buttons should be disabled during authentication
      expect(signupLink.props.disabled).toBe(true);
      expect(forgotPasswordLink.props.disabled).toBe(true);
    });
  });

  describe('Real User Authentication Workflows', () => {
    it('should complete full email login workflow', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseAuthUser,
      });

      mswServer.use(
        http.post('/api/auth/firebase', () =>
          HttpResponse.json({
            jwt: 'mock-strapi-token',
            user: mockUser,
          })
        )
      );

      const authStore = useAuthStore.getState();
      render(<LoginScreen />);

      // User sees login form
      expect(screen.getByText('Iniciar Sesión')).toBeTruthy();
      expect(screen.getByPlaceholderText('Correo Electrónico')).toBeTruthy();

      // User enters credentials
      const emailInput = screen.getByPlaceholderText('Correo Electrónico');
      const passwordInput = screen.getByPlaceholderText('Contraseña');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      // User submits form
      const loginButton = screen.getByText('Iniciar Sesión');
      fireEvent.press(loginButton);

      // User sees loading state
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();

      // Authentication succeeds and user is redirected
      await waitFor(() => {
        expect(authStore.isLoggedIn).toBe(true);
        expect(authStore.user).toEqual(mockUser);
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)/profile');
      });
    });

    it('should complete full Google login workflow', async () => {
      mockSignInWithPopup.mockResolvedValue({
        user: mockGoogleAuthUser,
      });

      mswServer.use(
        http.post('/api/auth/firebase', () =>
          HttpResponse.json({
            jwt: 'mock-strapi-token',
            user: {
              ...mockUser,
              email: 'googleuser@gmail.com',
            },
          })
        )
      );

      const authStore = useAuthStore.getState();
      render(<LoginScreen />);

      // User chooses Google login
      const googleButton = screen.getByText('Continuar con Google');
      fireEvent.press(googleButton);

      // User sees loading state
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();

      // Google authentication succeeds
      await waitFor(() => {
        expect(authStore.isLoggedIn).toBe(true);
        expect(authStore.user?.email).toBe('googleuser@gmail.com');
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)/profile');
      });
    });

    it('should handle authentication error recovery workflow', async () => {
      // First attempt fails
      mockSignInWithEmailAndPassword.mockRejectedValueOnce({
        code: 'auth/wrong-password',
        message: 'The password is invalid.',
      });

      // Second attempt succeeds
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseAuthUser,
      });

      mswServer.use(
        http.post('/api/auth/firebase', () =>
          HttpResponse.json({
            jwt: 'mock-strapi-token',
            user: mockUser,
          })
        )
      );

      const authStore = useAuthStore.getState();
      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('Correo Electrónico');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const loginButton = screen.getByText('Iniciar Sesión');

      // First attempt with wrong password
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Error al iniciar sesión/)).toBeTruthy();
      });

      // User corrects password and tries again
      fireEvent.changeText(passwordInput, 'correctpassword');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(authStore.isLoggedIn).toBe(true);
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)/profile');
      });
    });

    it('should handle navigation between auth screens', async () => {
      render(<LoginScreen />);

      // User navigates to signup
      fireEvent.press(screen.getByText('¿No tienes cuenta? Regístrate'));
      expect(mockPush).toHaveBeenCalledWith('/auth/signup');

      // User navigates to forgot password
      fireEvent.press(screen.getByText('¿Olvidaste tu contraseña?'));
      expect(mockPush).toHaveBeenCalledWith('/auth/forgot-password');

      // User closes auth flow
      fireEvent.press(screen.getByTestId('close-button'));
      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid button presses without double submission', async () => {
      let callCount = 0;
      mockSignInWithEmailAndPassword.mockImplementation(() => {
        callCount++;
        return new Promise((resolve) => setTimeout(resolve, 100));
      });

      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('Correo Electrónico');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const loginButton = screen.getByText('Iniciar Sesión');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      // Rapidly press login button
      fireEvent.press(loginButton);
      fireEvent.press(loginButton);
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(callCount).toBe(1); // Should only call once due to loading state
      });
    });

    it('should handle very long email addresses', async () => {
      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('Correo Electrónico');
      const veryLongEmail = 'a'.repeat(100) + '@example.com';

      fireEvent.changeText(emailInput, veryLongEmail);

      expect(emailInput.props.value).toBe(veryLongEmail);
    });

    it('should handle special characters in credentials', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseAuthUser,
      });

      mswServer.use(
        http.post('/api/auth/firebase', () =>
          HttpResponse.json({
            jwt: 'mock-strapi-token',
            user: mockUser,
          })
        )
      );

      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('Correo Electrónico');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const loginButton = screen.getByText('Iniciar Sesión');

      fireEvent.changeText(emailInput, 'test+special@example.com');
      fireEvent.changeText(passwordInput, 'password@#$%123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          'test+special@example.com',
          'password@#$%123'
        );
      });
    });

    it('should handle auth state changes during component lifecycle', async () => {
      const authStore = useAuthStore.getState();
      render(<LoginScreen />);

      // Simulate external auth state change (e.g., from another tab)
      await act(async () => {
        authStore.isLoggedIn = true;
        authStore.user = mockUser;
        authStore.token = 'external-token';
      });

      // Component should handle the state change appropriately
      expect(authStore.isLoggedIn).toBe(true);
    });
  });
});
