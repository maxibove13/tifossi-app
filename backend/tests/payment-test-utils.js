/**
 * Payment Testing Utilities for Tifossi Expo
 * MercadoPago Integration Testing Tools
 */

const MercadoPagoService = require('../strapi/src/lib/payment/mercadopago-service');

class PaymentTestUtils {
  constructor() {
    // Test environment configuration
    this.testConfig = {
      // MercadoPago Sandbox Credentials
      accessToken: process.env.MP_ACCESS_TOKEN_SANDBOX || 'TEST-1234567890-123456-your-sandbox-token',
      publicKey: process.env.MP_PUBLIC_KEY_SANDBOX || 'TEST-your-public-key-sandbox',
      webhookSecret: process.env.MP_WEBHOOK_SECRET || 'your-webhook-secret',
      
      // Test endpoints
      baseUrl: process.env.API_BASE_URL || 'http://localhost:1337',
      appScheme: 'tifossi'
    };

    // Initialize MercadoPago service for testing
    this.mpService = new MercadoPagoService();
  }

  /**
   * Test card numbers for different scenarios
   */
  getTestCards() {
    return {
      // Approved cards
      approved: {
        visa: {
          number: '4170068810108020',
          cvv: '123',
          expiry: '12/25',
          name: 'APRO'
        },
        mastercard: {
          number: '5031755734530604',
          cvv: '123',
          expiry: '12/25',
          name: 'APRO'
        },
        amex: {
          number: '371180303257522',
          cvv: '1234',
          expiry: '12/25',
          name: 'APRO'
        }
      },
      
      // Rejected cards
      rejected: {
        insufficientFunds: {
          number: '4013540682746260',
          cvv: '123',
          expiry: '12/25',
          name: 'FUND',
          error: 'insufficient_amount'
        },
        badSecurityCode: {
          number: '4509953566233704',
          cvv: '123',
          expiry: '12/25',
          name: 'SECU',
          error: 'bad_filled_security_code'
        },
        badDate: {
          number: '4774678947350004',
          cvv: '123',
          expiry: '12/25',
          name: 'EXPI',
          error: 'bad_filled_date'
        },
        generalError: {
          number: '4000000000000002',
          cvv: '123',
          expiry: '12/25',
          name: 'OTHE',
          error: 'other_reason'
        }
      },
      
      // Pending cards
      pending: {
        review: {
          number: '5287212965310979',
          cvv: '123',
          expiry: '12/25',
          name: 'CONT',
          status: 'in_process'
        }
      }
    };
  }

  /**
   * Generate test order data
   */
  generateTestOrder(overrides = {}) {
    const baseOrder = {
      orderNumber: `TEST-${Date.now()}`,
      items: [
        {
          productId: 'test-product-1',
          productName: 'Camiseta Test',
          description: 'Camiseta de prueba',
          quantity: 2,
          price: 29.99,
          size: 'M',
          color: 'Azul'
        },
        {
          productId: 'test-product-2',
          productName: 'Pantalón Test',
          description: 'Pantalón de prueba',
          quantity: 1,
          price: 49.99,
          size: 'L',
          color: 'Negro'
        }
      ],
      user: {
        id: 'test-user-123',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'test@tifossi.com',
        phone: {
          areaCode: '598',
          number: '91234567'
        },
        identification: {
          type: 'CI',
          number: '12345678'
        }
      },
      shippingAddress: {
        street: 'Av. 18 de Julio',
        number: '1234',
        city: 'Montevideo',
        state: 'Montevideo',
        country: 'UY',
        zipCode: '11000'
      },
      shippingMethod: 'delivery',
      shippingCost: 5.00,
      subtotal: 109.97,
      discount: 0,
      total: 114.97
    };

    return { ...baseOrder, ...overrides };
  }

  /**
   * Create test payment preference
   */
  async createTestPreference(orderOverrides = {}) {
    try {
      const testOrder = this.generateTestOrder(orderOverrides);
      const preference = await this.mpService.createPreference(testOrder);
      
      console.log('Test preference created:', {
        id: preference.id,
        initPoint: preference.initPoint,
        externalReference: preference.externalReference
      });
      
      return { preference, order: testOrder };
    } catch (error) {
      console.error('Error creating test preference:', error);
      throw error;
    }
  }

  /**
   * Simulate webhook notification
   */
  generateWebhookPayload(type = 'payment', data = {}) {
    const basePayload = {
      id: Date.now(),
      live_mode: false,
      type: type,
      date_created: new Date().toISOString(),
      application_id: 'test-app-id',
      user_id: 'test-user-id',
      version: 1,
      api_version: 'v1',
      action: 'payment.updated',
      data: {
        id: data.paymentId || '123456789'
      }
    };

    return { ...basePayload, data: { ...basePayload.data, ...data } };
  }

  /**
   * Generate webhook signature for testing
   */
  generateWebhookSignature(payload) {
    const crypto = require('crypto');
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadString = JSON.stringify(payload);
    
    const signature = crypto
      .createHmac('sha256', this.testConfig.webhookSecret)
      .update(`${timestamp}.${payloadString}`)
      .digest('hex');

    return `ts=${timestamp},v1=${signature}`;
  }

