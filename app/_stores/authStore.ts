import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import authService from '../_services/auth/authService';
import { setHttpClientAuthToken } from '../_services/api/httpClient';
import { initializeDeepLinkRouter as initializeDeepLinking } from '../_services/navigation/deepLinkRouter';
// Store imports removed to prevent circular dependencies
import {
  AuthState as AuthStateFromTypes,
  User as UserFromTypes,
  PasswordChangeCredentials,
} from '../_types/auth';

// Lazy-initialize MMKV to prevent crashes on real devices
// Native modules can't be instantiated during bundle evaluation
let _storage: MMKV | null = null;
const getStorage = () => {
  if (!_storage) {
    _storage = new MMKV({ id: 'auth-storage' });
  }
  return _storage;
};

const mmkvStorage = createJSONStorage(() => ({
  getItem: (name) => getStorage().getString(name) ?? null,
  setItem: (name, value) => getStorage().set(name, value),
  removeItem: (name) => getStorage().delete(name),
}));

const AUTH_TOKEN_KEY = 'tifossi_auth_token';

type ExtendedAuthState = AuthStateFromTypes & {
  sendPasswordReset: (email: string) => Promise<void>;
  clearAuthData: () => void;
  deleteAccount: (password?: string) => Promise<{ success: boolean; error?: string }>;
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

            // Report any pending orphan Firebase UIDs (crash recovery)
            authService.reportPendingOrphan().catch(() => {
              // Silently ignore - will retry on next startup
            });

            // Set up Firebase auth state listener for automatic state synchronization
            authService.onAuthStateChanged((firebaseUser) => {
              const currentState = get();

              if (firebaseUser) {
                // Don't treat unverified Firebase sessions as logged-in
                if (!firebaseUser.isEmailVerified) {
                  SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
                  setHttpClientAuthToken(null, 'auth-unverified');
                  set({
                    user: firebaseUser as UserFromTypes,
                    token: null,
                    isLoggedIn: false,
                    isLoading: false,
                    status: 'idle',
                    error: null,
                  });
                  return;
                }

                // User is signed in with Firebase, update state if needed
                if (!currentState.isLoggedIn || currentState.user?.id !== firebaseUser.id) {
                  // Get API token for the current user
                  authService
                    .getApiToken()
                    .then((apiToken) => {
                      if (apiToken) {
                        setHttpClientAuthToken(apiToken, 'auth-state-sync');
                        SecureStore.setItemAsync(AUTH_TOKEN_KEY, apiToken).catch(() => {});
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
                  setHttpClientAuthToken(null, 'auth-state-signed-out');
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
                setHttpClientAuthToken(storedToken, 'startup-restore');
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
                setHttpClientAuthToken(null, 'startup-invalid-token');
                throw tokenError;
              }
            } else {
              // No token found, set logged out state
              setHttpClientAuthToken(null, 'startup-no-token');
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
            // Clear stored token only for actual auth failures
            const message = error?.message || 'Session invalid or expired. Please login.';
            if (
              typeof message === 'string' &&
              (message.toLowerCase().includes('invalid') ||
                message.toLowerCase().includes('expired'))
            ) {
              await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
              setHttpClientAuthToken(null, 'startup-auth-failure');
            }

            set({
              user: null,
              token: null,
              isLoggedIn: false,
              isLoading: false,
              isInitialized: true,
              status: 'failed',
              error: message,
            });
          }
        },

        login: async (credentials: { email: string; password: string }) => {
          set({ isLoading: true, error: null, status: 'loading' });

          try {
            const result = await authService.login(credentials);

            if (result.needsEmailVerification) {
              // Store user for verification screen but NOT logged in
              set({
                user: result.user,
                token: null,
                isLoggedIn: false,
                isLoading: false,
                status: 'idle',
                error: null,
              });
              return { needsEmailVerification: true, user: result.user };
            }

            // Verified - persist token (result.token is guaranteed when !needsEmailVerification)
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, result.token!);
            setHttpClientAuthToken(result.token!, 'login');
            set({
              user: result.user,
              token: result.token!,
              isLoggedIn: true,
              isLoading: false,
              status: 'succeeded',
              error: null,
            });
            return { needsEmailVerification: false, user: result.user };
          } catch (error: any) {
            set({
              user: null,
              token: null,
              isLoggedIn: false,
              isLoading: false,
              status: 'failed',
              error: error.message || 'Login failed. Please try again.',
            });
            throw error;
          }
        },

        register: async (userData: { name: string; email: string; password: string }) => {
          set({ isLoading: true, error: null, status: 'loading' });

          try {
            const result = await authService.register(userData);

            if (result.needsEmailVerification) {
              // Store user for verification screen but NOT logged in
              set({
                user: result.user,
                token: null,
                isLoggedIn: false,
                isLoading: false,
                status: 'idle',
                error: null,
              });
              return { needsEmailVerification: true, user: result.user };
            }

            // Verified - persist token (result.token is guaranteed when !needsEmailVerification)
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, result.token!);
            setHttpClientAuthToken(result.token!, 'register');
            set({
              user: result.user,
              token: result.token!,
              isLoggedIn: true,
              isLoading: false,
              status: 'succeeded',
              error: null,
            });
            return { needsEmailVerification: false, user: result.user };
          } catch (error: any) {
            set({
              user: null,
              token: null,
              isLoggedIn: false,
              isLoading: false,
              status: 'failed',
              error: error.message || 'Registration failed. Please try again.',
            });
            throw error;
          }
        },

        // Google OAuth login method
        loginWithGoogle: async () => {
          set({ isLoading: true, error: null, status: 'loading' });

          try {
            const result = await authService.loginWithGoogle();

            if (result.needsEmailVerification) {
              // Store user for verification screen but NOT logged in
              set({
                user: result.user,
                token: null,
                isLoggedIn: false,
                isLoading: false,
                status: 'idle',
                error: null,
              });
              return { needsEmailVerification: true, user: result.user };
            }

            // Verified - persist token (result.token is guaranteed when !needsEmailVerification)
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, result.token!);
            setHttpClientAuthToken(result.token!, 'login-google');
            set({
              user: result.user,
              token: result.token!,
              isLoggedIn: true,
              isLoading: false,
              status: 'succeeded',
              error: null,
            });
            return { needsEmailVerification: false, user: result.user };
          } catch (error: any) {
            // Check if user cancelled - don't set error, just reset state
            const errorMessage = error.message || '';
            const isCancelled =
              errorMessage.includes('cancel') ||
              errorMessage.includes('Cancel') ||
              errorMessage.includes('cancelado') ||
              errorMessage.includes('dismissed');

            set({
              user: null,
              token: null,
              isLoggedIn: false,
              isLoading: false,
              status: isCancelled ? 'idle' : 'failed',
              error: isCancelled ? null : errorMessage || 'Google login failed. Please try again.',
            });
            throw error;
          }
        },

        // Apple Sign-In login method
        loginWithApple: async () => {
          set({ isLoading: true, error: null, status: 'loading' });

          try {
            const result = await authService.loginWithApple();

            if (result.needsEmailVerification) {
              // Store user for verification screen but NOT logged in
              set({
                user: result.user,
                token: null,
                isLoggedIn: false,
                isLoading: false,
                status: 'idle',
                error: null,
              });
              return { needsEmailVerification: true, user: result.user };
            }

            // Verified - persist token (result.token is guaranteed when !needsEmailVerification)
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, result.token!);
            setHttpClientAuthToken(result.token!, 'login-apple');
            set({
              user: result.user,
              token: result.token!,
              isLoggedIn: true,
              isLoading: false,
              status: 'succeeded',
              error: null,
            });
            return { needsEmailVerification: false, user: result.user };
          } catch (error: any) {
            const errorMessage = error.message || '';

            // Check if user cancelled - don't show error, just reset state
            const isCancelled =
              errorMessage === 'cancelled' ||
              errorMessage.includes('cancel') ||
              errorMessage.includes('Cancel') ||
              errorMessage.includes('cancelado');

            if (isCancelled) {
              set({
                user: null,
                token: null,
                isLoggedIn: false,
                isLoading: false,
                status: 'idle',
                error: null,
              });
              return { needsEmailVerification: false, user: null };
            }

            // Handle other Apple-specific error messages
            let appleError = 'Inicio de sesión con Apple falló. Por favor intenta de nuevo.';
            if (errorMessage.includes('not available')) {
              appleError = 'Apple Sign-In no está disponible en este dispositivo';
            } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
              appleError = 'Error de conexión. Verifica tu conexión a internet';
            } else if (errorMessage.includes('invalid')) {
              appleError = 'Respuesta inválida de Apple';
            }

            set({
              user: null,
              token: null,
              isLoggedIn: false,
              isLoading: false,
              status: 'failed',
              error: appleError,
            });
            throw error;
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
            setHttpClientAuthToken(null, 'logout');
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
          // Note: Does NOT require API token - uses Firebase's current user session
          // This allows unverified users to resend verification emails
          set({ isVerifyingEmail: true, error: null, status: 'loading' });
          try {
            await authService.resendVerificationEmail();
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
          // Note: Does NOT require API token - uses Firebase action code verification
          // This allows unverified users to complete email verification
          set({ isVerifyingEmail: true, error: null, status: 'loading' });
          try {
            await authService.verifyEmail(code);
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
          setHttpClientAuthToken(null, 'clear-auth-data');
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

        // Delete user account
        deleteAccount: async (password?: string) => {
          set({ isLoading: true, error: null });

          const result = await authService.deleteAccount(password);

          if (!result.success) {
            set({ isLoading: false, error: result.error });
            return result;
          }

          // Clear local auth state
          const currentState = get();
          if (currentState.clearAuthData && typeof currentState.clearAuthData === 'function') {
            currentState.clearAuthData();
          }
          await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
          setHttpClientAuthToken(null, 'delete-account');
          set({ isInitialized: true, isLoading: false });

          return { success: true };
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
          setHttpClientAuthToken(token, 'set-token');
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
      // IMPORTANT: Do NOT call initializeAuth() in onRehydrateStorage!
      // This callback runs synchronously during store creation (module load time),
      // before React Native's bridge is fully ready. Calling Firebase methods here
      // causes production crashes. Auth initialization is handled by _layout.tsx
      // after the component mounts.
    }
  )
);

const utilityExport = {
  name: 'AuthStore',
  version: '1.0.0',
};

export default utilityExport;
