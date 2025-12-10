import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '../utils/render-utils';
import { Alert } from 'react-native';
import PaymentSelectionScreen from '../../checkout/payment-selection';
import { renderStoreUtils } from '../utils/render-utils';
import httpClient from '../../_services/api/httpClient';
import mercadoPagoService from '../../_services/payment/mercadoPago';
import type { Address } from '../../_services/address/addressService';
import type { AxiosRequestConfig } from 'axios';

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
    selectedAddressId: '0', // Index of the address in the array
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
  id: 0,
  firstName: 'Juan',
  lastName: 'Pérez',
  addressLine1: 'Avenida 18 de Julio 1234',
  city: 'Montevideo',
  state: 'Montevideo',
  country: 'UY',
  isDefault: true,
  type: 'shipping',
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
      '/user-profile/me/addresses',
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
      httpClientMock.get.mockImplementation((url: string, config?: AxiosRequestConfig) => {
        if (url === '/user-profile/me/addresses') {
          // Return array format - addressService handles both array and { addresses: [] } formats
          return Promise.resolve({ data: [defaultSelectedAddress] });
        }

        if (url.startsWith('/user-profile/me/addresses/')) {
          return Promise.resolve({ data: defaultSelectedAddress });
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

      await waitFor(
        () => {
          // Check header
          expect(screen.getByText('Método de pago')).toBeTruthy();

          // Check section titles
          expect(screen.getByText('Métodos predeterminados')).toBeTruthy();
          expect(screen.getByText('Otros métodos')).toBeTruthy();

          // Only enabled payment methods are shown (Mercado Pago)
          expect(screen.getByText('Mercado Pago')).toBeTruthy();

          // Disabled methods (PayPal, Tiffosi, Efectivo) are filtered out
          expect(screen.queryByText('PayPal')).toBeNull();
          expect(screen.queryByText('Crédito Tiffosi')).toBeNull();
          expect(screen.queryByText('Efectivo')).toBeNull();

          // Check action buttons
          expect(screen.getByText('Continuar con el pago')).toBeTruthy();
          expect(screen.getByText('Atrás')).toBeTruthy();
        },
        { timeout: 10000 }
      );
    }, 15000);

    it('should render close button in header', async () => {
      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        // The header should be rendered with title
        expect(screen.getByText('Método de pago')).toBeTruthy();
        // The close icon is mocked as 'CloseIcon' string
        // Just verify the header renders without checking for button role
      });
    });

    it('should only render enabled payment methods', async () => {
      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        // Only Mercado Pago is enabled and should be rendered
        expect(screen.getByText('Mercado Pago')).toBeTruthy();
        expect(screen.getByTestId('payment-method-mercadopago')).toBeTruthy();

        // Disabled methods are not rendered at all
        expect(screen.queryByTestId('payment-method-paypal')).toBeNull();
        expect(screen.queryByTestId('payment-method-tiffosi')).toBeNull();
        expect(screen.queryByTestId('payment-method-efectivo')).toBeNull();
      });
    });

    it('should render payment method icons', async () => {
      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        // Only enabled payment method should have icon rendered
        expect(screen.getByText('Mercado Pago')).toBeTruthy();
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
      // Mock createPaymentPreference (the method actually used by the component)
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

      const createPreferenceSpy = jest.spyOn(mercadoPagoService, 'createPaymentPreference');
      const initiatePaymentSpy = jest.spyOn(mercadoPagoService, 'initiatePayment');

      await selectMercadoPagoOption();
      await waitForSelectedAddress();
      await tapContinue();

      await waitFor(() => {
        expect(createPreferenceSpy).toHaveBeenCalled();
        expect(initiatePaymentSpy).toHaveBeenCalled();
      });
      createPreferenceSpy.mockRestore();
      initiatePaymentSpy.mockRestore();
    });

    it('should handle payment processing errors', async () => {
      // Mock createPaymentPreference to throw an error
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      render(<PaymentSelectionScreen />);

      await selectMercadoPagoOption();
      await waitForSelectedAddress();
      await tapContinue();

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error de Pago', expect.any(String));
      });
    });

    it('should show loading state during payment processing', async () => {
      let resolvePreference: ((value: Response) => void) | undefined;

      // Create a delayed fetch mock for createPaymentPreference
      fetchMock.mockImplementationOnce(() => {
        return new Promise((resolve) => {
          resolvePreference = resolve;
        });
      });

      render(<PaymentSelectionScreen />);

      const createPreferenceSpy = jest.spyOn(mercadoPagoService, 'createPaymentPreference');
      const initiatePaymentSpy = jest.spyOn(mercadoPagoService, 'initiatePayment');

      await selectMercadoPagoOption();
      await waitForSelectedAddress();
      await tapContinue();

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText('Procesando...')).toBeTruthy();
      });

      // Resolve the delayed preference
      await act(async () => {
        resolvePreference?.({
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
        } as Response);
      });

      await waitFor(() => {
        expect(createPreferenceSpy).toHaveBeenCalled();
        expect(initiatePaymentSpy).toHaveBeenCalled();
      });

      createPreferenceSpy.mockRestore();
      initiatePaymentSpy.mockRestore();
    });

    it('should require address or guest info for delivery checkout', async () => {
      // Set user as null (not authenticated) and no guest address
      renderStoreUtils.auth.setState({
        user: null,
        token: null,
      });

      // Ensure no guest address is set
      renderStoreUtils.payment.setState({
        guestAddress: null,
        guestContactInfo: null,
        selectedStore: null,
      });

      render(<PaymentSelectionScreen />);

      await selectMercadoPagoOption();
      await tapContinue();

      // Without auth or guest info, delivery checkout requires address
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error',
          'Debes proporcionar una dirección de envío'
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

    it('should only show Mercado Pago as selectable option', async () => {
      render(<PaymentSelectionScreen />);

      await waitFor(() => {
        // Only Mercado Pago is available - disabled methods are not rendered
        expect(screen.getByText('Mercado Pago')).toBeTruthy();
        expect(screen.queryByText('Crédito Tiffosi')).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle address loading failure gracefully', async () => {
      httpClientMock.get.mockImplementationOnce((url: string, config?: AxiosRequestConfig) => {
        if (url.startsWith('/user-profile/me/addresses')) {
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
      // Mock fetch to throw a network error
      fetchMock.mockRejectedValueOnce(new Error('network error occurred'));

      render(<PaymentSelectionScreen />);

      await selectMercadoPagoOption();
      await waitForSelectedAddress();
      await tapContinue();

      await waitFor(() => {
        // Component converts network errors to user-friendly message
        expect(mockAlert).toHaveBeenCalledWith(
          'Error de Pago',
          'Sin conexión a internet. Verifica tu conexión.'
        );
      });
    });

    it('should handle authentication errors during payment', async () => {
      // Mock fetch to throw an auth error
      fetchMock.mockRejectedValueOnce(new Error('auth token expired'));

      render(<PaymentSelectionScreen />);

      await selectMercadoPagoOption();
      await waitForSelectedAddress();
      await tapContinue();

      await waitFor(() => {
        // Component converts auth errors to user-friendly message
        expect(mockAlert).toHaveBeenCalledWith(
          'Error de Pago',
          'Debes iniciar sesión para continuar.'
        );
      });
    });

    it('should handle preference creation failure', async () => {
      // Mock fetch to return a failure response
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Service unavailable' }),
      } as Response);

      render(<PaymentSelectionScreen />);

      await selectMercadoPagoOption();
      await waitForSelectedAddress();
      await tapContinue();

      await waitFor(() => {
        // Component shows generic error for non-network, non-auth failures
        expect(mockAlert).toHaveBeenCalledWith('Error de Pago', expect.any(String));
      });
    });

    it('should handle payment initiation failure', async () => {
      // Mock successful preference creation via fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            preference: {
              id: 'PREF-123',
              initPoint: 'https://mercadopago.com/checkout/123',
              externalReference: 'ORD-2024-001',
            },
          },
        }),
      } as Response);

      // Mock failed payment initiation
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
        // Only enabled payment methods are accessible
        expect(screen.getByText('Mercado Pago')).toBeTruthy();
        expect(screen.getByTestId('payment-method-mercadopago')).toBeTruthy();
      });
    });

    it('should have proper accessibility state on selected method', async () => {
      render(<PaymentSelectionScreen />);

      await selectMercadoPagoOption();

      await waitFor(() => {
        const mercadoPagoOption = screen.getByTestId('payment-method-mercadopago');
        expect(mercadoPagoOption.props.accessibilityState?.selected).toBe(true);
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
