/**
 * Unified Deep Link Router Service for Tifossi Expo
 *
 * Handles all deep link routing including:
 * - Payment callbacks (MercadoPago)
 * - Product navigation
 * - Category navigation
 * - Cart navigation
 * - Profile navigation
 * - Authentication flows
 */

import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { deepLinking as authDeepLinking } from '../../_utils/auth/deepLinking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Deep link route patterns
export const DEEP_LINK_ROUTES = {
  // Product routes
  PRODUCT: '/product',
  PRODUCT_DETAIL: '/product/[id]',

  // Category routes
  CATEGORY: '/category',
  CATEGORY_DETAIL: '/category/[slug]',

  // App navigation routes
  CART: '/cart',
  PROFILE: '/profile',
  HOME: '/',

  // Auth routes (handled by existing auth deep linking)
  AUTH_BASE: '/auth',

  // Apple Sign-In callback patterns
  APPLE_AUTH_CALLBACK: '/auth/apple/callback',
  APPLE_AUTH_SUCCESS: '/auth/apple/success',
  APPLE_AUTH_ERROR: '/auth/apple/error',
  APPLE_AUTH_LINK: '/auth/apple/link',
} as const;

// Apple Sign-In callback patterns
const APPLE_AUTH_PATTERNS = {
  callback: /^tifossi:\/\/auth\/apple\/callback/,
  success: /^tifossi:\/\/auth\/apple\/success/,
  error: /^tifossi:\/\/auth\/apple\/error/,
  link: /^tifossi:\/\/auth\/apple\/link/,
};

// Apple authentication constants
const APPLE_AUTH_TIMEOUT = 60000; // 60 seconds
const APPLE_AUTH_STATE_KEY = 'apple_auth_state';
const APPLE_AUTH_PENDING_KEY = 'apple_auth_pending';

