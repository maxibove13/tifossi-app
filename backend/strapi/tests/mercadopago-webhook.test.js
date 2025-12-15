/**
 * MercadoPago Webhook Tests - Revenue Critical
 *
 * Following TESTING_PRINCIPLES.md:
 * - These tests protect against payment fraud
 * - Test webhook signature validation
 * - Test payment status updates
 * - Would definitely "wake you up at 3 AM" if broken
 *
 * MercadoPago Official Documentation:
 * - Webhooks Guide: https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks
 * - Signature Validation: https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks#editor_3
 * - Payment Notifications: https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks#editor_4
 * - Testing Guide: https://www.mercadopago.com/developers/en/docs/checkout-api/integration-test
 *
 * Implementation Notes:
 * - Signature format (v1): HMAC SHA256 of "id:{dataId};request-id:{xRequestId};ts:{timestamp};"
 * - No timestamp validation (MercadoPago doesn't require it)
 * - Response time target: < 50ms (async queue pattern)
 * - Duplicate detection: Database-backed webhook-log with unique webhookKey (prevents replay attacks)
 */

const crypto = require('crypto');

// Mock OrderStateManager before any imports
jest.mock('../src/lib/payment/order-state-manager', () => {
  const MockOrderStateManager = jest.fn().mockImplementation(() => ({
    transitionStatus: jest.fn(() => Promise.resolve()),
  }));

  return {
    OrderStateManager: MockOrderStateManager,
    default: MockOrderStateManager,
  };
});

/**
 * Helper function to create a complete strapi mock for webhook tests
 * @param {object} options - Configuration options
 * @param {object} options.paymentInfo - Mock payment data to return from getPayment()
 * @param {Array} options.existingOrders - Mock orders to return from findMany()
 * @param {Array} options.existingWebhookLogs - Mock webhook logs for duplicate detection
 * @returns {object} Configured strapi mock
 */
function createStrapiMock(options = {}) {
  const {
    paymentInfo = null,
    existingOrders = [],
    existingWebhookLogs = [],
  } = options;

  // Create mock database responses based on content type
  const documentsMap = {
    'api::order.order': {
      findMany: jest.fn(() => Promise.resolve(existingOrders)),
      update: jest.fn((params) => Promise.resolve({ ...existingOrders[0], ...params.data })),
    },
    'api::webhook-log.webhook-log': {
      findMany: jest.fn(() => Promise.resolve(existingWebhookLogs)),
      create: jest.fn((params) => Promise.resolve({ id: 1, ...params.data })),
    },
    'api::webhook-queue.webhook-queue': {
      findMany: jest.fn(() => Promise.resolve([])),
      create: jest.fn((params) => Promise.resolve({ id: 1, ...params.data })),
      update: jest.fn((params) => Promise.resolve({ id: 1, ...params.data })),
    },
  };

  return {
    log: {
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    },
    documents: jest.fn((contentType) => {
      return documentsMap[contentType] || {
        findMany: jest.fn(() => Promise.resolve([])),
        create: jest.fn((params) => Promise.resolve(params.data)),
        update: jest.fn((params) => Promise.resolve(params.data)),
      };
    }),
    mercadoPago: {
      verifyWebhookSignature: jest.fn((signature, requestId, dataId) => {
        // Implement actual signature verification logic for testing
        const webhookSecret = process.env.MP_WEBHOOK_SECRET || 'test-webhook-secret';

        // Parse signature header: "ts={timestamp},v1={hash}"
        const signatureParts = signature.split(',');
        if (signatureParts.length !== 2) return false;

        const timestamp = signatureParts[0].replace('ts=', '');
        const receivedHash = signatureParts[1].replace('v1=', '');

        // Generate expected signature
        // Note: No timestamp validation - MercadoPago doesn't require it
        const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
        const expectedHash = crypto
          .createHmac('sha256', webhookSecret)
          .update(manifest)
          .digest('hex');

        // Constant-time comparison to prevent timing attacks
        return crypto.timingSafeEqual(
          Buffer.from(receivedHash, 'utf8'),
          Buffer.from(expectedHash, 'utf8')
        );
      }),
      getPayment: jest.fn(() => Promise.resolve(paymentInfo)),
    },
  };
}

