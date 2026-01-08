/**
 * Unified Authentication Service
 *
 * Bridges Firebase Authentication with the existing authStore interface.
 * Provides a clean interface for the auth store while using real Firebase implementation.
 * Maintains backward compatibility with simplified error handling.
 */

import firebaseAuthExport from './firebaseAuth';
import { tokenManager } from '../../_utils/auth/tokenManager';
import { buildUrl } from '../../_config/endpoints';
import * as SecureStore from 'expo-secure-store';
import type { User as AppUser, PasswordChangeCredentials } from '../../_types/auth';

// Extract the service from the export
const firebaseAuth = firebaseAuthExport.service;

// Key for storing pending orphan deletion receipt
const PENDING_ORPHAN_KEY = 'tifossi_pending_orphan';

// Define AuthResult and RegistrationData locally since they're not exported
interface AuthResult {
  success: boolean;
  user?: AppUser;
  token?: string;
  error?: string;
  firebaseToken?: string;
  needsEmailVerification?: boolean;
}

interface RegistrationData {
  name: string;
  email: string;
  password: string;
}

// Re-export types for compatibility
export type { AppUser, PasswordChangeCredentials, AuthResult, RegistrationData };

// Authentication service result interfaces
export interface LoginResult {
  token?: string; // Optional - undefined for unverified users
  user: AppUser;
  needsEmailVerification: boolean; // Required, not optional
}

export interface ServiceHealthCheck {
  status: 'healthy' | 'degraded' | 'error';
  firebase: boolean;
  tokenManager: boolean;
  details: Record<string, any>;
}

class AuthService {
  private isInitialized = false;
  private authStateListener: (() => void) | null = null;

