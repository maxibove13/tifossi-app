import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
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

type ExtendedAuthState = AuthStateFromTypes & {
  sendPasswordReset: (email: string) => Promise<void>;
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
        isVerifyingEmail: false,

        initializeAuth: async () => {
          const currentState = get();
          if (currentState.isInitialized) return;

          set({ isLoading: true, status: 'loading', isLoggedIn: false, user: null, token: null });

          try {
            // Initialize authentication services and deep linking
            await Promise.all([authService.initialize(), initializeDeepLinking()]);

            // Set up Firebase auth state listener for automatic state synchronization
            authService.onAuthStateChanged((firebaseUser) => {
              const currentState = get();

              if (firebaseUser) {
                // User is signed in with Firebase, update state if needed
                if (!currentState.isLoggedIn || currentState.user?.id !== firebaseUser.id) {
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
                    .catch((_tokenError) => {
                      // Token fetch failed - user has Firebase auth but no API access
                      set({
                        error:
                          'Error al sincronizar la sesión. Por favor inicie sesión nuevamente.',
                        status: 'failed',
                      });
                    });
                }
              } else {
                // User is signed out from Firebase
                if (currentState.isLoggedIn) {
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
              } catch (tokenError) {
                // Clear invalid token and continue as logged out
                await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
                throw tokenError;
              }
            } else {
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

            // Handle email verification if needed
            if (loginResult.needsEmailVerification) {
            }
          } catch (error: any) {
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

            // Handle email verification requirement
            if (registerResult.needsEmailVerification) {
            }
          } catch (error: any) {
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

            // Handle email verification if needed for Google accounts (usually not required)
            if (loginResult.needsEmailVerification) {
            }
          } catch (error: any) {
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

        // Apple Sign-In login method
        loginWithApple: async () => {
          set({ isLoading: true, error: null, status: 'loading' });

          try {
            // Login with Apple via auth service
            const loginResult = await authService.loginWithApple();

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

            // Handle email verification if needed for Apple accounts (usually not required)
            if (loginResult.needsEmailVerification) {
            }
          } catch (error: any) {
            // Handle Apple-specific error messages in Spanish
            let appleError = 'Inicio de sesión con Apple falló. Por favor intenta de nuevo.';

            if (error.message) {
              if (error.message.includes('canceled') || error.message.includes('cancelled')) {
                appleError = 'Inicio de sesión cancelado';
              } else if (error.message.includes('not available')) {
                appleError = 'Apple Sign-In no está disponible en este dispositivo';
              } else if (
                error.message.includes('network') ||
                error.message.includes('connection')
              ) {
                appleError = 'Error de conexión. Verifica tu conexión a internet';
              } else if (error.message.includes('invalid')) {
                appleError = 'Respuesta inválida de Apple';
              }
            }

            set({
              user: null,
              token: null,
              isLoggedIn: false,
              isLoading: false,
              status: 'failed',
              error: appleError,
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
          } catch {
          } finally {
            // Clean up auth state listener to prevent memory leaks
            authService.cleanup();

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
            set({
              isChangingPassword: false,
              status: 'failed',
              error: error.message || 'Failed to change password. Please try again.',
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
            set({
              isVerifyingEmail: false,
              status: 'failed',
              error:
                error.message || 'Failed to verify email. Please check the code and try again.',
            });
            throw error;
          }
        },

        // Send password reset email
        sendPasswordReset: async (email: string) => {
          set({ isLoading: true, error: null, status: 'loading' });

          try {
            // Send password reset email via auth service
            await authService.sendPasswordResetEmail(email);

            set({
              isLoading: false,
              status: 'succeeded',
              error: null,
            });
          } catch (error: any) {
            set({
              isLoading: false,
              status: 'failed',
              error: error.message || 'Failed to send password reset email. Please try again.',
            });
            throw error;
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
            isVerifyingEmail: false,
          });
        },

        // Apple Sign-In utility methods
        isAppleSignInAvailable: async (): Promise<boolean> => {
          try {
            if (Platform.OS !== 'ios') {
              return false;
            }
            return await authService.isAppleSignInAvailable();
          } catch {
            return false;
          }
        },

        getAppleCredentialState: async (userId: string): Promise<number> => {
          try {
            if (Platform.OS !== 'ios') {
              return 0; // Default to unknown state on non-iOS
            }
            return await authService.getAppleCredentialState(userId);
          } catch {
            return 0; // Default to unknown state on error
          }
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
