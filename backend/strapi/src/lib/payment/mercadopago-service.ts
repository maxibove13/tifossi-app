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
      console.warn('MercadoPago webhook secret not configured');
    }

    console.log(
      `MercadoPago service initialized in ${this.isProduction ? 'PRODUCTION' : 'TEST'} mode`
    );
  }

  /**
   * Create payment preference for checkout
   */
  async createPreference(orderData: OrderData): Promise<MPPreferenceResponse> {
    try {
      const preferenceData = this.buildPreferenceData(orderData);

      const response = await fetch(`${this.apiUrl}/checkout/preferences`, {
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

      console.log(
        `Payment preference created: ${preference.id} for order ${orderData.orderNumber}`
      );

      return preference;
    } catch (error) {
      console.error('Error creating payment preference:', error);
      throw new Error(
        `Failed to create payment preference: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build preference data structure for MercadoPago
   */
  private buildPreferenceData(orderData: OrderData): MPPreferenceRequest {
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
        process.env.WEBHOOK_URL || `${process.env.API_BASE_URL}/webhooks/mercadopago`,

      binary_mode: false,

      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
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
      const response = await fetch(`${this.apiUrl}/v1/payments/${paymentId}`, {
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

      console.log(`Payment ${paymentId} retrieved: Status ${payment.status}`);

      return payment;
    } catch (error) {
      console.error('Error fetching payment information:', error);
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
        console.warn('Invalid signature format');
        return false;
      }

      const timestamp = timestampPart.split('=')[1];
      const signatureHash = signaturePart.split('=')[1];

      // Check timestamp (prevent replay attacks)
      const currentTime = Math.floor(Date.now() / 1000);
      const requestTime = parseInt(timestamp);
      const timeDifference = Math.abs(currentTime - requestTime);

      if (timeDifference > 300) {
        // 5 minutes tolerance
        console.warn('Webhook timestamp too old or too far in future');
        return false;
      }

      // Compute expected signature using correct MercadoPago format
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
      console.error('Error verifying webhook signature:', error);
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

      const response = await fetch(`${this.apiUrl}/v1/payments/${paymentId}/refunds`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': this.generateIdempotencyKey(`refund_${paymentId}_${Date.now()}`),
        },
        body: JSON.stringify(refundData),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        throw new Error(
          `MercadoPago API error ${response.status}: ${errorData.message || 'Unknown error'}`
        );
      }

      const refund = (await response.json()) as MPRefundResponse;

      console.log(`Refund created for payment ${paymentId}: ${refund.id}`);

      return refund;
    } catch (error) {
      console.error('Error creating refund:', error);
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
      pending: OrderStatus.PAYMENT_PENDING,
      in_process: OrderStatus.PAYMENT_PENDING,
      authorized: OrderStatus.PAYMENT_PENDING,
      in_mediation: OrderStatus.PAYMENT_PENDING,
      rejected: OrderStatus.PAYMENT_FAILED,
      cancelled: OrderStatus.CANCELLED,
      refunded: OrderStatus.REFUNDED,
      charged_back: OrderStatus.REFUNDED,
    };

    return statusMap[mpStatus] || OrderStatus.PAYMENT_PENDING;
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
}

export default MercadoPagoService;