// Apple auth state management
export const appleAuthState = {
  /**
   * Save authentication state before external redirect
   */
  saveAuthState: async (state: any): Promise<void> => {
    try {
      const stateData = {
        ...state,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(APPLE_AUTH_STATE_KEY, JSON.stringify(stateData));
    } catch {}
  },

  /**
   * Restore authentication state after returning from external app
   */
  restoreAuthState: async (): Promise<any | null> => {
    try {
      const stateData = await AsyncStorage.getItem(APPLE_AUTH_STATE_KEY);
      if (stateData) {
        const parsed = JSON.parse(stateData);
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Clear saved authentication state
   */
  clearAuthState: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(APPLE_AUTH_STATE_KEY);
    } catch {}
  },

  /**
   * Save pending Apple auth session info
   */
  savePendingAppleAuth: async (sessionData: any): Promise<void> => {
    try {
      const pendingData = {
        ...sessionData,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(APPLE_AUTH_PENDING_KEY, JSON.stringify(pendingData));
    } catch {}
  },

  /**
   * Get pending Apple auth session info
   */
  getPendingAppleAuth: async (): Promise<any | null> => {
    try {
      const pendingData = await AsyncStorage.getItem(APPLE_AUTH_PENDING_KEY);
      if (pendingData) {
        const parsed = JSON.parse(pendingData);

        // Check if session hasn't expired (within timeout period)
        const isExpired = Date.now() - parsed.timestamp > APPLE_AUTH_TIMEOUT;
        if (isExpired) {
          await appleAuthState.clearPendingAppleAuth();
          return null;
        }

        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Clear pending Apple auth session info
   */
  clearPendingAppleAuth: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(APPLE_AUTH_PENDING_KEY);
    } catch {}
  },
};

// Linking configuration for Expo Router
export const linkingConfig = {
  prefixes: [
    'tifossi://',
    'https://tifossi.app',
    'https://auth.tifossi.app',
    'https://pay.tifossi.app',
    // Development prefixes
    'exp://192.168.1.100:8081',
    'exp://localhost:8081',
  ],
  config: {
    screens: {
      // Root level
      index: '/',

      // Tab navigation
      '(tabs)': {
        screens: {
          index: '/home',
          cart: '/cart',
          profile: '/profile',
          tiffosiExplore: '/explore',
          favorites: '/favorites',
        },
      },

      // Authentication
      '(auth)': {
        screens: {
          login: '/auth/login',
          signup: '/auth/signup',
          'forgot-password': '/auth/forgot-password',
          'reset-password': '/auth/reset-password',
          'verify-email': '/auth/verify-email',
          'verification-code': '/auth/verification-code',
          'verify-success': '/auth/verify-success',
          // Apple Sign-In callback routes
          'apple-callback': '/auth/apple/callback',
          'apple-success': '/auth/apple/success',
          'apple-error': '/auth/apple/error',
          'apple-link': '/auth/apple/link',
        },
      },

      // Products
      products: {
        screens: {
          product: '/product',
          '[id]': '/product/[id]',
        },
      },

      // Categories
      catalog: {
        screens: {
          index: '/catalog',
          '[slug]': '/category/[slug]',
        },
      },

      // Locations
      locations: {
        screens: {
          '[cityId]': {
            screens: {
              index: '/locations/[cityId]',
              '[zoneId]': '/locations/[cityId]/[zoneId]',
            },
          },
        },
      },

      // Checkout
      checkout: {
        screens: {
          'payment-result': '/checkout/payment-result',
          'payment-selection': '/checkout/payment',
          'shipping-address': '/checkout/shipping',
          'store-selection': '/checkout/store',
        },
      },

      // Legal
      legal: {
        screens: {
          terms: '/legal/terms',
          privacy: '/legal/privacy',
        },
      },
    },
  },
};

export interface DeepLinkResult {
  handled: boolean;
  success?: boolean;
  route?: string;
  params?: Record<string, any>;
  error?: string;
}

// Known Firebase Dynamic Link domains - add your page.link domain here
const FIREBASE_DYNAMIC_LINK_HOSTS = ['tifossi.page.link', 'page.link'];

// App domains that can appear inside Firebase Dynamic Link payloads
const APP_LINK_HOSTS = ['tifossi.app', 'auth.tifossi.app'];

class DeepLinkRouter {
  private isInitialized = false;
  private linkingListener: ((event: { url: string }) => void) | null = null;
  private processingUrls = new Set<string>(); // Guard against infinite recursion

  /**
   * Initialize the deep link router
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize auth deep linking
      await authDeepLinking.initialize();

      // Set up URL listener
      this.setupUrlListener();

      // Handle initial URL if app was opened via deep link
      await this.handleInitialUrl();

      this.isInitialized = true;
    } catch (_error) {
      throw _error;
    }
  }

  /**
   * Set up URL event listener
   */
  private setupUrlListener(): void {
    this.linkingListener = ({ url }) => {
      this.handleDeepLink(url);
    };

    Linking.addEventListener('url', this.linkingListener);
  }

  /**
   * Handle initial URL when app is opened via deep link
   */
  private async handleInitialUrl(): Promise<void> {
    try {
      const initialUrl = await Linking.getInitialURL();

      if (initialUrl) {
        await this.handleDeepLink(initialUrl);
      }
    } catch {}
  }

  /**
   * Main deep link handler - routes to appropriate handler
   */
  async handleDeepLink(url: string): Promise<DeepLinkResult> {
    // Guard against infinite recursion
    if (this.processingUrls.has(url)) {
      return { handled: false, error: 'Recursive deep link detected' };
    }

    this.processingUrls.add(url);
    try {
      // Parse URL using URL constructor instead of Linking.parse
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const queryParams: Record<string, any> = {};

      // Convert URLSearchParams to Record<string, any>
      urlObj.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });

      // Handle Firebase Dynamic Links - unwrap the inner link parameter
      // Only unwrap if: host is a known Firebase Dynamic Link domain, OR
      // the link param points to one of our app domains
      if (queryParams.link) {
        const host = urlObj.hostname;
        const isFirebaseDynamicLinkHost = FIREBASE_DYNAMIC_LINK_HOSTS.some(
          (h) => host === h || host.endsWith('.' + h)
        );

        if (isFirebaseDynamicLinkHost) {
          const innerUrl = decodeURIComponent(queryParams.link);
          return await this.handleDeepLink(innerUrl);
        }

        // Also unwrap if the link param points to our app domains (custom domain setup)
        try {
          const innerUrl = decodeURIComponent(queryParams.link);
          const innerHost = new URL(innerUrl).hostname;
          const isAppLink = APP_LINK_HOSTS.some(
            (h) => innerHost === h || innerHost.endsWith('.' + h)
          );
          if (isAppLink) {
            return await this.handleDeepLink(innerUrl);
          }
        } catch {
          // Invalid URL in link param, continue with normal routing
        }
      }

      if (!path) {
        // Navigate to home for empty paths
        router.replace('/' as any);
        return { handled: true, success: true, route: '/(tabs)/' };
      }

      // Route to appropriate handler based on path
      // Note: Payment deep links now route directly to /checkout/payment-result via expo-router
      if (path.includes('/product/')) {
        return await this.handleProductDeepLink(path, queryParams || {});
      } else if (path.includes('/category/')) {
        return await this.handleCategoryDeepLink(path, queryParams || {});
      } else if (path.includes('/auth/')) {
        // Check if this is an Apple auth callback
        if (path.includes('/auth/apple/')) {
          return await this.handleAppleAuthDeepLink(url, path, queryParams || {});
        }
        // Delegate to general auth deep linking service for password reset, email verify, etc.
        return await authDeepLinking.handleAuthDeepLink(path, queryParams || {});
      } else {
        return await this.handleAppNavigationDeepLink(path, queryParams || {});
      }
    } catch (error: any) {
      return {
        handled: false,
        error: error.message,
      };
    } finally {
      this.processingUrls.delete(url);
    }
  }

  /**
   * Handle product deep links
   */
  private async handleProductDeepLink(
    path: string,
    queryParams: Record<string, any>
  ): Promise<DeepLinkResult> {
    try {
      // Extract product ID from path
      // Expected format: /product/{id}
      const pathParts = path.split('/');
      const productId = pathParts[pathParts.length - 1];

      if (!productId || productId === 'product') {
        // Navigate to catalog if no specific product ID
        router.push('/catalog');
        return { handled: true, success: true, route: '/catalog' };
      }

      // Navigate to product detail screen
      router.push({
        pathname: '/products/[id]' as any,
        params: { id: productId, ...queryParams },
      });

      return {
        handled: true,
        success: true,
        route: '/products/[id]',
        params: { id: productId, ...queryParams },
      };
    } catch (error: any) {
      // Fall back to catalog
      router.push('/catalog');

      return {
        handled: true,
        success: false,
        error: error.message,
        route: '/catalog',
      };
    }
  }

  /**
   * Handle category deep links
   */
  private async handleCategoryDeepLink(
    path: string,
    queryParams: Record<string, any>
  ): Promise<DeepLinkResult> {
    try {
      // Extract category slug from path
      // Expected format: /category/{slug}
      const pathParts = path.split('/');
      const categorySlug = pathParts[pathParts.length - 1];

      if (!categorySlug || categorySlug === 'category') {
        // Navigate to catalog if no specific category
        router.push('/catalog');
        return { handled: true, success: true, route: '/catalog' };
      }

      // Navigate to catalog with category filter
      router.push({
        pathname: '/catalog',
        params: { category: categorySlug, ...queryParams },
      });

      return {
        handled: true,
        success: true,
        route: '/catalog',
        params: { category: categorySlug, ...queryParams },
      };
    } catch (error: any) {
      // Fall back to catalog
      router.push('/catalog');

      return {
        handled: true,
        success: false,
        error: error.message,
        route: '/catalog',
      };
    }
  }

  /**
   * Handle Apple Sign-In deep links and OAuth callbacks
   */
  private async handleAppleAuthDeepLink(
    url: string,
    path: string,
    queryParams: Record<string, any>
  ): Promise<DeepLinkResult> {
    try {
      // Validate URL is from Apple
      if (!this.validateAppleAuthURL(url)) {
        throw new Error('Invalid Apple authentication URL');
      }

      // Handle different Apple auth callback types
      if (path.includes('/callback')) {
        return await this.handleAppleAuthCallback(url, queryParams);
      } else if (path.includes('/success')) {
        return await this.handleAppleAuthSuccess(queryParams);
      } else if (path.includes('/error')) {
        return await this.handleAppleAuthError(queryParams);
      } else if (path.includes('/link')) {
        return await this.handleAppleAuthLink(queryParams);
      }

      // Unknown Apple auth path
      throw new Error(`Unknown Apple auth path: ${path}`);
    } catch (error: any) {
      // Navigate to login with error
      router.push({
        pathname: '/auth/login' as any,
        params: {
          error: 'apple-signin-failed',
          message: error.message,
        },
      });

      return {
        handled: true,
        success: false,
        error: error.message,
        route: '/auth/login',
      };
    }
  }

  /**
   * Handle Apple OAuth callback with authorization code
   */
  private async handleAppleAuthCallback(
    url: string,
    params: Record<string, any>
  ): Promise<DeepLinkResult> {
    try {
      // Parse OAuth response parameters
      const { code, state, error } = params;

      if (error) {
        // Handle OAuth error callback
        return await this.handleAppleAuthError({ error, state });
      }

      if (code) {
        // Authorization code flow - complete sign-in
        await this.completeAppleSignIn(code, state);

        // Clear any pending auth state
        await appleAuthState.clearPendingAppleAuth();

        // Navigate to success or intended destination
        const successRoute = await this.navigateAfterAppleAuth(params);

        return {
          handled: true,
          success: true,
          route: successRoute,
          params: { appleAuth: 'completed' },
        };
      }

      // If no code and no error, this might be a malformed callback
      throw new Error('Apple callback missing authorization code');
    } catch (error: any) {
      return await this.handleAppleAuthError({ error: error.message });
    }
  }

  /**
   * Handle Apple auth success callback
   */
  private async handleAppleAuthSuccess(params: Record<string, any>): Promise<DeepLinkResult> {
    try {
      // Recover any pending auth session
      await this.recoverAppleAuthSession();

      // Navigate to appropriate screen
      const targetRoute = params.redirect || '/(tabs)/';

      router.replace({
        pathname: targetRoute as any,
        params: { appleAuth: 'success', ...params },
      });

      return {
        handled: true,
        success: true,
        route: targetRoute,
        params,
      };
    } catch (error: any) {
      return await this.handleAppleAuthError({ error: error.message });
    }
  }

  /**
   * Handle Apple auth error callback
   */
  private async handleAppleAuthError(params: Record<string, any>): Promise<DeepLinkResult> {
    try {
      const errorMessage = params.error || 'Apple Sign-In failed';

      // Clear any pending auth state
      await appleAuthState.clearPendingAppleAuth();
      await appleAuthState.clearAuthState();

      // Navigate to login with error
      router.push({
        pathname: '/auth/login' as any,
        params: {
          error: 'apple-signin-error',
          message: this.getLocalizedAppleError(errorMessage),
        },
      });

      return {
        handled: true,
        success: false,
        error: errorMessage,
        route: '/auth/login',
      };
    } catch (error: any) {
      // Fallback to login screen
      router.replace('/auth/login' as any);

      return {
        handled: true,
        success: false,
        error: error.message,
        route: '/auth/login',
      };
    }
  }

  /**
   * Handle Apple universal link callback
   */
  private async handleAppleAuthLink(params: Record<string, any>): Promise<DeepLinkResult> {
    try {
      // Extract the actual target from the link parameter
      const targetUrl = params.link || params.url;

      if (targetUrl) {
        // Process the target URL recursively
        return await this.handleDeepLink(targetUrl);
      }

      // No target URL, navigate to home
      router.replace('/(tabs)/' as any);

      return {
        handled: true,
        success: true,
        route: '/(tabs)/',
      };
    } catch (error: any) {
      return await this.handleAppleAuthError({ error: error.message });
    }
  }

  /**
   * Complete Apple Sign-In with authorization code
   */
  private async completeAppleSignIn(_code: string, _state?: string): Promise<void> {
    try {
      // Here you would typically:
      // 1. Exchange the authorization code for tokens with your backend
      // 2. Verify the state parameter if you're using one
      // 3. Create or update the user session
      // For now, we'll log and delegate to the auth service
      // The actual implementation would depend on your backend API
      // This is a placeholder for the integration
    } catch (_error) {
      throw _error;
    }
  }

  /**
   * Navigate to appropriate screen after Apple authentication
   */
  private async navigateAfterAppleAuth(params: Record<string, any>): Promise<string> {
    try {
      // Check for intended destination in saved state
      const savedState = await appleAuthState.restoreAuthState();

      if (savedState?.redirectTo) {
        const targetRoute = savedState.redirectTo;

        router.replace({
          pathname: targetRoute as any,
          params: { appleAuth: 'completed', ...params },
        });

        return targetRoute;
      }

      // Default to home screen
      const defaultRoute = '/(tabs)/';
      router.replace({
        pathname: defaultRoute as any,
        params: { appleAuth: 'completed' },
      });

      return defaultRoute;
    } catch {
      // Fallback to home
      const fallbackRoute = '/(tabs)/';
      router.replace(fallbackRoute as any);
      return fallbackRoute;
    }
  }

  /**
   * Recover Apple auth session after app switch
   */
  private async recoverAppleAuthSession(): Promise<void> {
    try {
      // Check for pending Apple auth session
      const pendingSession = await appleAuthState.getPendingAppleAuth();

      if (pendingSession) {
        // Resume authentication process
        await this.resumeAppleAuth(pendingSession);

        // Clear pending session
        await appleAuthState.clearPendingAppleAuth();
      }
    } catch {}
  }

  /**
   * Resume Apple authentication process
   */
  private async resumeAppleAuth(_sessionData: any): Promise<void> {
    try {
      // The implementation here would depend on your specific auth flow
      // This might involve re-validating tokens, checking session state, etc.
    } catch (_error) {
      throw _error;
    }
  }

  /**
   * Validate Apple authentication URL
   */
  private validateAppleAuthURL(url: string): boolean {
    try {
      // Validate URL structure
      new URL(url);

      // Check if URL matches expected Apple auth patterns
      const isValidPattern = Object.values(APPLE_AUTH_PATTERNS).some((pattern) =>
        pattern.test(url)
      );

      if (!isValidPattern) {
        return false;
      }

      // Additional validation could include:
      // - Checking domain whitelist
      // - Validating signature if provided
      // - Verifying state parameter

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get localized error message for Apple auth errors
   */
  private getLocalizedAppleError(error: string): string {
    const errorMessages: Record<string, string> = {
      user_canceled: 'Inicio de sesión con Apple cancelado por el usuario',
      invalid_request: 'Solicitud de Apple Sign-In inválida',
      invalid_client: 'Configuración de Apple Sign-In incorrecta',
      invalid_grant: 'Código de autorización de Apple inválido o expirado',
      unsupported_response_type: 'Tipo de respuesta no soportado por Apple',
      invalid_scope: 'Permisos solicitados inválidos',
      server_error: 'Error del servidor de Apple',
      temporarily_unavailable: 'Apple Sign-In temporalmente no disponible',
    };

    return errorMessages[error] || `Error de Apple Sign-In: ${error}`;
  }

  /**
   * Start authentication timeout for Apple Sign-In
   */
  private startAppleAuthTimeout(): NodeJS.Timeout {
    return setTimeout(async () => {
      try {
        // Cancel pending auth
        await this.cancelPendingAppleAuth();

        // Show timeout error
        this.showAppleAuthError(
          'La autenticación con Apple ha expirado. Por favor, intenta nuevamente.'
        );
      } catch {}
    }, APPLE_AUTH_TIMEOUT);
  }

  /**
   * Cancel pending Apple authentication
   */
  private async cancelPendingAppleAuth(): Promise<void> {
    try {
      await appleAuthState.clearPendingAppleAuth();
      await appleAuthState.clearAuthState();
    } catch {}
  }

  /**
   * Show Apple auth error to user
   */
  private showAppleAuthError(message: string): void {
    // Navigate to login with error message
    router.push({
      pathname: '/auth/login' as any,
      params: {
        error: 'apple-signin-timeout',
        message,
      },
    });
  }

  /**
   * Handle app lifecycle changes during Apple auth
   */
  async handleAppStateChange(appState: string): Promise<void> {
    if (appState === 'active') {
      // App became active, check for pending Apple auth recovery
      await this.recoverAppleAuthSession();
    }
  }

  /**
   * Handle app navigation deep links
   */
  private async handleAppNavigationDeepLink(
    path: string,
    queryParams: Record<string, any>
  ): Promise<DeepLinkResult> {
    try {
      const routes: Record<string, string> = {
        '/cart': '/(tabs)/cart',
        '/profile': '/(tabs)/profile',
        '/home': '/(tabs)/',
        '/': '/(tabs)/',
        '/explore': '/(tabs)/tiffosiExplore',
        '/favorites': '/(tabs)/favorites',
      };

      const targetRoute = routes[path] || path;

      // Navigate to the specified route
      if (Object.keys(queryParams).length > 0) {
        router.push({
          pathname: targetRoute as any,
          params: queryParams,
        });
      } else {
        router.push(targetRoute as any);
      }

      return {
        handled: true,
        success: true,
        route: targetRoute,
        params: queryParams,
      };
    } catch (error: any) {
      // Fall back to home
      router.replace('/' as any);

      return {
        handled: true,
        success: false,
        error: error.message,
        route: '/(tabs)/',
      };
    }
  }

  /**
   * Generate deep link URL for a route
   */
  generateDeepLink(route: string, params?: Record<string, any>): string {
    const baseUrl = 'tifossi://';
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return `${baseUrl}${route.startsWith('/') ? route.slice(1) : route}${query}`;
  }

  /**
   * Generate web deep link URL for a route
   */
  generateWebDeepLink(route: string, params?: Record<string, any>): string {
    const baseUrl = 'https://tifossi.app';
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return `${baseUrl}${route}${query}`;
  }

  /**
   * Test deep link (development only)
   */
  async testDeepLink(route: string, params?: Record<string, any>): Promise<void> {
    const testUrl = this.generateDeepLink(route, params);
    await this.handleDeepLink(testUrl);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.linkingListener) {
      // Note: Linking.removeEventListener is deprecated in favor of subscription pattern
      // The event listener will be cleaned up automatically when the component unmounts
      this.linkingListener = null;
    }

    // Clean up auth deep linking
    authDeepLinking.cleanup();

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
export const deepLinkRouter = new DeepLinkRouter();

// Export convenience functions
export const initializeDeepLinkRouter = () => deepLinkRouter.initialize();
export const generateDeepLink = (route: string, params?: Record<string, any>) =>
  deepLinkRouter.generateDeepLink(route, params);
export const generateWebDeepLink = (route: string, params?: Record<string, any>) =>
  deepLinkRouter.generateWebDeepLink(route, params);
export const testDeepLink = (route: string, params?: Record<string, any>) =>
  deepLinkRouter.testDeepLink(route, params);

// Add default export to fix router warnings
const utilityExport = {
  name: 'DeepLinkRouter',
  version: '1.0.0',
  instance: deepLinkRouter,
};

export default utilityExport;
