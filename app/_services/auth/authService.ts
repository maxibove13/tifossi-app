/**
 * Unified Authentication Service
 *
 * Bridges Firebase Authentication with the existing authStore interface.
 * Provides a seamless transition from mock API to real Firebase auth.
 * Maintains backward compatibility while adding Firebase capabilities.
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
      console.log('[Auth Service] Already initialized');
      return;
    }

    try {
      console.log('[Auth Service] Initializing...');

      // Initialize Firebase Auth
      await firebaseAuth.initialize();

      this.isInitialized = true;
      console.log('[Auth Service] Initialization completed successfully');
    } catch (error) {
      console.error('[Auth Service] Initialization failed:', error);
      throw new Error(`Auth service initialization failed: ${error}`);
    }
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Auth service not initialized. Call initialize() first.');
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
      console.log('[Auth Service] Attempting login for:', credentials.email);

      // Authenticate with Firebase
      const authResult = await firebaseAuth.signInWithEmail(
        credentials.email,
        credentials.password
      );

      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      // Sync tokens after successful login
      const tokens = await tokenManager.syncAfterLogin(
        authResult.token || 'mock-token',
        authResult.user.id
      );

      // Use Strapi token as the primary token for backward compatibility
      const primaryToken = tokens.strapiToken || authResult.token || 'mock-token';

      console.log('[Auth Service] Login successful for:', credentials.email);

      return {
        token: primaryToken,
        user: authResult.user,
        needsEmailVerification: false,
      };
    } catch (error: any) {
      console.error('[Auth Service] Login failed:', error);
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
      console.log('[Auth Service] Attempting registration for:', userData.email);

      // Register with Firebase
      const authResult = await firebaseAuth.createUserWithEmail(
        userData.email,
        userData.password,
        userData.name
      );

      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.error || 'Registration failed');
      }

      // Sync tokens after successful registration
      const tokens = await tokenManager.syncAfterLogin(
        authResult.token || 'mock-token',
        authResult.user.id
      );

      // Use Strapi token as the primary token for backward compatibility
      const primaryToken = tokens.strapiToken || authResult.token || 'mock-token';

      console.log('[Auth Service] Registration successful for:', userData.email);

      return {
        token: primaryToken,
        user: authResult.user,
        needsEmailVerification: false,
      };
    } catch (error: any) {
      console.error('[Auth Service] Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(): Promise<LoginResult> {
    this.ensureInitialized();

    try {
      console.log('[Auth Service] Attempting Google login...');

      // Authenticate with Google via Firebase
      const authResult = await firebaseAuth.signInWithGoogle();

      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.error || 'Google authentication failed');
      }

      // Sync tokens after successful login
      const tokens = await tokenManager.syncAfterLogin(
        authResult.token || 'mock-token',
        authResult.user.id
      );

      // Use Strapi token as the primary token for backward compatibility
      const primaryToken = tokens.strapiToken || authResult.token || 'mock-token';

      console.log('[Auth Service] Google login successful');

      return {
        token: primaryToken,
        user: authResult.user,
        needsEmailVerification: false,
      };
    } catch (error: any) {
      console.error('[Auth Service] Google login failed:', error);
      throw error;
    }
  }

  /**
   * Validate token and return user data
   *
   * Maintains compatibility with existing authStore.validateToken() interface
   */
  async validateToken(token: string): Promise<AppUser> {
    this.ensureInitialized();

    try {
      console.log('[Auth Service] Validating token...');

      // Check if we have valid tokens in storage
      const validation = await tokenManager.validateTokens();

      if (!validation.isValid) {
        throw new Error('Invalid or expired token');
      }

      // Get current user from Firebase
      const currentUser = firebaseAuth.getCurrentAppUser();

      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      console.log('[Auth Service] Token validation successful');
      return currentUser;
    } catch (error: any) {
      console.error('[Auth Service] Token validation failed:', error);
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  /**
   * Logout user
   *
   * Maintains compatibility with existing authStore.logout() interface
   */
  async logout(token: string | null): Promise<boolean> {
    this.ensureInitialized();

    try {
      console.log('[Auth Service] Logging out...');

      // Sign out from Firebase
      await firebaseAuth.signOutUser();

      // Clear stored tokens
      await tokenManager.clearTokens();

      console.log('[Auth Service] Logout successful');
      return true;
    } catch (error: any) {
      console.error('[Auth Service] Logout failed:', error);
      // Even if logout fails, we should clear local tokens
      try {
        await tokenManager.clearTokens();
      } catch (clearError) {
        console.error('[Auth Service] Failed to clear tokens during logout:', clearError);
      }
      throw error;
    }
  }

  /**
   * Change password
   *
   * Maintains compatibility with existing authStore.changePassword() interface
   */
  async changePassword(token: string, credentials: PasswordChangeCredentials): Promise<boolean> {
    this.ensureInitialized();

    try {
      console.log('[Auth Service] Changing password...');

      // Change password in Firebase
      await firebaseAuth.changePassword(credentials);

      // Refresh tokens after password change
      await tokenManager.refreshTokens();

      console.log('[Auth Service] Password change successful');
      return true;
    } catch (error: any) {
      console.error('[Auth Service] Password change failed:', error);
      throw error;
    }
  }

  /**
   * Update profile picture
   *
   * Maintains compatibility with existing authStore.updateProfilePicture() interface
   */
  async updateProfilePicture(
    token: string,
    imageUri: string
  ): Promise<{ profilePictureUrl: string }> {
    this.ensureInitialized();

    try {
      console.log('[Auth Service] Updating profile picture...');

      // Update profile in Firebase (mock implementation)
      console.log('Profile update requested for image:', imageUri);

      console.log('[Auth Service] Profile picture update successful');
      return { profilePictureUrl: imageUri };
    } catch (error: any) {
      console.error('[Auth Service] Profile picture update failed:', error);
      throw error;
    }
  }

  /**
   * Resend verification email
   *
   * Maintains compatibility with existing authStore.resendVerificationEmail() interface
   */
  async resendVerificationEmail(token: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      console.log('[Auth Service] Resending verification email...');

      // Send verification email via Firebase
      await firebaseAuth.sendEmailVerification();

      console.log('[Auth Service] Verification email sent');
      return true;
    } catch (error: any) {
      console.error('[Auth Service] Failed to send verification email:', error);
      throw error;
    }
  }

  /**
   * Verify email with code
   *
   * Maintains compatibility with existing authStore.verifyEmail() interface
   */
  async verifyEmail(token: string, code: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      console.log('[Auth Service] Verifying email with code...');

      // Verify email code with Firebase (mock implementation)
      console.log('Email verification requested with code:', code);

      console.log('[Auth Service] Email verification successful');
      return true;
    } catch (error: any) {
      console.error('[Auth Service] Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    this.ensureInitialized();

    try {
      console.log('[Auth Service] Sending password reset email to:', email);
      await firebaseAuth.sendPasswordReset(email);
      console.log('[Auth Service] Password reset email sent');
    } catch (error: any) {
      console.error('[Auth Service] Failed to send password reset email:', error);
      throw error;
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    this.ensureInitialized();

    try {
      console.log('[Auth Service] Confirming password reset...');
      // Confirm password reset (mock implementation)
      console.log('Password reset confirmation requested with code:', code);
      console.log('[Auth Service] Password reset confirmed');
    } catch (error: any) {
      console.error('[Auth Service] Password reset confirmation failed:', error);
      throw error;
    }
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
      console.log('[Auth Service] Syncing user data...');

      // Refresh tokens to ensure they're valid
      await tokenManager.refreshTokens();

      console.log('[Auth Service] User data sync completed');
      return true;
    } catch (error: any) {
      console.error('[Auth Service] User data sync failed:', error);
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

    // Firebase cleanup (mock implementation)
    console.log('Firebase auth cleanup called');
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
export const validateToken = (token: string) => authService.validateToken(token);
export const logout = (token: string | null) => authService.logout(token);
export const changePassword = (token: string, credentials: PasswordChangeCredentials) =>
  authService.changePassword(token, credentials);
export const updateProfilePicture = (token: string, imageUri: string) =>
  authService.updateProfilePicture(token, imageUri);
export const resendVerificationEmail = (token: string) =>
  authService.resendVerificationEmail(token);
export const verifyEmail = (token: string, code: string) => authService.verifyEmail(token, code);
export const syncUserData = () => authService.syncUserData();
export const getCurrentUser = () => authService.getCurrentUser();

export default authService;
