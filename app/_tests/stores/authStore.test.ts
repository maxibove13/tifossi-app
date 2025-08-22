/**
 * Auth Store State Management Tests
 * Tests authentication state behavior with real store and services
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '../../_stores/authStore';
import { useCartStore } from '../../_stores/cartStore';
import { useFavoritesStore } from '../../_stores/favoritesStore';
import { mswServer, mswHelpers } from '../utils/msw-setup';
import { mockUser } from '../utils/mock-data';
import * as SecureStore from 'expo-secure-store';
import { http, HttpResponse } from 'msw';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock MMKV storage
const mockStorage = new Map<string, string>();
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn().mockImplementation((key: string, value: string) => mockStorage.set(key, value)),
    getString: jest.fn().mockImplementation((key: string) => mockStorage.get(key) || null),
    getNumber: jest.fn().mockImplementation((key: string) => {
      const value = mockStorage.get(key);
      return value ? Number(value) : undefined;
    }),
    getBoolean: jest.fn().mockImplementation((key: string) => {
      const value = mockStorage.get(key);
      return value ? JSON.parse(value) : undefined;
    }),
    contains: jest.fn().mockImplementation((key: string) => mockStorage.has(key)),
    delete: jest.fn().mockImplementation((key: string) => mockStorage.delete(key)),
    clearAll: jest.fn().mockImplementation(() => mockStorage.clear()),
    getAllKeys: jest.fn().mockImplementation(() => Array.from(mockStorage.keys())),
  })),
}));

// Mock auth service
jest.mock('../../_services/auth/authService', () => ({
  authService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    login: jest.fn().mockResolvedValue({
      user: mockUser,
      token: 'mock-token-123',
      needsEmailVerification: false,
    }),
    register: jest.fn().mockResolvedValue({
      user: mockUser,
      token: 'mock-token-123',
      needsEmailVerification: true,
    }),
    loginWithGoogle: jest.fn().mockResolvedValue({
      user: mockUser,
      token: 'mock-google-token-123',
      needsEmailVerification: false,
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    validateToken: jest.fn().mockResolvedValue(mockUser),
    changePassword: jest.fn().mockResolvedValue(undefined),
    updateProfilePicture: jest.fn().mockResolvedValue({
      profilePictureUrl: 'https://example.com/new-profile-pic.jpg',
    }),
    resendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    verifyEmail: jest.fn().mockResolvedValue(undefined),
    onAuthStateChanged: jest.fn(),
    getApiToken: jest.fn().mockResolvedValue('mock-token-123'),
  },
}));

// Mock deep linking
jest.mock('../../_utils/auth/deepLinking', () => ({
  initializeDeepLinking: jest.fn().mockResolvedValue(undefined),
}));

const setupTest = () => {
  mockStorage.clear();
  (SecureStore.setItemAsync as jest.Mock).mockClear();
  (SecureStore.getItemAsync as jest.Mock).mockClear();
  (SecureStore.deleteItemAsync as jest.Mock).mockClear();

  // Reset stores
  useAuthStore.getState().clearAuthData();
  useCartStore.getState().clearCart();
  useFavoritesStore.setState({ productIds: [], error: null });
};

describe('Auth Store State Management', () => {
  beforeAll(() => {
    mswHelpers.startServer();
  });

  afterAll(() => {
    mswHelpers.stopServer();
  });

  beforeEach(() => {
    setupTest();
    mswHelpers.resetHandlers();
  });

  describe('Authentication Flow State Management', () => {
    it('should handle complete login flow with state persistence', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Initial state
      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();

      // Login
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Verify state changes
      await waitFor(() => {
        expect(result.current.isLoggedIn).toBe(true);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.token).toBe('mock-token-123');
        expect(result.current.status).toBe('succeeded');
        expect(result.current.error).toBeNull();
      });

      // Verify secure storage was called
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('tifossi_auth_token', 'mock-token-123');
    });

    it('should handle registration flow with email verification state', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(result.current.isLoggedIn).toBe(true);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.status).toBe('succeeded');
      });
    });

    it('should handle logout and clear all auth state', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Login first
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(result.current.isLoggedIn).toBe(true);
      });

      // Logout
      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.isLoggedIn).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(result.current.status).toBe('idle');
        expect(result.current.error).toBeNull();
      });

      // Verify secure storage was cleared
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('tifossi_auth_token');
    });
  });

  describe('Token Persistence and Hydration', () => {
    it('should restore authentication state from stored token', async () => {
      // Mock stored token
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-token-123');

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      await waitFor(() => {
        expect(result.current.isLoggedIn).toBe(true);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.token).toBe('stored-token-123');
        expect(result.current.isInitialized).toBe(true);
      });
    });

    it('should handle invalid stored token by clearing state', async () => {
      // Mock stored token but validation fails
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('invalid-token');

      const authService = require('../../_services/auth/authService').authService;
      authService.validateToken.mockRejectedValue(new Error('Invalid token'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      await waitFor(() => {
        expect(result.current.isLoggedIn).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(result.current.status).toBe('failed');
        expect(result.current.error).toContain('Session invalid');
      });

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('tifossi_auth_token');
    });
  });

  describe('Cross-Store State Synchronization', () => {
    it('should sync cart and favorites after login', async () => {
      const cartStore = useCartStore.getState();
      const favoritesStore = useFavoritesStore.getState();

      // Mock sync methods
      const mockCartSync = jest.spyOn(cartStore, 'migrateGuestCart').mockResolvedValue();
      const mockFavoritesSync = jest.spyOn(favoritesStore, 'syncWithServer').mockResolvedValue();

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(mockCartSync).toHaveBeenCalledWith('mock-token-123');
        expect(mockFavoritesSync).toHaveBeenCalled();
      });

      mockCartSync.mockRestore();
      mockFavoritesSync.mockRestore();
    });

    it('should clear user data from all stores on logout', async () => {
      const cartStore = useCartStore.getState();
      const favoritesStore = useFavoritesStore.getState();

      const mockCartClear = jest.spyOn(cartStore, 'clearCart').mockResolvedValue();

      const { result } = renderHook(() => useAuthStore());

      // Login first
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Logout
      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(mockCartClear).toHaveBeenCalled();
        expect(favoritesStore.productIds).toEqual([]);
      });

      mockCartClear.mockRestore();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle login failure and maintain error state', async () => {
      const authService = require('../../_services/auth/authService').authService;
      authService.login.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        });
      });

      await waitFor(() => {
        expect(result.current.isLoggedIn).toBe(false);
        expect(result.current.status).toBe('failed');
        expect(result.current.error).toContain('Invalid credentials');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle network errors during auth operations', async () => {
      // Setup MSW to simulate network error
      mswServer.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.error();
        })
      );

      const authService = require('../../_services/auth/authService').authService;
      authService.login.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(result.current.status).toBe('failed');
        expect(result.current.error).toContain('Network error');
      });
    });
  });

  describe('Profile Management State', () => {
    it('should handle password change with loading states', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Login first
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Change password
      await act(async () => {
        const changePromise = result.current.changePassword({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword',
        });

        // Check loading state
        expect(result.current.isChangingPassword).toBe(true);

        await changePromise;
      });

      await waitFor(() => {
        expect(result.current.isChangingPassword).toBe(false);
        expect(result.current.status).toBe('succeeded');
      });
    });

    it('should handle profile picture update with state changes', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Login first
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Update profile picture
      await act(async () => {
        const updatePromise = result.current.updateProfilePicture('file://new-image.jpg');

        // Check loading state
        expect(result.current.isUploadingProfilePicture).toBe(true);

        await updatePromise;
      });

      await waitFor(() => {
        expect(result.current.isUploadingProfilePicture).toBe(false);
        expect(result.current.user?.profilePicture).toBe('https://example.com/new-profile-pic.jpg');
      });
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent login attempts', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Start multiple login attempts
      const loginPromises = [
        result.current.login({ email: 'test1@example.com', password: 'password123' }),
        result.current.login({ email: 'test2@example.com', password: 'password123' }),
        result.current.login({ email: 'test3@example.com', password: 'password123' }),
      ];

      await act(async () => {
        await Promise.allSettled(loginPromises);
      });

      await waitFor(() => {
        // Should end up in a consistent state
        expect(result.current.isLoggedIn).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle login followed by immediate logout', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        // Start login and logout simultaneously
        const loginPromise = result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });

        const logoutPromise = result.current.logout();

        await Promise.allSettled([loginPromise, logoutPromise]);
      });

      await waitFor(() => {
        // Should be in logged out state
        expect(result.current.isLoggedIn).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('State Persistence Scenarios', () => {
    it('should maintain state consistency across app restarts', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Login and verify state
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      const loginState = {
        isLoggedIn: result.current.isLoggedIn,
        user: result.current.user,
        token: result.current.token,
      };

      // Simulate app restart by re-initializing
      await act(async () => {
        result.current.clearAuthData();
        await result.current.initializeAuth();
      });

      await waitFor(() => {
        expect(result.current.isLoggedIn).toBe(loginState.isLoggedIn);
        expect(result.current.user).toEqual(loginState.user);
        expect(result.current.token).toBe(loginState.token);
      });
    });
  });
});
