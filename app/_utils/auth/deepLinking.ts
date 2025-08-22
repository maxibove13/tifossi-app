/**
 * Deep Linking Configuration for Authentication
 *
 * Handles deep links for OAuth flows, email verification, password reset,
 * and other authentication-related actions in the Tifossi app.
 */

import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import firebaseAuthExport from '../../_services/auth/firebaseAuth';
import { tokenManager } from './tokenManager';
const firebaseAuth = firebaseAuthExport.service;

// Deep link URL patterns
const DEEP_LINK_PATTERNS = {
  // OAuth callback patterns
  GOOGLE_OAUTH: '/auth/google/callback',
  FIREBASE_OAUTH: '/auth/firebase/callback',

  // Email verification patterns
  EMAIL_VERIFY: '/auth/verify-email',

  // Password reset patterns
  PASSWORD_RESET: '/auth/password-reset',

  // General auth patterns
  AUTH_ACTION: '/auth/action',

  // Dynamic link patterns (Firebase Dynamic Links)
  DYNAMIC_LINK: '/link',
} as const;

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
  private linkingListener: ((url: string) => void) | null = null;

  /**
   * Initialize deep linking service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Configure Expo Linking
      this.configureLinking();

      // Set up URL event listener
      this.setupUrlListener();

      // Handle initial URL if app was opened via deep link
      await this.handleInitialUrl();

      this.isInitialized = true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Configure Expo Linking with URL scheme
   */
  private configureLinking(): void {
    const linking = {
      prefixes: [
        'tifossi://',
        'https://tifossi.app',
        'https://auth.tifossi.app',
        'exp://192.168.1.100:8081', // Development
        'exp://localhost:8081', // Development
      ],
      config: {
        screens: {
          '(auth)': {
            screens: {
              'verify-email': DEEP_LINK_PATTERNS.EMAIL_VERIFY,
              'password-reset': DEEP_LINK_PATTERNS.PASSWORD_RESET,
              'oauth-callback': DEEP_LINK_PATTERNS.GOOGLE_OAUTH,
              action: DEEP_LINK_PATTERNS.AUTH_ACTION,
            },
          },
          '(tabs)': {
            screens: {
              index: '/',
              profile: '/profile',
            },
          },
        },
      },
    };
  }

  /**
   * Set up URL event listener for incoming deep links
   */
  private setupUrlListener(): void {
    this.linkingListener = (url: string) => {
      this.handleIncomingUrl(url);
    };

    Linking.addEventListener('url', this.linkingListener as any);
  }

  /**
   * Handle initial URL when app is opened via deep link
   */
  private async handleInitialUrl(): Promise<void> {
    try {
      const initialUrl = await Linking.getInitialURL();

      if (initialUrl) {
        await this.handleIncomingUrl(initialUrl);
      }
    } catch (error) {}
  }

  /**
   * Handle incoming deep link URL
   */
  private async handleIncomingUrl(url: string): Promise<DeepLinkResult> {
    try {
      const parsedUrl = Linking.parse(url);

      const { path, queryParams } = parsedUrl;

      // Route to appropriate handler based on path
      if (path?.includes('/auth/')) {
        return await this.handleAuthDeepLink(path, queryParams || {});
      } else if (path?.includes('/link')) {
        return await this.handleDynamicLink(url, queryParams || {});
      } else {
        return await this.handleGeneralDeepLink(path, queryParams || {});
      }
    } catch (error: any) {
      return {
        handled: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle authentication-related deep links
   */
  private async handleAuthDeepLink(
    path: string,
    queryParams: Record<string, any>
  ): Promise<DeepLinkResult> {
    try {
      // Handle email verification
      if (path.includes('verify-email') || queryParams.mode === 'verifyEmail') {
        return await this.handleEmailVerification(queryParams);
      }

      // Handle password reset
      if (path.includes('password-reset') || queryParams.mode === 'resetPassword') {
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
      const { oobCode, continueUrl } = queryParams;

      if (!oobCode) {
        throw new Error('Missing verification code');
      }

      // Verify email code with Firebase
      await firebaseAuth.verifyEmailCode(oobCode);

      // Refresh tokens to get updated user data
      await tokenManager.refreshTokens();

      // Navigate to success screen or profile
      router.replace('/(tabs)/profile');

      return {
        handled: true,
        success: true,
        action: 'email-verified',
        redirectTo: '/(tabs)/profile',
      };
    } catch (error: any) {
      // Navigate to error screen with message
      router.push({
        pathname: '/auth/verification-code' as any,
        params: { error: error.message },
      });

      return {
        handled: true,
        success: false,
        error: error.message,
        redirectTo: '/auth/verification-code',
      };
    }
  }

  /**
   * Handle password reset deep link
   */
  private async handlePasswordReset(queryParams: Record<string, any>): Promise<DeepLinkResult> {
    try {
      const { oobCode, continueUrl } = queryParams;

      if (!oobCode) {
        throw new Error('Missing password reset code');
      }

      // Verify the password reset code
      const email = await firebaseAuth.verifyPasswordResetCode(oobCode);

      // Navigate to password reset screen with code
      router.push({
        pathname: '/auth/reset-password' as any,
        params: { code: oobCode, email: email } as any,
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
      const { code, state, error } = queryParams;

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
   * Handle Firebase Dynamic Links
   */
  private async handleDynamicLink(
    url: string,
    queryParams: Record<string, any>
  ): Promise<DeepLinkResult> {
    try {
      // Extract the actual deep link from the dynamic link
      const link = queryParams.link || queryParams.url;

      if (link) {
        return await this.handleIncomingUrl(link);
      }

      return {
        handled: false,
        error: 'No target link found in dynamic link',
      };
    } catch (error: any) {
      return {
        handled: true,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle general deep links (non-auth)
   */
  private async handleGeneralDeepLink(
    path: string | null,
    queryParams: Record<string, any>
  ): Promise<DeepLinkResult> {
    try {
      if (!path) {
        // Navigate to home screen
        router.replace('/' as any);
        return {
          handled: true,
          success: true,
          redirectTo: '/',
        };
      }

      // Handle specific app routes
      if (path.startsWith('/product/')) {
        const productId = path.split('/')[2];
        router.push(`/products/${productId}` as any);
        return {
          handled: true,
          success: true,
          redirectTo: `/products/${productId}`,
        };
      }

      // Default: navigate to the path if it's a valid route
      router.push(path as any);

      return {
        handled: true,
        success: true,
        redirectTo: path,
      };
    } catch (error: any) {
      // Fall back to home screen
      router.replace('/' as any);

      return {
        handled: true,
        success: false,
        error: error.message,
        redirectTo: '/',
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
    if (this.linkingListener) {
      // In newer versions of Expo/React Native, listeners are cleaned up automatically
      // or use unsubscribe pattern if available
      this.linkingListener = null;
    }

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
