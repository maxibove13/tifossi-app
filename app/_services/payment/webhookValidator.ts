/**
 * MercadoPago Webhook Validator
 * Validates webhook signatures according to MercadoPago's latest specification
 */

import * as crypto from 'crypto';

export interface WebhookValidationResult {
  isValid: boolean;
  reason?: string;
  timestamp?: number;
}

export interface WebhookHeaders {
  'x-signature': string;
  'x-request-id': string;
}

export class MercadoPagoWebhookValidator {
  private webhookSecret: string;
  private maxTimeDifference: number;

  constructor(webhookSecret: string, maxTimeDifference: number = 300) {
    if (!webhookSecret) {
      throw new Error('Webhook secret is required for validation');
    }
    this.webhookSecret = webhookSecret;
    this.maxTimeDifference = maxTimeDifference; // 5 minutes default
  }

  /**
   * Validate webhook signature according to MercadoPago specification
   * @param headers - Request headers including x-signature and x-request-id
   * @param dataId - The data.id from the webhook payload
   * @returns Validation result
   */
  validateSignature(headers: WebhookHeaders, dataId: string): WebhookValidationResult {
    try {
      // Extract x-signature header
      const xSignature = headers['x-signature'];
      const xRequestId = headers['x-request-id'];

      if (!xSignature) {
        return { isValid: false, reason: 'Missing x-signature header' };
      }

      if (!xRequestId) {
        return { isValid: false, reason: 'Missing x-request-id header' };
      }

      if (!dataId) {
        return { isValid: false, reason: 'Missing data.id in payload' };
      }

      // Parse signature header: ts=<timestamp>,v1=<signature>
      const signatureParts = xSignature.split(',');
      const timestampPart = signatureParts.find((part) => part.startsWith('ts='));
      const signaturePart = signatureParts.find((part) => part.startsWith('v1='));

      if (!timestampPart || !signaturePart) {
        return { isValid: false, reason: 'Invalid x-signature format' };
      }

      const timestamp = timestampPart.split('=')[1];
      const signature = signaturePart.split('=')[1];

      // Validate timestamp to prevent replay attacks
      const currentTime = Math.floor(Date.now() / 1000);
      const requestTime = parseInt(timestamp, 10);
      const timeDifference = Math.abs(currentTime - requestTime);

      if (timeDifference > this.maxTimeDifference) {
        return {
          isValid: false,
          reason: `Timestamp too old or too far in future (${timeDifference}s difference)`,
          timestamp: requestTime,
        };
      }

      // Create the manifest string according to MercadoPago spec
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;

      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(manifest)
        .digest('hex');

      // Compare signatures using timing-safe comparison
      const isValid = this.timingSafeEqual(signature, expectedSignature);

      if (!isValid) {
        return {
          isValid: false,
          reason: 'Invalid signature',
          timestamp: requestTime,
        };
      }

      return {
        isValid: true,
        timestamp: requestTime,
      };
    } catch (error) {
      return {
        isValid: false,
        reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    return crypto.timingSafeEqual(bufferA, bufferB);
  }

  /**
   * Extract webhook data from request
   */
  extractWebhookData(body: any): {
    type: string;
    action: string;
    dataId: string;
    userId?: string;
    dateCreated: string;
    liveMode: boolean;
  } | null {
    try {
      return {
        type: body.type,
        action: body.action,
        dataId: body.data?.id?.toString() || '',
        userId: body.user_id,
        dateCreated: body.date_created,
        liveMode: body.live_mode || false,
      };
    } catch {
      return null;
    }
  }

  /**
   * Create test signature for testing purposes
   */
  createTestSignature(dataId: string, requestId: string, timestamp?: number): string {
    const ts = timestamp || Math.floor(Date.now() / 1000);
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;

    const signature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(manifest)
      .digest('hex');

    return `ts=${ts},v1=${signature}`;
  }

  /**
   * Validate webhook payload structure
   */
  validatePayloadStructure(payload: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!payload.id) errors.push('Missing webhook id');
    if (!payload.type) errors.push('Missing webhook type');
    if (!payload.action) errors.push('Missing webhook action');
    if (!payload.data) errors.push('Missing webhook data');
    if (!payload.data?.id) errors.push('Missing data.id');
    if (!payload.date_created) errors.push('Missing date_created');

    // Validate webhook type
    const validTypes = ['payment', 'merchant_order', 'chargebacks'];
    if (payload.type && !validTypes.includes(payload.type)) {
      errors.push(`Invalid webhook type: ${payload.type}`);
    }

    // Validate payment actions
    if (payload.type === 'payment') {
      const validActions = ['payment.created', 'payment.updated'];
      if (payload.action && !validActions.includes(payload.action)) {
        errors.push(`Invalid payment action: ${payload.action}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Singleton instance for the app
let validatorInstance: MercadoPagoWebhookValidator | null = null;

export const initializeWebhookValidator = (webhookSecret: string): MercadoPagoWebhookValidator => {
  if (!validatorInstance) {
    validatorInstance = new MercadoPagoWebhookValidator(webhookSecret);
  }
  return validatorInstance;
};

export const getWebhookValidator = (): MercadoPagoWebhookValidator => {
  if (!validatorInstance) {
    throw new Error('Webhook validator not initialized. Call initializeWebhookValidator first.');
  }
  return validatorInstance;
};

// Export helper functions
export const validateWebhook = (
  headers: WebhookHeaders,
  dataId: string,
  webhookSecret: string
): WebhookValidationResult => {
  const validator = new MercadoPagoWebhookValidator(webhookSecret);
  return validator.validateSignature(headers, dataId);
};

export const createTestWebhookSignature = (
  dataId: string,
  requestId: string,
  webhookSecret: string,
  timestamp?: number
): string => {
  const validator = new MercadoPagoWebhookValidator(webhookSecret);
  return validator.createTestSignature(dataId, requestId, timestamp);
};
