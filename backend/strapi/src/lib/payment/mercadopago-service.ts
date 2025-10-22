/**
 * MercadoPago Service for Tifossi Expo
 * Handles payment preferences and payment processing
 */

import * as crypto from 'crypto';
import { OrderStatus } from './types/orders';
import {
  MPPaymentResponse,
  MPPreferenceResponse,
  MPPreferenceRequest,
  MPRefundRequest,
  MPRefundResponse,
  UruguayIdType,
} from './types/mercadopago';

interface OrderItem {
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

interface OrderUser {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: {
    areaCode: string;
    number: string;
  };
  identification?: {
    type: 'CI' | 'RUT' | 'OTRO';
    number: string;
  };
}

interface ShippingAddress {
  street: string;
  number: string;
  city: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

interface OrderData {
  orderNumber: string;
  items: OrderItem[];
  user: OrderUser;
  shippingAddress: ShippingAddress;
  shippingMethod: 'delivery' | 'pickup';
  shippingCost: number;
  subtotal: number;
  discount: number;
  total: number;
}

export class MercadoPagoService {
  private accessToken: string;
  private publicKey: string;
  private webhookSecret: string;
  private apiUrl: string;
  private isProduction: boolean;
  private readonly API_TIMEOUT_MS = 30000; // 30 seconds

  constructor() {
    // Determine environment
    this.isProduction = process.env.NODE_ENV === 'production';

    // Load credentials based on environment
    this.accessToken = this.isProduction
      ? process.env.MP_ACCESS_TOKEN!
      : process.env.MP_TEST_ACCESS_TOKEN!;

    this.publicKey = this.isProduction
      ? process.env.MP_PUBLIC_KEY!
      : process.env.MP_TEST_PUBLIC_KEY!;

    this.webhookSecret = process.env.MP_WEBHOOK_SECRET!;
    this.apiUrl = process.env.MP_API_URL || 'https://api.mercadopago.com';

    // Validate credentials
    if (!this.accessToken) {
      throw new Error('MercadoPago access token is required');
    }

    if (!this.publicKey) {
      throw new Error('MercadoPago public key is required');
    }

    if (!this.webhookSecret) {
      throw new Error(
        'MercadoPago webhook secret is required for signature verification. ' +
          'Set MP_WEBHOOK_SECRET environment variable.'
      );
    }

    // Log initialization only in debug mode
    if (process.env.NODE_ENV !== 'production') {
      strapi?.log?.info?.(
        `MercadoPago service initialized in ${this.isProduction ? 'PRODUCTION' : 'TEST'} mode`
      );
    }
  }