  /**
   * Test webhook endpoint
   */
  async testWebhookEndpoint(webhookData = {}) {
    try {
      const payload = this.generateWebhookPayload('payment', webhookData);
      const signature = this.generateWebhookSignature(payload);
      
      const response = await fetch(`${this.testConfig.baseUrl}/webhooks/mercadopago`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': signature,
          'x-request-id': `test-${Date.now()}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      console.log('Webhook test result:', {
        status: response.status,
        success: result.success,
        message: result.message
      });
      
      return { response, result };
    } catch (error) {
      console.error('Error testing webhook:', error);
      throw error;
    }
  }

  /**
   * Test payment API endpoints
   */
  async testPaymentEndpoints(authToken) {
    const results = {
      createPreference: null,
      verifyPayment: null,
      getOrders: null,
      getOrder: null
    };

    try {
      // Test create preference
      console.log('Testing create preference endpoint...');
      const testOrder = this.generateTestOrder();
      
      const createResponse = await fetch(`${this.testConfig.baseUrl}/api/payment/create-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ orderData: testOrder })
      });

      results.createPreference = {
        status: createResponse.status,
        success: createResponse.ok,
        data: createResponse.ok ? await createResponse.json() : null
      };

      // Test verify payment (with mock payment ID)
      console.log('Testing verify payment endpoint...');
      const verifyResponse = await fetch(`${this.testConfig.baseUrl}/api/payment/verify/123456789`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      results.verifyPayment = {
        status: verifyResponse.status,
        success: verifyResponse.ok,
        data: verifyResponse.ok ? await verifyResponse.json() : null
      };

      // Test get orders
      console.log('Testing get orders endpoint...');
      const ordersResponse = await fetch(`${this.testConfig.baseUrl}/api/payment/orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      results.getOrders = {
        status: ordersResponse.status,
        success: ordersResponse.ok,
        data: ordersResponse.ok ? await ordersResponse.json() : null
      };

      console.log('Payment endpoints test results:', results);
      return results;

    } catch (error) {
      console.error('Error testing payment endpoints:', error);
      throw error;
    }
  }

  /**
   * Test deep link generation
   */
  generateTestDeepLinks() {
    const baseUrl = `${this.testConfig.appScheme}://payment/`;
    const testParams = {
      payment_id: '123456789',
      collection_id: '123456789',
      external_reference: 'TEST-20241201-123456',
      collection_status: 'approved',
      payment_type: 'credit_card'
    };

    return {
      success: `${baseUrl}success?${new URLSearchParams(testParams).toString()}`,
      failure: `${baseUrl}failure?${new URLSearchParams({ ...testParams, collection_status: 'rejected' }).toString()}`,
      pending: `${baseUrl}pending?${new URLSearchParams({ ...testParams, collection_status: 'pending' }).toString()}`
    };
  }

  /**
   * Load test configuration
   */
  getTestConfiguration() {
    return {
      environment: 'sandbox',
      credentials: {
        accessToken: this.testConfig.accessToken,
        publicKey: this.testConfig.publicKey,
        webhookSecret: this.testConfig.webhookSecret
      },
      endpoints: {
        api: `${this.testConfig.baseUrl}/api/payment`,
        webhook: `${this.testConfig.baseUrl}/webhooks/mercadopago`
      },
      deepLinks: this.generateTestDeepLinks(),
      testCards: this.getTestCards()
    };
  }

  /**
   * Run comprehensive payment system test
   */
  async runFullPaymentTest(authToken) {
    console.log('Starting comprehensive payment system test...');
    
    const testResults = {
      timestamp: new Date().toISOString(),
      results: {}
    };

    try {
      // Test 1: Create payment preference
      console.log('\n--- Test 1: Payment Preference Creation ---');
      const { preference, order } = await this.createTestPreference();
      testResults.results.preferenceCreation = {
        success: true,
        preferenceId: preference.id,
        orderNumber: order.orderNumber
      };

      // Test 2: Webhook processing
      console.log('\n--- Test 2: Webhook Processing ---');
      const webhookResult = await this.testWebhookEndpoint({
        paymentId: '123456789',
        externalReference: order.orderNumber
      });
      testResults.results.webhookProcessing = {
        success: webhookResult.response.ok,
        status: webhookResult.response.status
      };

      // Test 3: API endpoints
      console.log('\n--- Test 3: API Endpoints ---');
      const apiResults = await this.testPaymentEndpoints(authToken);
      testResults.results.apiEndpoints = apiResults;

      // Test 4: Deep link generation
      console.log('\n--- Test 4: Deep Link Generation ---');
      const deepLinks = this.generateTestDeepLinks();
      testResults.results.deepLinks = {
        success: true,
        links: deepLinks
      };

      console.log('\n--- Test Summary ---');
      console.log(JSON.stringify(testResults, null, 2));
      
      return testResults;

    } catch (error) {
      console.error('Comprehensive test failed:', error);
      testResults.results.error = error.message;
      return testResults;
    }
  }
}

module.exports = PaymentTestUtils;