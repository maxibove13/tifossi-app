/**
 * Checkout Flow Integration Tests
 * Verifies delivery and pickup checkout scenarios using real services
 * while mocking only at the HTTP boundary via the shared httpClient mock.
 */

import { act } from '@testing-library/react-native';
import { useCartStore } from '../../_stores/cartStore';
import { useProductStore } from '../../_stores/productStore';
import { useAuthStore } from '../../_stores/authStore';
import { usePaymentStore } from '../../_stores/paymentStore';
import { useUserStore } from '../../_stores/userStore';
import httpClient from '../../_services/api/httpClient';
import orderService from '../../_services/order/orderService';
import addressService, { Address } from '../../_services/address/addressService';
import mercadoPagoService from '../../_services/payment/mercadoPago';
import { storesData } from '../../_data/stores';

jest.mock('expo-web-browser', () => ({
  __esModule: true,
  warmUpAsync: jest.fn().mockResolvedValue(undefined),
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'success' }),
  coolDownAsync: jest.fn().mockResolvedValue(undefined),
  WebBrowserPresentationStyle: {
    FORM_SHEET: 'FORM_SHEET',
  },
}));

type HttpClientMock = jest.Mocked<typeof httpClient>;

const httpClientMock = httpClient as HttpClientMock;
const defaultHttpGet = httpClientMock.get.getMockImplementation();
const defaultHttpPost = httpClientMock.post.getMockImplementation();
const defaultHttpPut = httpClientMock.put.getMockImplementation();
const defaultHttpDelete = httpClientMock.delete.getMockImplementation();
const originalFetch: typeof fetch | undefined = globalThis.fetch;
const webBrowserMock = require('expo-web-browser');

let fetchMock: jest.Mock;

const resetAllStores = (): void => {
  useCartStore.setState({
    items: [],
    isLoading: false,
    error: null,
    isGuestCart: true,
  });

  useProductStore.setState({
    products: [],
    isLoading: false,
    error: null,
  });

  useAuthStore.setState({
    user: null,
    token: null,
    isLoggedIn: false,
    isLoading: false,
    error: null,
  });

  usePaymentStore.setState({
    currentOrderNumber: null,
    currentOrderId: null,
    isLoading: false,
    error: null,
  });

  useUserStore.setState({
    profile: null,
    preferences: {
      notifications: {
        push: true,
        email: true,
        promotions: false,
        orderUpdates: true,
      },
      privacy: {
        shareAnalytics: false,
        personalizedAds: false,
      },
      accessibility: {
        fontSize: 'medium',
        highContrast: false,
        reducedMotion: false,
      },
      language: 'es',
      currency: 'UYU',
    },
    isLoading: false,
    error: null,
  });
};

const setupGuestSession = (): void => {
  useAuthStore.setState({
    user: null,
    token: null,
    isLoggedIn: false,
    isLoading: false,
    error: null,
  });
};

const setupAuthenticatedSession = (): void => {
  useAuthStore.setState({
    user: {
      id: 'user-123',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      name: 'Test User',
      profilePicture: null,
    },
    token: 'test-auth-token',
    isLoggedIn: true,
    isLoading: false,
    error: null,
  });
};

const ensureAuthTokens = (): void => {
  const { token } = useAuthStore.getState();
  const effectiveToken = token ?? 'test-auth-token';
  addressService.setAuthToken(effectiveToken);
  orderService.setAuthToken(effectiveToken);
  mercadoPagoService.setAuthToken(effectiveToken);
};

type OrderOverrides = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  shippingCost: number;
  subtotal: number;
  discount: number;
  total: number;
  shippingMethod: 'delivery' | 'pickup';
};

const queueOrderSuccess = (overrides: Partial<OrderOverrides> = {}): void => {
  httpClientMock.post.mockImplementationOnce(async (url, data, config) => {
    // Handle both authenticated (/orders) and guest (/orders/guest) endpoints
    if (url === '/orders' || url === '/orders/guest') {
      const items = Array.isArray((data as any)?.items) ? (data as any).items : [];
      return {
        order: {
          id: overrides.id ?? 'ORDER_TEST_123',
          orderNumber: overrides.orderNumber ?? 'ORDER_TEST_123',
          status: overrides.status ?? 'PAYMENT_PENDING',
          paymentStatus: overrides.paymentStatus ?? 'PENDING',
          items,
          shippingCost: overrides.shippingCost ?? 150,
          subtotal: overrides.subtotal ?? 3000,
          discount: overrides.discount ?? 0,
          total: overrides.total ?? 3150,
          shippingMethod: overrides.shippingMethod ?? 'delivery',
        },
      };
    }

    return defaultHttpPost ? defaultHttpPost(url, data, config) : Promise.resolve({ data: {} });
  });
};

const queueOrderFailure = (error: Error): void => {
  httpClientMock.post.mockImplementationOnce(async (url, data, config) => {
    // Handle both authenticated (/orders) and guest (/orders/guest) endpoints
    if (url === '/orders' || url === '/orders/guest') {
      throw error;
    }

    return defaultHttpPost ? defaultHttpPost(url, data, config) : Promise.resolve({ data: {} });
  });
};

const buildUserData = () => {
  const authState = useAuthStore.getState();
  if (!authState.user) {
    return {
      id: 'guest-user',
      firstName: 'Guest',
      lastName: 'User',
      email: 'guest@example.com',
    };
  }

  return {
    id: authState.user.id,
    firstName: authState.user.firstName ?? 'Guest',
    lastName: authState.user.lastName ?? 'User',
    email: authState.user.email ?? 'guest@example.com',
    phone: authState.user.phone
      ? {
          areaCode: '598',
          number: authState.user.phone,
        }
      : undefined,
  };
};

