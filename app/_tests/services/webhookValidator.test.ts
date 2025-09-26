/**
 * WebhookValidator Tests
 * Tests MercadoPago webhook signature validation for security
 * These are pure function tests - no mocking needed
 */

import { MercadoPagoWebhookValidator } from '../../_services/payment/webhookValidator';
import * as crypto from 'crypto';

describe('MercadoPagoWebhookValidator', () => {
  const testSecret = 'test-webhook-secret-123';
  let validator: MercadoPagoWebhookValidator;

  beforeEach(() => {
    validator = new MercadoPagoWebhookValidator(testSecret);
  });

  describe('constructor', () => {
    it('should throw error if webhook secret is not provided', () => {
      expect(() => new MercadoPagoWebhookValidator('')).toThrow(
        'Webhook secret is required for validation'
      );
    });

    it('should accept custom max time difference', () => {
      const customValidator = new MercadoPagoWebhookValidator(testSecret, 600);
      // No error means it was created successfully
      expect(customValidator).toBeDefined();
    });
  });

  describe('validateSignature', () => {
    const generateValidSignature = (dataId: string, requestId: string, timestamp: number) => {
      const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
      const signature = crypto.createHmac('sha256', testSecret).update(manifest).digest('hex');
      return `ts=${timestamp},v1=${signature}`;
    };

    it('should validate correct signature', () => {
      const dataId = 'payment-123';
      const requestId = 'request-456';
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateValidSignature(dataId, requestId, timestamp);

      const result = validator.validateSignature(
        {
          'x-signature': signature,
          'x-request-id': requestId,
        },
        dataId
      );

      expect(result.isValid).toBe(true);
      expect(result.timestamp).toBe(timestamp);
      expect(result.reason).toBeUndefined();
    });

    it('should reject missing x-signature header', () => {
      const result = validator.validateSignature(
        {
          'x-signature': '',
          'x-request-id': 'request-123',
        },
        'data-123'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Missing x-signature header');
    });

    it('should reject missing x-request-id header', () => {
      const result = validator.validateSignature(
        {
          'x-signature': 'ts=123,v1=abc',
          'x-request-id': '',
        },
        'data-123'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Missing x-request-id header');
    });

    it('should reject missing data.id', () => {
      const result = validator.validateSignature(
        {
          'x-signature': 'ts=123,v1=abc',
          'x-request-id': 'request-123',
        },
        ''
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Missing data.id in payload');
    });

    it('should reject invalid signature format', () => {
      const result = validator.validateSignature(
        {
          'x-signature': 'invalid-format',
          'x-request-id': 'request-123',
        },
        'data-123'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Invalid x-signature format');
    });

    it('should reject signature without timestamp part', () => {
      const result = validator.validateSignature(
        {
          'x-signature': 'v1=somesignature',
          'x-request-id': 'request-123',
        },
        'data-123'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Invalid x-signature format');
    });

    it('should reject signature without v1 part', () => {
      const result = validator.validateSignature(
        {
          'x-signature': 'ts=123456789',
          'x-request-id': 'request-123',
        },
        'data-123'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Invalid x-signature format');
    });

    it('should reject old timestamp (replay attack prevention)', () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
      const dataId = 'payment-123';
      const requestId = 'request-456';
      const signature = generateValidSignature(dataId, requestId, oldTimestamp);

      const result = validator.validateSignature(
        {
          'x-signature': signature,
          'x-request-id': requestId,
        },
        dataId
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Timestamp too old');
      expect(result.timestamp).toBe(oldTimestamp);
    });

    it('should reject future timestamp', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 400; // 400 seconds in future
      const dataId = 'payment-123';
      const requestId = 'request-456';
      const signature = generateValidSignature(dataId, requestId, futureTimestamp);

      const result = validator.validateSignature(
        {
          'x-signature': signature,
          'x-request-id': requestId,
        },
        dataId
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Timestamp too old or too far in future');
      expect(result.timestamp).toBe(futureTimestamp);
    });

    it('should reject incorrect signature', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const dataId = 'payment-123';
      const requestId = 'request-456';

      // Generate signature with wrong secret
      const wrongSecret = 'wrong-secret';
      const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
      const wrongSignature = crypto
        .createHmac('sha256', wrongSecret)
        .update(manifest)
        .digest('hex');
      const signature = `ts=${timestamp},v1=${wrongSignature}`;

      const result = validator.validateSignature(
        {
          'x-signature': signature,
          'x-request-id': requestId,
        },
        dataId
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Invalid signature');
      expect(result.timestamp).toBe(timestamp);
    });

    it('should reject tampered data.id', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const originalDataId = 'payment-123';
      const tamperedDataId = 'payment-456';
      const requestId = 'request-789';
      const signature = generateValidSignature(originalDataId, requestId, timestamp);

      const result = validator.validateSignature(
        {
          'x-signature': signature,
          'x-request-id': requestId,
        },
        tamperedDataId // Different from what was signed
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Invalid signature');
    });

    it('should reject tampered request-id', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const dataId = 'payment-123';
      const originalRequestId = 'request-456';
      const tamperedRequestId = 'request-789';
      const signature = generateValidSignature(dataId, originalRequestId, timestamp);

      const result = validator.validateSignature(
        {
          'x-signature': signature,
          'x-request-id': tamperedRequestId, // Different from what was signed
        },
        dataId
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Invalid signature');
    });

    it('should handle complex data.id values', () => {
      const complexDataId = 'payment_123-456.789!@#$%^&*()';
      const requestId = 'req-complex-123';
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateValidSignature(complexDataId, requestId, timestamp);

      const result = validator.validateSignature(
        {
          'x-signature': signature,
          'x-request-id': requestId,
        },
        complexDataId
      );

      expect(result.isValid).toBe(true);
    });

    it('should validate signature with custom time window', () => {
      const customValidator = new MercadoPagoWebhookValidator(testSecret, 60); // 60 second window

      const timestamp = Math.floor(Date.now() / 1000) - 50; // 50 seconds ago (within 60s window)
      const dataId = 'payment-123';
      const requestId = 'request-456';
      const signature = generateValidSignature(dataId, requestId, timestamp);

      const result = customValidator.validateSignature(
        {
          'x-signature': signature,
          'x-request-id': requestId,
        },
        dataId
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('createTestSignature', () => {
    it('should create valid test signature', () => {
      const dataId = 'test-payment-123';
      const requestId = 'test-request-456';
      const signature = validator.createTestSignature(dataId, requestId);

      // Parse the signature
      const parts = signature.split(',');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toMatch(/^ts=\d+$/);
      expect(parts[1]).toMatch(/^v1=[a-f0-9]{64}$/); // SHA256 hex is 64 chars
    });

    it('should create signature that can be validated', () => {
      const dataId = 'test-payment-789';
      const requestId = 'test-request-012';
      const signature = validator.createTestSignature(dataId, requestId);

      const result = validator.validateSignature(
        {
          'x-signature': signature,
          'x-request-id': requestId,
        },
        dataId
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('timing-safe comparison', () => {
    it('should use timing-safe comparison for signatures', () => {
      // This test verifies the method exists and works
      // The actual timing-safe property is hard to test directly
      const timestamp = Math.floor(Date.now() / 1000);
      const dataId = 'payment-123';
      const requestId = 'request-456';

      // Generate valid signature
      const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
      const sig = crypto.createHmac('sha256', testSecret).update(manifest).digest('hex');
      const signature = `ts=${timestamp},v1=${sig}`;

      // Should validate without timing attacks
      const result = validator.validateSignature(
        {
          'x-signature': signature,
          'x-request-id': requestId,
        },
        dataId
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string webhook secret in validation', () => {
      expect(() => new MercadoPagoWebhookValidator('')).toThrow();
    });

    it('should handle malformed timestamp in signature', () => {
      const result = validator.validateSignature(
        {
          'x-signature': 'ts=notanumber,v1=somesignature',
          'x-request-id': 'request-123',
        },
        'data-123'
      );

      expect(result.isValid).toBe(false);
      // Will fail either on parsing or time validation
    });

    it('should handle extra fields in signature header', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const dataId = 'payment-123';
      const requestId = 'request-456';

      // Add extra fields to signature
      const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
      const sig = crypto.createHmac('sha256', testSecret).update(manifest).digest('hex');
      const signature = `ts=${timestamp},v1=${sig},v2=extra,custom=field`;

      const result = validator.validateSignature(
        {
          'x-signature': signature,
          'x-request-id': requestId,
        },
        dataId
      );

      // Should still validate as it finds ts and v1 parts
      expect(result.isValid).toBe(true);
    });
  });
});
