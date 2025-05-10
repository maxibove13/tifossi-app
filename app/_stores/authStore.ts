import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import mockApi from '../_services/api/mockApi';
import { User as UserTypeFromAPI } from '../_services/api/mockApi';
import { useCartStore } from './cartStore';
import { useFavoritesStore } from './favoritesStore';
import {
  AuthState as AuthStateFromTypes,
  User as UserFromTypes,
  PasswordChangeCredentials,
} from '../_types/auth';

const AUTH_TOKEN_KEY = 'tifossi_auth_token';

// Mock user for development toggle
const mockDevUser: UserFromTypes = {
  id: 'dev-user-123',
  name: 'Dev User',
  email: 'dev@example.com',
  profilePicture: null, // Or a mock image URL
};

export const useAuthStore = create<AuthStateFromTypes & { dev_toggleLogin: () => void }>()(
  (set, get) => ({
    user: null,
    token: null,
    isLoggedIn: false,
    isLoading: false,
    isInitialized: false,
    status: 'idle',
    error: null,
    isChangingPassword: false,
    isUploadingProfilePicture: false,
    isVerifyingEmail: false,

    initializeAuth: async () => {
      if (get().isInitialized) return;

      set({ isLoading: true, status: 'loading', isLoggedIn: false, user: null, token: null }); // Default to logged out at start of init
      try {
        const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        if (storedToken) {
          // For UI dev, we might even bypass token validation if a dev flag is set
          // and assume the token is valid to easily test logged-in states.
          // However, for now, we'll stick to the validation flow.
          const userFromApi: UserTypeFromAPI = await mockApi.validateToken(storedToken);
          const user: UserFromTypes = {
            id: userFromApi.id,
            name: userFromApi.name,
            email: userFromApi.email,
            profilePicture: null,
          };
          set({
            user,
            token: storedToken,
            isLoggedIn: true,
            isLoading: false,
            isInitialized: true,
            status: 'succeeded',
            error: null,
          });
          await useCartStore.getState().syncWithServer();
          await useFavoritesStore.getState().syncWithServer();
        } else {
          // No token found, ensure logged out state
          set({
            user: null,
            token: null,
            isLoggedIn: false,
            isLoading: false,
            isInitialized: true,
            status: 'idle',
          });
        }
      } catch (error) {
        console.error('Auth initialization failed, ensuring logged out state:', error);
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY); // Clear invalid token
        set({
          user: null,
          token: null,
          isLoggedIn: false,
          isLoading: false,
          isInitialized: true,
          status: 'failed',
          error: 'Session invalid or expired. Please login.', // More specific error
        });
      }
    },

    login: async (credentials: { email: string; password: string }) => {
      set({ isLoading: true, error: null, status: 'loading' });
      try {
        const { token, user: userFromApi }: { token: string; user: UserTypeFromAPI } =
          await mockApi.login(credentials);
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
        const user: UserFromTypes = {
          id: userFromApi.id,
          name: userFromApi.name,
          email: userFromApi.email,
          profilePicture: null,
        };
        set({
          user,
          token,
          isLoggedIn: true,
          isLoading: false,
          status: 'succeeded',
          error: null,
        });
        await useCartStore.getState().syncWithServer();
        await useFavoritesStore.getState().syncWithServer();
      } catch (error: any) {
        console.error('Login failed:', error);
        set({
          user: null,
          token: null,
          isLoggedIn: false,
          isLoading: false,
          status: 'failed',
          error: error.message || 'Login failed. Please try again.',
        });
      }
    },

    register: async (userData: { name: string; email: string; password: string }) => {
      set({ isLoading: true, error: null, status: 'loading' });
      try {
        const { token, user: userFromApi }: { token: string; user: UserTypeFromAPI } =
          await mockApi.register(userData);
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
        const user: UserFromTypes = {
          id: userFromApi.id,
          name: userFromApi.name,
          email: userFromApi.email,
          profilePicture: null,
        };
        set({
          user,
          token,
          isLoggedIn: true,
          isLoading: false,
          status: 'succeeded',
          error: null,
        });
        await useCartStore.getState().syncWithServer();
        await useFavoritesStore.getState().syncWithServer();
      } catch (error: any) {
        console.error('Registration failed:', error);
        set({
          user: null,
          token: null,
          isLoggedIn: false,
          isLoading: false,
          status: 'failed',
          error: error.message || 'Registration failed. Please try again.',
        });
      }
    },

    logout: async () => {
      set({ isLoading: true, status: 'loading' });
      const currentToken = get().token;
      try {
        if (currentToken) {
          // Only call logout if there was a token
          await mockApi.logout(currentToken);
        }
      } catch (e) {
        console.error('Mock logout API call failed (continuing local logout):', e);
      } finally {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        set({
          user: null,
          token: null,
          isLoggedIn: false,
          isLoading: false,
          isInitialized: true, // Still initialized, just logged out
          status: 'idle',
          error: null,
        });
        // Clear user-specific data from other stores upon logout - removed for now as methods don't exist
        // useCartStore.getState().clearCartLocal();
        // useFavoritesStore.getState().clearFavoritesLocal();
      }
    },

    // New authentication methods

    changePassword: async (credentials: PasswordChangeCredentials) => {
      const { token } = get();
      if (!token) {
        throw new Error('No authentication token found. Please login first.');
      }

      set({ isChangingPassword: true, error: null, status: 'loading' });
      try {
        await mockApi.changePassword(token, credentials);
        set({
          isChangingPassword: false,
          status: 'succeeded',
        });
      } catch (error: any) {
        console.error('Password change failed:', error);
        set({
          isChangingPassword: false,
          status: 'failed',
          error: error.message || 'Failed to change password. Please try again.',
        });
        throw error;
      }
    },

    updateProfilePicture: async (imageUri: string) => {
      const { token } = get();
      if (!token) {
        throw new Error('No authentication token found. Please login first.');
      }

      set({ isUploadingProfilePicture: true, error: null, status: 'loading' });
      try {
        const result = await mockApi.updateProfilePicture(token, imageUri);
        set({
          user: { ...get().user, profilePicture: result.profilePictureUrl } as UserFromTypes,
          isUploadingProfilePicture: false,
          status: 'succeeded',
        });
      } catch (error: any) {
        console.error('Profile picture update failed:', error);
        set({
          isUploadingProfilePicture: false,
          status: 'failed',
          error: error.message || 'Failed to update profile picture. Please try again.',
        });
        throw error;
      }
    },

    resendVerificationEmail: async () => {
      const { token } = get();
      if (!token) {
        throw new Error('No authentication token found. Please login first.');
      }

      set({ isVerifyingEmail: true, error: null, status: 'loading' });
      try {
        await mockApi.resendVerificationEmail(token);
        set({
          isVerifyingEmail: false,
          status: 'succeeded',
        });
      } catch (error: any) {
        console.error('Resend verification email failed:', error);
        set({
          isVerifyingEmail: false,
          status: 'failed',
          error: error.message || 'Failed to resend verification email. Please try again.',
        });
        throw error;
      }
    },

    verifyEmail: async (code: string) => {
      const { token } = get();
      if (!token) {
        throw new Error('No authentication token found. Please login first.');
      }

      set({ isVerifyingEmail: true, error: null, status: 'loading' });
      try {
        await mockApi.verifyEmail(token, code);
        set({
          user: { ...get().user, isEmailVerified: true } as UserFromTypes,
          isVerifyingEmail: false,
          status: 'succeeded',
        });
      } catch (error: any) {
        console.error('Email verification failed:', error);
        set({
          isVerifyingEmail: false,
          status: 'failed',
          error: error.message || 'Failed to verify email. Please check the code and try again.',
        });
        throw error;
      }
    },

    // Development only: Function to easily toggle login state
    dev_toggleLogin: () => {
      const currentState = get();
      if (currentState.isLoggedIn) {
        // Simulate logout
        SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        set({
          user: null,
          token: null,
          isLoggedIn: false,
          status: 'idle',
          error: null,
        });
        console.log('[DEV] Toggled to Logged Out');
      } else {
        // Simulate login with mock user and token
        const mockToken = 'mock-dev-token-xxxx';
        SecureStore.setItemAsync(AUTH_TOKEN_KEY, mockToken);
        set({
          user: mockDevUser,
          token: mockToken,
          isLoggedIn: true,
          status: 'succeeded',
          error: null,
        });
        console.log('[DEV] Toggled to Logged In with Dev User');
      }
    },
  })
);

const utilityExport = {
  name: 'AuthStore',
  version: '1.0.0',
};

export default utilityExport;
