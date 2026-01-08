/**
 * Deep Linking Configuration for Authentication
 *
 * Handles deep links for OAuth flows, email verification, password reset,
 * and other authentication-related actions in the Tifossi app.
 */

import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import firebaseAuthExport from '../../_services/auth/firebaseAuth';
import { setHttpClientAuthToken } from '../../_services/api/httpClient';
import { tokenManager } from './tokenManager';
const firebaseAuth = firebaseAuthExport.service;

const AUTH_TOKEN_KEY = 'tifossi_auth_token';

// Lazy import to avoid circular dependency (authStore -> deepLinkRouter -> deepLinking -> authStore)
const getAuthStore = () => require('../../_stores/authStore').useAuthStore;

// Action types for Firebase auth actions
const FIREBASE_ACTION_TYPES = {
  VERIFY_EMAIL: 'verifyEmail',
  RESET_PASSWORD: 'resetPassword',
  RECOVER_EMAIL: 'recoverEmail',
  SIGN_IN: 'signIn',
} as const;

// Deep link handling result
interface DeepLinkResult {
  handled: boolean;
  action?: string;
  success?: boolean;
  error?: string;
  redirectTo?: string;
}

class DeepLinkingService {
  private isInitialized = false;

  /**
   * Initialize deep linking service
   *
   * Note: URL listener registration and initial URL handling are done by
   * deepLinkRouter, which delegates auth links to handleAuthDeepLink().
   * This avoids duplicate processing of the same deep link.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // No listener setup here - deepLinkRouter handles all URL events
    // and delegates auth-related links to this service's handleAuthDeepLink()
    this.isInitialized = true;
  }

  /**
   * Handle authentication-related deep links
   * Public so deepLinkRouter can delegate to this
   */
  async handleAuthDeepLink(
    path: string,
    queryParams: Record<string, any>
  ): Promise<DeepLinkResult> {
    try {
      // Handle email verification
      if (path.includes('verify-email') || queryParams.mode === 'verifyEmail') {
        return await this.handleEmailVerification(queryParams);
      }

      // Handle password reset
      if (
        path.includes('password-reset') ||
        path.includes('reset-password') ||
        queryParams.mode === 'resetPassword'
      ) {
        return await this.handlePasswordReset(queryParams);
      }

      // Handle OAuth callback
      if (path.includes('oauth') || path.includes('callback')) {
        return await this.handleOAuthCallback(queryParams);
      }

      // Handle general Firebase auth actions
      if (path.includes('action') && queryParams.mode) {
        return await this.handleFirebaseAuthAction(queryParams);
      }

      return {
        handled: false,
        error: 'Unknown auth deep link pattern',
      };
    } catch (error: any) {
      return {
        handled: true,
        success: false,
        error: error.message,
        redirectTo: '/auth/login',
      };
    }
  }

