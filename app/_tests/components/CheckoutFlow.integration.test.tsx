/**
 * Checkout Flow Integration Tests
 *
 * Tests the complete checkout flow with real dependencies:
 * - Real cart, auth, and payment store integration
 * - Address management and selection
 * - Payment method selection and processing
 * - MercadoPago integration
 * - Deep link payment callback handling
 * - Complete user checkout journey
 *
 * Testing Philosophy:
 * - Test complete checkout workflows
 * - Use real stores and services
 * - Mock only network responses and external SDKs
 * - Test user payment journey end-to-end
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { mswServer } from '../utils/msw-setup';
import { mockUser, mockCartItem } from '../utils/mock-data';
import ShippingAddressScreen from '../../checkout/shipping-address';
import PaymentSelectionScreen from '../../checkout/payment-selection';
import { useAuthStore } from '../../_stores/authStore';
import { useCartStore } from '../../_stores/cartStore';
import { usePaymentStore } from '../../_stores/paymentStore';
import { Address } from '../../_services/address/addressService';
import { testLifecycleHelpers } from '../utils/test-setup';

// Mock expo-router
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: mockPush,
    back: mockBack,
    navigate: mockNavigate,
  },
  useLocalSearchParams: () => ({ selectedAddressId: 'address-1' }),
  Stack: {
    Screen: ({ options }: any) => <div data-testid="stack-screen" {...options} />,
  },
}));

// Mock React Native components for testing
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    ScrollView: ({ children, ...props }: any) => <RN.View {...props}>{children}</RN.View>,
    SafeAreaView: ({ children, ...props }: any) => <RN.View {...props}>{children}</RN.View>,
    ActivityIndicator: ({ color, size }: any) => (
      <div data-testid="loading-indicator" style={{ color, fontSize: size }}>
        Loading...
      </div>
    ),
    Image: ({ source, style }: any) => (
      <div data-testid="payment-icon" style={style}>
        {source?.uri || 'payment-icon'}
      </div>
    ),
    Alert: {
      alert: jest.fn(),
    },
  };
});

// Mock SVG components
jest.mock('../../../assets/icons/close.svg', () => 'CloseSVG');
jest.mock('../../../assets/icons/plus_circle.svg', () => 'PlusCircleSVG');

// Mock UI components
jest.mock('../../_components/ui/form/RadioButton', () => ({ selected, disabled }: any) => (
  <div
    data-testid={`radio-button-${selected ? 'selected' : 'unselected'}`}
    className={disabled ? 'disabled' : ''}
  >
    {selected ? '●' : '○'}
  </div>
));

// Mock payment utilities
jest.mock('../../_utils/payment/deepLinkHandler', () => ({
  PaymentDeepLinks: {
    initialize: jest.fn(),
    stopListening: jest.fn(),
  },
}));

describe('Checkout Flow Integration Tests', () => {
  // Helper to clear all stores before each test
  const clearStores = () => {
    const authStore = useAuthStore.getState();
    const cartStore = useCartStore.getState();
    const paymentStore = usePaymentStore.getState();

    // Clear auth state
    authStore.isLoggedIn = false;
    authStore.user = null;
    authStore.token = null;
    authStore.isLoading = false;
    authStore.error = null;

    // Clear cart state
    cartStore.items = [];
    cartStore.isLoading = false;
    cartStore.error = null;
    cartStore.isGuestCart = true;

    // Clear payment state
    paymentStore.currentOrder = null;
    paymentStore.paymentStatus = 'idle';
    paymentStore.isLoading = false;
    paymentStore.error = null;
  };

  // Helper to set up authenticated user with cart
  const setupCheckoutState = () => {
    const authStore = useAuthStore.getState();
    const cartStore = useCartStore.getState();

    authStore.isLoggedIn = true;
    authStore.user = mockUser;
    authStore.token = 'mock-auth-token';

    cartStore.items = [
      {
        ...mockCartItem,
        productId: 'hoodie-1',
        quantity: 2,
        color: 'Blue',
        size: 'M',
      },
      {
        ...mockCartItem,
        productId: 'jeans-1',
        quantity: 1,
        color: 'Black',
        size: 'L',
      },
    ];
  };

  // Test addresses
  const mockAddresses: Address[] = [
    {
      id: 'address-1',
      addressType: 'home',
      firstName: 'John',
      lastName: 'Doe',
      street: '123 Main St',
      number: '123',
      apartment: 'Apt 4B',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country',
      phone: '+1-555-123-4567',
      isDefault: true,
      notes: 'Ring doorbell',
    },
    {
      id: 'address-2',
      addressType: 'work',
      firstName: 'John',
      lastName: 'Doe',
      street: '456 Business Ave',
      number: '456',
      city: 'Business City',
      state: 'BC',
      zipCode: '67890',
      country: 'Test Country',
      phone: '+1-555-987-6543',
      isDefault: false,
    },
  ];

  beforeEach(() => {
    clearStores();
    mswServer.resetHandlers();
    testLifecycleHelpers.setupTest();

    // Clear all mocks
    mockPush.mockClear();
    mockBack.mockClear();
    mockNavigate.mockClear();

    // Clear React Native Alert mock
    const { Alert } = require('react-native');
    Alert.alert.mockClear();
  });

  afterEach(() => {
    testLifecycleHelpers.teardownTest();
  });

  describe('Shipping Address Screen', () => {
    it('should display loading state while fetching addresses', async () => {
      setupCheckoutState();

      mswServer.use(
        http.get('/api/user/addresses', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({ data: mockAddresses });
        })
      );

      render(<ShippingAddressScreen />);

      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
      expect(screen.getByText('Cargando direcciones...')).toBeTruthy();

      await waitFor(() => {
        expect(screen.getByText('Mis direcciones')).toBeTruthy();
      });
    });

    it('should display user addresses with default selection', async () => {
      setupCheckoutState();

      mswServer.use(
        http.get('/api/user/addresses', () => HttpResponse.json({ data: mockAddresses }))
      );

      render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mis direcciones')).toBeTruthy();
        expect(screen.getByText('123 Main St, Apt 4B, Downtown')).toBeTruthy();
        expect(screen.getByText('456 Business Ave, Business City')).toBeTruthy();
        expect(screen.getByText('Por defecto')).toBeTruthy();

        // Default address should be selected
        expect(screen.getByTestId('radio-button-selected')).toBeTruthy();
      });
    });

    it('should allow address selection', async () => {
      setupCheckoutState();

      mswServer.use(
        http.get('/api/user/addresses', () => HttpResponse.json({ data: mockAddresses }))
      );

      render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(screen.getByText('456 Business Ave, Business City')).toBeTruthy();
      });

      // Select different address
      fireEvent.press(screen.getByText('456 Business Ave, Business City'));

      await waitFor(() => {
        // Should update selection
        expect(screen.getAllByTestId('radio-button-selected')).toHaveLength(1);
      });
    });

    it('should navigate to payment selection with selected address', async () => {
      setupCheckoutState();

      mswServer.use(
        http.get('/api/user/addresses', () => HttpResponse.json({ data: mockAddresses }))
      );

      render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(screen.getByText('Siguiente')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Siguiente'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/checkout/payment-selection',
        params: { selectedAddressId: 'address-1' },
      });
    });

    it('should show empty state when no addresses', async () => {
      setupCheckoutState();

      mswServer.use(http.get('/api/user/addresses', () => HttpResponse.json({ data: [] })));

      render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(screen.getByText('Parece que no tienes ninguna dirección guardada.')).toBeTruthy();
        expect(
          screen.getByText('Adiciona tu dirección de envío preferida para recibir tus pedidos.')
        ).toBeTruthy();
        expect(screen.getByText('Adicionar dirección nueva')).toBeTruthy();
      });
    });

    it('should handle address loading errors', async () => {
      setupCheckoutState();

      mswServer.use(http.get('/api/user/addresses', () => HttpResponse.error()));

      render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load addresses. Please try again.')).toBeTruthy();
        expect(screen.getByText('Reintentar')).toBeTruthy();
      });
    });

    it('should retry loading addresses on error', async () => {
      setupCheckoutState();

      let callCount = 0;
      mswServer.use(
        http.get('/api/user/addresses', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.error();
          }
          return HttpResponse.json({ data: mockAddresses });
        })
      );

      render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(screen.getByText('Reintentar')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Reintentar'));

      await waitFor(() => {
        expect(screen.getByText('Mis direcciones')).toBeTruthy();
      });
    });

    it('should navigate to add new address', async () => {
      setupCheckoutState();

      mswServer.use(
        http.get('/api/user/addresses', () => HttpResponse.json({ data: mockAddresses }))
      );

      render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(screen.getByText('Añadir dirección nueva')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Añadir dirección nueva'));

      expect(mockNavigate).toHaveBeenCalledWith('/checkout/new-address');
    });
  });

  describe('Payment Selection Screen', () => {
    it('should display payment methods', async () => {
      setupCheckoutState();

      mswServer.use(
        http.get('/api/user/addresses/address-1', () =>
          HttpResponse.json({ data: mockAddresses[0] })
        )
      );

      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        expect(screen.getByText('Método de pago')).toBeTruthy();
        expect(screen.getByText('Métodos predeterminados')).toBeTruthy();
        expect(screen.getByText('Mercado Pago')).toBeTruthy();
        expect(screen.getByText('PayPal')).toBeTruthy();
        expect(screen.getByText('Otros métodos')).toBeTruthy();
        expect(screen.getByText('Crédito Tiffosi')).toBeTruthy();
        expect(screen.getByText('Efectivo')).toBeTruthy();
      });
    });

    it('should show disabled state for unavailable payment methods', async () => {
      setupCheckoutState();
      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        // PayPal should show "Próximamente"
        expect(screen.getAllByText('Próximamente')).toHaveLength(3); // PayPal, Tiffosi, Efectivo
      });
    });

    it('should allow selection of available payment methods', async () => {
      setupCheckoutState();
      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mercado Pago')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Mercado Pago'));

      await waitFor(() => {
        expect(screen.getByTestId('radio-button-selected')).toBeTruthy();
      });
    });

    it('should show alert for unavailable payment methods', async () => {
      setupCheckoutState();
      const { Alert } = require('react-native');

      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        expect(screen.getByText('PayPal')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('PayPal'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Método no disponible',
        'PayPal estará disponible próximamente.'
      );
    });

    it('should enable continue button when payment method selected', async () => {
      setupCheckoutState();
      render(<PaymentSelectionScreen />);

      // Initially disabled
      await waitFor(() => {
        const continueButton = screen.getByText('Continuar con el pago');
        expect(continueButton.props.disabled).toBe(true);
      });

      // Select payment method
      fireEvent.press(screen.getByText('Mercado Pago'));

      await waitFor(() => {
        const continueButton = screen.getByText('Continuar con el pago');
        expect(continueButton.props.disabled).toBe(false);
      });
    });

    it('should navigate back to shipping address', async () => {
      setupCheckoutState();
      render(<PaymentSelectionScreen />);

      fireEvent.press(screen.getByText('Atrás'));

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('MercadoPago Payment Integration', () => {
    it('should process MercadoPago payment successfully', async () => {
      setupCheckoutState();

      mswServer.use(
        http.get('/api/user/addresses/address-1', () =>
          HttpResponse.json({ data: mockAddresses[0] })
        ),
        http.post('/api/orders/create-with-payment', async ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          expect(authHeader).toBe('Bearer mock-auth-token');

          const body = (await request.json()) as { items?: any[]; shippingAddress?: Address };
          expect(body?.items).toHaveLength(2);
          expect(body?.shippingAddress).toEqual(mockAddresses[0]);

          return HttpResponse.json({
            success: true,
            order: {
              id: 'order-123',
              orderNumber: 'ORD-123',
            },
            paymentUrl: 'https://mercadopago.com/checkout/v1/redirect?pref_id=123',
          });
        }),
        http.post('/api/payments/mercadopago/initiate', () =>
          HttpResponse.json({
            success: true,
            paymentId: 'payment-123',
          })
        )
      );

      render(<PaymentSelectionScreen />);

      // Select MercadoPago
      await waitFor(() => {
        expect(screen.getByText('Mercado Pago')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Mercado Pago'));
      fireEvent.press(screen.getByText('Continuar con el pago'));

      // Should show processing state
      await waitFor(() => {
        expect(screen.getByText('Procesando...')).toBeTruthy();
      });

      await waitFor(() => {
        expect(screen.getByText('Continuar con el pago')).toBeTruthy();
      });
    });

    it('should handle payment processing errors', async () => {
      setupCheckoutState();
      const { Alert } = require('react-native');

      mswServer.use(
        http.get('/api/user/addresses/address-1', () =>
          HttpResponse.json({ data: mockAddresses[0] })
        ),
        http.post('/api/orders/create-with-payment', () =>
          HttpResponse.json({ error: 'Order creation failed' }, { status: 500 })
        )
      );

      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mercado Pago')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Mercado Pago'));
      fireEvent.press(screen.getByText('Continuar con el pago'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'No se pudo crear el pedido');
      });
    });

    it('should validate required data before payment', async () => {
      // User without authentication
      clearStores();
      const { Alert } = require('react-native');

      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mercado Pago')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Mercado Pago'));
      fireEvent.press(screen.getByText('Continuar con el pago'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Debes estar autenticado para realizar el pago'
      );
    });

    it('should validate cart items before payment', async () => {
      const authStore = useAuthStore.getState();
      authStore.isLoggedIn = true;
      authStore.user = mockUser;
      authStore.token = 'mock-auth-token';
      // No cart items

      const { Alert } = require('react-native');
      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        expect(screen.getByText('Mercado Pago')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Mercado Pago'));
      fireEvent.press(screen.getByText('Continuar con el pago'));

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Tu carrito está vacío');
    });
  });

  describe('Complete Checkout Flow', () => {
    it('should complete full checkout workflow: address → payment → processing', async () => {
      setupCheckoutState();

      // Mock address API
      mswServer.use(
        http.get('/api/user/addresses', () => HttpResponse.json({ data: mockAddresses })),
        http.get('/api/user/addresses/address-1', () =>
          HttpResponse.json({ data: mockAddresses[0] })
        ),
        http.post('/api/orders/create-with-payment', () =>
          HttpResponse.json({
            success: true,
            order: {
              id: 'order-123',
              orderNumber: 'ORD-123',
            },
            paymentUrl: 'https://mercadopago.com/checkout/v1/redirect?pref_id=123',
          })
        ),
        http.post('/api/payments/mercadopago/initiate', () =>
          HttpResponse.json({
            success: true,
            paymentId: 'payment-123',
          })
        )
      );

      // Step 1: Shipping Address Screen
      const { rerender } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(screen.getByText('Direcciones de envío')).toBeTruthy();
        expect(screen.getByText('123 Main St, Apt 4B, Downtown')).toBeTruthy();
      });

      // User selects address and continues
      fireEvent.press(screen.getByText('Siguiente'));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/checkout/payment-selection',
        params: { selectedAddressId: 'address-1' },
      });

      // Step 2: Payment Selection Screen
      rerender(<PaymentSelectionScreen />);

      await waitFor(() => {
        expect(screen.getByText('Método de pago')).toBeTruthy();
        expect(screen.getByText('Mercado Pago')).toBeTruthy();
      });

      // User selects payment method
      fireEvent.press(screen.getByText('Mercado Pago'));

      await waitFor(() => {
        const continueButton = screen.getByText('Continuar con el pago');
        expect(continueButton.props.disabled).toBe(false);
      });

      // User initiates payment
      fireEvent.press(screen.getByText('Continuar con el pago'));

      // Should show processing state
      await waitFor(() => {
        expect(screen.getByText('Procesando...')).toBeTruthy();
      });

      // Payment should be processed
      await waitFor(() => {
        expect(screen.getByText('Continuar con el pago')).toBeTruthy();
      });
    });

    it('should handle checkout flow navigation', async () => {
      setupCheckoutState();

      mswServer.use(
        http.get('/api/user/addresses', () => HttpResponse.json({ data: mockAddresses }))
      );

      render(<ShippingAddressScreen />);

      // Test close button
      fireEvent.press(screen.getByTestId('close-button'));
      expect(mockNavigate).toHaveBeenCalledWith('/(tabs)');

      // Test back button
      fireEvent.press(screen.getByText('Atrás'));
      expect(mockBack).toHaveBeenCalled();
    });

    it('should handle guest user checkout attempt', async () => {
      // Clear auth state but keep cart
      const cartStore = useCartStore.getState();
      cartStore.items = [mockCartItem];

      render(<ShippingAddressScreen />);

      await waitFor(() => {
        // Should not crash, but should handle gracefully
        expect(screen.getByText('Direcciones de envío')).toBeTruthy();
      });
    });

    it('should maintain state across navigation', async () => {
      setupCheckoutState();

      mswServer.use(
        http.get('/api/user/addresses', () => HttpResponse.json({ data: mockAddresses })),
        http.get('/api/user/addresses/address-2', () =>
          HttpResponse.json({ data: mockAddresses[1] })
        )
      );

      const { rerender } = render(<ShippingAddressScreen />);

      // Select non-default address
      await waitFor(() => {
        expect(screen.getByText('456 Business Ave, Business City')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('456 Business Ave, Business City'));
      fireEvent.press(screen.getByText('Siguiente'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/checkout/payment-selection',
        params: { selectedAddressId: 'address-2' },
      });

      // Navigation should pass correct address ID
      const mockParams = require('expo-router').useLocalSearchParams;
      mockParams.mockReturnValue({ selectedAddressId: 'address-2' });

      rerender(<PaymentSelectionScreen />);

      // Payment screen should load with correct address
      await waitFor(() => {
        expect(screen.getByText('Método de pago')).toBeTruthy();
      });
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle network interruptions during checkout', async () => {
      setupCheckoutState();

      mswServer.use(http.get('/api/user/addresses', () => HttpResponse.error()));

      render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load addresses. Please try again.')).toBeTruthy();
      });

      // Recovery: fix network and retry
      mswServer.use(
        http.get('/api/user/addresses', () => HttpResponse.json({ data: mockAddresses }))
      );

      fireEvent.press(screen.getByText('Reintentar'));

      await waitFor(() => {
        expect(screen.getByText('Mis direcciones')).toBeTruthy();
      });
    });

    it('should handle rapid user interactions during checkout', async () => {
      setupCheckoutState();

      mswServer.use(
        http.get('/api/user/addresses', () => HttpResponse.json({ data: mockAddresses }))
      );

      render(<ShippingAddressScreen />);

      // Rapidly interact with UI elements
      fireEvent.press(screen.getByText('Siguiente'));
      fireEvent.press(screen.getByText('Atrás'));
      fireEvent.press(screen.getByText('Siguiente'));

      // Should handle gracefully without breaking
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
    });

    it('should clean up resources on component unmount', async () => {
      setupCheckoutState();
      const PaymentDeepLinks = require('../../_utils/payment/deepLinkHandler').PaymentDeepLinks;

      const { unmount } = render(<PaymentSelectionScreen />);

      unmount();

      expect(PaymentDeepLinks.stopListening).toHaveBeenCalled();
    });

    it('should handle payment timeout scenarios', async () => {
      setupCheckoutState();

      mswServer.use(
        http.get('/api/user/addresses/address-1', () =>
          HttpResponse.json({ data: mockAddresses[0] })
        ),
        http.post('/api/orders/create-with-payment', async () => {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return HttpResponse.json({ success: true });
        })
      );

      render(<PaymentSelectionScreen />);

      fireEvent.press(screen.getByText('Mercado Pago'));
      fireEvent.press(screen.getByText('Continuar con el pago'));

      // Should show processing state
      await waitFor(() => {
        expect(screen.getByText('Procesando...')).toBeTruthy();
      });

      // Should handle long-running requests
      expect(screen.getByText('Procesando...')).toBeTruthy();
    });
  });
});
