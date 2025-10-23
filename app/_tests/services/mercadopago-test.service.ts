/**
 * MercadoPago Test Service
 * Provides real sandbox integration for testing
 * Only works with valid MercadoPago test credentials
 */

import {
  URUGUAY_TEST_CARDS,
  TEST_CARDHOLDER_NAMES,
  TEST_PAYERS,
  TEST_ADDRESSES,
  createTestPreferenceData,
  generateTestOrderReference,
} from '../../_config/mercadopago-uruguay.config';
import { MercadoPagoWebhookValidator } from '../../../backend/strapi/src/webhooks/webhookValidator';

export interface MercadoPagoTestConfig {
  accessToken: string;
  publicKey: string;
  webhookSecret: string;
  apiUrl?: string;
}

export interface TestPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  external_reference: string;
  items: any[];
  payer: any;
}

export interface TestPayment {
  id: string;
  status: string;
  status_detail: string;
  transaction_amount: number;
  currency_id: string;
  external_reference: string;
  date_created: string;
  date_approved?: string;
}

export class MercadoPagoTestService {
  private config: MercadoPagoTestConfig;
  private apiUrl: string;
  private webhookValidator: MercadoPagoWebhookValidator;
  private testPreferences: Map<string, TestPreference> = new Map();
  private testPayments: Map<string, TestPayment> = new Map();

  constructor(config: MercadoPagoTestConfig) {
    this.validateConfig(config);
    this.config = config;
    this.apiUrl = config.apiUrl || 'https://api.mercadopago.com';
    this.webhookValidator = new MercadoPagoWebhookValidator(config.webhookSecret);
  }

  private validateConfig(config: MercadoPagoTestConfig) {
    // Accept both TEST- (official test credentials) and APP_USR- (sandbox credentials)
    const isValidAccessToken =
      config.accessToken?.startsWith('TEST-') || config.accessToken?.startsWith('APP_USR-');
    const isValidPublicKey =
      config.publicKey?.startsWith('TEST-') || config.publicKey?.startsWith('APP_USR-');

    if (!isValidAccessToken) {
      throw new Error('Invalid access token. Must start with TEST- or APP_USR-');
    }
    if (!isValidPublicKey) {
      throw new Error('Invalid public key. Must start with TEST- or APP_USR-');
    }
    if (!config.webhookSecret) {
      throw new Error('Webhook secret is required');
    }
  }

