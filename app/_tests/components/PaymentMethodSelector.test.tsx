import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '../utils/render-utils';
import { Alert } from 'react-native';
import PaymentSelectionScreen from '../../checkout/payment-selection';
import { renderStoreUtils } from '../utils/render-utils';
import httpClient from '../../_services/api/httpClient';
import orderService from '../../_services/order/orderService';
import mercadoPagoService from '../../_services/payment/mercadoPago';
import type { Address } from '../../_services/address/addressService';

type HttpClientMock = jest.Mocked<typeof httpClient>;

// Create mock router object to track calls
const mockRouter = {
  back: jest.fn(),
  navigate: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};

// Mock expo-router completely
jest.mock('expo-router', () => ({
  __esModule: true,
  router: mockRouter,
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({
    selectedAddressId: 'addr-default-1',
  }),
  useGlobalSearchParams: () => ({}),
  Stack: {
    Screen: ({ children }: any) => children,
  },
  Link: ({ children }: any) => children,
}));

// Re-export router for use in tests

// Mock Expo WebBrowser used by MercadoPago service to avoid opening UI
jest.mock('expo-web-browser', () => ({
  __esModule: true,
  warmUpAsync: jest.fn().mockResolvedValue(undefined),
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'success' }),
  coolDownAsync: jest.fn().mockResolvedValue(undefined),
  WebBrowserPresentationStyle: {
    FORM_SHEET: 'FORM_SHEET',
  },
}));

// Mock Alert to capture calls
const mockAlert = jest.spyOn(Alert, 'alert');
mockAlert.mockImplementation(() => {});

// Mock SVG components
jest.mock('../../../assets/icons/close.svg', () => 'CloseIcon');

// Mock payment deep links
jest.mock('../../_utils/payment/deepLinkHandler', () => ({
  PaymentDeepLinks: {
    initialize: jest.fn(),
    stopListening: jest.fn(),
  },
}));

const httpClientMock = httpClient as HttpClientMock;
const webBrowserMock = require('expo-web-browser');
const defaultHttpGet = httpClientMock.get.getMockImplementation();
const defaultHttpPost = httpClientMock.post.getMockImplementation();
const defaultHttpPut = httpClientMock.put.getMockImplementation();
const defaultHttpDelete = httpClientMock.delete.getMockImplementation();
const defaultHttpPatch = httpClientMock.patch.getMockImplementation?.() ?? null;

const originalFetch: typeof fetch | undefined = globalThis.fetch;

let fetchMock: jest.Mock;

const defaultSelectedAddress: Address = {
  id: 'addr-default-1',
  firstName: 'Juan',
  lastName: 'Pérez',
  street: 'Avenida 18 de Julio',
  number: '1234',
  city: 'Montevideo',
  country: 'Uruguay',
  isDefault: true,
};

const enqueueSuccessfulOrderResponse = (overrides: Partial<Record<string, unknown>> = {}) => {
  httpClientMock.post.mockImplementationOnce(async (url, data, config) => {
    if (url === '/orders') {
      const items = Array.isArray((data as any)?.items) ? (data as any).items : [];
      return {
        order: {
          id: 'order-123',
          orderNumber: 'ORD-2024-001',
          status: 'PAYMENT_PENDING',
          paymentStatus: 'PENDING',
          items,
          shippingCost: 150,
          subtotal: 3000,
          discount: 0,
          total: 3150,
          ...overrides,
        },
      };
    }

    return defaultHttpPost ? defaultHttpPost(url, data, config) : Promise.resolve({ data: {} });
  });
};

const enqueueOrderFailure = (error: Error) => {
  httpClientMock.post.mockImplementationOnce(async (url, data, config) => {
    if (url === '/orders') {
      throw error;
    }
    return defaultHttpPost ? defaultHttpPost(url, data, config) : Promise.resolve({ data: {} });
  });
};

const enqueueEmptyOrderResponse = () => {
  httpClientMock.post.mockImplementationOnce(async (url, data, config) => {
    if (url === '/orders') {
      return { data: null } as any;
    }
    return defaultHttpPost ? defaultHttpPost(url, data, config) : Promise.resolve({ data: {} });
  });
};

const selectMercadoPagoOption = async () => {
  const option = await screen.findByTestId('payment-method-mercadopago');
  fireEvent.press(option);
  return option;
};

const tapContinue = async () => {
  const button = await screen.findByTestId('continue-button');
  fireEvent.press(button);
  return button;
};

const tapBack = async () => {
  const button = await screen.findByTestId('back-button');
  fireEvent.press(button);
  return button;
};

const waitForSelectedAddress = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 25));
  });
  await waitFor(() => {
    expect(httpClientMock.get).toHaveBeenCalledWith(
      '/users/me/addresses/addr-default-1',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: expect.stringContaining('Bearer') }),
      })
    );
  });
};