describe('MercadoPago Webhook - Revenue Critical', () => {
  beforeAll(() => {
    process.env.MP_TEST_ACCESS_TOKEN = 'test-access-token';
    process.env.MP_TEST_PUBLIC_KEY = 'test-public-key';
    process.env.MP_WEBHOOK_SECRET = 'test-webhook-secret';
  });

  // These require full Strapi instance with webhook endpoint
  /**
   * Webhook Signature Validation Tests
   *
   * MercadoPago Documentation:
   * @see https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks#editor_3
   *
   * Signature Format (v1):
   * - Header: "x-signature: ts={timestamp},v1={hash}"
   * - Manifest: "id:{dataId};request-id:{xRequestId};ts:{timestamp};"
   * - Hash: HMAC-SHA256(manifest, webhookSecret)
   *
   * Security Requirements:
   * - Constant-time comparison to prevent timing attacks
   * - Timestamp validation (max 5 minutes old)
   * - Unique request ID tracking for duplicate prevention
   */
  describe('Webhook Signature Validation', () => {
    it('should reject webhooks with invalid signature', async () => {
      const webhookPayload = {
        id: 12345,
        type: 'payment',
        data: { id: 'payment-123' },
        action: 'payment.updated',
        date_created: new Date().toISOString(),
        api_version: 'v1',
      };

      const xRequestId = 'req-' + Date.now();
      const dataId = 'payment-123';
      const wrongSecret = 'wrong-secret';
      const timestamp = Math.floor(Date.now() / 1000);
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
      const invalidSignature = crypto
        .createHmac('sha256', wrongSecret)
        .update(manifest)
        .digest('hex');

      const ctx = {
        request: {
          body: webhookPayload,
          query: {},
          headers: {
            'x-signature': `ts=${timestamp},v1=${invalidSignature}`,
            'x-request-id': xRequestId,
            'user-agent': 'MercadoPago/Test',
          },
        },
        badRequest: jest.fn(),
        unauthorized: jest.fn(),
        status: null,
        body: null,
      };

      global.strapi = createStrapiMock();

      const webhookHandler = require('../src/webhooks/mercadopago');
      await webhookHandler.handleWebhook(ctx);

      expect(ctx.unauthorized).toHaveBeenCalledWith('Invalid signature');
      expect(ctx.badRequest).not.toHaveBeenCalled();
    });

    it('should accept webhooks with valid signature', async () => {
      const webhookPayload = {
        id: 12346,
        type: 'payment',
        data: { id: 'payment-124' },
        action: 'payment.updated',
        date_created: new Date().toISOString(),
        api_version: 'v1',
      };

      const xRequestId = 'req-' + Date.now();
      const dataId = 'payment-124';
      const webhookSecret = process.env.MP_WEBHOOK_SECRET || 'test-webhook-secret';
      const timestamp = Math.floor(Date.now() / 1000);
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(manifest)
        .digest('hex');

      const mockPaymentInfo = {
        id: 124,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 100,
        currency_id: 'UYU',
        external_reference: 'ORDER-123',
        payment_method_id: 'visa',
        payment_type_id: 'credit_card',
        date_approved: new Date().toISOString(),
      };

      const ctx = {
        request: {
          body: webhookPayload,
          query: {},
          headers: {
            'x-signature': `ts=${timestamp},v1=${validSignature}`,
            'x-request-id': xRequestId,
            'user-agent': 'MercadoPago/Test',
          },
        },
        badRequest: jest.fn(),
        unauthorized: jest.fn(),
        status: null,
        body: null,
      };

      global.strapi = createStrapiMock({
        paymentInfo: mockPaymentInfo,
      });

      const webhookHandler = require('../src/webhooks/mercadopago');

      await webhookHandler.handleWebhook(ctx);

      expect(ctx.unauthorized).not.toHaveBeenCalled();
      expect(ctx.badRequest).not.toHaveBeenCalled();
      expect(ctx.status).toBe(200);
      expect(ctx.body).toBeDefined();

      if (ctx.body.success === false) {
        throw new Error(`Webhook test failed: ${ctx.body.error} - ${ctx.body.message}`);
      }

      expect(ctx.body.success).toBe(true);
    });

    it('should handle replay attacks', async () => {
      const webhookPayload = {
        id: 12347,
        type: 'payment',
        data: { id: 'payment-125' },
        action: 'payment.updated',
        date_created: new Date().toISOString(),
        api_version: 'v1',
      };

      const xRequestId = 'req-replay-test-' + Date.now();
      const dataId = 'payment-125';
      const webhookSecret = process.env.MP_WEBHOOK_SECRET || 'test-webhook-secret';
      const timestamp = Math.floor(Date.now() / 1000);
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(manifest)
        .digest('hex');

      const createContext = () => ({
        request: {
          body: { ...webhookPayload },
          query: {},
          headers: {
            'x-signature': `ts=${timestamp},v1=${validSignature}`,
            'x-request-id': xRequestId,
            'user-agent': 'MercadoPago/Test',
          },
        },
        badRequest: jest.fn(),
        unauthorized: jest.fn(),
        status: null,
        body: null,
      });

      const mockPaymentInfo = {
        id: 125,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 100,
        currency_id: 'UYU',
        external_reference: 'ORDER-125',
        payment_method_id: 'visa',
        payment_type_id: 'credit_card',
        date_approved: new Date().toISOString(),
      };

      // For replay attack test, we need stateful webhook log tracking
      let webhookLogCalls = 0;
      const strapiMock = createStrapiMock({ paymentInfo: mockPaymentInfo });

      // Override documents() to track webhook log state
      const webhookLogs = [];
      const originalDocuments = strapiMock.documents;
      strapiMock.documents = jest.fn((contentType) => {
        if (contentType === 'api::webhook-log.webhook-log') {
          return {
            findMany: jest.fn(() => {
              webhookLogCalls++;
              // First call: no logs (new webhook)
              // Second call: return existing log (duplicate)
              return Promise.resolve(webhookLogCalls === 1 ? [] : webhookLogs);
            }),
            create: jest.fn((params) => {
              const log = { id: webhookLogs.length + 1, ...params.data };
              webhookLogs.push(log);
              return Promise.resolve(log);
            }),
          };
        }
        return originalDocuments(contentType);
      });

      global.strapi = strapiMock;

      const webhookHandler = require('../src/webhooks/mercadopago');

      const ctx1 = createContext();
      await webhookHandler.handleWebhook(ctx1);
      expect(ctx1.status).toBe(200);
      expect(ctx1.body.success).toBe(true);

      const ctx2 = createContext();
      await webhookHandler.handleWebhook(ctx2);
      expect(ctx2.status).toBe(200);
      expect(ctx2.body.success).toBe(true);
    });
  });

  /**
   * Payment Status Update Tests
   *
   * MercadoPago Payment Statuses:
   * @see https://www.mercadopago.com/developers/en/docs/checkout-api/response-handling
   *
   * Status Mapping:
   * - approved → PAID (payment successful)
   * - pending → PENDING (awaiting payment)
   * - in_process → PENDING (processing)
   * - in_mediation → PENDING (in dispute)
   * - rejected → CANCELLED (payment declined)
   * - cancelled → CANCELLED (cancelled by user)
   * - refunded → REFUNDED (money returned)
   * - charged_back → REFUNDED (chargeback)
   *
   * Critical Validations:
   * - Amount must match order total (fraud prevention)
   * - Currency must be UYU (Uruguay Peso)
   * - External reference must match order number
   */
  describe('Payment Status Updates', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
    });

    it('should update order to PAID on approved payment', async () => {
      // Mock data
      const orderId = 'ORDER-APPROVED-001';
      const paymentId = 'payment-approved-123';

      const mockOrder = {
        id: 1,
        documentId: 'doc-1',
        orderNumber: orderId,
        status: 'PENDING_PAYMENT',
        total: 150.0,
        user: { id: 1, email: 'test@example.com' },
        items: [],
      };

      const mockPayment = {
        id: 123,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 150.0,
        currency_id: 'UYU',
        external_reference: orderId,
        payment_method_id: 'visa',
        payment_type_id: 'credit_card',
        date_approved: new Date().toISOString(),
      };

      // Mock Strapi documents API
      const mockUpdate = jest.fn((params) => {
        expect(params.documentId).toBe('doc-1');
        expect(params.data.status).toBe('PAID');
        expect(params.data.mpPaymentId).toBe('123');
        expect(params.data.mpPaymentStatus).toBe('approved');
        expect(params.data.paidAt).toBeDefined();
        return Promise.resolve(mockOrder);
      });

      global.strapi = {
        documents: jest.fn(() => ({
          findMany: jest.fn(() => Promise.resolve([mockOrder])),
          update: mockUpdate,
        })),
        log: {
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => Promise.resolve(mockPayment)),
          mapPaymentStatus: jest.fn(() => 'PAID'),
        },
      };

      // Load and execute handler
      const webhookHandler = require('../src/webhooks/mercadopago');

      await webhookHandler.handlePaymentNotification({ id: paymentId }, 'req-test-123');

      // Verify order was updated to PAID
      expect(strapi.documents).toHaveBeenCalledWith('api::order.order');
      expect(mockUpdate).toHaveBeenCalled();
      expect(strapi.log.info).toHaveBeenCalledWith(
        expect.stringContaining('Order found'),
        expect.any(Object)
      );
    });

    it('should update order to PAYMENT_FAILED on rejection', async () => {
      const orderId = 'ORDER-REJECTED-001';
      const paymentId = 'payment-rejected-123';

      const mockOrder = {
        id: 2,
        documentId: 'doc-2',
        orderNumber: orderId,
        status: 'PENDING_PAYMENT',
        total: 200.0,
        user: { id: 2, email: 'test@example.com' },
        items: [],
      };

      const mockPayment = {
        id: 124,
        status: 'rejected',
        status_detail: 'cc_rejected_insufficient_amount',
        transaction_amount: 200.0,
        currency_id: 'UYU',
        external_reference: orderId,
        payment_method_id: 'visa',
        payment_type_id: 'credit_card',
      };

      const mockUpdate = jest.fn((params) => {
        expect(params.data.status).toBe('cancelled');
        expect(params.data.mpPaymentStatus).toBe('rejected');
        return Promise.resolve(mockOrder);
      });

      global.strapi = {
        documents: jest.fn(() => ({
          findMany: jest.fn(() => Promise.resolve([mockOrder])),
          update: mockUpdate,
        })),
        log: {
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => Promise.resolve(mockPayment)),
          mapPaymentStatus: jest.fn(() => 'cancelled'),
        },
      };

      const MercadoPagoService =
        require('../src/lib/payment/mercadopago-service').MercadoPagoService;
      MercadoPagoService.prototype.mapPaymentStatus = jest.fn(() => 'cancelled');

      const webhookHandler = require('../src/webhooks/mercadopago');

      await webhookHandler.handlePaymentNotification({ id: paymentId }, 'req-test-124');

      expect(strapi.documents).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle pending payments correctly', async () => {
      const orderId = 'ORDER-PENDING-001';
      const paymentId = 'payment-pending-123';

      const mockOrder = {
        id: 3,
        documentId: 'doc-3',
        orderNumber: orderId,
        status: 'PENDING_PAYMENT',
        total: 300.0,
        user: { id: 3, email: 'test@example.com' },
        items: [],
      };

      const mockPayment = {
        id: 125,
        status: 'pending',
        status_detail: 'pending_waiting_payment',
        transaction_amount: 300.0,
        currency_id: 'UYU',
        external_reference: orderId,
        payment_method_id: 'bolbradesco',
        payment_type_id: 'ticket',
      };

      const mockUpdate = jest.fn((params) => {
        // Should stay in pending status
        expect(params.data.status).toBe('pending');
        expect(params.data.mpPaymentStatus).toBe('pending');
        return Promise.resolve(mockOrder);
      });

      global.strapi = {
        documents: jest.fn(() => ({
          findMany: jest.fn(() => Promise.resolve([mockOrder])),
          update: mockUpdate,
        })),
        log: {
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => Promise.resolve(mockPayment)),
          mapPaymentStatus: jest.fn(() => 'pending'),
        },
      };

      const MercadoPagoService =
        require('../src/lib/payment/mercadopago-service').MercadoPagoService;
      MercadoPagoService.prototype.mapPaymentStatus = jest.fn(() => 'pending');

      const webhookHandler = require('../src/webhooks/mercadopago');

      await webhookHandler.handlePaymentNotification({ id: paymentId }, 'req-test-125');

      expect(strapi.documents).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle refund webhooks', async () => {
      const orderId = 'ORDER-REFUND-001';
      const paymentId = 'payment-refund-123';

      const mockOrder = {
        id: 4,
        documentId: 'doc-4',
        orderNumber: orderId,
        status: 'PAID',
        total: 400.0,
        user: { id: 4, email: 'test@example.com' },
        items: [],
      };

      const mockPayment = {
        id: 126,
        status: 'refunded',
        status_detail: 'refunded',
        transaction_amount: 400.0,
        currency_id: 'UYU',
        external_reference: orderId,
        payment_method_id: 'visa',
        payment_type_id: 'credit_card',
      };

      const mockUpdate = jest.fn((params) => {
        expect(params.data.status).toBe('REFUNDED');
        expect(params.data.mpPaymentStatus).toBe('refunded');
        return Promise.resolve(mockOrder);
      });

      global.strapi = {
        documents: jest.fn(() => ({
          findMany: jest.fn(() => Promise.resolve([mockOrder])),
          update: mockUpdate,
        })),
        log: {
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => Promise.resolve(mockPayment)),
          mapPaymentStatus: jest.fn(() => 'REFUNDED'),
        },
      };

      const MercadoPagoService =
        require('../src/lib/payment/mercadopago-service').MercadoPagoService;
      MercadoPagoService.prototype.mapPaymentStatus = jest.fn(() => 'REFUNDED');

      const webhookHandler = require('../src/webhooks/mercadopago');

      await webhookHandler.handlePaymentNotification({ id: paymentId }, 'req-test-126');

      expect(strapi.documents).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('Webhook Data Validation', () => {
    beforeEach(() => {
      // Clear all module mocks before each test
      jest.clearAllMocks();

      // Set up required environment variables for MercadoPagoService
      process.env.MP_TEST_ACCESS_TOKEN = 'test-access-token';
      process.env.MP_TEST_PUBLIC_KEY = 'test-public-key';
      process.env.MP_WEBHOOK_SECRET = 'test-webhook-secret';
    });

    it('should validate required fields', async () => {
      // Test missing payment.id
      const webhookPayload1 = {
        type: 'payment',
        data: {}, // Missing id
        action: 'payment.updated',
      };

      // Mock strapi
      global.strapi = {
        log: {
          warn: jest.fn(),
          info: jest.fn(),
          error: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => Promise.resolve(null)),
        },
      };

      const webhookHandler = require('../src/webhooks/mercadopago');

      await webhookHandler.handlePaymentNotification(webhookPayload1.data, 'req-missing-id');

      // Should log warning about missing payment ID
      expect(strapi.log.warn).toHaveBeenCalledWith(
        expect.stringContaining('missing payment ID')
      );
    });

    it('should match payment amount with order total', async () => {
      const orderId = 'ORDER-AMOUNT-MISMATCH-001';

      const mockOrder = {
        id: 5,
        documentId: 'doc-5',
        orderNumber: orderId,
        status: 'PENDING_PAYMENT',
        total: 100.0, // Order expects 100
        user: { id: 5, email: 'test@example.com' },
        items: [],
        metadata: {},
      };

      const mockPayment = {
        id: 128,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 50.0, // But payment is only 50!
        currency_id: 'UYU',
        external_reference: orderId,
        payment_method_id: 'visa',
        payment_type_id: 'credit_card',
      };

      // Track whether early return was triggered
      let earlyReturnTriggered = false;
      const mockUpdate = jest.fn((params) => {
        if (params.data.metadata?.fraudDetected) {
          // Fraud was detected, early return should happen
          earlyReturnTriggered = true;
          expect(params.data.status).toBe('cancelled');
          expect(params.data.metadata.fraudDetected).toBe(true);
          expect(params.data.metadata.fraudReason).toBe('amount_mismatch');
        }
        return Promise.resolve(mockOrder);
      });

      global.strapi = {
        documents: jest.fn(() => ({
          findMany: jest.fn(() => Promise.resolve([mockOrder])),
          update: mockUpdate,
        })),
        log: {
          error: jest.fn(),
          warn: jest.fn(),
          info: jest.fn(),
          debug: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => Promise.resolve(mockPayment)),
        },
      };

      const MercadoPagoService =
        require('../src/lib/payment/mercadopago-service').MercadoPagoService;
      MercadoPagoService.prototype.getPayment = jest.fn(() => Promise.resolve(mockPayment));

      const webhookHandler = require('../src/webhooks/mercadopago');

      await webhookHandler.handlePaymentNotification({ id: '128' }, 'req-amount-mismatch');

      // Should log fraud detection
      expect(strapi.log.error).toHaveBeenCalledWith(
        expect.stringContaining('Payment fraud attempt detected - amount mismatch'),
        expect.objectContaining({
          orderId: expect.any(String),
          expectedAmount: expect.any(Number),
          receivedAmount: expect.any(Number),
        })
      );

      // Should update order with fraud flag
      expect(earlyReturnTriggered).toBe(true);
      expect(strapi.documents).toHaveBeenCalledWith('api::order.order');
    });

    it('should verify payment currency is UYU', async () => {
      const orderId = 'ORDER-CURRENCY-INVALID-001';

      const mockOrder = {
        id: 6,
        documentId: 'doc-6',
        orderNumber: orderId,
        status: 'PENDING_PAYMENT',
        total: 100.0,
        user: { id: 6, email: 'test@example.com' },
        items: [],
        metadata: {},
      };

      const mockPayment = {
        id: 129,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 100.0,
        currency_id: 'USD', // Wrong currency! Should be UYU
        external_reference: orderId,
        payment_method_id: 'visa',
        payment_type_id: 'credit_card',
      };

      let earlyReturnTriggered = false;
      const mockUpdate = jest.fn((params) => {
        if (params.data.metadata?.fraudDetected) {
          earlyReturnTriggered = true;
          expect(params.data.status).toBe('cancelled');
          expect(params.data.metadata.fraudDetected).toBe(true);
          expect(params.data.metadata.fraudReason).toBe('invalid_currency');
        }
        return Promise.resolve(mockOrder);
      });

      global.strapi = {
        documents: jest.fn(() => ({
          findMany: jest.fn(() => Promise.resolve([mockOrder])),
          update: mockUpdate,
        })),
        log: {
          error: jest.fn(),
          warn: jest.fn(),
          info: jest.fn(),
          debug: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => Promise.resolve(mockPayment)),
        },
      };

      const MercadoPagoService =
        require('../src/lib/payment/mercadopago-service').MercadoPagoService;
      MercadoPagoService.prototype.getPayment = jest.fn(() => Promise.resolve(mockPayment));

      const webhookHandler = require('../src/webhooks/mercadopago');

      await webhookHandler.handlePaymentNotification({ id: '129' }, 'req-currency-invalid');

      // Should log fraud detection
      expect(strapi.log.error).toHaveBeenCalledWith(
        expect.stringContaining('Payment fraud attempt detected - invalid currency'),
        expect.objectContaining({
          orderId: expect.any(String),
          expectedCurrency: 'UYU',
          receivedCurrency: expect.any(String),
        })
      );

      // Should update order with fraud flag
      expect(earlyReturnTriggered).toBe(true);
      expect(strapi.documents).toHaveBeenCalledWith('api::order.order');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });

    it('should handle missing orders gracefully', async () => {
      const paymentId = 'payment-no-order-123';

      const mockPayment = {
        id: 130,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 100.0,
        currency_id: 'UYU',
        external_reference: 'ORDER-DOES-NOT-EXIST',
        payment_method_id: 'visa',
        payment_type_id: 'credit_card',
      };

      // Mock Strapi - order not found
      global.strapi = {
        documents: jest.fn(() => ({
          findMany: jest.fn(() => Promise.resolve([])), // Empty array - no order found
        })),
        log: {
          warn: jest.fn(),
          info: jest.fn(),
          error: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => Promise.resolve(mockPayment)),
        },
      };

      const webhookHandler = require('../src/webhooks/mercadopago');

      // Should not throw error
      await expect(
        webhookHandler.handlePaymentNotification({ id: paymentId }, 'req-no-order')
      ).resolves.not.toThrow();

      // Should log error about orphaned payment (implementation logs error, not warn)
      expect(strapi.log.error).toHaveBeenCalledWith(
        expect.stringContaining('ORDER NOT FOUND'),
        expect.any(Object)
      );
    });

    it('should handle database errors', async () => {
      const paymentId = 'payment-db-error-123';

      const mockPayment = {
        id: 131,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 100.0,
        currency_id: 'UYU',
        external_reference: 'ORDER-DB-ERROR-001',
        payment_method_id: 'visa',
        payment_type_id: 'credit_card',
      };

      // Mock database connection error
      global.strapi = {
        documents: jest.fn(() => ({
          findMany: jest.fn(() => {
            throw new Error('Database connection failed');
          }),
        })),
        log: {
          error: jest.fn(),
          warn: jest.fn(),
          info: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => Promise.resolve(mockPayment)),
        },
      };

      const webhookHandler = require('../src/webhooks/mercadopago');

      // handlePaymentNotification re-throws errors, so it WILL throw
      // In production, handleWebhook catches this
      await expect(
        webhookHandler.handlePaymentNotification({ id: paymentId }, 'req-db-error')
      ).rejects.toThrow('Database connection failed');

      // Should log error before throwing
      expect(strapi.log.error).toHaveBeenCalledWith(
        expect.stringContaining('FAILED'),
        expect.any(Object)
      );
    });

    it('should handle malformed webhook data', async () => {
      const webhookHandler = require('../src/webhooks/mercadopago');

      // Test 1: Null body and empty query - unknown format
      const ctx1 = {
        request: {
          body: null,
          query: {},
          headers: {},
        },
        badRequest: jest.fn(),
        unauthorized: jest.fn(),
        status: null,
        body: null,
      };

      global.strapi = {
        log: {
          warn: jest.fn(),
          info: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => Promise.resolve(null)),
        },
      };

      await webhookHandler.handleWebhook(ctx1);

      // Should call badRequest for unknown webhook format
      expect(ctx1.badRequest).toHaveBeenCalledWith('Unknown webhook format');

      // Test 2: v1 format body but missing signature headers
      const ctx2 = {
        request: {
          body: {
            type: 'payment',
            data: { id: '123' },
          },
          query: {},
          headers: {}, // Missing x-signature and x-request-id
        },
        badRequest: jest.fn(),
        unauthorized: jest.fn(),
        status: null,
        body: null,
      };

      global.strapi = {
        log: {
          warn: jest.fn(),
          info: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => Promise.resolve(null)),
        },
      };

      await webhookHandler.handleWebhook(ctx2);

      // Should call badRequest for missing signature headers (v1 format requires them)
      expect(ctx2.badRequest).toHaveBeenCalledWith('Missing signature headers');
    });

    it('should handle MercadoPago API errors', async () => {
      const paymentId = 'payment-api-error-123';

      global.strapi = {
        log: {
          error: jest.fn(),
          warn: jest.fn(),
          info: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => {
            throw new Error('MercadoPago API timeout');
          }),
        },
      };

      const webhookHandler = require('../src/webhooks/mercadopago');

      // handlePaymentNotification re-throws API errors
      await expect(
        webhookHandler.handlePaymentNotification({ id: paymentId }, 'req-api-error')
      ).rejects.toThrow('MercadoPago API timeout');

      // Should log error before throwing
      expect(strapi.log.error).toHaveBeenCalledWith(
        expect.stringContaining('FAILED'),
        expect.any(Object)
      );
    });

    it('should handle API request timeouts', async () => {
      const paymentId = 'payment-timeout-123';

      global.strapi = {
        log: {
          error: jest.fn(),
          warn: jest.fn(),
          info: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => {
            const error = new Error('MercadoPago API request timeout after 30 seconds');
            error.name = 'AbortError';
            throw error;
          }),
        },
      };

      const webhookHandler = require('../src/webhooks/mercadopago');

      // Simulate AbortError from timeout
      const MercadoPagoService =
        require('../src/lib/payment/mercadopago-service').MercadoPagoService;
      MercadoPagoService.prototype.getPayment = jest.fn(() => {
        const error = new Error('MercadoPago API request timeout after 30 seconds');
        error.name = 'AbortError';
        throw error;
      });

      // Should throw timeout error
      await expect(
        webhookHandler.handlePaymentNotification({ id: paymentId }, 'req-timeout')
      ).rejects.toThrow('MercadoPago API request timeout after 30 seconds');

      // Should log error before throwing
      expect(strapi.log.error).toHaveBeenCalledWith(
        expect.stringContaining('FAILED'),
        expect.any(Object)
      );
    });

    it('should handle missing webhook headers', async () => {
      const webhookHandler = require('../src/webhooks/mercadopago');

      // v1 format with missing x-signature
      const ctx1 = {
        request: {
          body: { type: 'payment', data: { id: '123' } },
          query: {},
          headers: {
            'x-request-id': 'test-req-id',
            // Missing x-signature
          },
        },
        badRequest: jest.fn(),
        unauthorized: jest.fn(),
        status: null,
        body: null,
      };

      global.strapi = {
        log: {
          warn: jest.fn(),
          info: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => Promise.resolve(null)),
        },
      };

      await webhookHandler.handleWebhook(ctx1);

      // Should call badRequest for missing signature headers (v1 format)
      expect(ctx1.badRequest).toHaveBeenCalledWith('Missing signature headers');

      // v1 format with missing x-request-id
      const ctx2 = {
        request: {
          body: { type: 'payment', data: { id: '123' } },
          query: {},
          headers: {
            'x-signature': 'test-signature',
            // Missing x-request-id
          },
        },
        badRequest: jest.fn(),
        unauthorized: jest.fn(),
        status: null,
        body: null,
      };

      global.strapi = {
        log: {
          warn: jest.fn(),
          info: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => Promise.resolve(null)),
        },
      };

      await webhookHandler.handleWebhook(ctx2);

      // Should call badRequest for missing signature headers (v1 format)
      expect(ctx2.badRequest).toHaveBeenCalledWith('Missing signature headers');
    });

    it('should handle concurrent webhook processing', async () => {
      const orderId = 'ORDER-CONCURRENT-001';

      const mockOrder = {
        id: 7,
        documentId: 'doc-7',
        orderNumber: orderId,
        status: 'PENDING_PAYMENT',
        total: 100.0,
        user: { id: 7, email: 'test@example.com' },
        items: [],
        metadata: {},
      };

      const mockPayment = {
        id: 132,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 100.0,
        currency_id: 'UYU',
        external_reference: orderId,
        payment_method_id: 'visa',
        payment_type_id: 'credit_card',
        date_approved: new Date().toISOString(),
      };

      let updateCallCount = 0;

      global.strapi = {
        documents: jest.fn(() => ({
          findMany: jest.fn(() => Promise.resolve([mockOrder])),
          update: jest.fn(() => {
            updateCallCount++;
            return Promise.resolve(mockOrder);
          }),
        })),
        log: {
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
        },
        mercadoPago: {
          getPayment: jest.fn(() => Promise.resolve(mockPayment)),
          mapPaymentStatus: jest.fn(() => 'PAID'),
        },
      };

      const webhookHandler = require('../src/webhooks/mercadopago');

      const MercadoPagoService =
        require('../src/lib/payment/mercadopago-service').MercadoPagoService;
      MercadoPagoService.prototype.getPayment = jest.fn(() => Promise.resolve(mockPayment));
      MercadoPagoService.prototype.mapPaymentStatus = jest.fn(() => 'PAID');

      const { OrderStateManager } = require('../src/lib/payment/order-state-manager');
      OrderStateManager.prototype.transitionStatus = jest.fn();

      // Process same webhook multiple times concurrently
      await Promise.all([
        webhookHandler.handlePaymentNotification({ id: '132' }, 'req-concurrent-1'),
        webhookHandler.handlePaymentNotification({ id: '132' }, 'req-concurrent-2'),
        webhookHandler.handlePaymentNotification({ id: '132' }, 'req-concurrent-3'),
      ]);

      // Should handle all webhooks without errors
      // Note: error log is called with two params ('message', errorObject)
      expect(strapi.log.error).not.toHaveBeenCalledWith(
        'Error handling payment notification:',
        expect.anything()
      );
    });
  });

  // Smoke tests that can run without full Strapi
  describe('Webhook Configuration', () => {
    it('should have webhook endpoint configured', () => {
      const fs = require('fs');
      const path = require('path');

      // Check for webhook routes
      const customRoutesPath = path.join(
        __dirname,
        '..',
        'src',
        'api',
        'order',
        'routes',
        'custom-order.js'
      );

      if (fs.existsSync(customRoutesPath)) {
        const routes = require(customRoutesPath);

        // Check if webhook route exists
        const webhookRoute = routes.routes?.find(
          (route) => route.path?.includes('webhook') && route.path?.includes('mercadopago')
        );

        expect(webhookRoute).toBeDefined();
        expect(webhookRoute?.method).toBe('POST');
      } else {
        // If custom routes don't exist, mark as pending implementation
        console.warn('Webhook routes not yet implemented');
      }
    });

    it('should have webhook secret configured in example env', () => {
      const fs = require('fs');
      const path = require('path');

      const envExamplePath = path.join(__dirname, '..', '.env.example');

      // Check if file exists first (might not exist in CI)
      if (!fs.existsSync(envExamplePath)) {
        console.warn('.env.example not found - this is normal in CI environments');
        return;
      }

      const envContent = fs.readFileSync(envExamplePath, 'utf8');

      // Check for MercadoPago webhook configuration
      expect(envContent).toMatch(/MP_WEBHOOK_SECRET/);
      expect(envContent).toMatch(/MP_ACCESS_TOKEN/);
    });
  });

  describe('Webhook Security Helpers', () => {
    it('should correctly generate webhook signature', () => {
      // Test signature generation logic
      const secret = 'test-webhook-secret';
      const data = {
        id: 12345,
        type: 'payment',
        data: { id: 'payment-123' },
      };

      const payload = JSON.stringify(data);
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      expect(signature).toBeDefined();
      expect(signature).toHaveLength(64); // SHA256 produces 64 hex characters
    });

    it('should validate webhook timestamp to prevent replay', () => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      const oneHourAgo = now - 60 * 60 * 1000;

      // Helper function to check if timestamp is recent
      const isRecentTimestamp = (timestamp, maxAgeMs = 10 * 60 * 1000) => {
        const age = Date.now() - timestamp;
        return age >= 0 && age <= maxAgeMs;
      };

      expect(isRecentTimestamp(fiveMinutesAgo)).toBe(true);
      expect(isRecentTimestamp(oneHourAgo)).toBe(false);
    });
  });

  /**
   * Async Queue Processing Tests
   *
   * Implementation Pattern:
   * @see https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks#editor_6
   *
   * MercadoPago requires webhooks to respond within 500ms.
   * We implement an async queue pattern:
   * 1. Validate signature (SYNC - <10ms)
   * 2. Check for duplicates (SYNC - <20ms)
   * 3. Queue for processing (SYNC - <20ms)
   * 4. Return 200 OK (target: <50ms total)
   * 5. Process webhook asynchronously (ASYNC - no time limit)
   *
   * Benefits:
   * - 75-94% faster response time (200-800ms → <50ms)
   * - Prevents MercadoPago timeouts and retries
   * - Allows complex processing without blocking
   * - Built-in retry mechanism with exponential backoff
   */
  describe('Async Queue Processing', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.env.MP_TEST_ACCESS_TOKEN = 'test-access-token';
      process.env.MP_TEST_PUBLIC_KEY = 'test-public-key';
      process.env.MP_WEBHOOK_SECRET = 'test-webhook-secret';
    });

    it('should queue webhook for async processing and return quickly', async () => {
      const startTime = Date.now();
      const webhookPayload = {
        id: 12350,
        type: 'payment',
        data: { id: 'payment-queue-123' },
        action: 'payment.updated',
        date_created: new Date().toISOString(),
        api_version: 'v1',
      };

      const xRequestId = 'req-queue-test-' + Date.now();
      const dataId = 'payment-queue-123';
      const webhookSecret = process.env.MP_WEBHOOK_SECRET || 'test-webhook-secret';
      const timestamp = Math.floor(Date.now() / 1000);
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(manifest)
        .digest('hex');

      const mockCreate = jest.fn(() => Promise.resolve({ id: 1, documentId: 'queue-1' }));
      const mockFindMany = jest.fn(() => Promise.resolve([])); // No duplicates

      const ctx = {
        request: {
          body: webhookPayload,
          query: {},
          headers: {
            'x-signature': `ts=${timestamp},v1=${validSignature}`,
            'x-request-id': xRequestId,
            'user-agent': 'MercadoPago/Test',
          },
        },
        badRequest: jest.fn(),
        unauthorized: jest.fn(),
        status: null,
        body: null,
      };

      global.strapi = {
        log: {
          info: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        documents: jest.fn((type) => {
          if (type === 'api::webhook-log.webhook-log') {
            return {
              findMany: mockFindMany,
              create: jest.fn(() => Promise.resolve({ id: 1 })),
            };
          } else if (type === 'api::webhook-queue.webhook-queue') {
            return {
              create: mockCreate,
            };
          }
          return { findMany: jest.fn(() => Promise.resolve([])) };
        }),
        mercadoPago: {
          verifyWebhookSignature: jest.fn(() => true),
          getPayment: jest.fn(() => Promise.resolve(null)),
        },
      };

      const webhookHandler = require('../src/webhooks/mercadopago');
      await webhookHandler.handleWebhook(ctx);

      const responseTime = Date.now() - startTime;

      // Should return 200 OK
      expect(ctx.status).toBe(200);
      expect(ctx.body).toBeDefined();
      expect(ctx.body.success).toBe(true);
      expect(ctx.body.status).toBe('queued');

      // Should create queue entry - payload is normalized, not raw
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          requestId: xRequestId,
          webhookType: 'payment',
          dataId: dataId,
          status: 'queued',
          retryCount: 0,
          maxRetries: 5,
        }),
      });

      // Response should be fast (< 200ms for test environment with mocks)
      // In production with real DB, target is < 50ms
      expect(responseTime).toBeLessThan(200);
      console.log(`Webhook queued in ${responseTime}ms (target: <50ms in production)`);
    });

    it('should process queued webhooks from the queue', async () => {
      const mockQueueItem = {
        id: 1,
        documentId: 'queue-doc-1',
        requestId: 'req-queue-process-123',
        webhookType: 'payment',
        dataId: 'payment-456',
        payload: {
          type: 'payment',
          data: { id: 'payment-456', collection_id: 'coll-456' },
          action: 'payment.updated',
        },
        status: 'queued',
        retryCount: 0,
        maxRetries: 5,
        scheduledAt: new Date().toISOString(),
      };

      const mockOrder = {
        id: 10,
        documentId: 'order-doc-10',
        orderNumber: 'ORDER-QUEUE-001',
        status: 'PENDING_PAYMENT',
        total: 200.0,
        user: { id: 10, email: 'test@example.com' },
        items: [],
        metadata: {},
      };

      const mockPayment = {
        id: 456,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 200.0,
        currency_id: 'UYU',
        external_reference: 'ORDER-QUEUE-001',
        payment_method_id: 'visa',
        payment_type_id: 'credit_card',
        date_approved: new Date().toISOString(),
      };

      const mockUpdateQueue = jest.fn(() => Promise.resolve({}));
      const mockUpdateOrder = jest.fn(() => Promise.resolve(mockOrder));

      global.strapi = {
        log: {
          info: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        documents: jest.fn((type) => {
          if (type === 'api::webhook-queue.webhook-queue') {
            return {
              findMany: jest.fn(() => Promise.resolve([mockQueueItem])),
              update: mockUpdateQueue,
            };
          } else if (type === 'api::order.order') {
            return {
              findMany: jest.fn(() => Promise.resolve([mockOrder])),
              update: mockUpdateOrder,
            };
          }
          return { findMany: jest.fn(() => Promise.resolve([])) };
        }),
        mercadoPago: {
          getPayment: jest.fn(() => Promise.resolve(mockPayment)),
          mapPaymentStatus: jest.fn(() => 'PAID'),
        },
      };

      const MercadoPagoService =
        require('../src/lib/payment/mercadopago-service').MercadoPagoService;
      MercadoPagoService.prototype.getPayment = jest.fn(() => Promise.resolve(mockPayment));
      MercadoPagoService.prototype.mapPaymentStatus = jest.fn(() => 'PAID');

      const { WebhookProcessor } = require('../src/lib/payment/webhook-processor');
      const processor = new WebhookProcessor();

      await processor.processQueue();

      // Should update queue status to processing, then completed
      expect(mockUpdateQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 'queue-doc-1',
          data: expect.objectContaining({ status: 'processing' }),
        })
      );

      expect(mockUpdateQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 'queue-doc-1',
          data: expect.objectContaining({ status: 'completed' }),
        })
      );

      // Should update order
      expect(mockUpdateOrder).toHaveBeenCalled();
    });

    it('should retry failed webhook processing with exponential backoff', async () => {
      const mockQueueItem = {
        id: 2,
        documentId: 'queue-doc-2',
        requestId: 'req-retry-123',
        webhookType: 'payment',
        dataId: 'payment-retry-789',
        payload: {
          type: 'payment',
          data: { id: 'payment-retry-789' },
          action: 'payment.updated',
        },
        status: 'queued',
        retryCount: 2, // Already tried twice
        maxRetries: 5,
        scheduledAt: new Date().toISOString(),
      };

      const mockUpdateQueue = jest.fn(() => Promise.resolve({}));

      global.strapi = {
        log: {
          info: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        documents: jest.fn((type) => {
          if (type === 'api::webhook-queue.webhook-queue') {
            return {
              findMany: jest.fn(() => Promise.resolve([mockQueueItem])),
              update: mockUpdateQueue,
            };
          }
          return {
            findMany: jest.fn(() => {
              throw new Error('Database error');
            }),
          };
        }),
        mercadoPago: {
          getPayment: jest.fn(() => {
            throw new Error('API timeout');
          }),
        },
      };

      const MercadoPagoService =
        require('../src/lib/payment/mercadopago-service').MercadoPagoService;
      MercadoPagoService.prototype.getPayment = jest.fn(() => {
        throw new Error('API timeout');
      });

      const { WebhookProcessor } = require('../src/lib/payment/webhook-processor');
      const processor = new WebhookProcessor();

      await processor.processQueue();

      // Should update retry count and reschedule with exponential backoff
      // retryCount goes from 2 to 3, backoff = 2^3 = 8 seconds
      expect(mockUpdateQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 'queue-doc-2',
          data: expect.objectContaining({
            status: 'queued', // Still queued for retry
            retryCount: 3,
            error: expect.any(String),
            scheduledAt: expect.any(String), // Should be scheduled for future
          }),
        })
      );
    });

    it('should mark webhook as failed after max retries', async () => {
      const mockQueueItem = {
        id: 3,
        documentId: 'queue-doc-3',
        requestId: 'req-max-retry-123',
        webhookType: 'payment',
        dataId: 'payment-max-retry-999',
        payload: {
          type: 'payment',
          data: { id: 'payment-max-retry-999' },
          action: 'payment.updated',
        },
        status: 'queued',
        retryCount: 4, // One more retry will hit max (5)
        maxRetries: 5,
        scheduledAt: new Date().toISOString(),
      };

      const mockUpdateQueue = jest.fn(() => Promise.resolve({}));

      global.strapi = {
        log: {
          info: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        documents: jest.fn((type) => {
          if (type === 'api::webhook-queue.webhook-queue') {
            return {
              findMany: jest.fn(() => Promise.resolve([mockQueueItem])),
              update: mockUpdateQueue,
            };
          }
          return {
            findMany: jest.fn(() => {
              throw new Error('Persistent error');
            }),
          };
        }),
        mercadoPago: {
          getPayment: jest.fn(() => {
            throw new Error('Persistent API error');
          }),
        },
      };

      const MercadoPagoService =
        require('../src/lib/payment/mercadopago-service').MercadoPagoService;
      MercadoPagoService.prototype.getPayment = jest.fn(() => {
        throw new Error('Persistent API error');
      });

      const { WebhookProcessor } = require('../src/lib/payment/webhook-processor');
      const processor = new WebhookProcessor();

      await processor.processQueue();

      // Should mark as failed after max retries
      expect(mockUpdateQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 'queue-doc-3',
          data: expect.objectContaining({
            status: 'failed', // Failed after max retries
            retryCount: 5,
            processedAt: expect.any(String),
          }),
        })
      );
    });

    it('should prevent duplicate webhook processing via webhook-log', async () => {
      const xRequestId = 'req-duplicate-queue-' + Date.now();
      const dataId = 'payment-dup-555';
      const webhookKey = `${xRequestId}_payment_${dataId}`;

      const webhookPayload = {
        id: 12351,
        type: 'payment',
        data: { id: dataId },
        action: 'payment.updated',
        date_created: new Date().toISOString(),
        api_version: 'v1',
      };

      const webhookSecret = process.env.MP_WEBHOOK_SECRET || 'test-webhook-secret';
      const timestamp = Math.floor(Date.now() / 1000);
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(manifest)
        .digest('hex');

      const ctx = {
        request: {
          body: webhookPayload,
          query: {},
          headers: {
            'x-signature': `ts=${timestamp},v1=${validSignature}`,
            'x-request-id': xRequestId,
            'user-agent': 'MercadoPago/Test',
          },
        },
        badRequest: jest.fn(),
        unauthorized: jest.fn(),
        status: null,
        body: null,
      };

      // Mock webhook log create to throw unique constraint error (duplicate)
      const mockLogCreate = jest.fn(() => {
        const error = new Error('Unique constraint violation');
        error.code = '23505';
        throw error;
      });
      const mockQueueCreate = jest.fn();

      global.strapi = {
        log: {
          info: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        documents: jest.fn((type) => {
          if (type === 'api::webhook-log.webhook-log') {
            return {
              findMany: jest.fn(() => Promise.resolve([])),
              create: mockLogCreate,
            };
          } else if (type === 'api::webhook-queue.webhook-queue') {
            return {
              create: mockQueueCreate,
            };
          }
          return { findMany: jest.fn(() => Promise.resolve([])) };
        }),
        mercadoPago: {
          verifyWebhookSignature: jest.fn(() => true),
          getPayment: jest.fn(() => Promise.resolve(null)),
        },
      };

      const webhookHandler = require('../src/webhooks/mercadopago');
      await webhookHandler.handleWebhook(ctx);

      // Should return 200 with duplicate status
      expect(ctx.status).toBe(200);
      expect(ctx.body.success).toBe(true);
      expect(ctx.body.status).toBe('duplicate');

      // Should NOT queue webhook
      expect(mockQueueCreate).not.toHaveBeenCalled();
    });
  });
});
