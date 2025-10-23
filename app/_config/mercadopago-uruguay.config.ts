/**
 * MercadoPago Uruguay Configuration
 * Test cards and environment settings for Uruguay
 */

export const URUGUAY_TEST_CARDS = {
  // Credit Cards
  mastercard: {
    number: '5031755734530604',
    cvv: '123',
    expiry: '11/30',
    type: 'credit',
  },
  visa: {
    number: '4509953566233704',
    cvv: '123',
    expiry: '11/30',
    type: 'credit',
  },
  // Debit Card
  visaDebit: {
    number: '4213016314706756',
    cvv: '123',
    expiry: '11/30',
    type: 'debit',
  },
};

// Cardholder names to trigger different payment states
export const TEST_CARDHOLDER_NAMES = {
  APPROVED: 'APRO',
  REJECTED_INSUFFICIENT_FUNDS: 'FUND',
  REJECTED_OTHER: 'OTHE',
};

// Identification types for Uruguay
export const URUGUAY_ID_TYPES = {
  CI: 'CI', // Cédula de Identidad (individuals)
  RUT: 'RUT', // Business identification
  OTHER: 'OTRO', // For testing (use with 9 digits)
};

// Test payer configurations
export const TEST_PAYERS = {
  individual: {
    email: 'test_user_123456@testuser.com',
    first_name: 'Test',
    last_name: 'User',
    identification: {
      type: URUGUAY_ID_TYPES.CI,
      number: '12345678',
    },
    phone: {
      area_code: '598',
      number: '91234567',
    },
  },
  business: {
    email: 'business_test@company.com',
    first_name: 'Empresa',
    last_name: 'Test SA',
    identification: {
      type: URUGUAY_ID_TYPES.RUT,
      number: '218878260019',
    },
    phone: {
      area_code: '598',
      number: '29001234',
    },
  },
  testMode: {
    email: 'test_' + Date.now() + '@testuser.com',
    first_name: 'Test',
    last_name: 'Mode',
    identification: {
      type: URUGUAY_ID_TYPES.OTHER,
      number: '123456789', // 9 digits for test mode
    },
    phone: {
      area_code: '598',
      number: '99999999',
    },
  },
};

// Test addresses for Uruguay
export const TEST_ADDRESSES = {
  montevideo: {
    street_name: '18 de Julio',
    street_number: 1234,
    city: 'Montevideo',
    state: 'Montevideo',
    zip_code: '11000',
    country: 'UY',
  },
  canelones: {
    street_name: 'Av. Giannattasio',
    street_number: 5678,
    city: 'Ciudad de la Costa',
    state: 'Canelones',
    zip_code: '15000',
    country: 'UY',
  },
};

// Payment method configurations
export const PAYMENT_METHODS = {
  // Credit/Debit cards
  cards: ['visa', 'master', 'oca', 'diners', 'lider'],

  // Cash payment methods in Uruguay
  cash: ['abitab', 'redpagos'],

  // Bank transfer
  bank_transfer: ['bank_transfer'],
};

// MercadoPago API Configuration
export const MERCADOPAGO_CONFIG = {
  // API endpoints (same for sandbox and production)
  api: {
    baseUrl: 'https://api.mercadopago.com',
    version: 'v1',
    endpoints: {
      preferences: '/checkout/preferences',
      payments: '/payments',
      paymentMethods: '/payment_methods',
      paymentSearch: '/payments/search',
    },
  },

  // Preference settings
  preferences: {
    currency_id: 'UYU',
    installments: 12, // Max installments allowed
    expiration_minutes: 30, // Preference expires after 30 minutes
    binary_mode: false, // Allow pending payments
  },

  // Webhook configuration
  webhooks: {
    events: ['payment.created', 'payment.updated'],
    timeout: 5000, // 5 second timeout for signature validation
  },
};

// Test scenarios
export const TEST_SCENARIOS = {
  approvedPayment: {
    card: URUGUAY_TEST_CARDS.mastercard,
    cardholderName: TEST_CARDHOLDER_NAMES.APPROVED,
    payer: TEST_PAYERS.individual,
    expectedStatus: 'approved',
  },
  rejectedInsufficientFunds: {
    card: URUGUAY_TEST_CARDS.visa,
    cardholderName: TEST_CARDHOLDER_NAMES.REJECTED_INSUFFICIENT_FUNDS,
    payer: TEST_PAYERS.individual,
    expectedStatus: 'rejected',
    expectedStatusDetail: 'insufficient_amount',
  },
  rejectedOther: {
    card: URUGUAY_TEST_CARDS.visaDebit,
    cardholderName: TEST_CARDHOLDER_NAMES.REJECTED_OTHER,
    payer: TEST_PAYERS.individual,
    expectedStatus: 'rejected',
    expectedStatusDetail: 'other_reason',
  },
};

// Helper function to format card number
export const formatCardNumber = (number: string): string => {
  return number.replace(/\s/g, '');
};

// Helper function to generate test order reference
export const generateTestOrderReference = (prefix = 'TEST'): string => {
  const timestamp = Date.now().toString().slice(-6);
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `${prefix}-${date}-${timestamp}`;
};

// Helper function to create test preference data
export const createTestPreferenceData = (overrides: any = {}) => {
  const orderRef = generateTestOrderReference();

  return {
    items: [
      {
        id: 'test-product-1',
        title: 'Test Product',
        quantity: 1,
        unit_price: 100,
        currency_id: 'UYU',
      },
    ],
    payer: TEST_PAYERS.individual,
    external_reference: orderRef,
    notification_url: process.env.TEST_WEBHOOK_URL || 'http://localhost:1337/webhooks/mercadopago',
    back_urls: {
      success: `${process.env.APP_SCHEME || 'tifossi'}://payment/success`,
      failure: `${process.env.APP_SCHEME || 'tifossi'}://payment/failure`,
      pending: `${process.env.APP_SCHEME || 'tifossi'}://payment/pending`,
    },
    auto_return: 'approved',
    binary_mode: false,
    expires: true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    ...overrides,
  };
};

// Add default export to fix router warnings
const utilityExport = {
  name: 'MercadoPagoUruguayConfig',
  version: '1.0.0',
};

export default utilityExport;