  /**
   * Create a real payment preference in MercadoPago sandbox
   */
  async createRealPreference(data: any = {}): Promise<TestPreference> {
    const preferenceData = createTestPreferenceData(data);

    try {
      const response = await fetch(`${this.apiUrl}/checkout/preferences`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferenceData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          `MercadoPago API error ${response.status}: ${error.message || 'Unknown error'}`
        );
      }

      const preference = await response.json();

      // Store for later verification
      this.testPreferences.set(preference.id, preference);

      return preference;
    } catch (error) {
      console.error('Error creating preference:', error);
      throw error;
    }
  }

  /**
   * Get preference details from MercadoPago
   *
   * NOTE: MercadoPago API does not officially support GET /checkout/preferences/{id}
   * Preferences can only be retrieved from the creation response.
   * This method first checks local storage, then attempts API call (which may fail).
   *
   * @deprecated Use the preference returned from createRealPreference() instead
   */
  async getPreference(preferenceId: string): Promise<TestPreference | null> {
    // First check if we have it stored locally
    const stored = this.testPreferences.get(preferenceId);
    if (stored) {
      return stored;
    }

    // Attempt API call (this will likely fail with 401/405)
    try {
      const url = `${this.apiUrl}/checkout/preferences/${preferenceId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const _errorBody = await response.text().catch(() => 'Unable to read error body');
        console.warn(
          `[MercadoPago] Cannot fetch preference ${preferenceId} (expected - API doesn't support this):`,
          response.status,
          response.statusText
        );
        return null;
      }

      const preference = await response.json();
      return preference;
    } catch (error) {
      console.warn('[MercadoPago] Preference fetch failed (expected):', error);
      return null;
    }
  }

  /**
   * Get payment details from MercadoPago
   */
  async getPayment(paymentId: string): Promise<TestPayment | null> {
    try {
      const response = await fetch(`${this.apiUrl}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const payment = await response.json();

      // Store for later verification
      this.testPayments.set(payment.id, payment);

      return payment;
    } catch (error) {
      console.error('Error fetching payment:', error);
      return null;
    }
  }

  /**
   * Search for payments by external reference
   */
  async searchPaymentsByReference(externalReference: string): Promise<TestPayment[]> {
    try {
      const params = new URLSearchParams({
        external_reference: externalReference,
      });

      const response = await fetch(`${this.apiUrl}/v1/payments/search?${params}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      return result.results || [];
    } catch (error) {
      console.error('Error searching payments:', error);
      return [];
    }
  }

  /**
   * Wait for webhook notification (polling)
   */
  async waitForWebhook(
    paymentId: string,
    timeout: number = 30000
  ): Promise<{ received: boolean; payment?: TestPayment }> {
    const startTime = Date.now();
    const pollInterval = 2000; // Poll every 2 seconds

    while (Date.now() - startTime < timeout) {
      // Check if payment exists and has been updated
      const payment = await this.getPayment(paymentId);

      if (payment && payment.status !== 'pending') {
        return { received: true, payment };
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    return { received: false };
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(headers: any, dataId: string): boolean {
    const result = this.webhookValidator.validateSignature(
      {
        'x-signature': headers['x-signature'],
        'x-request-id': headers['x-request-id'],
      },
      dataId
    );

    return result.isValid;
  }

  /**
   * Create test webhook signature
   */
  createTestWebhookSignature(dataId: string, requestId: string): string {
    return this.webhookValidator.createTestSignature(dataId, requestId);
  }

  /**
   * Simulate payment (for testing - actual payment happens in MercadoPago checkout)
   */
  simulatePaymentScenario(scenario: 'approved' | 'rejected_funds' | 'rejected_other'): {
    card: any;
    cardholderName: string;
    expectedStatus: string;
    expectedStatusDetail?: string;
  } {
    switch (scenario) {
      case 'approved':
        return {
          card: URUGUAY_TEST_CARDS.mastercard,
          cardholderName: TEST_CARDHOLDER_NAMES.APPROVED,
          expectedStatus: 'approved',
          expectedStatusDetail: 'accredited',
        };

      case 'rejected_funds':
        return {
          card: URUGUAY_TEST_CARDS.visa,
          cardholderName: TEST_CARDHOLDER_NAMES.REJECTED_INSUFFICIENT_FUNDS,
          expectedStatus: 'rejected',
          expectedStatusDetail: 'insufficient_amount',
        };

      case 'rejected_other':
      default:
        return {
          card: URUGUAY_TEST_CARDS.visaDebit,
          cardholderName: TEST_CARDHOLDER_NAMES.REJECTED_OTHER,
          expectedStatus: 'rejected',
          expectedStatusDetail: 'other_reason',
        };
    }
  }

  /**
   * Clean up test data (preferences and payments)
   */
  async cleanupTestData(externalReference: string): Promise<void> {
    try {
      // Find and log test payments for this reference
      const payments = await this.searchPaymentsByReference(externalReference);

      if (payments.length > 0) {
        console.log(`Found ${payments.length} test payments for ${externalReference}`);
        // Note: MercadoPago doesn't allow deletion of test data
        // But we can track what was created for reporting
        payments.forEach((payment) => {
          console.log(`Test payment: ${payment.id} - Status: ${payment.status}`);
        });
      }

      // Clear from local storage
      this.testPreferences.forEach((pref, id) => {
        if (pref.external_reference === externalReference) {
          this.testPreferences.delete(id);
        }
      });

      this.testPayments.forEach((payment, id) => {
        if (payment.external_reference === externalReference) {
          this.testPayments.delete(id);
        }
      });
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Check MercadoPago API health
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.apiUrl}/v1/payment_methods`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
        },
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          healthy: false,
          latency,
          error: `API returned ${response.status}`,
        };
      }

      return {
        healthy: true,
        latency,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get test statistics
   */
  getTestStatistics() {
    return {
      preferencesCreated: this.testPreferences.size,
      paymentsProcessed: this.testPayments.size,
      approvedPayments: Array.from(this.testPayments.values()).filter(
        (p) => p.status === 'approved'
      ).length,
      rejectedPayments: Array.from(this.testPayments.values()).filter(
        (p) => p.status === 'rejected'
      ).length,
      pendingPayments: Array.from(this.testPayments.values()).filter((p) => p.status === 'pending')
        .length,
    };
  }

  /**
   * Generate test order data
   */
  generateTestOrder(overrides: any = {}) {
    return {
      orderNumber: generateTestOrderReference(),
      items: [
        {
          productId: 'test-prod-1',
          productName: 'Camiseta Nacional Test',
          description: 'Camiseta de prueba',
          quantity: 1,
          price: 2500,
          size: 'L',
          color: 'Azul',
        },
      ],
      user: TEST_PAYERS.individual,
      shippingAddress: TEST_ADDRESSES.montevideo,
      shippingMethod: 'delivery' as const,
      shippingCost: 200,
      subtotal: 2500,
      discount: 0,
      total: 2700,
      ...overrides,
    };
  }
}

// Export singleton factory
let testServiceInstance: MercadoPagoTestService | null = null;

export const initializeMercadoPagoTestService = (
  config: MercadoPagoTestConfig
): MercadoPagoTestService => {
  if (!testServiceInstance) {
    testServiceInstance = new MercadoPagoTestService(config);
  }
  return testServiceInstance;
};

export const getMercadoPagoTestService = (): MercadoPagoTestService => {
  if (!testServiceInstance) {
    throw new Error('MercadoPago test service not initialized');
  }
  return testServiceInstance;
};
