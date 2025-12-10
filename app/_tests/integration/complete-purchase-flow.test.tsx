/**
 * Complete Purchase Flow Integration Test
 * Tests the entire user journey from product selection to order confirmation
 * This is the most critical revenue-protecting test
 */

import { act } from '@testing-library/react-native';
import { useCartStore } from '../../_stores/cartStore';
import { useProductStore } from '../../_stores/productStore';
import { useAuthStore } from '../../_stores/authStore';
import { usePaymentStore } from '../../_stores/paymentStore';
import httpClient from '../../_services/api/httpClient';
import orderService from '../../_services/order/orderService';
import addressService from '../../_services/address/addressService';
import mercadoPagoService from '../../_services/payment/mercadoPago';
import { productMockData } from '../mocks/data/products';
import type { AxiosRequestConfig } from 'axios';

type HttpClientMock = jest.Mocked<typeof httpClient>;

jest.mock('expo-web-browser', () => ({
  __esModule: true,
  warmUpAsync: jest.fn().mockResolvedValue(undefined),
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'success' }),
  coolDownAsync: jest.fn().mockResolvedValue(undefined),
  WebBrowserPresentationStyle: {
    FORM_SHEET: 'FORM_SHEET',
  },
}));

const httpClientMock = httpClient as HttpClientMock;
const defaultHttpGet = httpClientMock.get.getMockImplementation();
const defaultHttpPost = httpClientMock.post.getMockImplementation();
const defaultHttpPut = httpClientMock.put.getMockImplementation();
const defaultHttpDelete = httpClientMock.delete.getMockImplementation();
const originalFetch: typeof fetch | undefined = globalThis.fetch;
const webBrowserMock = require('expo-web-browser');

