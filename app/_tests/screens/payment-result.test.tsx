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

describe('PaymentResultScreen', () => {
  let mockGetOrderStatus: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset stores to initial state
    usePaymentStore.setState({
      currentOrderNumber: null,
      currentOrderId: null,
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
  });

  afterEach(() => {
    mockGetOrderStatus.mockRestore();
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

    it('should clear cart on successful payment', async () => {
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

    it('should navigate back when "Intentar Nuevamente" is pressed', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentFailure: 'true',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('Intentar nuevamente')).toBeTruthy();
      });

      fireEvent.press(getByText('Intentar nuevamente'));

      expect(router.back).toHaveBeenCalled();
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
        expect(mockGetOrderStatus).toHaveBeenCalledWith('ORDER-123');
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
        expect(mockGetOrderStatus).toHaveBeenCalledWith('GUEST-ORDER-123');
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