  /**
   * Handle email verification deep link
   */
  private async handleEmailVerification(queryParams: Record<string, any>): Promise<DeepLinkResult> {
    try {
      const { oobCode, continueUrl: _continueUrl } = queryParams;

      if (!oobCode) {
        throw new Error('Missing verification code');
      }

      // Verify email code with Firebase
      await firebaseAuth.verifyEmailCode(oobCode);

      // Check if user is currently signed in to Firebase
      const currentUser = firebaseAuth.getCurrentAppUser();

      if (currentUser) {
        // User is signed in - mint Strapi token and update auth state
        try {
          const firebaseToken = await firebaseAuth.getIdToken(true);
          const tokens = await tokenManager.syncAfterLogin(firebaseToken, currentUser.id);

          if (tokens.strapiToken) {
            // Persist token for httpClient
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, tokens.strapiToken);
            setHttpClientAuthToken(tokens.strapiToken, 'verify-email');

            // Update auth store state (lazy import to avoid circular dependency)
            getAuthStore().setState({
              user: { ...currentUser, isEmailVerified: true },
              token: tokens.strapiToken,
              isLoggedIn: true,
              status: 'succeeded',
              error: null,
            });

            router.replace('/(tabs)/profile');

            return {
              handled: true,
              success: true,
              action: 'email-verified',
              redirectTo: '/(tabs)/profile',
            };
          }
        } catch {
          // Token minting failed - sign out and redirect to login
          await firebaseAuth.signOutUser();
          router.replace({
            pathname: '/auth/login' as any,
            params: { emailVerified: 'true', tokenError: 'true' },
          });

          return {
            handled: true,
            success: true,
            action: 'email-verified',
            redirectTo: '/auth/login',
          };
        }
      }

      // User is not signed in - redirect to login with success message
      router.replace({
        pathname: '/auth/login' as any,
        params: { emailVerified: 'true' },
      });

      return {
        handled: true,
        success: true,
        action: 'email-verified',
        redirectTo: '/auth/login',
      };
    } catch (error: any) {
      // Email verification failed - sign out unverified Firebase session to avoid stale state
      const currentUser = firebaseAuth.getCurrentAppUser();
      if (currentUser && !currentUser.isEmailVerified) {
        await firebaseAuth.signOutUser();
      }

      // Navigate to login with error message (verification-code screen doesn't exist)
      router.push({
        pathname: '/auth/login' as any,
        params: { verificationError: error.message },
      });

      return {
        handled: true,
        success: false,
        error: error.message,
        redirectTo: '/auth/login',
      };
    }
  }

  /**
   * Handle password reset deep link
   */
  private async handlePasswordReset(queryParams: Record<string, any>): Promise<DeepLinkResult> {
    try {
      const {
        oobCode,
        continueUrl: _continueUrl,
        code,
        token,
        email: emailFromParams,
      } = queryParams;
      const resetCode = oobCode || code || token;

      if (!resetCode) {
        throw new Error('Missing password reset code');
      }

      // Try to verify the password reset code to fetch associated email (best effort)
      let resolvedEmail = emailFromParams as string | undefined;
      try {
        const verifiedEmail = await firebaseAuth.verifyPasswordResetCode(resetCode);
        resolvedEmail = verifiedEmail || resolvedEmail;
      } catch {
        // If verification fails (e.g., token from backend), still allow navigation to reset screen
      }

      // Navigate to password reset screen with code
      router.push({
        pathname: '/auth/reset-password' as any,
        params: { code: resetCode, email: resolvedEmail } as any,
      });

      return {
        handled: true,
        success: true,
        action: 'password-reset-verified',
        redirectTo: '/auth/reset-password',
      };
    } catch (error: any) {
      // Navigate to error screen
      router.push({
        pathname: '/auth/login' as any,
        params: { error: error.message },
      });

      return {
        handled: true,
        success: false,
        error: error.message,
        redirectTo: '/auth/login',
      };
    }
  }

  /**
   * Handle OAuth callback deep link
   */
  private async handleOAuthCallback(queryParams: Record<string, any>): Promise<DeepLinkResult> {
    try {
      const { code, state: _state, error } = queryParams;

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code) {
        throw new Error('Missing OAuth authorization code');
      }

      // Handle OAuth callback (implementation depends on provider)
      // For now, redirect to login screen to complete the flow
      router.replace('/auth/login' as any);

      return {
        handled: true,
        success: true,
        action: 'oauth-callback',
        redirectTo: '/auth/login',
      };
    } catch (error: any) {
      router.push({
        pathname: '/auth/login' as any,
        params: { error: error.message },
      });

      return {
        handled: true,
        success: false,
        error: error.message,
        redirectTo: '/auth/login',
      };
    }
  }

  /**
   * Handle Firebase auth action deep link
   */
  private async handleFirebaseAuthAction(
    queryParams: Record<string, any>
  ): Promise<DeepLinkResult> {
    try {
      const { mode, oobCode, continueUrl } = queryParams;

      switch (mode) {
        case FIREBASE_ACTION_TYPES.VERIFY_EMAIL:
          return await this.handleEmailVerification({ oobCode, continueUrl });

        case FIREBASE_ACTION_TYPES.RESET_PASSWORD:
          return await this.handlePasswordReset({ oobCode, continueUrl });

        default:
          throw new Error(`Unknown Firebase auth action: ${mode}`);
      }
    } catch (error: any) {
      return {
        handled: true,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate deep link URL for email verification
   */
  generateEmailVerificationLink(email: string): string {
    const baseUrl = 'https://tifossi.app';
    const params = new URLSearchParams({
      email,
      action: 'verify-email',
    });

    return `${baseUrl}/auth/verify-email?${params.toString()}`;
  }

  /**
   * Generate deep link URL for password reset
   */
  generatePasswordResetLink(email: string): string {
    const baseUrl = 'https://tifossi.app';
    const params = new URLSearchParams({
      email,
      action: 'reset-password',
    });

    return `${baseUrl}/auth/password-reset?${params.toString()}`;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.isInitialized = false;
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const deepLinking = new DeepLinkingService();

// Export convenience methods
export const initializeDeepLinking = () => deepLinking.initialize();
export const generateEmailVerificationLink = (email: string) =>
  deepLinking.generateEmailVerificationLink(email);
export const generatePasswordResetLink = (email: string) =>
  deepLinking.generatePasswordResetLink(email);

// Add default export to fix router warnings
const utilityExport = {
  name: 'DeepLinking',
  version: '1.0.0',
  service: deepLinking,
};

export default utilityExport;