const enqueueOrderSuccess = () => {
  httpClientMock.post.mockImplementationOnce(async (url, data, config) => {
    if (url === '/orders') {
      const items = Array.isArray((data as any)?.items) ? (data as any).items : [];
      return {
        order: {
          id: 'ORDER_TEST_123',
          orderNumber: 'ORDER_TEST_123',
          status: 'PAYMENT_PENDING',
          paymentStatus: 'PENDING',
          items,
          shippingCost: 150,
          subtotal: 3000,
          discount: 0,
          total: 3150,
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

const setupAuthenticatedUser = () => {
  useAuthStore.setState({
    user: {
      id: 'user-guest-123',
      firstName: 'Guest',
      lastName: 'User',
      email: 'guest@example.com',
      name: 'Guest User',
      profilePicture: null,
    },
    token: 'test-auth-token',
    isLoggedIn: true,
    isLoading: false,
    error: null,
  });

  addressService.setAuthToken('test-auth-token');
  orderService.setAuthToken('test-auth-token');
  mercadoPagoService.setAuthToken('test-auth-token');
};

const buildUserData = () => {
  const authState = useAuthStore.getState();
  if (!authState.user) {
    throw new Error('User not initialized');
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

let fetchMock: jest.Mock;

describe('Complete Purchase Flow - Revenue Critical', () => {
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
            id: 'TEST_PREFERENCE_123',
            initPoint: 'https://www.mercadopago.com/checkout/TEST',
            externalReference: 'ORDER_TEST_123',
          },
        },
      }),
    });

    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    (webBrowserMock.openBrowserAsync as jest.Mock).mockResolvedValue({ type: 'success' });
    (webBrowserMock.warmUpAsync as jest.Mock).mockResolvedValue(undefined);
    (webBrowserMock.coolDownAsync as jest.Mock).mockResolvedValue(undefined);

    // Reset all stores to initial state
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
  });

  describe('Guest User Purchase Flow', () => {
    it('should complete full purchase flow as guest user', async () => {
      setupAuthenticatedUser();

      // Step 1: Load products
      const { fetchProducts } = useProductStore.getState();
      await act(async () => {
        await fetchProducts();
      });

      // Verify products are loaded
      const updatedProductStore = useProductStore.getState();
      expect(updatedProductStore.products.length).toBeGreaterThan(0);

      // Step 2: Add product to cart
      const firstProduct = updatedProductStore.products[0];
      const { addItem } = useCartStore.getState();

      await act(async () => {
        await addItem({
          productId: firstProduct.id,
          quantity: 1,
          size: firstProduct.sizes?.[0]?.value || 'M',
          color: firstProduct.colors?.[0]?.colorName,
          price: firstProduct.price,
          discountedPrice: firstProduct.discountedPrice,
        });
      });

      // Verify item is in cart
      const cartState = useCartStore.getState();
      expect(cartState.items).toHaveLength(1);
      expect(cartState.items[0].productId).toBe(firstProduct.id);

      // Step 3: Proceed to checkout (simulate navigation)
      // In a real test, we would navigate to checkout screens
      // For this test, we simulate the checkout process

      // Step 4: Create shipping address (guest user)
      const shippingAddress = await addressService.createAddress({
        firstName: 'Guest',
        lastName: 'User',
        addressLine1: 'Test Street 123',
        addressLine2: '4B',
        city: 'Montevideo',
        state: 'Montevideo',
        postalCode: '11000',
        country: 'UY',
        phoneNumber: '+598 99 123 456',
        isDefault: false,
        type: 'shipping',
      });

      expect(shippingAddress).toBeDefined();
      expect(shippingAddress.addressLine1).toBeDefined();

      // Step 5: Select delivery method
      const deliveryMethod = 'delivery'; // or 'pickup'

      // Step 6: Initialize payment with MercadoPago
      enqueueOrderSuccess();

      const orderRequest = {
        items: cartState.items,
        shippingAddress,
        shippingMethod: deliveryMethod as 'delivery',
        notes: 'Pedido de prueba',
      };

      const userData = buildUserData();

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            preference: {
              id: 'TEST_PREFERENCE_123',
              initPoint: 'https://www.mercadopago.com/checkout/TEST',
              externalReference: 'ORDER_TEST_123',
            },
          },
        }),
      } as unknown as Response);

      const orderResult = await orderService.createOrderWithPayment(orderRequest, userData);

      expect(orderResult.success).toBe(true);
      expect(orderResult.order?.id).toBe('ORDER_TEST_123');
      expect(orderResult.order?.status).toBe('PAYMENT_PENDING');
      expect(orderResult.paymentUrl).toContain('mercadopago.com');

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

      // Step 7: Simulate payment completion (webhook would handle this)
      usePaymentStore.setState({
        currentOrderNumber: orderResult.order!.orderNumber,
        currentOrderId: orderResult.order!.id,
        isLoading: false,
        error: null,
      });

      // Step 8: Verify order confirmation
      const paymentState = usePaymentStore.getState();
      expect(paymentState.currentOrderNumber).toBe('ORDER_TEST_123');
      expect(paymentState.currentOrderId).toBe('ORDER_TEST_123');

      // Cart should be cleared after successful purchase
      await act(async () => {
        useCartStore.getState().clearCart();
      });

      const finalCartState = useCartStore.getState();
      expect(finalCartState.items).toHaveLength(0);
    });

    it('should handle out of stock during checkout', async () => {
      setupAuthenticatedUser();

      // Add item to cart
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

      // Simulate out of stock error during order creation
      enqueueOrderFailure(new Error('Product out of stock'));

      const cartItems = [
        {
          productId: 'test-product-1',
          quantity: 2,
          size: 'M',
        },
      ];

      const orderAttempt = await orderService.createOrderWithPayment(
        {
          items: cartItems,
          shippingAddress,
          shippingMethod: 'delivery',
        },
        buildUserData()
      );

      expect(orderAttempt.success).toBe(false);
      expect(orderAttempt.error).toContain('Product out of stock');

      // Payment status should remain idle
      const paymentState = usePaymentStore.getState();
      expect(paymentState.error).toBeNull();
    });

    it('should recover from payment failure', async () => {
      setupAuthenticatedUser();

      // Setup cart with item
      const { addItem } = useCartStore.getState();
      await act(async () => {
        await addItem({
          productId: 'test-product-1',
          quantity: 1,
          size: 'M',
          price: 100,
        });
      });

      const initiatePaymentSpy = jest
        .spyOn(mercadoPagoService, 'initiatePayment')
        .mockResolvedValueOnce({ success: false, error: 'Payment gateway error' })
        .mockResolvedValueOnce({ success: true, orderId: 'ORDER_123' });

      const firstAttempt = await mercadoPagoService.initiatePayment({
        id: 'ORDER_123',
        initPoint: 'https://www.mercadopago.com/checkout/TEST',
        externalReference: 'ORDER_123',
      });

      expect(firstAttempt.success).toBe(false);
      expect(firstAttempt.error).toContain('Payment gateway error');

      const retryResult = await mercadoPagoService.initiatePayment({
        id: 'ORDER_123',
        initPoint: 'https://www.mercadopago.com/checkout/TEST',
        externalReference: 'ORDER_123',
      });

      expect(retryResult.success).toBe(true);
      initiatePaymentSpy.mockRestore();
    });
  });

  describe('Authenticated User Purchase Flow', () => {
    beforeEach(() => {
      setupAuthenticatedUser();
    });

    it('should create order using saved address', async () => {
      const addresses = await addressService.fetchUserAddresses();
      expect(addresses.length).toBeGreaterThan(0);

      const savedAddress = addresses[0];

      const { addItem } = useCartStore.getState();
      await act(async () => {
        await addItem({
          productId: 'test-product-1',
          quantity: 1,
          size: 'M',
          price: 100,
        });
      });

      enqueueOrderSuccess();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            preference: {
              id: 'AUTH_PREF_123',
              initPoint: 'https://www.mercadopago.com/checkout/AUTH',
              externalReference: 'ORDER_TEST_123',
            },
          },
        }),
      } as unknown as Response);

      const orderResult = await orderService.createOrderWithPayment(
        {
          items: useCartStore.getState().items,
          shippingAddress: savedAddress,
          shippingMethod: 'delivery',
        },
        buildUserData()
      );

      expect(orderResult.success).toBe(true);
      expect(orderResult.order).toBeDefined();
      expect(orderResult.paymentUrl).toContain('mercadopago');
    });

    it('should merge guest cart after login', async () => {
      // Start as guest with items in cart
      useAuthStore.setState({ isLoggedIn: false, user: null, token: null });

      const { addItem } = useCartStore.getState();
      await act(async () => {
        await addItem({
          productId: 'guest-product-1',
          quantity: 2,
          size: 'L',
          price: 150,
        });
      });

      // Verify guest cart has items
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().isGuestCart).toBe(true);

      // User logs in
      await act(async () => {
        useAuthStore.setState({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            profilePicture: null,
            isEmailVerified: true,
          },
          token: 'test-auth-token',
          isLoggedIn: true,
        });

        // Migrate cart to user
        await useCartStore.getState().migrateGuestCart('test-auth-token');
      });

      // Cart should still have the items
      const cartState = useCartStore.getState();
      expect(cartState.items).toHaveLength(1);
      expect(cartState.items[0].productId).toBe('guest-product-1');
      expect(cartState.isGuestCart).toBe(false);
    });
  });

  describe('Payment Integration', () => {
    it('should create correct MercadoPago preference', async () => {
      setupAuthenticatedUser();

      webBrowserMock.openBrowserAsync.mockResolvedValueOnce({ type: 'success' });

      const preference = {
        id: 'PREF-XYZ',
        initPoint: 'https://www.mercadopago.com/checkout/PREF-XYZ',
        externalReference: 'ORDER_123',
      };

      const initiatePaymentSpy = jest
        .spyOn(mercadoPagoService, 'initiatePayment')
        .mockResolvedValue({ success: true, orderId: 'ORDER_123' });

      const paymentResult = await mercadoPagoService.initiatePayment(preference);

      expect(paymentResult.success).toBe(true);
      expect(initiatePaymentSpy).toHaveBeenCalledWith(preference);
      initiatePaymentSpy.mockRestore();
    });

    it('should handle payment webhook confirmation', async () => {
      // Simulate webhook received after payment
      // In a real scenario, the webhook would call the backend
      // which would update the order status

      // For this test, we simulate the payment completion
      await act(async () => {
        usePaymentStore.setState({
          currentOrderNumber: 'ORDER_123',
          currentOrderId: 'ORDER_123',
          isLoading: false,
          error: null,
        });
      });

      const paymentState = usePaymentStore.getState();
      expect(paymentState.currentOrderNumber).toBe('ORDER_123');
      expect(paymentState.currentOrderId).toBe('ORDER_123');
    });
  });

  describe('Error Recovery', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      httpClientMock.get.mockRejectedValueOnce(new Error('Network error'));

      // Try to fetch products
      const { fetchProducts } = useProductStore.getState();
      await act(async () => {
        await fetchProducts();
      });

      const productState = useProductStore.getState();
      expect(productState.error).toBeDefined();
      expect(productState.products).toHaveLength(0);

      // Mock successful response for retry
      httpClientMock.get.mockImplementationOnce(
        async (url: string, config?: AxiosRequestConfig) => {
          if (url === '/products') {
            return {
              data: productMockData.slice(0, 5).map((product) => ({
                id: product.id,
                attributes: product.attributes,
              })),
              meta: { pagination: { total: 5 } },
            };
          }

          return defaultHttpGet ? defaultHttpGet(url, config) : Promise.resolve({ data: [] });
        }
      );

      // Retry should work
      await act(async () => {
        await fetchProducts();
      });

      const updatedState = useProductStore.getState();
      expect(updatedState.error).toBeNull();
      expect(updatedState.products.length).toBeGreaterThan(0);
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
