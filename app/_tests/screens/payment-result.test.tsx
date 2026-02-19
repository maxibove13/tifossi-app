/**
 * Payment Result Screen Tests
 * Tests the payment result UI and behavior
 * Following testing principles: Use real stores, spy on service methods
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import PaymentResultScreen from '../../checkout/payment-result';
import { usePaymentStore } from '../../_stores/paymentStore';
import { useCartStore } from '../../_stores/cartStore';
import { useAuthStore } from '../../_stores/authStore';
import mercadoPagoService from '../../_services/payment/mercadoPago';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
  Stack: {
    Screen: () => null,
  },
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  Feather: 'Feather',
}));

// Import mocked router after mocking
const { router, useLocalSearchParams } = require('expo-router');

// Import maskEmail for unit testing - extract from component
// We test it indirectly through the rendered output
const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  const firstChar = localPart.charAt(0);
  return `${firstChar}***@${domain}`;
};

describe('maskEmail utility', () => {
  it('should mask email correctly', () => {
    expect(maskEmail('john@example.com')).toBe('j***@example.com');
    expect(maskEmail('maria@gmail.com')).toBe('m***@gmail.com');
  });

  it('should handle single character local part', () => {
    expect(maskEmail('a@test.com')).toBe('a***@test.com');
  });

  it('should return original if no @ symbol', () => {
    expect(maskEmail('invalid-email')).toBe('invalid-email');
  });
});

describe('PaymentResultScreen', () => {
  let mockGetOrderStatus: jest.SpyInstance;
  let mockSetAuthToken: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset stores to initial state
    usePaymentStore.setState({
      currentOrderNumber: null,
      currentOrderId: null,
      guestData: null,
      isLoading: false,
      error: null,
    });

    useCartStore.setState({
      items: [
        { productId: 'test-1', quantity: 1, price: 100 },
        { productId: 'test-2', quantity: 2, price: 50 },
      ],
      isLoading: false,
      error: null,
    });

    useAuthStore.setState({
      token: 'test-auth-token',
      user: { id: 'user-1', email: 'test@example.com', name: 'Test User', profilePicture: null },
      isLoggedIn: true,
    });

    // Default params
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    // Default mock for order status - returns immediately
    mockGetOrderStatus = jest
      .spyOn(mercadoPagoService, 'getOrderStatusByNumber')
      .mockResolvedValue({
        orderNumber: 'ORDER-123',
        status: 'pending',
      });

    // Mock setAuthToken
    mockSetAuthToken = jest.spyOn(mercadoPagoService, 'setAuthToken').mockImplementation(() => {});
  });

  afterEach(() => {
    mockGetOrderStatus.mockRestore();
    mockSetAuthToken.mockRestore();
  });

  describe('Authentication', () => {
    it('should set auth token on service when user is logged in', async () => {
      useAuthStore.setState({
        token: 'my-jwt-token',
        isLoggedIn: true,
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', profilePicture: null },
      });

      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'ORDER-123',
        status: 'paid',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
      });

      render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(mockSetAuthToken).toHaveBeenCalledWith('my-jwt-token');
      });
    });

    it('should not set auth token when user is not logged in', async () => {
      useAuthStore.setState({
        token: null,
        isLoggedIn: false,
        user: null,
      });

      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'ORDER-123',
        status: 'paid',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
      });

      render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(mockSetAuthToken).not.toHaveBeenCalled();
      });
    });

    it('should NOT pass email to getOrderStatusByNumber for authenticated users', async () => {
      useAuthStore.setState({
        token: 'auth-token',
        isLoggedIn: true,
        user: { id: 'user-1', email: 'user@example.com', name: 'User', profilePicture: null },
      });

      // Even if guestData exists, authenticated users should not pass email
      usePaymentStore.setState({
        guestData: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'guest@example.com',
          phoneNumber: '+5491122334455',
          addressLine1: '123 Main St',
          city: 'Buenos Aires',
          state: 'CABA',
          country: 'Argentina',
        },
      });

      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'AUTH-ORDER-123',
        status: 'paid',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'AUTH-ORDER-123',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        // Should pass undefined for email since user is authenticated
        expect(mockGetOrderStatus).toHaveBeenCalledWith('AUTH-ORDER-123', undefined);
        expect(getByText('¡Pago exitoso!')).toBeTruthy();
      });
    });
  });

  describe('Successful Payment (via backend polling)', () => {
    it('should display success UI when backend returns paid status', async () => {
      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'ORDER-123',
        status: 'paid',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('¡Pago exitoso!')).toBeTruthy();
        expect(getByText('Tu pedido ha sido procesado correctamente.')).toBeTruthy();
        expect(getByText('Ver mis pedidos')).toBeTruthy();
      });
    });

    it('should display success UI when backend returns processing status', async () => {
      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'ORDER-123',
        status: 'processing',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('¡Pago exitoso!')).toBeTruthy();
      });
    });

    it('should clear cart on successful cart checkout payment', async () => {
      // No pendingBuyNowItem = this was a cart checkout
      usePaymentStore.setState({
        pendingBuyNowItem: null,
        currentOrderNumber: 'ORDER-123',
      });

      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'ORDER-123',
        status: 'paid',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
      });

      const clearCartSpy = jest.spyOn(useCartStore.getState(), 'clearCart');

      render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(clearCartSpy).toHaveBeenCalled();
      });

      clearCartSpy.mockRestore();
    });

    it('should NOT clear cart on successful "Buy Now" payment', async () => {
      // pendingBuyNowItem exists = this was a "Buy Now" order, cart items were not part of order
      usePaymentStore.setState({
        pendingBuyNowItem: {
          productId: 'buy-now-product',
          size: 'M',
          quantity: 1,
          price: 100,
          title: 'Buy Now Product',
          imageUrl: 'https://example.com/image.jpg',
        },
        currentOrderNumber: 'ORDER-BUY-NOW',
      });

      // Cart has items that should NOT be cleared
      useCartStore.setState({
        items: [
          { productId: 'cart-item-1', quantity: 2, price: 50 },
          { productId: 'cart-item-2', quantity: 1, price: 75 },
        ],
      });

      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'ORDER-BUY-NOW',
        status: 'paid',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-BUY-NOW',
      });

      const clearCartSpy = jest.spyOn(useCartStore.getState(), 'clearCart');

      render(<PaymentResultScreen />);

      await waitFor(() => {
        // Should show success
        expect(mockGetOrderStatus).toHaveBeenCalled();
      });

      // Wait for effect to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Cart should NOT be cleared for "Buy Now" orders
      expect(clearCartSpy).not.toHaveBeenCalled();

      clearCartSpy.mockRestore();
    });

    it('should navigate to orders when "Ver Mis Pedidos" is pressed', async () => {
      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'ORDER-123',
        status: 'paid',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('Ver mis pedidos')).toBeTruthy();
      });

      fireEvent.press(getByText('Ver mis pedidos'));

      expect(router.replace).toHaveBeenCalledWith('/profile/orders');
    });
  });

  describe('Failed Payment (from deep link)', () => {
    it('should display failure UI when paymentFailure=true in params', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentFailure: 'true',
        external_reference: 'ORDER-FAILED',
        error: 'Fondos insuficientes',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('Pago no completado')).toBeTruthy();
        expect(getByText('Fondos insuficientes')).toBeTruthy();
        expect(getByText('Intentar nuevamente')).toBeTruthy();
      });
    });

    it('should display failure UI when backend returns cancelled status', async () => {
      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'ORDER-123',
        status: 'cancelled',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('Pago no completado')).toBeTruthy();
      });
    });

    it('should NOT clear cart on failed payment', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentFailure: 'true',
        error: 'Payment declined',
      });

      const clearCartSpy = jest.spyOn(useCartStore.getState(), 'clearCart');

      render(<PaymentResultScreen />);

      // Wait a small amount of time, cart should remain
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(clearCartSpy).not.toHaveBeenCalled();

      clearCartSpy.mockRestore();
    });

    it('should navigate to payment selection when "Intentar Nuevamente" is pressed', async () => {
      // paymentFailure with no payment_id shows failure immediately
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentFailure: 'true',
        external_reference: 'ORDER-FAILED',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('Intentar nuevamente')).toBeTruthy();
      });

      fireEvent.press(getByText('Intentar nuevamente'));

      expect(router.replace).toHaveBeenCalledWith('/checkout/payment-selection');
    });

    it('should verify once when paymentFailure=true but payment_id exists', async () => {
      // Edge case: payment_id exists means MP created a payment, so we should verify
      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'ORDER-EDGE',
        status: 'cancelled', // Backend confirms it really failed
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentFailure: 'true',
        external_reference: 'ORDER-EDGE',
        payment_id: '12345678',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(mockGetOrderStatus).toHaveBeenCalledTimes(1);
        expect(mockGetOrderStatus).toHaveBeenCalledWith('ORDER-EDGE', undefined);
        expect(getByText('Pago no completado')).toBeTruthy();
      });
    });

    it('should show success when paymentFailure=true but backend returns paid (edge case)', async () => {
      // Edge case: User got failure redirect but payment actually went through
      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'ORDER-SURPRISE',
        status: 'paid',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentFailure: 'true',
        external_reference: 'ORDER-SURPRISE',
        payment_id: '12345678',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('¡Pago exitoso!')).toBeTruthy();
      });
    });

    it('should show pending when paymentFailure=true but backend returns pending', async () => {
      // Payment still processing - don't show as failed yet
      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'ORDER-PROCESSING',
        status: 'pending',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentFailure: 'true',
        external_reference: 'ORDER-PROCESSING',
        payment_id: '12345678',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('Pago pendiente')).toBeTruthy();
      });
    });

    it('should show failure immediately when paymentFailure=true and no payment_id', async () => {
      // No payment_id = user cancelled before MP created a payment
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentFailure: 'true',
        external_reference: 'ORDER-CANCELLED',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(mockGetOrderStatus).not.toHaveBeenCalled();
        expect(getByText('Pago no completado')).toBeTruthy();
      });
    });
  });

  describe('Pending Payment', () => {
    it('should show pending when no order number available', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        // No external_reference or currentOrderNumber
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('Pago pendiente')).toBeTruthy();
        expect(getByText(/Si realizaste el pago, revisá tu casilla de correo/)).toBeTruthy();
        expect(getByText(/infotiffosiuy@gmail.com/)).toBeTruthy();
      });
    });

    it('should show masked email for guest in pending state', async () => {
      useAuthStore.setState({
        token: null,
        isLoggedIn: false,
        user: null,
      });

      usePaymentStore.setState({
        guestData: {
          firstName: 'Test',
          lastName: 'User',
          email: 'testuser@example.com',
          phoneNumber: '+59899123456',
        },
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        // No external_reference - immediate pending
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('Pago pendiente')).toBeTruthy();
        expect(getByText(/t\*\*\*@example\.com/)).toBeTruthy();
      });
    });

    it('should NOT clear cart for pending payment', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        // No external_reference - immediate pending
      });

      const clearCartSpy = jest.spyOn(useCartStore.getState(), 'clearCart');

      render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(clearCartSpy).not.toHaveBeenCalled();
      });

      clearCartSpy.mockRestore();
    });
  });

  describe('Status Verification (polling behavior)', () => {
    it('should verify order status by order number', async () => {
      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'ORDER-123',
        status: 'paid',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(mockGetOrderStatus).toHaveBeenCalledWith('ORDER-123', undefined);
        expect(getByText('¡Pago exitoso!')).toBeTruthy();
      });
    });

    it('should show loading state while verifying', async () => {
      mockGetOrderStatus.mockImplementation(() => new Promise(() => {})); // Never resolves

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
      });

      const { getByText } = render(<PaymentResultScreen />);

      // Should show verifying message while loading
      await waitFor(() => {
        expect(getByText('Verificando pago...')).toBeTruthy();
      });
    });

    it('should stop polling when status becomes paid', async () => {
      let callCount = 0;
      mockGetOrderStatus.mockImplementation(() => {
        callCount++;
        if (callCount >= 2) {
          return Promise.resolve({ orderNumber: 'ORDER-123', status: 'paid' });
        }
        return Promise.resolve({ orderNumber: 'ORDER-123', status: 'pending' });
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(
        () => {
          expect(getByText('¡Pago exitoso!')).toBeTruthy();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Order Number Display', () => {
    it('should display order number from external_reference param', async () => {
      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'ORD-2024-001',
        status: 'paid',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORD-2024-001',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('ORD-2024-001')).toBeTruthy();
      });
    });

    it('should use currentOrderNumber from store when not in params', async () => {
      usePaymentStore.setState({
        currentOrderId: 'STORE-ORDER-123',
        currentOrderNumber: 'STORE-ORDER-123',
      });

      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'STORE-ORDER-123',
        status: 'paid',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        // No external_reference in params
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('STORE-ORDER-123')).toBeTruthy();
      });
    });
  });

  describe('Guest User', () => {
    it('should NOT show "Ver mis pedidos" for guest users on success', async () => {
      useAuthStore.setState({
        token: null,
        isLoggedIn: false,
        user: null,
      });

      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'ORDER-123',
        status: 'paid',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
      });

      const { queryByText, getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('¡Pago exitoso!')).toBeTruthy();
        expect(queryByText('Ver mis pedidos')).toBeNull();
        expect(getByText('Volver al inicio')).toBeTruthy();
      });
    });

    it('should NOT show "Ver mis pedidos" for guest users on pending (no order number)', async () => {
      useAuthStore.setState({
        token: null,
        isLoggedIn: false,
        user: null,
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        // No order number - immediate pending
      });

      const { queryByText, getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('Pago pendiente')).toBeTruthy();
        expect(queryByText('Ver mis pedidos')).toBeNull();
        expect(getByText('Volver al inicio')).toBeTruthy();
      });
    });

    it('should verify by order number for guest users', async () => {
      useAuthStore.setState({
        token: null,
        isLoggedIn: false,
        user: null,
      });

      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'GUEST-ORDER-123',
        status: 'paid',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'GUEST-ORDER-123',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(mockGetOrderStatus).toHaveBeenCalledWith('GUEST-ORDER-123', undefined);
        expect(getByText('¡Pago exitoso!')).toBeTruthy();
      });
    });

    it('should pass guest email to getOrderStatusByNumber when guestData has email', async () => {
      useAuthStore.setState({
        token: null,
        isLoggedIn: false,
        user: null,
      });

      usePaymentStore.setState({
        guestData: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'guest@example.com',
          phoneNumber: '+5491122334455',
          addressLine1: '123 Main St',
          city: 'Buenos Aires',
          state: 'CABA',
          country: 'Argentina',
        },
      });

      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'GUEST-ORDER-456',
        status: 'paid',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'GUEST-ORDER-456',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(mockGetOrderStatus).toHaveBeenCalledWith('GUEST-ORDER-456', 'guest@example.com');
        expect(getByText('¡Pago exitoso!')).toBeTruthy();
      });
    });

    it('should pass guest email from guestData for pickup (contact info only)', async () => {
      useAuthStore.setState({
        token: null,
        isLoggedIn: false,
        user: null,
      });

      // Pickup case: guestData has contact info only (no address fields)
      usePaymentStore.setState({
        guestData: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phoneNumber: '+5491122334455',
        },
      });

      mockGetOrderStatus.mockResolvedValue({
        orderNumber: 'GUEST-PICKUP-789',
        status: 'paid',
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'GUEST-PICKUP-789',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(mockGetOrderStatus).toHaveBeenCalledWith('GUEST-PICKUP-789', 'jane@example.com');
        expect(getByText('¡Pago exitoso!')).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate home when "Volver al Inicio" is pressed on error', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentFailure: 'true',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('Volver al inicio')).toBeTruthy();
      });

      fireEvent.press(getByText('Volver al inicio'));

      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });
});
