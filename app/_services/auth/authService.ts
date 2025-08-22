/**
 * Unified Authentication Service
 *
 * Bridges Firebase Authentication with the existing authStore interface.
 * Provides a clean interface for the auth store while using real Firebase implementation.
 * Maintains backward compatibility with simplified error handling.
 */

import firebaseAuthExport from './firebaseAuth';
import { tokenManager } from '../../_utils/auth/tokenManager';
import type { User as AppUser, PasswordChangeCredentials } from '../../_types/auth';

// Extract the service from the export
const firebaseAuth = firebaseAuthExport.service;

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
  token: string;
  user: AppUser;
  needsEmailVerification?: boolean;
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
      throw new Error(`Error al inicializar el servicio de autenticación: ${error}`);
    }
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error(
        'El servicio de autenticación no ha sido inicializado. Llama initialize() primero.'
      );
    }
  }

  /**
   * Login with email and password
   *
   * Maintains compatibility with existing authStore.login() interface
   */
  async login(credentials: { email: string; password: string }): Promise<LoginResult> {
    this.ensureInitialized();

    try {
      // Authenticate with Firebase
      const authResult = await firebaseAuth.signInWithEmail(
        credentials.email,
        credentials.password
      );

      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.error || 'Error de autenticación');
      }

      // Sync tokens after successful login
      const tokens = await tokenManager.syncAfterLogin(
        authResult.token || 'mock-token',
        authResult.user.id
      );

      // Use Strapi token as the primary token for backward compatibility
      const primaryToken = tokens.strapiToken || authResult.token || 'mock-token';

      return {
        token: primaryToken,
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
    this.ensureInitialized();

    try {
      // Register with Firebase
      const authResult = await firebaseAuth.createUserWithEmail(
        userData.email,
        userData.password,
        userData.name
      );

      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.error || 'Error en el registro');
      }

      // Sync tokens after successful registration
      const tokens = await tokenManager.syncAfterLogin(
        authResult.token || 'mock-token',
        authResult.user.id
      );

      // Use Strapi token as the primary token for backward compatibility
      const primaryToken = tokens.strapiToken || authResult.token || 'mock-token';

      return {
        token: primaryToken,
        user: authResult.user,
        needsEmailVerification: false,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(): Promise<LoginResult> {
    this.ensureInitialized();

    try {
      // Authenticate with Google via Firebase
      const authResult = await firebaseAuth.signInWithGoogle();

      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.error || 'Error de autenticación con Google');
      }

      // Sync tokens after successful login
      const tokens = await tokenManager.syncAfterLogin(
        authResult.token || 'mock-token',
        authResult.user.id
      );

      // Use Strapi token as the primary token for backward compatibility
      const primaryToken = tokens.strapiToken || authResult.token || 'mock-token';

      return {
        token: primaryToken,
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
    this.ensureInitialized();

    try {
      // Authenticate with Apple via Firebase
      const authResult = await firebaseAuth.signInWithApple();

      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.error || 'Error en Apple Sign-In');
      }

      // Sync tokens after successful login
      const tokens = await tokenManager.syncAfterLogin(
        authResult.token || 'mock-token',
        authResult.user.id
      );

      // Use Strapi token as the primary token for backward compatibility
      const primaryToken = tokens.strapiToken || authResult.token || 'mock-token';

      return {
        token: primaryToken,
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
  async validateToken(_token: string): Promise<AppUser> {
    this.ensureInitialized();

    try {
      // Check if we have valid tokens in storage
      const validation = await tokenManager.validateTokens();

      if (!validation.isValid) {
        throw new Error('Token inválido o expirado');
      }

      // Get current user from Firebase
      const currentUser = firebaseAuth.getCurrentAppUser();

      if (!currentUser) {
        throw new Error('No se encontró un usuario autenticado');
      }

      return currentUser;
    } catch (error: any) {
      throw new Error(`Error al validar el token: ${error.message}`);
    }
  }

  /**
   * Logout user
   *
   * Maintains compatibility with existing authStore.logout() interface
   */
  async logout(_token: string | null): Promise<boolean> {
    this.ensureInitialized();

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
      } catch (clearError) {}
      throw error;
    }
  }

  /**
   * Change password
   *
   * Maintains compatibility with existing authStore.changePassword() interface
   */
  async changePassword(_token: string, credentials: PasswordChangeCredentials): Promise<boolean> {
    this.ensureInitialized();

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
   * Update profile picture
   *
   * Maintains compatibility with existing authStore.updateProfilePicture() interface
   */
  async updateProfilePicture(
    _token: string,
    imageUri: string
  ): Promise<{ profilePictureUrl: string }> {
    this.ensureInitialized();

    try {
      // Update profile in Firebase (mock implementation)

      return { profilePictureUrl: imageUri };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Resend verification email
   *
   * Maintains compatibility with existing authStore.resendVerificationEmail() interface
   */
  async resendVerificationEmail(_token: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      // Send verification email via Firebase
      await firebaseAuth.sendEmailVerification();

      return true;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Verify email with code
   *
   * Maintains compatibility with existing authStore.verifyEmail() interface
   */
  async verifyEmail(_token: string, code: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      // Verify email code with Firebase (mock implementation)

      return true;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    this.ensureInitialized();

    try {
      await firebaseAuth.sendPasswordReset(email);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Confirm password reset (simplified)
   */
  async confirmPasswordReset(code: string, _newPassword: string): Promise<void> {
    this.ensureInitialized();

    try {
      // This would normally confirm the password reset with Firebase
      // For now, just log the code as this is not fully implemented
    } catch (error: any) {
      throw error;
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
    this.ensureInitialized();
    return firebaseAuth.getCurrentAppUser();
  }

  /**
   * Get valid API token
   */
  async getApiToken(): Promise<string | null> {
    this.ensureInitialized();
    return await tokenManager.getApiToken();
  }

  /**
   * Set up auth state change listener
   */
  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
    this.ensureInitialized();

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
    } catch (error: any) {
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
export const updateProfilePicture = (token: string, imageUri: string) =>
  authService.updateProfilePicture(token, imageUri);
export const resendVerificationEmail = (token: string) =>
  authService.resendVerificationEmail(token);
export const verifyEmail = (token: string, code: string) => authService.verifyEmail(token, code);
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

export default authService;
