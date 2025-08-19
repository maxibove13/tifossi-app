/**
 * Deep Link Handler for Payment Callbacks
 * Handles MercadoPago payment result callbacks in Tifossi Expo
 *
 * NOTE: This service is now integrated with the unified DeepLinkRouter.
 * The main routing logic has been moved to deepLinkRouter.ts
 * This service now focuses on payment-specific callback processing.
 */

import { Linking } from 'react-native';
import { mercadoPagoService, PaymentResult } from '../../_services/payment/mercadoPago';

export interface PaymentCallbackData {
  paymentId?: string;
  collectionId?: string;
  externalReference?: string;
  status?: string;
  collectionStatus?: string;
  paymentType?: string;
  merchantOrderId?: string;
}

export interface DeepLinkOptions {
  onPaymentSuccess?: (data: PaymentCallbackData) => void;
  onPaymentFailure?: (data: PaymentCallbackData) => void;
  onPaymentPending?: (data: PaymentCallbackData) => void;
  onInvalidLink?: (url: string) => void;
}

class DeepLinkHandler {
  private isListening = false;
  private options: DeepLinkOptions = {};

  /**
   * Initialize deep link handling
   * NOTE: This is now primarily used for callback processing.
   * URL listening is handled by the unified DeepLinkRouter.
   */
  initialize(options: DeepLinkOptions = {}) {
    this.options = options;
    console.log('[PaymentDeepLinkHandler] Initialized with options:', Object.keys(options));
  }

  /**
   * Start listening for deep links
   * @deprecated Use unified DeepLinkRouter instead
   */
  private startListening() {
    console.warn(
      '[PaymentDeepLinkHandler] Direct listening is deprecated. Use unified DeepLinkRouter.'
    );

    if (!this.isListening) {
      // Handle deep links when app is already open
      Linking.addEventListener('url', this.handleDeepLink);

      // Handle deep link when app is opened from closed state
      this.handleInitialUrl();

      this.isListening = true;
    }
  }

  /**
   * Stop listening for deep links
   */
  stopListening() {
    if (this.isListening) {
      Linking.removeAllListeners('url');
      this.isListening = false;
    }
  }

  /**
   * Handle deep link URL
   */
  private handleDeepLink = ({ url }: { url: string }) => {
    console.log('[PaymentDeepLinkHandler] Deep link received:', url);
    this.processPaymentCallbackLegacy(url);
  };