  /**
   * Executes a fetch request with timeout using AbortController
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        strapi?.log?.error?.(`MercadoPago API timeout after ${this.API_TIMEOUT_MS}ms:`, { url });
        throw new Error(
          `MercadoPago API request timeout after ${this.API_TIMEOUT_MS / 1000} seconds`
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Create payment preference for checkout
   */
  async createPreference(
    orderData: OrderData,
    deviceFingerprint?: {
      deviceId: string;
      platform: string;
      osVersion: string;
      appVersion: string;
      timestamp: string;
    }
  ): Promise<MPPreferenceResponse> {
    try {
      const preferenceData = this.buildPreferenceData(orderData, deviceFingerprint);

      const response = await this.fetchWithTimeout(`${this.apiUrl}/checkout/preferences`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': this.generateIdempotencyKey(orderData.orderNumber),
        },
        body: JSON.stringify(preferenceData),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        throw new Error(
          `MercadoPago API error ${response.status}: ${errorData.message || 'Unknown error'}`
        );
      }

      const preference = (await response.json()) as MPPreferenceResponse;

      strapi?.log?.info?.(
        `Payment preference created: ${preference.id} for order ${orderData.orderNumber}`
      );

      return preference;
    } catch (error) {
      strapi?.log?.error?.('Error creating payment preference:', error);
      throw new Error(
        `Failed to create payment preference: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build preference data structure for MercadoPago
   */
  private buildPreferenceData(
    orderData: OrderData,
    deviceFingerprint?: {
      deviceId: string;
      platform: string;
      osVersion: string;
      appVersion: string;
      timestamp: string;
    }
  ): MPPreferenceRequest {
    const preference = {
      items: orderData.items.map((item) => ({
        id: item.productId,
        title: this.sanitizeText(item.productName),
        description: item.description ? this.sanitizeText(item.description) : undefined,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: 'UYU' as const,
        category_id: 'fashion',
      })),

      payer: {
        name: this.sanitizeText(orderData.user.firstName),
        surname: this.sanitizeText(orderData.user.lastName),
        email: orderData.user.email.toLowerCase(),
        phone: orderData.user.phone
          ? {
              area_code: orderData.user.phone.areaCode,
              number: orderData.user.phone.number,
            }
          : undefined,
        identification: orderData.user.identification
          ? {
              type: orderData.user.identification.type as unknown as UruguayIdType,
              number: orderData.user.identification.number,
            }
          : undefined,
        address: {
          street_name: this.sanitizeText(orderData.shippingAddress.street),
          street_number: parseInt(orderData.shippingAddress.number) || 0,
          city: this.sanitizeText(orderData.shippingAddress.city),
          federal_unit: orderData.shippingAddress.state || 'Montevideo',
          zip_code: orderData.shippingAddress.zipCode || '11000',
        },
      },

      external_reference: orderData.orderNumber,

      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
        default_installments: 1,
      },

      shipments: {
        cost: orderData.shippingCost,
        mode: orderData.shippingMethod === 'delivery' ? 'not_specified' : 'not_specified',
        receiver_address: {
          street_name: this.sanitizeText(orderData.shippingAddress.street),
          street_number: parseInt(orderData.shippingAddress.number) || 0,
          city_name: this.sanitizeText(orderData.shippingAddress.city),
          state_name: orderData.shippingAddress.state || 'Montevideo',
          zip_code: orderData.shippingAddress.zipCode || '11000',
          country_name: 'Uruguay',
        },
      },

      back_urls: {
        success: `${process.env.APP_SCHEME || 'tifossi'}://payment/success`,
        failure: `${process.env.APP_SCHEME || 'tifossi'}://payment/failure`,
        pending: `${process.env.APP_SCHEME || 'tifossi'}://payment/pending`,
      },

      auto_return: 'approved' as const,

      statement_descriptor: 'TIFOSSI',

      notification_url:
        process.env.WEBHOOK_URL || `${process.env.PUBLIC_URL}/api/webhooks/mercadopago`,

      binary_mode: false, // Must be false to enable 3DS authentication

      /**
       * 3DS 2.0 Authentication Configuration
       *
       * Enables 3D Secure authentication to improve approval rates for high-risk transactions.
       *
       * Options:
       * - 'optional': 3DS may or may not be required based on transaction risk profile (RECOMMENDED)
       *   - Low-risk: Payment proceeds without Challenge
       *   - High-risk: Additional Challenge step required
       *   - Balances security with user experience
       *
       * - 'not_supported': Disables 3DS authentication (default if not specified)
       *
       * Trade-offs:
       * - PROS: Higher approval rates for risky transactions, reduced fraud, issuer confidence
       * - CONS: Additional friction for some users (Challenge verification step ~5 min timeout)
       *
       * UX Impact:
       * - When Challenge required: Payment status = 'pending_challenge'
       * - User must complete bank verification in popup/iframe
       * - Mobile app must handle 3DS flow via WebView or external browser
       *
       * Uruguay Considerations:
       * - Major issuers (BROU, Santander, BBVA, Scotiabank) support 3DS 2.0
       * - Recommended for transactions >$1000 UYU or international cards
       * - Test with sandbox cards: 5483 9281 6457 4623 (success), 5361 9568 0611 7557 (fail)
       *
       * @see https://www.mercadopago.com/developers/en/docs/checkout-api/how-tos/integrate-3ds
       */
      three_d_secure_mode: 'optional' as const,

      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes

      // Add device fingerprint metadata for fraud prevention
      metadata: deviceFingerprint
        ? {
            device_id: deviceFingerprint.deviceId,
            device_platform: deviceFingerprint.platform,
            device_os_version: deviceFingerprint.osVersion,
            app_version: deviceFingerprint.appVersion,
            fingerprint_timestamp: deviceFingerprint.timestamp,
          }
        : undefined,
    };

    // Add shipping cost as an item if applicable
    if (orderData.shippingCost > 0) {
      preference.items.push({
        id: 'shipping',
        title: 'Envío',
        description: undefined,
        quantity: 1,
        unit_price: orderData.shippingCost,
        currency_id: 'UYU' as const,
        category_id: 'shipping',
      });
    }

    // Apply discount if applicable
    if (orderData.discount > 0) {
      preference.items.push({
        id: 'discount',
        title: 'Descuento',
        description: undefined,
        quantity: 1,
        unit_price: -orderData.discount,
        currency_id: 'UYU' as const,
        category_id: 'discount',
      });
    }

