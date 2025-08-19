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
import { deepLinkHandler as paymentDeepLinkHandler } from '../../_utils/payment/deepLinkHandler';

// Deep link route patterns
export const DEEP_LINK_ROUTES = {
  // Payment routes
  PAYMENT_SUCCESS: '/payment/success',
  PAYMENT_FAILURE: '/payment/failure',
  PAYMENT_PENDING: '/payment/pending',

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
} as const;

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
          'verify-email': '/auth/verify-email',
          'verification-code': '/auth/verification-code',
          'verify-success': '/auth/verify-success',
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
          'payment-result': '/payment/result',
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

class DeepLinkRouter {
  private isInitialized = false;
  private linkingListener: ((event: { url: string }) => void) | null = null;

  /**
   * Initialize the deep link router
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[DeepLinkRouter] Already initialized');
      return;
    }

    try {
      console.log('[DeepLinkRouter] Initializing...');

      // Initialize auth deep linking
      await authDeepLinking.initialize();

      // Set up URL listener
      this.setupUrlListener();

      // Handle initial URL if app was opened via deep link
      await this.handleInitialUrl();

      this.isInitialized = true;
      console.log('[DeepLinkRouter] Initialization completed');
    } catch (error) {
      console.error('[DeepLinkRouter] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set up URL event listener
   */
  private setupUrlListener(): void {
    this.linkingListener = ({ url }) => {
      console.log('[DeepLinkRouter] Received URL:', url);
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
        console.log('[DeepLinkRouter] Initial URL detected:', initialUrl);
        await this.handleDeepLink(initialUrl);
      }
    } catch (error) {
      console.error('[DeepLinkRouter] Failed to handle initial URL:', error);
    }
  }

  /**
   * Main deep link handler - routes to appropriate handler
   */
  async handleDeepLink(url: string): Promise<DeepLinkResult> {
    try {
      // Parse URL using URL constructor instead of Linking.parse
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const queryParams: Record<string, any> = {};

      // Convert URLSearchParams to Record<string, any>
      urlObj.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });

      console.log('[DeepLinkRouter] Parsed URL:', { path, queryParams });

      if (!path) {
        // Navigate to home for empty paths
        router.replace('/' as any);
        return { handled: true, success: true, route: '/(tabs)/' };
      }

      // Route to appropriate handler based on path
      if (path.includes('/payment/')) {
        return await this.handlePaymentDeepLink(url, path, queryParams || {});
      } else if (path.includes('/product/')) {
        return await this.handleProductDeepLink(path, queryParams || {});
      } else if (path.includes('/category/')) {
        return await this.handleCategoryDeepLink(path, queryParams || {});
      } else if (path.includes('/auth/')) {
        // Delegate to auth deep linking service
        return { handled: true, success: true };
      } else {
        return await this.handleAppNavigationDeepLink(path, queryParams || {});
      }
    } catch (error: any) {
      console.error('[DeepLinkRouter] Failed to handle deep link:', error);
      return {
        handled: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle payment deep links (MercadoPago callbacks)
   */
  private async handlePaymentDeepLink(
    url: string,
    path: string,
    queryParams: Record<string, any>
  ): Promise<DeepLinkResult> {
    try {
      console.log('[DeepLinkRouter] Handling payment deep link:', path);

      // Use the payment deep link handler for processing
      const paymentResult = paymentDeepLinkHandler.processPaymentCallback(url, queryParams);

      // Handle both sync and async payment handler responses
      const result = await Promise.resolve(paymentResult);

      if (!result || !result.success) {
        const errorMessage =
          (result && 'error' in result && typeof result.error === 'string' && result.error) ||
          'Failed to process payment callback';
        throw new Error(errorMessage);
      }

      // Extract payment status from path
      // Expected format: /payment/{status} where status is success|failure|pending
      const pathParts = path.split('/');
      const status = pathParts[pathParts.length - 1];

      if (!['success', 'failure', 'pending'].includes(status)) {
        throw new Error(`Invalid payment status: ${status}`);
      }

      // Navigate to payment result screen with appropriate params
      const params = {
        [`payment${status.charAt(0).toUpperCase() + status.slice(1)}`]: 'true',
        orderId: queryParams.external_reference || queryParams.orderId,
        paymentId: queryParams.payment_id || queryParams.paymentId,
        collectionId: queryParams.collection_id || queryParams.collectionId,
        merchantOrderId: queryParams.merchant_order_id || queryParams.merchantOrderId,
        ...(status === 'failure' && { error: queryParams.error || 'Payment was rejected' }),
      };

      // Filter out undefined values
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      );

      router.replace({
        pathname: '/checkout/payment-result' as any,
        params: filteredParams,
      });

      return {
        handled: true,
        success: true,
        route: '/checkout/payment-result',
        params: filteredParams,
      };
    } catch (error: any) {
      console.error('[DeepLinkRouter] Payment deep link error:', error);

      // Navigate to cart with error
      router.replace({
        pathname: '/(tabs)/cart',
        params: { paymentError: 'true', error: error.message },
      });

      return {
        handled: true,
        success: false,
        error: error.message,
        route: '/(tabs)/cart',
      };
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
      console.log('[DeepLinkRouter] Handling product deep link:', path);

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
      console.error('[DeepLinkRouter] Product deep link error:', error);

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
      console.log('[DeepLinkRouter] Handling category deep link:', path);

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
      console.error('[DeepLinkRouter] Category deep link error:', error);

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
   * Handle app navigation deep links
   */
  private async handleAppNavigationDeepLink(
    path: string,
    queryParams: Record<string, any>
  ): Promise<DeepLinkResult> {
    try {
      console.log('[DeepLinkRouter] Handling app navigation deep link:', path);

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
      console.error('[DeepLinkRouter] App navigation deep link error:', error);

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
    console.log('[DeepLinkRouter] Testing deep link:', testUrl);
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
    console.log('[DeepLinkRouter] Cleanup completed');
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
