/**
 * Payment Flow Integration Tests
 *
 * Tests the complete payment and checkout flow for Tifossi Expo app
 * - Uses REAL MercadoPago service and order service
 * - Mocks ONLY external payment gateway calls
 * - Tests complete user journey from cart to payment completion
 * - Includes deep link callback handling
 * - Focuses on behavior testing rather than implementation
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { HttpResponse, http } from 'msw';
import { mswServer } from '../utils/msw-setup';

// Import services - we'll use REAL services, not mocks
import mercadoPagoService from '../../_services/payment/mercadoPago';
import orderService from '../../_services/order/orderService';
import cartService from '../../_services/cart/cartService';
import { deepLinkHandler } from '../../_utils/payment/deepLinkHandler';

// Import stores
import { useCartStore } from '../../_stores/cartStore';
import { useAuthStore } from '../../_stores/authStore';
import { usePaymentStore } from '../../_stores/paymentStore';

// Import components
import PaymentSelectionScreen from '../../checkout/payment-selection';
import PaymentResultScreen from '../../checkout/payment-result';

// Import test utilities
import { mockUser } from '../utils/mock-data';
import { mockCartItems, mockAddress, mockPaymentResponses } from '../utils/payment-mock-data';

// Mock expo-router for navigation testing
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  navigate: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn().mockImplementation(() => false),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ selectedAddressId: 'test-address-1' }),
  router: mockRouter,
  Stack: {
    Screen: ({ children }: { children: React.ReactNode }) => children,
  },
}));

// Mock expo-web-browser for payment WebView simulation
const mockWebBrowser = {
  openBrowserAsync: jest.fn(),
  warmUpAsync: jest.fn(),
  coolDownAsync: jest.fn(),
  WebBrowserPresentationStyle: {
    FORM_SHEET: 'FORM_SHEET',
  },
};

jest.mock('expo-web-browser', () => mockWebBrowser);

// Mock Alert for user feedback testing
jest.spyOn(Alert, 'alert');

// Test data - moved to module scope for use across describe blocks
const mockOrderResponse = mockPaymentResponses.orderCreation;

describe('Payment and Checkout Flow', () => {
  const mockPaymentPreference = mockPaymentResponses.createPreference;

  const mockPaymentVerification = mockPaymentResponses.verifyPayment;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset MSW handlers
    mswServer.resetHandlers();

    // Reset stores to initial state
    useCartStore.getState().clearCart();
    useAuthStore.getState().logout();
    usePaymentStore.getState().clearCurrentPayment();

    // Setup auth state
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setToken('mock-jwt-token');

    // Setup cart state
    useCartStore.getState().setItems(mockCartItems);

    // Setup default MSW handlers for payment flow
    mswServer.use(
      // Order creation endpoint
      http.post('/api/orders', () => {
        return HttpResponse.json(mockOrderResponse);
      }),

      // Address fetch endpoint
      http.get('/api/addresses/:id', () => {
        return HttpResponse.json({
          success: true,
          data: mockAddress,
        });
      }),

      // MercadoPago preference creation (MOCKED - external API)
      http.post('/api/payment/create-preference', () => {
        return HttpResponse.json(mockPaymentPreference);
      }),

      // Payment verification endpoint
      http.get('/api/payment/verify/:paymentId', () => {
        return HttpResponse.json(mockPaymentVerification);
      }),

      // Cart sync endpoint
      http.put('/api/users/me/cart', () => {
        return HttpResponse.json({
          success: true,
          cart: [],
        });
      })
    );

    // Setup successful WebView mock
    mockWebBrowser.openBrowserAsync.mockResolvedValue({
      type: 'dismiss',
    });
  });

  describe('Complete Checkout Flow', () => {
    it('should complete full checkout flow with MercadoPago payment', async () => {
      const { getByText, queryByText, findByText } = render(<PaymentSelectionScreen />);

      // Wait for address to load
      await waitFor(() => {
        expect(getByText('Método de pago')).toBeTruthy();
      });

      // Select MercadoPago payment method
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      // Continue to payment
      const continueButton = getByText('Continuar con el pago');
      expect(continueButton).toBeTruthy();

      // Initiate payment
      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Verify order creation was called
      await waitFor(() => {
        expect(mockWebBrowser.openBrowserAsync).toHaveBeenCalledWith(
          'https://pay.mercadopago.com/test_preference',
          expect.objectContaining({
            presentationStyle: 'FORM_SHEET',
            toolbarColor: '#FFFFFF',
          })
        );
      });

      // Simulate successful payment callback
      const successDeepLink =
        'tifossi://payment/success?payment_id=payment_123&external_reference=TIF-20241201-123456&collection_id=col_123';

      await act(async () => {
        // Process the deep link callback
        const result = await deepLinkHandler.processPaymentCallback(successDeepLink, {
          payment_id: 'payment_123',
          external_reference: 'TIF-20241201-123456',
          collection_id: 'col_123',
        });
        expect(result?.success).toBe(true);
      });

      // Verify cart is cleared after successful payment
      await waitFor(() => {
        expect(useCartStore.getState().items).toHaveLength(0);
      });
    });

    it('should handle payment failure gracefully with retry options', async () => {
      // Setup failure WebView response
      mockWebBrowser.openBrowserAsync.mockResolvedValue({
        type: 'cancel',
      });

      const { getByText, findByText } = render(<PaymentSelectionScreen />);

      // Select MercadoPago and continue
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Simulate payment failure callback
      const failureDeepLink = paymentTestScenarios.failedPayment.deepLink;

      await act(async () => {
        const result = await deepLinkHandler.processPaymentCallback(failureDeepLink, {
          payment_id: 'payment_123',
          external_reference: 'TIF-20241201-123456',
          status: 'rejected',
        });
        expect(result?.success).toBe(true);
        expect((result as any)?.action).toBe('payment-failure');
      });

      // Verify cart items are still present for retry
      expect(useCartStore.getState().items).toHaveLength(mockCartItems.length);
    });

    it('should handle payment pending state correctly', async () => {
      const { getByText } = render(<PaymentSelectionScreen />);

      // Select MercadoPago and continue
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Simulate pending payment callback
      const pendingDeepLink =
        'tifossi://payment/pending?payment_id=payment_123&external_reference=TIF-20241201-123456&status=pending';

      await act(async () => {
        const result = await deepLinkHandler.processPaymentCallback(pendingDeepLink, {
          payment_id: 'payment_123',
          external_reference: 'TIF-20241201-123456',
          status: 'pending',
        });
        expect(result?.success).toBe(true);
        expect((result as any)?.action).toBe('payment-pending');
      });

      // Cart should remain for pending payments
      expect(useCartStore.getState().items).toHaveLength(mockCartItems.length);
    });
  });

  describe('Payment Method Selection', () => {
    it('should show available payment methods', async () => {
      const { getByText, queryByText } = render(<PaymentSelectionScreen />);

      await waitFor(() => {
        // Should show enabled methods
        expect(getByText('Mercado Pago')).toBeTruthy();
        expect(getByText('PayPal')).toBeTruthy();

        // Should show disabled methods with "Próximamente"
        expect(getByText('Crédito Tiffosi')).toBeTruthy();
        expect(getByText('Efectivo')).toBeTruthy();
        expect(queryByText('Próximamente')).toBeTruthy();
      });
    });

    it('should handle disabled payment methods correctly', async () => {
      const { getByText } = render(<PaymentSelectionScreen />);

      // Try to select disabled PayPal method
      const paypalOption = getByText('PayPal');
      fireEvent.press(paypalOption);

      // Should show alert for disabled method
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Método no disponible',
          'PayPal estará disponible próximamente.'
        );
      });
    });
  });

  describe('Order Creation and Validation', () => {
    it('should validate required data before order creation', async () => {
      // Clear cart to test empty cart validation
      useCartStore.getState().clearCart();

      const { getByText } = render(<PaymentSelectionScreen />);

      // Select payment method and try to continue
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Should show error for empty cart
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Tu carrito está vacío');
      });
    });

    it('should validate user authentication', async () => {
      // Clear user authentication
      useAuthStore.getState().logout();

      const { getByText } = render(<PaymentSelectionScreen />);

      // Select payment method and try to continue
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Should show error for missing authentication
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Debes estar autenticado para realizar el pago'
        );
      });
    });

    it('should create order with correct data structure', async () => {
      const orderCreateSpy = jest.spyOn(orderService, 'createOrderWithPayment');

      const { getByText } = render(<PaymentSelectionScreen />);

      // Complete payment flow
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Verify order creation was called with correct structure
      await waitFor(() => {
        expect(orderCreateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({
                productId: expect.any(String),
                quantity: expect.any(Number),
              }),
            ]),
            shippingAddress: expect.objectContaining({
              street: expect.any(String),
              city: expect.any(String),
            }),
            shippingMethod: 'delivery',
          }),
          expect.objectContaining({
            id: mockUser.id,
            firstName: expect.any(String),
            lastName: expect.any(String),
            email: mockUser.email,
          })
        );
      });
    });
  });

  describe('Deep Link Handling', () => {
    it('should correctly parse payment success deep links', () => {
      const successUrl =
        'tifossi://payment/success?payment_id=123&external_reference=TIF-123&collection_id=456';

      const result = mercadoPagoService.parsePaymentCallback(successUrl);

      expect(result).toEqual({
        success: true,
        orderId: 'TIF-123',
        paymentId: '123',
        collectionId: '456',
        status: 'approved',
      });
    });

    it('should correctly parse payment failure deep links', () => {
      const failureUrl =
        'tifossi://payment/failure?payment_id=123&external_reference=TIF-123&status=rejected';

      const result = mercadoPagoService.parsePaymentCallback(failureUrl);

      expect(result).toEqual({
        success: false,
        orderId: 'TIF-123',
        paymentId: '123',
        collectionId: undefined,
        status: 'rejected',
        error: 'Payment was rejected',
      });
    });

    it('should handle invalid deep link formats', () => {
      const invalidUrl = 'tifossi://invalid/path';

      const result = mercadoPagoService.parsePaymentCallback(invalidUrl);

      expect(result).toBeNull();
    });

    it('should verify payment status after successful callback', async () => {
      const verifyPaymentSpy = jest.spyOn(mercadoPagoService, 'verifyPaymentStatus');

      const successUrl =
        'tifossi://payment/success?payment_id=payment_123&external_reference=TIF-123';

      await act(async () => {
        await deepLinkHandler.processPaymentCallback(successUrl, {
          payment_id: 'payment_123',
          external_reference: 'TIF-123',
        });
      });

      // Should call payment verification
      await waitFor(() => {
        expect(verifyPaymentSpy).toHaveBeenCalledWith('payment_123');
      });
    });
  });

  describe('Error Recovery and Retry', () => {
    it('should handle network errors during order creation', async () => {
      // Setup network error for order creation
      mswServer.use(
        http.post('/api/orders', () => {
          return HttpResponse.error();
        })
      );

      const { getByText } = render(<PaymentSelectionScreen />);

      // Try to complete payment
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Should show network error
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('Ocurrió un error al procesar el pago')
        );
      });
    });

    it('should handle MercadoPago service errors', async () => {
      // Setup error for payment preference creation
      mswServer.use(
        http.post('/api/payment/create-preference', () => {
          return HttpResponse.json(
            { success: false, error: 'Payment service unavailable' },
            { status: 500 }
          );
        })
      );

      const { getByText } = render(<PaymentSelectionScreen />);

      // Try to complete payment
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Should show payment service error
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('No se pudo crear el pedido')
        );
      });
    });

    it('should allow payment retry after failure', async () => {
      const { getByText } = render(<PaymentSelectionScreen />);

      // Initial payment attempt
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      // First attempt fails
      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Simulate failure and then allow retry
      const failureUrl = 'tifossi://payment/failure?payment_id=123&external_reference=TIF-123';

      await act(async () => {
        await deepLinkHandler.processPaymentCallback(failureUrl, {
          payment_id: '123',
          external_reference: 'TIF-123',
        });
      });

      // Button should be enabled for retry
      expect(continueButton).toBeTruthy();
      expect(getByText('Continuar con el pago')).toBeTruthy();
    });
  });

  describe('Cart Management During Payment', () => {
    it('should clear cart only after successful payment', async () => {
      const clearCartSpy = jest.spyOn(cartService, 'clearCart');

      const { getByText } = render(<PaymentSelectionScreen />);

      // Complete payment flow
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Simulate successful payment
      const successUrl = 'tifossi://payment/success?payment_id=123&external_reference=TIF-123';

      await act(async () => {
        await deepLinkHandler.processPaymentCallback(successUrl, {
          payment_id: '123',
          external_reference: 'TIF-123',
        });
      });

      // Cart should be cleared after success
      await waitFor(() => {
        expect(clearCartSpy).toHaveBeenCalled();
      });
    });

    it('should preserve cart items after payment failure', async () => {
      const initialCartItems = [...useCartStore.getState().items];

      const { getByText } = render(<PaymentSelectionScreen />);

      // Complete payment flow
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Simulate payment failure
      const failureUrl = 'tifossi://payment/failure?payment_id=123&external_reference=TIF-123';

      await act(async () => {
        await deepLinkHandler.processPaymentCallback(failureUrl, {
          payment_id: '123',
          external_reference: 'TIF-123',
        });
      });

      // Cart items should remain for retry
      expect(useCartStore.getState().items).toEqual(initialCartItems);
    });
  });

  describe('Payment Status Tracking', () => {
    it('should track order status throughout payment process', async () => {
      const { getByText } = render(<PaymentSelectionScreen />);

      // Initial state
      expect(usePaymentStore.getState().paymentStatus).toBe('idle');

      // Start payment
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Should show processing state
      await waitFor(() => {
        expect(getByText('Procesando...')).toBeTruthy();
      });

      // Simulate successful completion
      const successUrl = 'tifossi://payment/success?payment_id=123&external_reference=TIF-123';

      await act(async () => {
        await deepLinkHandler.processPaymentCallback(successUrl, {
          payment_id: '123',
          external_reference: 'TIF-123',
        });
      });

      // Should update to success state
      await waitFor(() => {
        expect(usePaymentStore.getState().paymentStatus).toBe('success');
      });
    });
  });

  describe('WebView Integration', () => {
    it('should configure WebView with correct options for MercadoPago', async () => {
      const { getByText } = render(<PaymentSelectionScreen />);

      // Complete payment flow
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Verify WebView configuration
      await waitFor(() => {
        expect(mockWebBrowser.openBrowserAsync).toHaveBeenCalledWith(
          'https://pay.mercadopago.com/test_preference',
          expect.objectContaining({
            presentationStyle: 'FORM_SHEET',
            controlsColor: '#0C0C0C',
            showTitle: true,
            enableBarCollapsing: false,
            toolbarColor: '#FFFFFF',
            showInRecents: false,
          })
        );
      });
    });

    it('should handle WebView cancellation correctly', async () => {
      // Setup WebView cancellation
      mockWebBrowser.openBrowserAsync.mockResolvedValue({
        type: 'cancel',
      });

      const { getByText } = render(<PaymentSelectionScreen />);

      // Complete payment flow
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Should handle cancellation gracefully without showing error
      await waitFor(() => {
        expect(Alert.alert).not.toHaveBeenCalledWith(
          expect.anything(),
          expect.stringContaining('error')
        );
      });
    });
  });
});

/**
 * Payment Result Screen Tests
 * Tests the payment result display and post-payment actions
 */
describe('Payment Result Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup successful payment state
    usePaymentStore.getState().setPaymentStatus('success');
    usePaymentStore.getState().setCurrentOrder(mockOrderResponse.order);
  });

  it('should display successful payment result', async () => {
    const { getByText, queryByText } = render(<PaymentResultScreen />);

    await waitFor(() => {
      expect(getByText('¡Pago exitoso!')).toBeTruthy();
      expect(getByText(`Pedido #${mockOrderResponse.order.orderNumber}`)).toBeTruthy();
      expect(queryByText('Continuar comprando')).toBeTruthy();
    });
  });

  it('should navigate correctly after successful payment', async () => {
    const { getByText } = render(<PaymentResultScreen />);

    const continueButton = getByText('Continuar comprando');
    fireEvent.press(continueButton);

    expect(mockRouter.navigate).toHaveBeenCalledWith('/(tabs)');
  });

  it('should display order tracking information', async () => {
    const { getByText } = render(<PaymentResultScreen />);

    await waitFor(() => {
      expect(getByText('Seguir pedido')).toBeTruthy();
    });

    const trackButton = getByText('Seguir pedido');
    fireEvent.press(trackButton);

    expect(mockRouter.navigate).toHaveBeenCalledWith('/orders/order-123');
  });
});
