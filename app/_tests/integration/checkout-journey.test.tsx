/**
 * Complete End-to-End Checkout Journey Tests
 *
 * Tests the complete user checkout experience from cart to order confirmation:
 * - Full checkout flow with real services
 * - Cart to shipping address selection
 * - Address selection to payment method
 * - Payment processing to order confirmation
 * - Error recovery throughout the journey
 * - Multiple payment scenarios and deep link handling
 * - Order tracking and status updates
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { HttpResponse, http } from 'msw';
import { mswServer } from '../utils/msw-setup';

// Import real services for integration testing
import mercadoPagoService from '../../_services/payment/mercadoPago';
import orderService from '../../_services/order/orderService';
import cartService from '../../_services/cart/cartService';
import { deepLinkHandler } from '../../_utils/payment/deepLinkHandler';

// Import stores
import { useCartStore } from '../../_stores/cartStore';
import { useAuthStore } from '../../_stores/authStore';
import { usePaymentStore } from '../../_stores/paymentStore';

// Import checkout screens
import ShippingAddressScreen from '../../checkout/shipping-address';
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
  useLocalSearchParams: () => ({ selectedAddressId: 'address-1' }),
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

// Mock deep linking
const mockLinking = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getInitialURL: jest.fn(),
  openURL: jest.fn(),
};

jest.mock('react-native/Libraries/Linking/Linking', () => mockLinking);

// Mock Alert for user feedback testing
jest.spyOn(Alert, 'alert');

describe('Complete Checkout Journey Integration', () => {
  const mockAddresses = [
    {
      ...mockAddress,
      id: 'address-1',
      street: '123 Main Street',
      city: 'Montevideo',
      isDefault: true,
    },
    {
      ...mockAddress,
      id: 'address-2',
      street: '456 Oak Avenue',
      city: 'Punta del Este',
      isDefault: false,
    },
  ];

  const setupSuccessfulCheckoutFlow = () => {
    mswServer.use(
      // Address endpoints
      http.get('/api/addresses', () => {
        return HttpResponse.json({
          success: true,
          data: mockAddresses,
        });
      }),

      http.get('/api/addresses/:id', ({ params }) => {
        const { id } = params;
        const address = mockAddresses.find((addr) => addr.id === id);
        return HttpResponse.json({
          success: true,
          data: address,
        });
      }),

      // Order creation
      http.post('/api/orders', () => {
        return HttpResponse.json(mockPaymentResponses.orderCreation);
      }),

      // Payment preference creation
      http.post('/api/payment/create-preference', () => {
        return HttpResponse.json(mockPaymentResponses.createPreference);
      }),

      // Payment verification
      http.get('/api/payment/verify/:paymentId', () => {
        return HttpResponse.json(mockPaymentResponses.verifyPayment);
      }),

      // Cart sync
      http.put('/api/users/me/cart', () => {
        return HttpResponse.json({
          success: true,
          cart: [],
        });
      }),

      // Order status updates
      http.get('/api/orders/:orderId', ({ params }) => {
        const { orderId } = params;
        return HttpResponse.json({
          success: true,
          data: {
            ...mockPaymentResponses.orderCreation.order,
            id: orderId,
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
          },
        });
      })
    );
  };

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

    // Setup successful WebView mock by default
    mockWebBrowser.openBrowserAsync.mockResolvedValue({
      type: 'dismiss',
    });

    // Setup successful checkout flow by default
    setupSuccessfulCheckoutFlow();
  });

  describe('Complete Successful Checkout Journey', () => {
    it('should complete full checkout from cart to order confirmation', async () => {
      // Step 1: Shipping Address Selection
      const { getByText: getAddressText, unmount: unmountAddress } = render(
        <ShippingAddressScreen />
      );

      // Wait for addresses to load
      await waitFor(() => {
        expect(getAddressText('Mis direcciones')).toBeTruthy();
      });

      // Verify default address is selected
      expect(getAddressText('123 Main Street, Montevideo')).toBeTruthy();
      expect(getAddressText('Por defecto')).toBeTruthy();

      // Continue to payment selection
      const continueButton = getAddressText('Siguiente');
      fireEvent.press(continueButton);

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/checkout/payment-selection',
        params: { selectedAddressId: 'address-1' },
      });

      unmountAddress();

      // Step 2: Payment Method Selection
      const { getByText: getPaymentText, unmount: unmountPayment } = render(
        <PaymentSelectionScreen />
      );

      // Wait for payment methods to load
      await waitFor(() => {
        expect(getPaymentText('Método de pago')).toBeTruthy();
      });

      // Select MercadoPago payment method
      const mercadoPagoOption = getPaymentText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      // Continue with payment
      const paymentContinueButton = getPaymentText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(paymentContinueButton);
      });

      // Verify WebView was opened for payment
      await waitFor(() => {
        expect(mockWebBrowser.openBrowserAsync).toHaveBeenCalledWith(
          'https://pay.mercadopago.com/test_preference',
          expect.objectContaining({
            presentationStyle: 'FORM_SHEET',
          })
        );
      });

      unmountPayment();

      // Step 3: Payment Processing and Callback
      const successDeepLink =
        'tifossi://payment/success?payment_id=payment_123&external_reference=TIF-20241201-123456&collection_id=col_123';

      await act(async () => {
        // Simulate successful payment callback
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

      // Step 4: Payment Result Display
      usePaymentStore.getState().setPaymentStatus('success');
      usePaymentStore.getState().setCurrentOrder(mockPaymentResponses.orderCreation.order);

      const { getByText: getResultText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getResultText('¡Pago exitoso!')).toBeTruthy();
        expect(
          getResultText(`Pedido #${mockPaymentResponses.orderCreation.order.orderNumber}`)
        ).toBeTruthy();
      });

      // Verify navigation options are available
      expect(getResultText('Continuar comprando')).toBeTruthy();
      expect(getResultText('Seguir pedido')).toBeTruthy();
    });

    it('should handle address change during checkout', async () => {
      // Start with shipping address selection
      const { getByText } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Mis direcciones')).toBeTruthy();
      });

      // Select non-default address
      const secondAddress = getByText('456 Oak Avenue, Punta del Este');
      fireEvent.press(secondAddress);

      // Continue to payment
      const continueButton = getByText('Siguiente');
      fireEvent.press(continueButton);

      // Verify correct address is passed to payment screen
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/checkout/payment-selection',
        params: { selectedAddressId: 'address-2' },
      });
    });

    it('should maintain checkout state across screen transitions', async () => {
      // Verify cart items persist through address selection
      const { getByText } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Mis direcciones')).toBeTruthy();
      });

      // Cart should still have items
      expect(useCartStore.getState().items).toHaveLength(mockCartItems.length);

      // Continue to payment
      const continueButton = getByText('Siguiente');
      fireEvent.press(continueButton);

      // Cart should still be intact
      expect(useCartStore.getState().items).toHaveLength(mockCartItems.length);
    });
  });

  describe('Error Recovery Throughout Journey', () => {
    it('should handle address loading failure and allow retry', async () => {
      // Setup initial address loading failure
      mswServer.use(
        http.get('/api/addresses', () => {
          return HttpResponse.error();
        })
      );

      const { getByText, queryByText } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Failed to load addresses. Please try again.')).toBeTruthy();
      });

      // Should show retry option
      expect(getByText('Reintentar')).toBeTruthy();

      // Setup successful retry
      mswServer.use(
        http.get('/api/addresses', () => {
          return HttpResponse.json({
            success: true,
            data: mockAddresses,
          });
        })
      );

      // Retry address loading
      const retryButton = getByText('Reintentar');
      await act(async () => {
        fireEvent.press(retryButton);
      });

      // Should eventually show addresses
      await waitFor(() => {
        expect(getByText('Mis direcciones')).toBeTruthy();
      });

      // Error should be gone
      expect(queryByText('Failed to load addresses. Please try again.')).toBeNull();
    });

    it('should handle payment creation failure and allow retry', async () => {
      // Setup payment failure
      mswServer.use(
        http.post('/api/payment/create-preference', () => {
          return HttpResponse.json(
            { success: false, error: 'Payment service unavailable' },
            { status: 500 }
          );
        })
      );

      const { getByText } = render(<PaymentSelectionScreen />);

      await waitFor(() => {
        expect(getByText('Método de pago')).toBeTruthy();
      });

      // Try to initiate payment
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Should show error message
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('No se pudo crear el pedido')
        );
      });

      // Cart should still be available for retry
      expect(useCartStore.getState().items).toHaveLength(mockCartItems.length);
    });

    it('should handle payment processing failure and preserve cart', async () => {
      const { getByText } = render(<PaymentSelectionScreen />);

      await waitFor(() => {
        expect(getByText('Método de pago')).toBeTruthy();
      });

      // Initiate payment
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Simulate payment failure callback
      const failureDeepLink =
        'tifossi://payment/failure?payment_id=123&external_reference=TIF-123&status=rejected';

      await act(async () => {
        deepLinkHandler.processPaymentCallback(failureDeepLink, {
          payment_id: '123',
          external_reference: 'TIF-123',
          status: 'rejected',
        });
      });

      // Cart should be preserved for retry
      expect(useCartStore.getState().items).toHaveLength(mockCartItems.length);

      // Should be able to retry payment
      expect(getByText('Continuar con el pago')).toBeTruthy();
    });
  });

  describe('Multiple Payment Scenarios', () => {
    it('should handle pending payment status correctly', async () => {
      const { getByText } = render(<PaymentSelectionScreen />);

      await waitFor(() => {
        expect(getByText('Método de pago')).toBeTruthy();
      });

      // Initiate payment
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Simulate pending payment callback
      const pendingDeepLink =
        'tifossi://payment/pending?payment_id=123&external_reference=TIF-123&status=pending';

      await act(async () => {
        const result = await deepLinkHandler.processPaymentCallback(pendingDeepLink, {
          payment_id: '123',
          external_reference: 'TIF-123',
          status: 'pending',
        });
        expect(result?.success).toBe(true);
        expect((result as any)?.action).toBe('payment-pending');
      });

      // Cart should remain for pending payments
      expect(useCartStore.getState().items).toHaveLength(mockCartItems.length);

      // Payment status should be set to pending
      expect(usePaymentStore.getState().paymentStatus).toBe('pending');
    });

    it('should handle WebView cancellation gracefully', async () => {
      // Setup WebView cancellation
      mockWebBrowser.openBrowserAsync.mockResolvedValue({
        type: 'cancel',
      });

      const { getByText } = render(<PaymentSelectionScreen />);

      await waitFor(() => {
        expect(getByText('Método de pago')).toBeTruthy();
      });

      // Initiate payment
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Should handle cancellation without showing error
      await waitFor(() => {
        expect(Alert.alert).not.toHaveBeenCalledWith(
          expect.anything(),
          expect.stringContaining('error')
        );
      });

      // Cart should remain intact
      expect(useCartStore.getState().items).toHaveLength(mockCartItems.length);
    });
  });

  describe('Order Tracking and Status Updates', () => {
    it('should track order status throughout process', async () => {
      const { getByText } = render(<PaymentSelectionScreen />);

      // Initial payment status
      expect(usePaymentStore.getState().paymentStatus).toBe('idle');

      await waitFor(() => {
        expect(getByText('Método de pago')).toBeTruthy();
      });

      // Start payment process
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

      // Complete payment
      const successDeepLink = 'tifossi://payment/success?payment_id=123&external_reference=TIF-123';

      await act(async () => {
        deepLinkHandler.processPaymentCallback(successDeepLink, {
          payment_id: '123',
          external_reference: 'TIF-123',
        });
      });

      // Should update to success state
      await waitFor(() => {
        expect(usePaymentStore.getState().paymentStatus).toBe('success');
      });
    });

    it('should provide order tracking navigation', async () => {
      // Setup successful payment result state
      usePaymentStore.getState().setPaymentStatus('success');
      usePaymentStore.getState().setCurrentOrder(mockPaymentResponses.orderCreation.order);

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('¡Pago exitoso!')).toBeTruthy();
      });

      // Click track order button
      const trackButton = getByText('Seguir pedido');
      fireEvent.press(trackButton);

      // Should navigate to order tracking
      expect(mockRouter.navigate).toHaveBeenCalledWith('/orders/order-123');
    });

    it('should handle order status verification', async () => {
      const verifyPaymentSpy = jest.spyOn(mercadoPagoService, 'verifyPaymentStatus');

      const successDeepLink =
        'tifossi://payment/success?payment_id=payment_123&external_reference=TIF-123';

      await act(async () => {
        deepLinkHandler.processPaymentCallback(successDeepLink, {
          payment_id: 'payment_123',
          external_reference: 'TIF-123',
        });
      });

      // Should verify payment status
      await waitFor(() => {
        expect(verifyPaymentSpy).toHaveBeenCalledWith('payment_123');
      });
    });
  });

  describe('Data Consistency and State Management', () => {
    it('should maintain consistent order data across screens', async () => {
      const orderCreateSpy = jest.spyOn(orderService, 'createOrderWithPayment');

      const { getByText } = render(<PaymentSelectionScreen />);

      await waitFor(() => {
        expect(getByText('Método de pago')).toBeTruthy();
      });

      // Complete payment flow
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Verify order was created with correct data structure
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
          }),
          expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
          })
        );
      });
    });

    it('should clean up cart only after confirmed payment', async () => {
      const clearCartSpy = jest.spyOn(cartService, 'clearCart');

      const { getByText } = render(<PaymentSelectionScreen />);

      await waitFor(() => {
        expect(getByText('Método de pago')).toBeTruthy();
      });

      // Start payment process
      const mercadoPagoOption = getByText('Mercado Pago');
      fireEvent.press(mercadoPagoOption);

      const continueButton = getByText('Continuar con el pago');

      await act(async () => {
        fireEvent.press(continueButton);
      });

      // Cart should not be cleared yet
      expect(clearCartSpy).not.toHaveBeenCalled();

      // Complete successful payment
      const successDeepLink = 'tifossi://payment/success?payment_id=123&external_reference=TIF-123';

      await act(async () => {
        deepLinkHandler.processPaymentCallback(successDeepLink, {
          payment_id: '123',
          external_reference: 'TIF-123',
        });
      });

      // Now cart should be cleared
      await waitFor(() => {
        expect(clearCartSpy).toHaveBeenCalled();
      });
    });
  });

  describe('User Experience Flow Validation', () => {
    it('should provide clear progress indication throughout checkout', async () => {
      // Address selection screen should show clear title
      const { getByText: getAddressText, unmount: unmountAddress } = render(
        <ShippingAddressScreen />
      );

      await waitFor(() => {
        expect(getAddressText('Direcciones de envío')).toBeTruthy();
      });

      unmountAddress();

      // Payment selection should show clear title
      const { getByText: getPaymentText, unmount: unmountPayment } = render(
        <PaymentSelectionScreen />
      );

      await waitFor(() => {
        expect(getPaymentText('Método de pago')).toBeTruthy();
      });

      unmountPayment();

      // Payment result should show clear confirmation
      usePaymentStore.getState().setPaymentStatus('success');
      usePaymentStore.getState().setCurrentOrder(mockPaymentResponses.orderCreation.order);

      const { getByText: getResultText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getResultText('¡Pago exitoso!')).toBeTruthy();
      });
    });

    it('should handle navigation back and forth correctly', async () => {
      const { getByText } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Direcciones de envío')).toBeTruthy();
      });

      // Should be able to go back
      const backButton = getByText('Atrás');
      fireEvent.press(backButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });
});
