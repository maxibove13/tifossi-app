/**
 * Auth Store Tests
 * Testing authentication flows with services mocked at the boundary
 */

import { renderHook, act } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import authService from '../../_services/auth/authService';
import { useAuthStore } from '../../_stores/authStore';

// Get references to the mocked functions
const mockLogin = authService.login as jest.MockedFunction<typeof authService.login>;
const mockRegister = authService.register as jest.MockedFunction<typeof authService.register>;
const mockLoginWithGoogle = authService.loginWithGoogle as jest.MockedFunction<
  typeof authService.loginWithGoogle
>;
const mockLoginWithApple = authService.loginWithApple as jest.MockedFunction<
  typeof authService.loginWithApple
>;
const mockLogout = authService.logout as jest.MockedFunction<typeof authService.logout>;
const mockSendPasswordResetEmail = authService.sendPasswordResetEmail as jest.MockedFunction<
  typeof authService.sendPasswordResetEmail
>;
const mockChangePassword = authService.changePassword as jest.MockedFunction<
  typeof authService.changePassword
>;
const mockValidateToken = authService.validateToken as jest.MockedFunction<
  typeof authService.validateToken
>;
const mockInitialize = authService.initialize as jest.MockedFunction<typeof authService.initialize>;

describe('authStore', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset mock implementations
    mockInitialize.mockResolvedValue(undefined);
    mockLogout.mockResolvedValue(true);

    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      token: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,
      isInitialized: false,
      status: 'idle',
    });
  });

  describe('login', () => {
    it('should login user successfully with email and password', async () => {
      const mockUser = {
        id: 'test-uid',
        email: 'test@example.com',
        name: 'Test User',
        profilePicture: null,
        isEmailVerified: true,
      };

      mockLogin.mockImplementation(async (_creds) => {
        return {
          token: 'test-token',
          user: mockUser,
        };
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' });
      });

      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('test-token');
      expect(result.current.error).toBeNull();
    });

    it('should handle login failure with invalid credentials', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid email or password'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'wrong@example.com', password: 'wrongpassword' });
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe('Invalid email or password');
    });

    it('should set loading state during login', async () => {
      let resolveLogin!: (value: any) => void;
      const deferredLogin = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      mockLogin.mockReturnValue(deferredLogin as Promise<any>);

      const { result } = renderHook(() => useAuthStore());

      let loginPromise!: Promise<any>;
      act(() => {
        loginPromise = result.current.login({ email: 'test@example.com', password: 'password123' });
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLogin({
          token: 'test-token',
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test',
            profilePicture: null,
            isEmailVerified: true,
          },
        });

        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const mockUser = {
        id: 'new-user-uid',
        email: 'newuser@example.com',
        name: 'New User',
        profilePicture: null,
        isEmailVerified: false,
      };

      mockRegister.mockResolvedValue({
        token: 'new-token',
        user: mockUser,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
        });
      });

      expect(mockRegister).toHaveBeenCalledWith({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
      });
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle registration failure for existing email', async () => {
      mockRegister.mockRejectedValue(new Error('Email already in use'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register({
          name: 'User',
          email: 'existing@example.com',
          password: 'password123',
        });
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.error).toBe('Email already in use');
    });
  });

  describe('logout', () => {
    it('should logout user and clear state', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: {
          id: 'test-uid',
          email: 'test@example.com',
          name: 'Test User',
          profilePicture: null,
          isEmailVerified: true,
        },
        token: 'test-token',
        isLoggedIn: true,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalled();
      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('should handle logout error gracefully', async () => {
      mockLogout.mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      // Should still clear local state even if logout fails
      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email successfully', async () => {
      mockSendPasswordResetEmail.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.sendPasswordReset('test@example.com');
      });

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith('test@example.com');
      expect(result.current.error).toBeNull();
    });

    it('should handle reset password error', async () => {
      mockSendPasswordResetEmail.mockRejectedValue(new Error('User not found'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await expect(result.current.sendPasswordReset('nonexistent@example.com')).rejects.toThrow(
          'User not found'
        );
      });

      expect(result.current.error).toBe('User not found');
      expect(result.current.status).toBe('failed');
    });
  });

  describe('changePassword', () => {
    it('should update password successfully', async () => {
      useAuthStore.setState({
        user: {
          id: 'test-uid',
          email: 'test@example.com',
          name: 'Test User',
          profilePicture: null,
          isEmailVerified: true,
        },
        token: 'test-token',
        isLoggedIn: true,
      });

      mockChangePassword.mockResolvedValue(true);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.changePassword({
          currentPassword: 'oldPassword',
          newPassword: 'newPassword',
        });
      });

      expect(mockChangePassword).toHaveBeenCalledWith('test-token', {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword',
      });
      expect(result.current.error).toBeNull();
    });

    it('should handle wrong current password', async () => {
      // Set up authenticated state with token
      useAuthStore.setState({
        user: {
          id: 'test-uid',
          email: 'test@example.com',
          name: 'Test User',
          profilePicture: null,
          isEmailVerified: true,
        },
        token: 'test-token',
        isLoggedIn: true,
      });

      mockChangePassword.mockRejectedValue(new Error('Wrong password'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await expect(
          result.current.changePassword({
            currentPassword: 'wrongPassword',
            newPassword: 'newPassword',
          })
        ).rejects.toThrow('Wrong password');
      });

      expect(mockChangePassword).toHaveBeenCalledWith('test-token', {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword',
      });
      expect(result.current.error).toBe('Wrong password');
      expect(result.current.status).toBe('failed');
    });
  });

  describe('social login', () => {
    it('should login with Google successfully', async () => {
      const mockUser = {
        id: 'google-uid',
        email: 'google@example.com',
        name: 'Google User',
        profilePicture: 'https://example.com/photo.jpg',
        isEmailVerified: true,
      };

      mockLoginWithGoogle.mockResolvedValue({
        token: 'google-token',
        user: mockUser,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.loginWithGoogle();
      });

      expect(mockLoginWithGoogle).toHaveBeenCalled();
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should login with Apple successfully', async () => {
      const mockUser = {
        id: 'apple-uid',
        email: 'apple@example.com',
        name: 'Apple User',
        profilePicture: null,
        isEmailVerified: true,
      };

      mockLoginWithApple.mockResolvedValue({
        token: 'apple-token',
        user: mockUser,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.loginWithApple();
      });

      expect(mockLoginWithApple).toHaveBeenCalled();
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('initialization', () => {
    it('should initialize authentication status', async () => {
      mockValidateToken.mockResolvedValue({
        id: 'stored-uid',
        email: 'stored@example.com',
        name: 'Stored User',
        profilePicture: null,
        isEmailVerified: true,
      });

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-token');

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isLoggedIn).toBe(true);
    });

    it('should handle invalid token during initialization', async () => {
      // Mock validateToken to throw an error (invalid token)
      mockValidateToken.mockRejectedValue(new Error('Invalid token'));

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('invalid-token');

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('utility functions', () => {
    it('should allow setting user for testing', () => {
      const { result } = renderHook(() => useAuthStore());

      const testUser = {
        id: 'test-id',
        email: 'test@test.com',
        name: 'Test',
        profilePicture: null,
        isEmailVerified: true,
      };

      act(() => {
        result.current.setUser(testUser);
      });

      expect(result.current.user).toEqual(testUser);
    });

    it('should allow setting token for testing', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setToken('test-token');
      });

      expect(result.current.token).toBe('test-token');
    });

    it('should clear auth data properly', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set some data first
      act(() => {
        result.current.setUser({
          id: '1',
          email: 'test@test.com',
          name: 'Test',
          profilePicture: null,
          isEmailVerified: true,
        });
        result.current.setToken('token');
      });

      // Clear everything
      act(() => {
        result.current.clearAuthData();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoggedIn).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should clear error on successful operation', async () => {
      // Set initial error state
      useAuthStore.setState({
        error: 'Previous error',
      });

      mockLogin.mockResolvedValue({
        token: 'test-token',
        user: {
          id: '1',
          email: 'test@test.com',
          name: 'Test',
          profilePicture: null,
          isEmailVerified: true,
        },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' });
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle network errors', async () => {
      mockLogin.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' });
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoggedIn).toBe(false);
    });

    it('should handle authentication initialization errors', async () => {
      mockInitialize.mockRejectedValue(new Error('Initialization failed'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      // Should still mark as initialized even if it fails
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isLoggedIn).toBe(false);
    });
  });
});
