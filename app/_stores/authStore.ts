import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import authService from '../_services/auth/authService';
import { initializeDeepLinkRouter as initializeDeepLinking } from '../_services/navigation/deepLinkRouter';
// Store imports removed to prevent circular dependencies
import {
  AuthState as AuthStateFromTypes,
  User as UserFromTypes,
  PasswordChangeCredentials,
} from '../_types/auth';

// Setup MMKV storage for non-sensitive auth data
const storage = new MMKV({ id: 'auth-storage' });
const mmkvStorage = createJSONStorage(() => ({
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.delete(name),
}));

const AUTH_TOKEN_KEY = 'tifossi_auth_token';

// Mock user for development toggle
const mockDevUser: UserFromTypes = {
  id: 'dev-user-123',
  name: 'Dev User',
  email: 'dev@example.com',
  profilePicture: null, // Or a mock image URL
};

type ExtendedAuthState = AuthStateFromTypes & {
  dev_toggleLogin: () => void;
  clearAuthData: () => void;
};

// Use type assertion to resolve Zustand type issues
export const useAuthStore = create<ExtendedAuthState>()(
  (persist as any)(
    (set: any, get: any) =>
      ({
        user: null,
        token: null,
        isLoggedIn: false,
        isLoading: false,
        isInitialized: false,
        status: 'idle' as const,
        error: null,
        isChangingPassword: false,
        isUploadingProfilePicture: false,
        isVerifyingEmail: false,

        initializeAuth: async () => {
          const currentState = get();
          if (currentState.isInitialized) return;

          set({ isLoading: true, status: 'loading', isLoggedIn: false, user: null, token: null });

          try {
            console.log('[Auth Store] Initializing authentication services...');

            // Initialize authentication services and deep linking
            await Promise.all([authService.initialize(), initializeDeepLinking()]);

            // Set up Firebase auth state listener for automatic state synchronization
            authService.onAuthStateChanged((firebaseUser) => {
              const currentState = get();

              if (firebaseUser) {
                // User is signed in with Firebase, update state if needed
                if (!currentState.isLoggedIn || currentState.user?.id !== firebaseUser.id) {
                  console.log('[Auth Store] Firebase auth state: user signed in, syncing...');

                  // Get API token for the current user
                  authService
                    .getApiToken()
                    .then((apiToken) => {
                      if (apiToken) {
                        set({
                          user: firebaseUser,
                          token: apiToken,
                          isLoggedIn: true,
                          status: 'succeeded',
                          error: null,
                        });
                      }
                    })
                    .catch((error) => {
                      console.warn(
                        '[Auth Store] Failed to get API token after Firebase auth change:',
                        error
                      );
                    });
                }
              } else {
                // User is signed out from Firebase
                if (currentState.isLoggedIn) {
                  console.log(
                    '[Auth Store] Firebase auth state: user signed out, clearing state...'
                  );
                  SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
                  set({
                    user: null,
                    token: null,
                    isLoggedIn: false,
                    status: 'idle',
                    error: null,
                  });
                }
              }
            });

            // Check for stored token
            const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

            if (storedToken) {
              console.log('[Auth Store] Found stored token, validating...');

              try {
                // Validate token with the unified API service
                const user = await authService.validateToken(storedToken);

                set({
                  user,
                  token: storedToken,
                  isLoggedIn: true,
                  isLoading: false,
                  isInitialized: true,
                  status: 'succeeded',
                  error: null,
                });

                // Store initialization will be handled via subscription patterns
                // This prevents circular dependencies between stores

                console.log('[Auth Store] Authentication restored successfully');
              } catch (tokenError) {
                console.warn('[Auth Store] Token validation failed:', tokenError);
                // Clear invalid token and continue as logged out
                await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
                throw tokenError;
              }
            } else {
              console.log('[Auth Store] No stored token found');
              // No token found, set logged out state
              set({
                user: null,
                token: null,
                isLoggedIn: false,
                isLoading: false,
                isInitialized: true,
                status: 'idle',
              });
            }
          } catch (error: any) {
            console.error('[Auth Store] Auth initialization failed:', error);

            // Ensure clean logged out state
            await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);

            set({
              user: null,
              token: null,
              isLoggedIn: false,
              isLoading: false,
              isInitialized: true,
              status: 'failed',
              error: error.message || 'Session invalid or expired. Please login.',
            });
          }
        },

        login: async (credentials: { email: string; password: string }) => {
          set({ isLoading: true, error: null, status: 'loading' });

          try {
            console.log('[Auth Store] Attempting login for:', credentials.email);

            // Login with the unified API service
            const loginResult = await authService.login(credentials);

            // Store the token securely
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, loginResult.token);

            set({
              user: loginResult.user,
              token: loginResult.token,
              isLoggedIn: true,
              isLoading: false,
              status: 'succeeded',
              error: null,
            });

            // Store synchronization will be handled via subscription patterns
            // This prevents circular dependencies between stores

            console.log('[Auth Store] Login successful for:', credentials.email);

            // Handle email verification if needed
            if (loginResult.needsEmailVerification) {
              console.log('[Auth Store] Email verification required');
            }
          } catch (error: any) {
            console.error('[Auth Store] Login failed:', error);

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
            console.log('[Auth Store] Attempting registration for:', userData.email);

            // Register with the unified API service
            const registerResult = await authService.register(userData);

            // Store the token securely
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, registerResult.token);

            set({
              user: registerResult.user,
              token: registerResult.token,
              isLoggedIn: true,
              isLoading: false,
              status: 'succeeded',
              error: null,
            });

            // Store synchronization will be handled via subscription patterns
            // This prevents circular dependencies between stores

            console.log('[Auth Store] Registration successful for:', userData.email);

            // Handle email verification requirement
            if (registerResult.needsEmailVerification) {
              console.log('[Auth Store] Email verification required for new user');
            }
          } catch (error: any) {
            console.error('[Auth Store] Registration failed:', error);

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

        // Google OAuth login method
        loginWithGoogle: async () => {
          set({ isLoading: true, error: null, status: 'loading' });

          try {
            console.log('[Auth Store] Attempting Google login...');

            // Login with Google via auth service (fallback to mock for development)
            const loginResult = await authService.loginWithGoogle();

            // Store the token securely
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, loginResult.token);

            set({
              user: loginResult.user,
              token: loginResult.token,
              isLoggedIn: true,
              isLoading: false,
              status: 'succeeded',
              error: null,
            });

            // Store synchronization will be handled via subscription patterns
            // This prevents circular dependencies between stores

            console.log('[Auth Store] Google login successful');

            // Handle email verification if needed for Google accounts (usually not required)
            if (loginResult.needsEmailVerification) {
              console.log('[Auth Store] Google account requires email verification');
            }
          } catch (error: any) {
            console.error('[Auth Store] Google login failed:', error);

            set({
              user: null,
              token: null,
              isLoggedIn: false,
              isLoading: false,
              status: 'failed',
              error: error.message || 'Google login failed. Please try again.',
            });
          }
        },

        logout: async () => {
          set({ isLoading: true, status: 'loading' });
          const currentState = get();
          const currentToken = currentState.token;
          try {
            if (currentToken) {
              // Logout from the API service
              await authService.logout(currentToken);
            }
          } catch (e) {
            console.error('API logout call failed (continuing local logout):', e);
          } finally {
            await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
            const currentState = get();
            if (currentState.clearAuthData && typeof currentState.clearAuthData === 'function') {
              currentState.clearAuthData();
            }
            set({
              isInitialized: true, // Still initialized, just logged out
            });

            // Store cleanup will be handled via subscription patterns
            // This prevents circular dependencies between stores
            console.log(
              '[Auth Store] User logged out, other stores will be notified via subscriptions'
            );
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
            await authService.changePassword(token, credentials);
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
            const result = await authService.updateProfilePicture(token, imageUri);
            const currentState = get();
            const currentUser = currentState.user;
            if (currentUser) {
              set({
                user: { ...currentUser, profilePicture: result.profilePictureUrl } as UserFromTypes,
                isUploadingProfilePicture: false,
                status: 'succeeded',
              });
            }
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
            await authService.resendVerificationEmail(token);
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
            await authService.verifyEmail(token, code);
            const currentState = get();
            const currentUser = currentState.user;
            if (currentUser) {
              set({
                user: { ...currentUser, isEmailVerified: true } as UserFromTypes,
                isVerifyingEmail: false,
                status: 'succeeded',
              });
            }
          } catch (error: any) {
            console.error('Email verification failed:', error);
            set({
              isVerifyingEmail: false,
              status: 'failed',
              error:
                error.message || 'Failed to verify email. Please check the code and try again.',
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

        // Clear all authentication data (for logout and error recovery)
        clearAuthData: () => {
          set({
            user: null,
            token: null,
            isLoggedIn: false,
            isLoading: false,
            status: 'idle',
            error: null,
            isChangingPassword: false,
            isUploadingProfilePicture: false,
            isVerifyingEmail: false,
          });
        },

        // Test utility methods
        setUser: (user: UserFromTypes | null) => {
          set({ user, isLoggedIn: !!user });
        },

        setToken: (token: string | null) => {
          set({ token });
        },
      }) as ExtendedAuthState,
    {
      name: 'tifossi-auth-store',
      storage: mmkvStorage as any,
      // Only persist non-sensitive data (tokens are stored in SecureStore)
      partialize: (state: any) => {
        const { isInitialized, user } = state;
        return { isInitialized, user } as any;
      },
      onRehydrateStorage: () => (state: Partial<ExtendedAuthState> | undefined) => {
        console.log('[Auth Store] Hydration completed', {
          hasUser: !!state?.user,
          isInitialized: state?.isInitialized,
        });

        // Automatically initialize auth if not already done
        if (state && !state.isInitialized && state.initializeAuth) {
          state.initializeAuth();
        }
      },
    }
  )
);

const utilityExport = {
  name: 'AuthStore',
  version: '1.0.0',
};

export default utilityExport;