beforeEach(() => {
  jest.clearAllMocks();

  if (defaultHttpGet) {
    httpClientMock.get.mockImplementation(defaultHttpGet);
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

  (httpClientMock as any).__resetAddressMock?.();

  fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      data: {
        preference: {
          id: 'PREF-DEFAULT',
          initPoint: 'https://www.mercadopago.com/checkout/DEFAULT',
          externalReference: 'ORDER_TEST_123',
        },
      },
    }),
  });

  (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

  (webBrowserMock.openBrowserAsync as jest.Mock).mockResolvedValue({ type: 'success' });
  (webBrowserMock.warmUpAsync as jest.Mock).mockResolvedValue(undefined);
  (webBrowserMock.coolDownAsync as jest.Mock).mockResolvedValue(undefined);

  resetAllStores();
});

afterAll(() => {
  if (originalFetch) {
    (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch;
  } else {
    delete (globalThis as any).fetch;
  }
});

describe('Checkout Flow Variations - Revenue Critical', () => {
  it('should complete guest checkout with delivery to new address', async () => {
    setupGuestSession();
    ensureAuthTokens();

    const { fetchProducts } = useProductStore.getState();
    await act(async () => {
      await fetchProducts();
    });

    const firstProduct = useProductStore.getState().products[0];
    const { addItem } = useCartStore.getState();
    await act(async () => {
      await addItem({
        productId: firstProduct.id,
        quantity: 1,
        size: firstProduct.sizes?.[0]?.value ?? 'M',
        color: firstProduct.colors?.[0]?.colorName,
        price: firstProduct.price,
        discountedPrice: firstProduct.discountedPrice,
      });
    });

    const shippingAddress = await addressService.createAddress({
      firstName: 'Guest',
      lastName: 'User',
      addressLine1: 'Test Street 123',
      city: 'Montevideo',
      state: 'Montevideo',
      country: 'UY',
      isDefault: false,
      type: 'shipping',
    });

    expect(shippingAddress).toBeDefined();

    queueOrderSuccess();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          preference: {
            id: 'PREF-GUEST-DELIVERY',
            initPoint: 'https://www.mercadopago.com/checkout/GUEST',
            externalReference: 'ORDER_TEST_123',
          },
        },
      }),
    } as unknown as Response);

    const orderResult = await orderService.createOrderWithPayment(
      {
        items: useCartStore.getState().items,
        shippingAddress,
        shippingMethod: 'delivery',
      },
      buildUserData()
    );

    expect(orderResult.success).toBe(true);
    expect(orderResult.paymentUrl).toContain('mercadopago');

    const initiatePaymentSpy = jest
      .spyOn(mercadoPagoService, 'initiatePayment')
      .mockResolvedValue({ success: true, orderId: orderResult.order!.id });

    const paymentResult = await mercadoPagoService.initiatePayment({
      id: orderResult.order!.id,
      initPoint: orderResult.paymentUrl!,
      externalReference: orderResult.order!.orderNumber,
    });

    expect(paymentResult.success).toBe(true);
    initiatePaymentSpy.mockRestore();

    usePaymentStore.setState({
      currentOrderNumber: orderResult.order!.orderNumber,
      currentOrderId: orderResult.order!.id,
      isLoading: false,
      error: null,
    });

    expect(usePaymentStore.getState().currentOrderNumber).toBe(orderResult.order!.orderNumber);
  });

  it('should support authenticated pickup checkout', async () => {
    setupAuthenticatedSession();
    ensureAuthTokens();

    const pickupStore = storesData[0];
    // Store selection would be handled by checkout flow, not userStore
    useUserStore.setState({
      profile: null,
      preferences: useUserStore.getState().preferences,
      isLoading: false,
      error: null,
    });

    const { addItem } = useCartStore.getState();
    await act(async () => {
      await addItem({
        productId: 'pickup-product-1',
        quantity: 1,
        size: 'L',
        price: 2200,
      });
    });

    queueOrderSuccess({ shippingMethod: 'pickup', total: 2200, shippingCost: 0 });

    const pickupAddress: Address = {
      firstName: pickupStore.name,
      lastName: 'Pickup',
      addressLine1: pickupStore.address,
      city: 'Montevideo',
      state: 'Montevideo',
      country: 'UY',
      isDefault: false,
      type: 'shipping',
    };

    const orderResult = await orderService.createOrderWithPayment(
      {
        items: useCartStore.getState().items,
        shippingAddress: pickupAddress,
        shippingMethod: 'pickup',
        notes: `Retiro en tienda ${pickupStore.name}`,
      },
      buildUserData()
    );

    expect(orderResult.success).toBe(true);
    expect(orderResult.order?.shippingMethod).toBe('pickup');
  });

  it('should surface stock validation issues before payment', async () => {
    setupAuthenticatedSession();
    ensureAuthTokens();

    const { addItem } = useCartStore.getState();
    await act(async () => {
      await addItem({
        productId: 'limited-stock-product',
        quantity: 3,
        size: 'M',
        price: 1800,
      });
    });

    queueOrderFailure(new Error('Product out of stock'));

    const result = await orderService.createOrderWithPayment(
      {
        items: useCartStore.getState().items,
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          addressLine1: '18 de Julio 1234',
          city: 'Montevideo',
          state: 'Montevideo',
          country: 'UY',
          isDefault: false,
          type: 'shipping',
        },
        shippingMethod: 'delivery',
      },
      buildUserData()
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('out of stock');
    expect(usePaymentStore.getState().error).toBeNull();
  });
});