  /**
   * Initialize the authentication service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize Firebase Auth
      await firebaseAuth.initialize();

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize auth service: ${error}`);
    }
  }

  /**
   * Ensure service is initialized - auto-initializes if needed
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Login with email and password
   *
   * Maintains compatibility with existing authStore.login() interface
   */
  async login(credentials: { email: string; password: string }): Promise<LoginResult> {
    await this.ensureInitialized();

    try {
      // Authenticate with Firebase
      const authResult = await firebaseAuth.signInWithEmail(
        credentials.email,
        credentials.password
      );

      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      // GATE: Check verification BEFORE token minting
      if (!authResult.user.isEmailVerified) {
        return {
          user: authResult.user,
          needsEmailVerification: true,
        };
      }

      // Only mint Strapi token for verified users
      if (!authResult.token) {
        throw new Error('No Firebase token received');
      }

      const tokens = await tokenManager.syncAfterLogin(authResult.token, authResult.user.id);

      if (!tokens.strapiToken) {
        throw new Error('Token exchange failed');
      }

      return {
        token: tokens.strapiToken,
        user: authResult.user,
        needsEmailVerification: false,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Register new user
   *
   * Maintains compatibility with existing authStore.register() interface
   */
  async register(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<LoginResult> {
    await this.ensureInitialized();

    try {
      // Register with Firebase
      const authResult = await firebaseAuth.createUserWithEmail(
        userData.email,
        userData.password,
        userData.name
      );

      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.error || 'Registration failed');
      }

      // Send verification email - must succeed before returning needsEmailVerification
      const emailResult = await firebaseAuth.sendEmailVerification();
      if (!emailResult.success) {
        throw new Error(
          emailResult.error ||
            'No se pudo enviar el correo de verificación. Intenta iniciar sesión para reenviarlo.'
        );
      }

      // New users ALWAYS need verification - don't mint tokens
      return {
        user: authResult.user,
        needsEmailVerification: true,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(): Promise<LoginResult> {
    await this.ensureInitialized();

    try {
      // Authenticate with Google via Firebase
      const authResult = await firebaseAuth.signInWithGoogle();

      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.error || 'Google authentication failed');
      }

      // Google accounts are typically pre-verified, but check anyway
      if (!authResult.user.isEmailVerified) {
        return {
          user: authResult.user,
          needsEmailVerification: true,
        };
      }

      // Only mint Strapi token for verified users
      if (!authResult.token) {
        throw new Error('No Firebase token received');
      }

      const tokens = await tokenManager.syncAfterLogin(authResult.token, authResult.user.id);

      if (!tokens.strapiToken) {
        throw new Error('Token exchange failed');
      }

      return {
        token: tokens.strapiToken,
        user: authResult.user,
        needsEmailVerification: false,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Login with Apple Sign-In
   */
  async loginWithApple(): Promise<LoginResult> {
    await this.ensureInitialized();

    try {
      // Authenticate with Apple via Firebase
      const authResult = await firebaseAuth.signInWithApple();

      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.error || 'Apple Sign-In failed');
      }

      // Apple accounts are typically pre-verified, but check anyway
      if (!authResult.user.isEmailVerified) {
        return {
          user: authResult.user,
          needsEmailVerification: true,
        };
      }

      // Only mint Strapi token for verified users
      if (!authResult.token) {
        throw new Error('No Firebase token received');
      }

      const tokens = await tokenManager.syncAfterLogin(authResult.token, authResult.user.id);

      if (!tokens.strapiToken) {
        throw new Error('Token exchange failed');
      }

      return {
        token: tokens.strapiToken,
        user: authResult.user,
        needsEmailVerification: false,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Validate token and return user data
   */
  async validateToken(token: string): Promise<AppUser> {
    await this.ensureInitialized();

    if (!token) {
      throw new Error('No token provided');
    }

    // Import SecureStore for clearing tokens on failure
    const SecureStore = require('expo-secure-store');
    const AUTH_TOKEN_KEY = 'tifossi_auth_token';

    // Helper to clear ALL token storage on failure
    const clearAllTokens = async () => {
      await tokenManager.clearTokens();
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    };

    let shouldClearTokens = false;

    try {
      // Validate against Strapi backend using the PASSED token
      const { buildUrl, endpoints } = require('../../_config/endpoints');
      const response = await fetch(buildUrl(endpoints.auth.validateToken), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          shouldClearTokens = true;
          throw new Error('Invalid or expired token');
        }
        throw new Error('Unable to validate token at this time');
      }

      const data = await response.json();
      if (!data.valid || !data.user) {
        shouldClearTokens = true;
        throw new Error('Token validation failed');
      }

      // Best-effort sync tokenManager (not critical - httpClient uses SecureStore directly)
      try {
        const currentFirebaseUser = firebaseAuth.getCurrentAppUser();
        if (currentFirebaseUser) {
          const firebaseToken = await firebaseAuth.getIdToken();
          if (firebaseToken) {
            await tokenManager.storeTokens(firebaseToken, token, currentFirebaseUser.id);
          }
        }
      } catch {
        // Ignore sync errors - API calls use SecureStore, not tokenManager
      }

      return data.user as AppUser;
    } catch (error: any) {
      if (shouldClearTokens) {
        await clearAllTokens();
      }

      const message = error?.message || 'Token validation failed';
      const isNetworkError =
        typeof message === 'string' &&
        (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch'));

      if (isNetworkError && !shouldClearTokens) {
        throw new Error('Network error while validating token');
      }

      throw new Error(`Token validation failed: ${message}`);
    }
  }

  /**
   * Logout user
   *
   * Maintains compatibility with existing authStore.logout() interface
   */
  async logout(_token: string | null): Promise<boolean> {
    await this.ensureInitialized();

    try {
      // Sign out from Firebase
      await firebaseAuth.signOutUser();

      // Clear stored tokens
      await tokenManager.clearTokens();

      return true;
    } catch (error: any) {
      // Even if logout fails, we should clear local tokens
      try {
        await tokenManager.clearTokens();
      } catch {}
      throw error;
    }
  }

  /**
   * Change password
   *
   * Maintains compatibility with existing authStore.changePassword() interface
   */
  async changePassword(_token: string, credentials: PasswordChangeCredentials): Promise<boolean> {
    await this.ensureInitialized();

    try {
      // Change password in Firebase
      await firebaseAuth.changePassword(credentials);

      // Refresh tokens after password change
      await tokenManager.refreshTokens();

      return true;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Resend verification email
   *
   * Uses Firebase's current user session - no API token required.
   * This allows unverified users to request a new verification email.
   */
  async resendVerificationEmail(): Promise<boolean> {
    await this.ensureInitialized();

    // Send verification email via Firebase (uses current signed-in user)
    const result = await firebaseAuth.sendEmailVerification();

    if (!result.success) {
      throw new Error(result.error || 'Failed to send verification email');
    }

    return true;
  }

  /**
   * Verify email with action code from deep link
   *
   * Uses Firebase action code verification - no API token required.
   * Called when user clicks verification link in email.
   */
  async verifyEmail(code: string): Promise<boolean> {
    await this.ensureInitialized();

    // Apply the Firebase action code to verify the email
    await firebaseAuth.verifyEmailCode(code);

    return true;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    await this.ensureInitialized();

    const result = await firebaseAuth.sendPasswordReset(email);
    if (!result.success) {
      throw new Error(result.error || 'Failed to send password reset email');
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    await this.ensureInitialized();

    const result = await firebaseAuth.confirmPasswordReset(code, newPassword);
    if (!result.success) {
      throw new Error(result.error || 'Failed to reset password');
    }
  }

  /**
   * Check if Apple Sign-In is available (simplified)
   */
  async isAppleSignInAvailable(): Promise<boolean> {
    // Simplified implementation - let firebaseAuth handle the detailed availability check
    return true;
  }

  /**
   * Get Apple credential state (simplified)
   */
  async getAppleCredentialState(_userId: string): Promise<number> {
    // Simplified implementation - return unknown state
    // Real implementation would check with AppleAuthentication
    return 0; // UNKNOWN state
  }

  /**
   * Get current user
   */
  getCurrentUser(): AppUser | null {
    if (!this.isInitialized) {
      return null;
    }
    return firebaseAuth.getCurrentAppUser();
  }

  /**
   * Get valid API token
   */
  async getApiToken(): Promise<string | null> {
    await this.ensureInitialized();
    return await tokenManager.getStrapiToken();
  }

  /**
   * Set up auth state change listener
   */
  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
    if (!this.isInitialized) {
      // Return no-op unsubscribe function if not initialized
      return () => {};
    }

    // Clean up any existing listener before setting a new one
    if (this.authStateListener) {
      this.authStateListener();
      this.authStateListener = null;
    }

    this.authStateListener = firebaseAuth.initializeAuthStateListener(callback);
    return this.authStateListener || (() => {});
  }

  /**
   * Sync user data after login (for compatibility)
   */
  async syncUserData(): Promise<boolean> {
    try {
      // Refresh tokens to ensure they're valid
      await tokenManager.refreshTokens();

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Health check for the authentication service
   */
  async healthCheck(): Promise<ServiceHealthCheck> {
    try {
      const [firebaseHealth, tokenManagerHealth] = await Promise.all([
        Promise.resolve({ status: 'healthy' as const }),
        tokenManager.healthCheck(),
      ]);

      const isHealthy =
        firebaseHealth.status === 'healthy' && tokenManagerHealth.status === 'healthy';

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        firebase: firebaseHealth.status === 'healthy',
        tokenManager: tokenManagerHealth.status === 'healthy',
        details: {
          firebase: firebaseHealth,
          tokenManager: tokenManagerHealth,
          initialized: this.isInitialized,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        firebase: false,
        tokenManager: false,
        details: {
          error: error instanceof Error ? error.message : String(error),
          initialized: this.isInitialized,
        },
      };
    }
  }

  /**
   * Report pending orphan Firebase UID to server
   * Called on app startup and after Firebase deletion fails
   */
  async reportPendingOrphan(): Promise<void> {
    try {
      const receipt = await SecureStore.getItemAsync(PENDING_ORPHAN_KEY);
      if (!receipt) return;

      const response = await fetch(buildUrl('/api/user-profile/report-orphan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletionReceipt: receipt }),
      });

      if (response.ok || response.status === 400) {
        // Clear on success OR on 400 (expired/invalid receipt - no point retrying)
        await SecureStore.deleteItemAsync(PENDING_ORPHAN_KEY);
      }
      // On network/5xx errors, leave receipt for next attempt
    } catch {
      // Network error - leave receipt for next attempt
    }
  }

  /**
   * Delete user account
   * Handles reauthentication, Strapi data deletion, and Firebase account deletion
   */
  async deleteAccount(password?: string): Promise<{ success: boolean; error?: string }> {
    await this.ensureInitialized();

    const currentUser = firebaseAuth.getCurrentAppUser();
    if (!currentUser) {
      return { success: false, error: 'No hay usuario autenticado' };
    }

    // Get provider from metadata, or fallback to Firebase providerData at runtime
    let provider = currentUser.metadata?.provider;
    if (!provider) {
      // Stale user object - check Firebase directly
      const firebaseAuthModule = require('@react-native-firebase/auth');
      const firebaseUser = firebaseAuthModule.getAuth().currentUser;
      const providerData = firebaseUser?.providerData || [];
      if (providerData.some((p: any) => p.providerId === 'google.com')) {
        provider = 'google';
      } else if (providerData.some((p: any) => p.providerId === 'apple.com')) {
        provider = 'apple';
      } else {
        provider = 'email';
      }
    }

    // 1. Reauthenticate based on provider
    let reauthResult: { success: boolean; error?: string; authorizationCode?: string };

    switch (provider) {
      case 'email':
        if (!password) {
          return { success: false, error: 'Se requiere la contraseña' };
        }
        reauthResult = await firebaseAuth.reauthenticateWithEmail(password);
        break;
      case 'google':
        reauthResult = await firebaseAuth.reauthenticateWithGoogle();
        break;
      case 'apple':
        reauthResult = await firebaseAuth.reauthenticateWithApple();
        break;
      default:
        return { success: false, error: 'Método de autenticación no soportado' };
    }

    if (!reauthResult.success) {
      return reauthResult;
    }

    // 2. Delete Strapi data FIRST (use POST to avoid body issues with DELETE)
    try {
      const strapiToken = await tokenManager.getStrapiToken();
      const response = await fetch(buildUrl('/api/user-profile/me/delete'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${strapiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(provider === 'apple' &&
            reauthResult.authorizationCode && {
              appleAuthorizationCode: reauthResult.authorizationCode,
            }),
        }),
      });

      if (!response.ok) {
        return { success: false, error: 'Error al eliminar datos del servidor' };
      }

      const data = await response.json();
      // Server returns { success: true, deletionReceipt: '...', alreadyDeleted?: true }
      if (!data.success && !data.alreadyDeleted) {
        return { success: false, error: 'Error al eliminar datos del servidor' };
      }

      // Persist receipt immediately so we can report orphan even after crash
      const deletionReceipt = data.deletionReceipt;
      if (deletionReceipt) {
        await SecureStore.setItemAsync(PENDING_ORPHAN_KEY, deletionReceipt);
      }
    } catch {
      return { success: false, error: 'Error de conexión. Intenta nuevamente.' };
    }

    // 3. Delete Firebase account LAST (with retry)
    let deleteResult = await firebaseAuth.deleteCurrentUser();
    if (!deleteResult.success) {
      // Retry once
      await new Promise((resolve) => setTimeout(resolve, 1000));
      deleteResult = await firebaseAuth.deleteCurrentUser();
    }

    if (deleteResult.success) {
      // Firebase deleted - clear pending receipt (no orphan)
      await SecureStore.deleteItemAsync(PENDING_ORPHAN_KEY);
    } else {
      // Firebase deletion failed - report orphan
      await this.reportPendingOrphan();
    }

    // 4. Sign out from Firebase (critical: prevents orphan from auto-recreating via firebase-auth)
    // Do this regardless of whether deletion succeeded
    try {
      await firebaseAuth.signOutUser();
    } catch {
      // Ignore signOut errors
    }

    // 5. Clear ALL local storage (centralized here, not in UI)
    await tokenManager.clearTokens();

    // Clear cart and favorites stores
    try {
      const { useCartStore } = require('../../_stores/cartStore');
      const { useFavoritesStore } = require('../../_stores/favoritesStore');

      // Clear cart - use the store's clearCart method but skip server sync
      const cartStore = useCartStore.getState();
      cartStore.setItems([]); // Direct set to avoid server sync

      // Clear favorites storage
      if (useFavoritesStore.persist?.clearStorage) {
        useFavoritesStore.persist.clearStorage();
      }
    } catch {
      // Store cleanup is best-effort
    }

    return { success: true };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.authStateListener) {
      this.authStateListener();
      this.authStateListener = null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export convenience methods for backward compatibility
export const initializeAuth = () => authService.initialize();
export const login = (credentials: { email: string; password: string }) =>
  authService.login(credentials);
export const register = (userData: { name: string; email: string; password: string }) =>
  authService.register(userData);
export const loginWithGoogle = () => authService.loginWithGoogle();
export const loginWithApple = () => authService.loginWithApple();
export const validateToken = (token: string) => authService.validateToken(token);
export const logout = (token: string | null) => authService.logout(token);
export const changePassword = (token: string, credentials: PasswordChangeCredentials) =>
  authService.changePassword(token, credentials);
export const resendVerificationEmail = () => authService.resendVerificationEmail();
export const verifyEmail = (code: string) => authService.verifyEmail(code);
export const sendPasswordResetEmail = (email: string) => authService.sendPasswordResetEmail(email);
export const confirmPasswordReset = (code: string, newPassword: string) =>
  authService.confirmPasswordReset(code, newPassword);
export const syncUserData = () => authService.syncUserData();
export const getCurrentUser = () => authService.getCurrentUser();
export const getApiToken = () => authService.getApiToken();
export const onAuthStateChanged = (callback: (user: AppUser | null) => void) =>
  authService.onAuthStateChanged(callback);
export const isAppleSignInAvailable = () => authService.isAppleSignInAvailable();
export const getAppleCredentialState = (userId: string) =>
  authService.getAppleCredentialState(userId);
export const deleteAccount = (password?: string) => authService.deleteAccount(password);
export const reportPendingOrphan = () => authService.reportPendingOrphan();

export default authService;