    return preference;
  }

  /**
   * Get payment information from MercadoPago
   */
  async getPayment(paymentId: string): Promise<MPPaymentResponse> {
    try {
      const response = await this.fetchWithTimeout(`${this.apiUrl}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        throw new Error(
          `MercadoPago API error ${response.status}: ${errorData.message || 'Unknown error'}`
        );
      }

      const payment = (await response.json()) as MPPaymentResponse;

      strapi?.log?.info?.(`Payment ${paymentId} retrieved: Status ${payment.status}`);

      return payment;
    } catch (error) {
      strapi?.log?.error?.('Error fetching payment information:', error);
      throw new Error(
        `Failed to fetch payment information: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(signature: string, xRequestId: string, dataId: string): boolean {
    try {
      // Parse signature header: ts=timestamp,v1=signature
      const sigParts = signature.split(',');
      const timestampPart = sigParts.find((part) => part.startsWith('ts='));
      const signaturePart = sigParts.find((part) => part.startsWith('v1='));

      if (!timestampPart || !signaturePart) {
        strapi?.log?.warn?.('Invalid signature format');
        return false;
      }

      const timestamp = timestampPart.split('=')[1];
      const signatureHash = signaturePart.split('=')[1];

      // Compute expected signature using correct MercadoPago format
      // Note: We don't validate timestamp age - MercadoPago doesn't require it.
      // Replay attacks are prevented by database duplicate detection in webhook handler.
      // Format: id:${dataId};request-id:${xRequestId};ts:${timestamp};
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(manifest, 'utf8')
        .digest('hex');

      // Compare signatures
      return crypto.timingSafeEqual(
        Buffer.from(signatureHash, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      strapi?.log?.error?.('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Process refund for a payment
   */
  async createRefund(paymentId: string, amount?: number): Promise<MPRefundResponse> {
    try {
      const refundData: MPRefundRequest = {};

      // Partial refund if amount is specified
      if (amount !== undefined) {
        refundData.amount = amount;
      }

      const response = await this.fetchWithTimeout(
        `${this.apiUrl}/v1/payments/${paymentId}/refunds`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': this.generateIdempotencyKey(`refund_${paymentId}_${Date.now()}`),
          },
          body: JSON.stringify(refundData),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        throw new Error(
          `MercadoPago API error ${response.status}: ${errorData.message || 'Unknown error'}`
        );
      }

      const refund = (await response.json()) as MPRefundResponse;

      strapi?.log?.info?.(`Refund created for payment ${paymentId}: ${refund.id}`);

      return refund;
    } catch (error) {
      strapi?.log?.error?.('Error creating refund:', error);
      throw new Error(
        `Failed to create refund: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Map MercadoPago payment status to internal order status
   */
  mapPaymentStatus(mpStatus: string, _statusDetail?: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      approved: OrderStatus.PAID,
      pending: OrderStatus.PENDING,
      in_process: OrderStatus.PENDING,
      authorized: OrderStatus.PENDING,
      in_mediation: OrderStatus.PENDING,
      rejected: OrderStatus.CANCELLED,
      cancelled: OrderStatus.CANCELLED,
      refunded: OrderStatus.REFUNDED,
      charged_back: OrderStatus.REFUNDED,
    };

    return statusMap[mpStatus] || OrderStatus.PENDING;
  }

  /**
   * Generate idempotency key for API requests
   */
  private generateIdempotencyKey(seed: string): string {
    return crypto
      .createHash('sha256')
      .update(`${seed}_${this.isProduction ? 'prod' : 'test'}`)
      .digest('hex');
  }

  /**
   * Sanitize text to prevent XSS and injection attacks
   */
  private sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .trim()
      .substring(0, 255); // Limit length
  }

  /**
   * Get public configuration (safe to expose to frontend)
   */
  getPublicConfig(): { publicKey: string; isProduction: boolean } {
    return {
      publicKey: this.publicKey,
      isProduction: this.isProduction,
    };
  }

  /**
   * Get service status (for internal use only - logging/monitoring)
   */
  getServiceStatus(): {
    isProduction: boolean;
    accessTokenSet: boolean;
    publicKeySet: boolean;
    webhookSecretSet: boolean;
  } {
    return {
      isProduction: this.isProduction,
      accessTokenSet: !!this.accessToken,
      publicKeySet: !!this.publicKey,
      webhookSecretSet: !!this.webhookSecret,
    };
  }
}

export default MercadoPagoService;
