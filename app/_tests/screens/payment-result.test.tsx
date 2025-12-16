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

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Import mocked router after mocking
const { router, useLocalSearchParams } = require('expo-router');

describe('PaymentResultScreen', () => {
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
  });

  describe('Successful Payment (from deep link)', () => {
    it('should display success UI when paymentSuccess=true in params', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentSuccess: 'true',
        orderId: 'ORDER-123',
        paymentId: 'PAY-123',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('¡Pago exitoso!')).toBeTruthy();
        expect(getByText('Tu pedido ha sido procesado correctamente.')).toBeTruthy();
        expect(getByText('Ver mis pedidos')).toBeTruthy();
      });
    });

    it('should clear cart on successful payment', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentSuccess: 'true',
        orderId: 'ORDER-123',
        paymentId: 'PAY-123',
      });

      const clearCartSpy = jest.spyOn(useCartStore.getState(), 'clearCart');

      render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(clearCartSpy).toHaveBeenCalled();
      });

      clearCartSpy.mockRestore();
    });

    it('should navigate to orders when "Ver Mis Pedidos" is pressed', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentSuccess: 'true',
        orderId: 'ORDER-123',
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

    it('should NOT clear cart on failed payment', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentFailure: 'true',
        error: 'Payment declined',
      });

      const clearCartSpy = jest.spyOn(useCartStore.getState(), 'clearCart');

      render(<PaymentResultScreen />);

      await waitFor(() => {
        // Wait a bit to ensure it doesn't get called
        expect(clearCartSpy).not.toHaveBeenCalled();
      });

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

  describe('Pending Payment (from deep link)', () => {
    it('should display pending UI when paymentPending=true in params', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentPending: 'true',
        orderId: 'ORDER-789',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('Pago pendiente')).toBeTruthy();
        expect(getByText('Tu pago está siendo procesado.')).toBeTruthy();
        expect(getByText('Ver mis pedidos')).toBeTruthy();
      });
    });

    it('should NOT clear cart for pending payment', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentPending: 'true',
        orderId: 'ORDER-789',
      });

      const clearCartSpy = jest.spyOn(useCartStore.getState(), 'clearCart');

      render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(clearCartSpy).not.toHaveBeenCalled();
      });

      clearCartSpy.mockRestore();
    });
  });

  describe('Status Verification (when no deep link status)', () => {
    it('should verify order status by order number when no status params', async () => {
      const mockGetOrderStatus = jest
        .spyOn(mercadoPagoService, 'getOrderStatusByNumber')
        .mockResolvedValue({
          orderNumber: 'ORDER-123',
          status: 'paid',
          paymentStatus: 'paid',
        });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
        // No paymentSuccess/Failure/Pending params
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(mockGetOrderStatus).toHaveBeenCalledWith('ORDER-123');
        expect(getByText('¡Pago exitoso!')).toBeTruthy();
      });

      mockGetOrderStatus.mockRestore();
    });

    it('should show pending when order status is pending', async () => {
      const mockGetOrderStatus = jest
        .spyOn(mercadoPagoService, 'getOrderStatusByNumber')
        .mockResolvedValue({
          orderNumber: 'ORDER-123',
          status: 'pending',
          paymentStatus: 'pending',
        });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('Pago pendiente')).toBeTruthy();
      });

      mockGetOrderStatus.mockRestore();
    });

    it('should show loading state while verifying', async () => {
      const mockGetOrderStatus = jest
        .spyOn(mercadoPagoService, 'getOrderStatusByNumber')
        .mockImplementation(() => new Promise(() => {})); // Never resolves

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
      });

      const { getByText } = render(<PaymentResultScreen />);

      // Should show verifying message while loading
      await waitFor(() => {
        expect(getByText('Verificando pago...')).toBeTruthy();
      });

      mockGetOrderStatus.mockRestore();
    });

    it('should fall back to pending when verification fails', async () => {
      const mockGetOrderStatus = jest
        .spyOn(mercadoPagoService, 'getOrderStatusByNumber')
        .mockRejectedValue(new Error('Network error'));

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('Pago pendiente')).toBeTruthy();
      });

      mockGetOrderStatus.mockRestore();
    });

    it('should use paymentId verification when available with token', async () => {
      const setAuthTokenSpy = jest.spyOn(mercadoPagoService, 'setAuthToken');
      const mockVerifyStatus = jest
        .spyOn(mercadoPagoService, 'verifyPaymentStatus')
        .mockResolvedValue({
          orderId: 'ORDER-123',
          orderNumber: 'ORD-2024-001',
          status: 'approved',
          paymentInfo: {
            id: 'PAY-123',
            status: 'approved',
            statusDetail: 'accredited',
            amount: 1000,
            currency: 'UYU',
            paymentMethod: 'credit_card',
            dateCreated: new Date().toISOString(),
          },
        });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'ORDER-123',
        payment_id: 'PAY-123',
        // No paymentSuccess param - need to verify
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(setAuthTokenSpy).toHaveBeenCalledWith('test-auth-token');
        expect(mockVerifyStatus).toHaveBeenCalledWith('PAY-123');
        expect(getByText('¡Pago exitoso!')).toBeTruthy();
      });

      setAuthTokenSpy.mockRestore();
      mockVerifyStatus.mockRestore();
    });
  });

  describe('Order Number Display', () => {
    it('should display order number from external_reference param', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentSuccess: 'true',
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

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentSuccess: 'true',
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

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentSuccess: 'true',
        orderId: 'ORDER-123',
      });

      const { queryByText, getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(getByText('¡Pago exitoso!')).toBeTruthy();
        expect(queryByText('Ver mis pedidos')).toBeNull();
        expect(getByText('Volver al inicio')).toBeTruthy();
      });
    });

    it('should NOT show "Ver mis pedidos" for guest users on pending', async () => {
      useAuthStore.setState({
        token: null,
        isLoggedIn: false,
        user: null,
      });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        paymentPending: 'true',
        orderId: 'ORDER-789',
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

      const mockGetOrderStatus = jest
        .spyOn(mercadoPagoService, 'getOrderStatusByNumber')
        .mockResolvedValue({
          orderNumber: 'GUEST-ORDER-123',
          status: 'paid',
          paymentStatus: 'paid',
        });

      (useLocalSearchParams as jest.Mock).mockReturnValue({
        external_reference: 'GUEST-ORDER-123',
      });

      const { getByText } = render(<PaymentResultScreen />);

      await waitFor(() => {
        expect(mockGetOrderStatus).toHaveBeenCalledWith('GUEST-ORDER-123');
        expect(getByText('¡Pago exitoso!')).toBeTruthy();
      });

      mockGetOrderStatus.mockRestore();
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