  /**
   * Handle initial URL when app opens
   */
  private async handleInitialUrl() {
    try {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('[PaymentDeepLinkHandler] Initial URL:', initialUrl);
        this.processPaymentCallbackLegacy(initialUrl);
      }
    } catch (error) {
      console.error('[PaymentDeepLinkHandler] Error getting initial URL:', error);
    }
  }

  /**
   * Process payment callback from deep link
   * This is the main method called by the unified DeepLinkRouter
   */
  processPaymentCallback(url: string, params: Record<string, any>) {
    try {
      console.log('[PaymentDeepLinkHandler] Processing payment callback:', url);

      const parsedResult = mercadoPagoService.parsePaymentCallback(url);

      if (!parsedResult) {
        // Not a payment callback or invalid format
        console.warn('[PaymentDeepLinkHandler] Invalid payment callback format');
        this.options.onInvalidLink?.(url);
        return { success: false, error: 'Invalid payment callback format' };
      }

      const callbackData = this.extractCallbackData(url);

      // Route based on payment result
      if (parsedResult.success) {
        return this.handleSuccessCallback(parsedResult, callbackData);
      } else {
        return this.handleFailureCallback(parsedResult, callbackData);
      }
    } catch (error: any) {
      console.error('[PaymentDeepLinkHandler] Error processing payment callback:', error);
      this.options.onInvalidLink?.(url);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process payment callback from deep link (legacy method)
   * @deprecated Use processPaymentCallback instead
   */
  private processPaymentCallbackLegacy(url: string) {
    try {
      const parsedResult = mercadoPagoService.parsePaymentCallback(url);

      if (!parsedResult) {
        // Not a payment callback or invalid format
        this.options.onInvalidLink?.(url);
        return;
      }

      const callbackData = this.extractCallbackData(url);

      // Route based on payment result
      if (parsedResult.success) {
        this.handleSuccessCallback(parsedResult, callbackData);
      } else {
        this.handleFailureCallback(parsedResult, callbackData);
      }
    } catch (error) {
      console.error('Error processing payment callback:', error);
      this.options.onInvalidLink?.(url);
    }
  }

  /**
   * Handle successful payment callback
   */
  private async handleSuccessCallback(result: PaymentResult, callbackData: PaymentCallbackData) {
    try {
      console.log('[PaymentDeepLinkHandler] Payment success callback:', result);

      // Verify payment status with backend if we have payment ID
      if (result.paymentId) {
        try {
          const verificationResult = await mercadoPagoService.verifyPaymentStatus(result.paymentId);
          console.log('[PaymentDeepLinkHandler] Payment verification result:', verificationResult);
        } catch (error) {
          console.warn('[PaymentDeepLinkHandler] Payment verification failed:', error);
          // Continue with callback processing even if verification fails
        }
      }

      // Call custom success handler
      this.options.onPaymentSuccess?.(callbackData);

      return {
        success: true,
        action: 'payment-success',
        data: { result, callbackData },
      };
    } catch (error: any) {
      console.error('[PaymentDeepLinkHandler] Error handling success callback:', error);
      return this.handleFailureCallback(result, callbackData);
    }
  }

  /**
   * Handle failed or pending payment callback
   */
  private handleFailureCallback(result: PaymentResult, callbackData: PaymentCallbackData) {
    try {
      console.log('[PaymentDeepLinkHandler] Payment failure/pending callback:', result);

      if (result.status === 'pending') {
        // Call custom pending handler
        this.options.onPaymentPending?.(callbackData);

        return {
          success: true,
          action: 'payment-pending',
          data: { result, callbackData },
        };
      } else {
        // Call custom failure handler
        this.options.onPaymentFailure?.(callbackData);

        return {
          success: true,
          action: 'payment-failure',
          data: { result, callbackData },
        };
      }
    } catch (error: any) {
      console.error('[PaymentDeepLinkHandler] Error handling failure callback:', error);

      return {
        success: false,
        error: error.message,
        action: 'payment-error',
      };
    }
  }

  /**
   * Extract callback data from URL
   */
  private extractCallbackData(url: string): PaymentCallbackData {
    try {
      const urlObj = new URL(url);
      const params = Object.fromEntries(urlObj.searchParams.entries());

      return {
        paymentId: params.payment_id as string,
        collectionId: params.collection_id as string,
        externalReference: params.external_reference as string,
        status: params.status as string,
        collectionStatus: params.collection_status as string,
        paymentType: params.payment_type as string,
        merchantOrderId: params.merchant_order_id as string,
      };
    } catch (error) {
      console.error('Error extracting callback data:', error);
      return {};
    }
  }

  /**
   * Check if URL is a payment callback
   */
  isPaymentCallback(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname?.includes('/payment/') || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get payment status from callback URL
   */
  getPaymentStatusFromUrl(url: string): 'success' | 'failure' | 'pending' | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname?.split('/') || [];
      const status = pathParts[pathParts.length - 1];

      if (['success', 'failure', 'pending'].includes(status)) {
        return status as 'success' | 'failure' | 'pending';
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create test deep link (for development)
   */
  createTestDeepLink(
    status: 'success' | 'failure' | 'pending',
    params: Partial<PaymentCallbackData> = {}
  ): string {
    const baseUrl = 'tifossi://payment/';
    const queryParams = new URLSearchParams();

    // Add test parameters
    if (params.paymentId) queryParams.set('payment_id', params.paymentId);
    if (params.collectionId) queryParams.set('collection_id', params.collectionId);
    if (params.externalReference) queryParams.set('external_reference', params.externalReference);
    if (params.status) queryParams.set('status', params.status);
    if (params.collectionStatus) queryParams.set('collection_status', params.collectionStatus);

    // Add default test values
    if (!params.paymentId) queryParams.set('payment_id', '123456789');
    if (!params.collectionId) queryParams.set('collection_id', '123456789');
    if (!params.externalReference) queryParams.set('external_reference', 'TIF-20241201-123456');

    const query = queryParams.toString();
    return `${baseUrl}${status}${query ? '?' + query : ''}`;
  }

  /**
   * Test deep link handling (for development)
   */
  async testDeepLink(
    status: 'success' | 'failure' | 'pending',
    params: Partial<PaymentCallbackData> = {}
  ) {
    const testUrl = this.createTestDeepLink(status, params);
    console.log('Testing deep link:', testUrl);

    // Simulate receiving the deep link
    this.handleDeepLink({ url: testUrl });
  }
}

// Export singleton instance
export const deepLinkHandler = new DeepLinkHandler();

// Export utility functions
export const PaymentDeepLinks = {
  /**
   * Initialize payment deep link handling
   */
  initialize: (options: DeepLinkOptions = {}) => {
    deepLinkHandler.initialize(options);
  },

  /**
   * Stop listening for deep links
   */
  stopListening: () => {
    deepLinkHandler.stopListening();
  },

  /**
   * Check if URL is a payment callback
   */
  isPaymentCallback: (url: string) => {
    return deepLinkHandler.isPaymentCallback(url);
  },

  /**
   * Get payment status from URL
   */
  getPaymentStatus: (url: string) => {
    return deepLinkHandler.getPaymentStatusFromUrl(url);
  },

  /**
   * Test deep link (development only)
   */
  test: (status: 'success' | 'failure' | 'pending', params?: Partial<PaymentCallbackData>) => {
    return deepLinkHandler.testDeepLink(status, params);
  },

  /**
   * Create test deep link URL (development only)
   */
  createTestUrl: (
    status: 'success' | 'failure' | 'pending',
    params?: Partial<PaymentCallbackData>
  ) => {
    return deepLinkHandler.createTestDeepLink(status, params);
  },
};

export default deepLinkHandler;
