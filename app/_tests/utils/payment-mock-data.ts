/**
 * Payment-specific mock data for testing
 */

import { CartItem } from '../../_stores/cartStore';

// For test expectations
declare const expect: any;

// Import the payment-related types
export interface OrderData {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: {
    areaCode: string;
    number: string;
  };
  identification: {
    type: string;
    number: string;
  };
}

export interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  number: string;
  apartment?: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  phone?: string;
  isDefault?: boolean;
  addressType?: 'home' | 'work' | 'other';
  notes?: string;
}

export const mockCartItems: CartItem[] = [
  {
    productId: 'test-product-1',
    quantity: 2,
    color: 'Black',
    size: 'M',
  },
  {
    productId: 'test-product-2',
    quantity: 1,
    color: 'White',
    size: 'L',
  },
];

export const mockUserData: UserData = {
  id: 'test-user-1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@tifossi.com',
  phone: {
    areaCode: '598',
    number: '987654321',
  },
  identification: {
    type: 'CI',
    number: '12345678',
  },
};

export const mockAddress: Address = {
  id: 'test-address-1',
  firstName: 'Test',
  lastName: 'User',
  street: '456 Oak Avenue',
  number: '123',
  city: 'Montevideo',
  state: 'Montevideo',
  country: 'Uruguay',
  zipCode: '11000',
  phone: '+598987654321',
  isDefault: true,
  addressType: 'home',
};

export const createMockOrderData = (overrides?: Partial<OrderData>): OrderData => ({
  id: 'order-123',
  orderNumber: 'TIF-20241201-123456',
  items: [
    {
      productId: 'test-product-1',
      productName: 'Test Product 1',
      description: 'Test product description',
      quantity: 2,
      price: 29.99,
      size: 'M',
      color: 'Black',
    },
    {
      productId: 'test-product-2',
      productName: 'Test Product 2',
      description: 'Another test product',
      quantity: 1,
      price: 49.99,
      size: 'L',
      color: 'White',
    },
  ],
  subtotal: 109.97,
  shipping: 10.0,
  tax: 7.7,
  total: 127.67,
  currency: 'UYU',
  shippingAddress: mockAddress,
  paymentMethod: 'MercadoPago',
  status: 'pending',
  createdAt: '2024-12-01T10:00:00Z',
  updatedAt: '2024-12-01T10:00:00Z',
  ...overrides,
});

// MercadoPago specific mock data
export const mockMercadoPagoResponse = {
  success: {
    init_point: 'https://sandbox.mercadopago.com.uy/checkout/v1/redirect?pref_id=123456',
    id: 'MP-ORDER-123456',
    status: 'pending',
    preference_id: 'MP-PREF-123456',
  },
  error: {
    error: 'Payment initialization failed',
    code: 'PAYMENT_ERROR',
    details: 'Invalid payment data provided',
  },
};

// Mock payment responses for tests
export const mockPaymentResponses = {
  createPreference: {
    success: true,
    data: {
      preference: {
        id: 'pref_123456789',
        initPoint: 'https://pay.mercadopago.com/test_preference',
        externalReference: 'TIF-20241201-123456',
      },
    },
  },
  orderCreation: {
    success: true,
    order: {
      id: 'order-123',
      orderNumber: 'TIF-20241201-123456',
      status: 'PENDING',
      items: mockCartItems,
      subtotal: 89.97,
      shipping: 10.0,
      tax: 0.0,
      total: 99.97,
      currency: 'UYU',
      createdAt: new Date().toISOString(),
    },
  },
  verifyPayment: {
    success: true,
    data: {
      orderId: 'order-123',
      orderNumber: 'TIF-20241201-123456',
      status: 'PAID',
      paymentInfo: {
        id: 'payment_123456789',
        status: 'approved',
        statusDetail: 'accredited',
        amount: 99.97,
        currency: 'UYU',
        paymentMethod: 'visa',
        dateCreated: new Date().toISOString(),
        dateApproved: new Date().toISOString(),
      },
    },
  },
};

// Payment test scenarios for different test cases
export const paymentTestScenarios = {
  successful: {
    user: mockUserData,
    address: mockAddress,
    cart: mockCartItems,
    expectedOutcome: 'success',
  },
  invalidCard: {
    user: mockUserData,
    address: mockAddress,
    cart: mockCartItems,
    expectedOutcome: 'card_error',
  },
  insufficientFunds: {
    user: mockUserData,
    address: mockAddress,
    cart: mockCartItems,
    expectedOutcome: 'insufficient_funds',
  },
  networkError: {
    user: mockUserData,
    address: mockAddress,
    cart: mockCartItems,
    expectedOutcome: 'network_error',
  },
  failedPayment: {
    user: mockUserData,
    address: mockAddress,
    cart: mockCartItems,
    expectedOutcome: 'payment_failed',
    deepLink:
      'tifossi://payment/failure?payment_id=payment_123&external_reference=TIF-20241201-123456&status=rejected',
  },
};

// Payment flow utilities for tests
export const paymentFlowUtils = {
  setupCartWithProducts: () => mockCartItems,
  setupAuthenticatedUser: () => ({
    user: mockUserData,
    token: 'mock-jwt-token',
  }),
  setupShippingAddress: () => mockAddress,
  createCompleteOrderFlow: () => ({
    cartItems: mockCartItems,
    user: mockUserData,
    address: mockAddress,
    orderData: createMockOrderData(),
  }),
  simulateSuccessfulPayment: () => ({
    ...mockPaymentResponses.verifyPayment.data,
    status: 'PAID',
  }),
  simulateFailedPayment: (reason = 'generic') => ({
    success: false,
    error: `Payment failed: ${reason}`,
    code: 'PAYMENT_ERROR',
  }),
};

// Expected WebView configuration for payment testing
export const expectedWebViewConfig = {
  source: { uri: mockMercadoPagoResponse.success.init_point },
  style: { flex: 1 },
  onNavigationStateChange: expect.any(Function),
  javaScriptEnabled: true,
  domStorageEnabled: true,
  startInLoadingState: true,
};

// Add default export to fix router warnings
const paymentMockData = {
  name: 'PaymentMockData',
  version: '1.0.0',
  mockCartItems,
  mockUserData,
  mockAddress,
  createMockOrderData,
  mockMercadoPagoResponse,
};

export default paymentMockData;