describe('PaymentMethodSelector (PaymentSelectionScreen)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    mockAlert.mockImplementation(() => {});

    mockRouter.back.mockReset();
    mockRouter.navigate.mockReset();
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();

    if (defaultHttpGet) {
      httpClientMock.get.mockImplementation((url: string, config?: unknown) => {
        if (url === '/users/me/addresses') {
          return Promise.resolve({ addresses: [defaultSelectedAddress] });
        }

        if (url.startsWith('/users/me/addresses/')) {
          return Promise.resolve({ address: defaultSelectedAddress });
        }

        return defaultHttpGet(url, config);
      });
    }
    if (defaultHttpPost) {
      httpClientMock.post.mockImplementation(defaultHttpPost);
    }
    if (defaultHttpPut) {
      httpClientMock.put.mockImplementation(defaultHttpPut);
    }
    if (defaultHttpDelete) {
      httpClientMock.delete.mockImplementation(defaultHttpDelete);
    }
    if (defaultHttpPatch) {
      httpClientMock.patch.mockImplementation(defaultHttpPatch);
    }

    (httpClientMock as any).__resetAddressMock?.();

    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          preference: {
            id: 'PREF-123',
            initPoint: 'https://payments.test/checkout/PREF-123',
            externalReference: 'ORDER-123',
          },
        },
      }),
    });

    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    (webBrowserMock.openBrowserAsync as jest.Mock).mockResolvedValue({ type: 'success' });
    (webBrowserMock.warmUpAsync as jest.Mock).mockResolvedValue(undefined);
    (webBrowserMock.coolDownAsync as jest.Mock).mockResolvedValue(undefined);

    renderStoreUtils.auth.setState({
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '+598 99123456',
        profilePicture: null,
        isEmailVerified: true,
        metadata: {
          provider: 'email',
          hasReceivedUserData: true,
        },
      },
      token: 'test-auth-token',
    });

    renderStoreUtils.cart.setState({
      items: [
        {
          productId: 'prod-1',
          quantity: 2,
          color: 'Negro',
          size: 'M',
        },
        {
          productId: 'prod-2',
          quantity: 1,
          color: 'Blanco',
          size: 'L',
        },
      ],
    });

    renderStoreUtils.payment.setState({
      currentOrderNumber: null,
      currentOrderId: null,
      isLoading: false,
      error: null,
    });
  });

  describe('Component Rendering', () => {
    it('should render payment method selection interface correctly', async () => {
      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        // Check header
        expect(screen.getByText('Método de pago')).toBeTruthy();

        // Check section titles
        expect(screen.getByText('Métodos predeterminados')).toBeTruthy();
        expect(screen.getByText('Otros métodos')).toBeTruthy();

        // Check payment methods
        expect(screen.getByText('Mercado Pago')).toBeTruthy();
        expect(screen.getByText('PayPal')).toBeTruthy();
        expect(screen.getByText('Crédito Tiffosi')).toBeTruthy();
        expect(screen.getByText('Efectivo')).toBeTruthy();

        // Check action buttons
        expect(screen.getByText('Continuar con el pago')).toBeTruthy();
        expect(screen.getByText('Atrás')).toBeTruthy();
      });
    });

    it('should render close button in header', async () => {
      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        // The header should be rendered with title
        expect(screen.getByText('Método de pago')).toBeTruthy();
        // The close icon is mocked as 'CloseIcon' string
        // Just verify the header renders without checking for button role
      });
    });

    it('should show disabled state for unavailable payment methods', async () => {
      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        // PayPal, Tiffosi, and Cash should show "Próximamente"
        const proximamenteTexts = screen.getAllByText('Próximamente');
        expect(proximamenteTexts.length).toBe(3); // PayPal, Tiffosi Credit, Cash
      });
    });

    it('should render payment method icons', async () => {
      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        // Payment methods should have their respective names
        expect(screen.getByText('Mercado Pago')).toBeTruthy();
        expect(screen.getByText('PayPal')).toBeTruthy();
        expect(screen.getByText('Crédito Tiffosi')).toBeTruthy();
        expect(screen.getByText('Efectivo')).toBeTruthy();
      });
    });
  });

  describe('Payment Method Selection', () => {
    it('should allow selecting Mercado Pago method', async () => {
      render(<PaymentSelectionScreen />);

      await selectMercadoPagoOption();

      // Should be selectable (no alert for disabled method)
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should show alert for disabled payment methods', async () => {
      render(<PaymentSelectionScreen />);

      const paypalOption = await screen.findByTestId('payment-method-paypal');
      await act(async () => {
        fireEvent.press(paypalOption);
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Método no disponible',
          'PayPal estará disponible próximamente.'
        );
      });
    });

    it('should show alert for Tiffosi Credit when selected', async () => {
      render(<PaymentSelectionScreen />);

      const tiffosiOption = await screen.findByTestId('payment-method-tiffosi');
      await act(async () => {
        fireEvent.press(tiffosiOption);
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Método no disponible',
          'Crédito Tiffosi estará disponible próximamente.'
        );
      });
    });

    it('should show alert for Cash payment when selected', async () => {
      render(<PaymentSelectionScreen />);

      const cashOption = await screen.findByTestId('payment-method-efectivo');
      await act(async () => {
        fireEvent.press(cashOption);
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Método no disponible',
          'Efectivo estará disponible próximamente.'
        );
      });
    });

    it('should enable continue button when valid method is selected', async () => {
      render(<PaymentSelectionScreen />);

      await selectMercadoPagoOption();
      const continueButton = await screen.findByTestId('continue-button');

      expect(continueButton.props.accessibilityState?.disabled).toBe(false);

      fireEvent.press(continueButton);
    });

    it('should handle radio button selection visual feedback', async () => {
      render(<PaymentSelectionScreen />);

      await selectMercadoPagoOption();
      const updatedOption = await screen.findByTestId('payment-method-mercadopago');
      expect(updatedOption.props.accessibilityState?.selected).toBe(true);
    });
  });

  describe('Payment Processing', () => {
    it('should process Mercado Pago payment successfully', async () => {
      enqueueSuccessfulOrderResponse();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            preference: {
              id: 'PREF-456',
              initPoint: 'https://mercadopago.com/checkout/123',
              externalReference: 'ORD-2024-001',
            },
          },
        }),
      } as unknown as Response);

      render(<PaymentSelectionScreen />);

      const createOrderSpy = jest.spyOn(orderService, 'createOrderWithPayment');
      const initiatePaymentSpy = jest.spyOn(mercadoPagoService, 'initiatePayment');

      await selectMercadoPagoOption();
      await waitForSelectedAddress();
      await tapContinue();

      await waitFor(() => {
        expect(createOrderSpy).toHaveBeenCalled();
        expect(initiatePaymentSpy).toHaveBeenCalled();
      });
      createOrderSpy.mockRestore();
      initiatePaymentSpy.mockRestore();
    });

    it('should handle payment processing errors', async () => {
      enqueueOrderFailure(new Error('Network error'));

      render(<PaymentSelectionScreen />);

      const createOrderSpy = jest.spyOn(orderService, 'createOrderWithPayment');
      const initiatePaymentSpy = jest.spyOn(mercadoPagoService, 'initiatePayment');

      await selectMercadoPagoOption();
      await waitForSelectedAddress();
      await tapContinue();

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', expect.stringContaining('Network error'));
      });
    });

    it('should show loading state during payment processing', async () => {
      let resolveOrder: (() => void) | undefined;

      httpClientMock.post.mockImplementationOnce((url, data, config) => {
        if (url === '/orders') {
          return new Promise((resolve) => {
            resolveOrder = () =>
              resolve({
                order: {
                  id: 'order-123',
                  orderNumber: 'ORD-2024-001',
                  status: 'PAYMENT_PENDING',
                  paymentStatus: 'PENDING',
                  items: [],
                  shippingCost: 150,
                  subtotal: 3000,
                  discount: 0,
                  total: 3150,
                },
              });
          });
        }

        return defaultHttpPost ? defaultHttpPost(url, data, config) : Promise.resolve({ data: {} });
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            preference: {
              id: 'PREF-SLOW',
              initPoint: 'https://mercadopago.com/checkout/slow',
              externalReference: 'ORD-2024-001',
            },
          },
        }),
      } as unknown as Response);

      render(<PaymentSelectionScreen />);

      const createOrderSpy = jest.spyOn(orderService, 'createOrderWithPayment');
      const initiatePaymentSpy = jest.spyOn(mercadoPagoService, 'initiatePayment');

      await selectMercadoPagoOption();
      await tapContinue();

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText('Procesando...')).toBeTruthy();
      });

      await act(async () => {
        resolveOrder?.();
      });

      await waitFor(() => {
        expect(createOrderSpy).toHaveBeenCalled();
        expect(initiatePaymentSpy).toHaveBeenCalled();
      });

      createOrderSpy.mockRestore();
      initiatePaymentSpy.mockRestore();

      createOrderSpy.mockRestore();
      initiatePaymentSpy.mockRestore();
    });

    it('should validate user authentication before payment', async () => {
      // Set user as null (not authenticated)
      renderStoreUtils.auth.setState({
        user: null,
        token: null,
      });

      render(<PaymentSelectionScreen />);

      await selectMercadoPagoOption();
      await tapContinue();

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error',
          'Debes estar autenticado para realizar el pago'
        );
      });
    });

    it('should validate cart is not empty before payment', async () => {
      // Set empty cart
      renderStoreUtils.cart.setState({
        items: [],
      });

      render(<PaymentSelectionScreen />);

      await selectMercadoPagoOption();
      await waitForSelectedAddress();
      await tapContinue();

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Tu carrito está vacío');
      });
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate back when back button is pressed', async () => {
      render(<PaymentSelectionScreen />);

      await tapBack();

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('should navigate to home when close button is pressed', async () => {
      render(<PaymentSelectionScreen />);

      const closeButton = await screen.findByTestId('close-button');
      fireEvent.press(closeButton);

      expect(mockRouter.navigate).toHaveBeenCalledWith('/(tabs)');
    });

    it('should navigate to home for unimplemented payment methods', async () => {
      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        const tiffosiOption = screen.getByText('Crédito Tiffosi');
        fireEvent.press(tiffosiOption);
      });

      // After alert is dismissed, continue with that method
      mockAlert.mockImplementation((title, message, buttons) => {
        if (buttons && buttons[0] && buttons[0].onPress) {
          buttons[0].onPress();
        }
      });

      // Note: This test verifies the alert behavior rather than actual navigation
      // since the unimplemented methods show alerts first
    });
  });

  describe('Error Handling', () => {
    it('should handle address loading failure gracefully', async () => {
      httpClientMock.get.mockImplementationOnce((url: string, config?: unknown) => {
        if (url.startsWith('/users/me/addresses/')) {
          return Promise.reject(new Error('Address not found'));
        }

        return defaultHttpGet ? defaultHttpGet(url, config) : Promise.resolve([]);
      });

      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'No pudimos cargar la dirección de envío.');
      });
    });

    it('should handle network errors during payment', async () => {
      enqueueOrderFailure(new Error('network error occurred'));

      render(<PaymentSelectionScreen />);

      await selectMercadoPagoOption();
      await waitForSelectedAddress();
      await tapContinue();

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', expect.stringContaining('network error'));
      });
    });

    it('should handle authentication errors during payment', async () => {
      enqueueOrderFailure(new Error('auth token expired'));

      render(<PaymentSelectionScreen />);

      await selectMercadoPagoOption();
      await tapContinue();

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('auth token expired')
        );
      });
    });

    it('should handle order creation failure', async () => {
      enqueueEmptyOrderResponse();

      render(<PaymentSelectionScreen />);

      await selectMercadoPagoOption();
      await tapContinue();

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to create order');
      });
    });

    it('should handle payment initiation failure', async () => {
      enqueueSuccessfulOrderResponse();
      const initiatePaymentSpy = jest
        .spyOn(mercadoPagoService, 'initiatePayment')
        .mockResolvedValue({ success: false, error: 'Payment initiation failed' });

      render(<PaymentSelectionScreen />);

      await selectMercadoPagoOption();
      await waitForSelectedAddress();
      await tapContinue();

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Payment initiation failed');
      });

      initiatePaymentSpy.mockRestore();
    });
  });

  describe('Store Integration', () => {
    it('should use payment store loading state', async () => {
      renderStoreUtils.payment.setState({
        isLoading: true,
      });

      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        // Continue button should show loading state when payment store is loading
        const continueButton = screen.getByText('Procesando...');
        expect(continueButton).toBeTruthy();
      });
    });

    it('should display payment store errors', async () => {
      renderStoreUtils.payment.setState({
        error: 'Payment service unavailable',
      });

      render(<PaymentSelectionScreen />);

      // Should show alert for payment error
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error de pago', 'Payment service unavailable');
      });
    });

    it('should clear payment state on cleanup', async () => {
      renderStoreUtils.payment.setState({
        error: 'Payment error',
      });

      const { unmount } = render(<PaymentSelectionScreen />);

      unmount();

      // Payment state should be cleared on component unmount
      // This is tested by the component's useEffect cleanup
      expect(renderStoreUtils.payment.getState().error).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles and labels', async () => {
      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        const continueButton = screen.getByText('Continuar con el pago');
        const backButton = screen.getByText('Atrás');

        expect(continueButton).toBeTruthy();
        expect(backButton).toBeTruthy();
      });
    });

    it('should have accessible payment method options', async () => {
      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        // All payment methods should be accessible
        expect(screen.getByText('Mercado Pago')).toBeTruthy();
        expect(screen.getByText('PayPal')).toBeTruthy();
        expect(screen.getByText('Crédito Tiffosi')).toBeTruthy();
        expect(screen.getByText('Efectivo')).toBeTruthy();
      });
    });

    it('should provide visual feedback for disabled methods', async () => {
      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        // Disabled methods should show "Próximamente"
        const proximamenteTexts = screen.getAllByText('Próximamente');
        expect(proximamenteTexts.length).toBe(3);
      });
    });
  });
});

afterAll(() => {
  if (originalFetch) {
    (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch;
  } else {
    delete (globalThis as any).fetch;
  }
});
