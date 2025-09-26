/**
 * Order Service Unit Tests
 * Tests business logic without making actual API calls
 * Following testing principles: mock only at httpClient boundary
 */

import httpClient from '../../_services/api/httpClient';
import { orderService } from '../../_services/order/orderService';
import mercadoPagoService from '../../_services/payment/mercadoPago';
import type {
  CreateOrderRequest,
  OrderStatus,
  PaymentStatus,
} from '../../_services/order/orderService';

// Mock httpClient at the boundary
jest.mock('../../_services/api/httpClient');
const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

// Mock MercadoPago service for createOrderWithPayment
jest.mock('../../_services/payment/mercadoPago');
const mockMercadoPagoService = mercadoPagoService as jest.Mocked<typeof mercadoPagoService>;

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    orderService.setAuthToken('test-auth-token');
  });

  describe('createOrder', () => {
    const validOrderRequest: CreateOrderRequest = {
      items: [
        {
          productId: 'prod-1',
          quantity: 2,
        },
      ],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        street: 'Main St',
        number: '123',
        city: 'Montevideo',
        country: 'Uruguay',
      },
      shippingMethod: 'delivery',
      notes: 'Test order',
    };

    const userData = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    it('should create order with valid data', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'TIF-20240101-123456',
        status: 'CREATED',
        items: validOrderRequest.items,
        total: 69.98,
      };

      mockHttpClient.post.mockResolvedValue({ order: mockOrder });

      const result = await orderService.createOrder(validOrderRequest, userData);

      expect(result.success).toBe(true);
      expect(result.order).toEqual(mockOrder);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/orders',
        expect.objectContaining({
          orderNumber: expect.stringMatching(/^TIF-\d{8}-\d{6}$/),
          items: validOrderRequest.items,
          user: userData,
          shippingAddress: validOrderRequest.shippingAddress,
          shippingMethod: 'delivery',
          status: 'CREATED',
          paymentStatus: 'PENDING',
        }),
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-auth-token' },
        })
      );
    });

    it('should fail when no authentication token', async () => {
      orderService.setAuthToken(null);

      const result = await orderService.createOrder(validOrderRequest, userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication token required');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should validate order has items', async () => {
      const invalidRequest = { ...validOrderRequest, items: [] };

      const result = await orderService.createOrder(invalidRequest, userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Order must contain at least one item');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should validate shipping address is provided', async () => {
      const invalidRequest = { ...validOrderRequest, shippingAddress: undefined as any };

      const result = await orderService.createOrder(invalidRequest, userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Shipping address is required');
    });

    it('should validate shipping method', async () => {
      const invalidRequest = { ...validOrderRequest, shippingMethod: 'invalid' as any };

      const result = await orderService.createOrder(invalidRequest, userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid shipping method');
    });

    it('should validate each item has required fields', async () => {
      const invalidRequest = {
        ...validOrderRequest,
        items: [
          { productId: '', quantity: 0, productName: '', price: 0 },
          { productId: 'prod-2', quantity: -1, productName: 'Test', price: 10 },
        ],
      };

      const result = await orderService.createOrder(invalidRequest, userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Item 1: Product ID is required');
      expect(result.error).toContain('Item 1: Valid quantity is required');
      expect(result.error).toContain('Item 2: Valid quantity is required');
    });

    it('should handle API errors gracefully', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Network error'));

      const result = await orderService.createOrder(validOrderRequest, userData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should generate unique order numbers', async () => {
      const orderNumbers = new Set<string>();

      // Mock successful responses
      mockHttpClient.post.mockResolvedValue({ order: { id: 'order-1' } });

      // Create multiple orders with small delays to ensure different timestamps
      for (let i = 0; i < 5; i++) {
        await orderService.createOrder(validOrderRequest, userData);
        const call = mockHttpClient.post.mock.calls[i][1];
        orderNumbers.add((call as any).orderNumber);

        // Add 1ms delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 1));
      }

      // All order numbers should be unique
      expect(orderNumbers.size).toBe(5);

      // All should follow the pattern
      orderNumbers.forEach((orderNumber) => {
        expect(orderNumber).toMatch(/^TIF-\d{8}-\d{6}$/);
      });
    });
  });

  describe('createOrderWithPayment', () => {
    const orderRequest: CreateOrderRequest = {
      items: [{ productId: 'prod-1', quantity: 1 }],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        street: 'Main St',
        number: '123',
        city: 'Montevideo',
        country: 'Uruguay',
      },
      shippingMethod: 'delivery',
    };

    const userData = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    it('should create order and payment preference', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'TIF-20240101-123456',
        status: 'CREATED' as OrderStatus,
        items: orderRequest.items,
        shippingCost: 10,
        subtotal: 100,
        discount: 0,
        total: 110,
      };

      mockHttpClient.post.mockResolvedValue({ order: mockOrder });
      mockMercadoPagoService.createPaymentPreference.mockResolvedValue({
        id: 'pref-1',
        initPoint: 'https://checkout.mercadopago.com/...',
        externalReference: 'TIF-20240101-123456',
      });

      const result = await orderService.createOrderWithPayment(orderRequest, userData);

      expect(result.success).toBe(true);
      expect(result.order).toEqual(mockOrder);
      expect(result.paymentUrl).toBe('https://checkout.mercadopago.com/...');

      expect(mockMercadoPagoService.createPaymentPreference).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'order-1',
          orderNumber: 'TIF-20240101-123456',
          total: 110,
        })
      );
    });

    it('should handle order creation failure', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Order creation failed'));

      const result = await orderService.createOrderWithPayment(orderRequest, userData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockMercadoPagoService.createPaymentPreference).not.toHaveBeenCalled();
    });

    it('should handle payment preference creation failure', async () => {
      mockHttpClient.post.mockResolvedValue({
        order: { id: 'order-1', orderNumber: 'TIF-123', total: 100 },
      });
      mockMercadoPagoService.createPaymentPreference.mockRejectedValue(new Error('Payment failed'));

      const result = await orderService.createOrderWithPayment(orderRequest, userData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getUserOrders', () => {
    it('should fetch user orders with pagination', async () => {
      const mockOrders = [
        { id: 'order-1', orderNumber: 'TIF-001', status: 'PAID' },
        { id: 'order-2', orderNumber: 'TIF-002', status: 'DELIVERED' },
      ];

      mockHttpClient.get.mockResolvedValue({
        orders: mockOrders,
        pagination: {
          page: 1,
          pageSize: 10,
          total: 2,
          totalPages: 1,
        },
      });

      const result = await orderService.getUserOrders(1, 10);

      expect(result.success).toBe(true);
      expect(result.orders).toEqual(mockOrders);
      expect(result.pagination).toBeDefined();
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/orders?page=1&pageSize=10',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-auth-token' },
        })
      );
    });

    it('should filter orders by status', async () => {
      mockHttpClient.get.mockResolvedValue({ orders: [] });

      await orderService.getUserOrders(1, 10, 'PAID');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/orders?page=1&pageSize=10&status=PAID',
        expect.any(Object)
      );
    });

    it('should require authentication', async () => {
      orderService.setAuthToken(null);

      const result = await orderService.getUserOrders();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication token required');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      mockHttpClient.put.mockResolvedValue({ success: true });

      const result = await orderService.updateOrderStatus('order-1', 'SHIPPED');

      expect(result).toBe(true);
      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/orders/order-1/status',
        { status: 'SHIPPED' },
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-auth-token' },
        })
      );
    });

    it('should return false on error', async () => {
      mockHttpClient.put.mockRejectedValue(new Error('Update failed'));

      const result = await orderService.updateOrderStatus('order-1', 'SHIPPED');

      expect(result).toBe(false);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order with reason', async () => {
      mockHttpClient.put.mockResolvedValue({ success: true });

      const result = await orderService.cancelOrder('order-1', 'Customer request');

      expect(result).toBe(true);
      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/orders/order-1/cancel',
        { reason: 'Customer request' },
        expect.any(Object)
      );
    });

    it('should cancel order without reason', async () => {
      mockHttpClient.put.mockResolvedValue({ success: true });

      const result = await orderService.cancelOrder('order-1');

      expect(result).toBe(true);
      expect(mockHttpClient.put).toHaveBeenCalledWith(
        '/orders/order-1/cancel',
        { reason: undefined },
        expect.any(Object)
      );
    });
  });

  describe('trackOrder', () => {
    it('should fetch order tracking information', async () => {
      const mockTracking = {
        order: { id: 'order-1', status: 'SHIPPED' },
        trackingEvents: [
          {
            status: 'CREATED' as OrderStatus,
            timestamp: '2024-01-01',
            description: 'Order created',
          },
          {
            status: 'PAID' as OrderStatus,
            timestamp: '2024-01-02',
            description: 'Payment received',
          },
        ],
      };

      mockHttpClient.get.mockResolvedValue({ data: mockTracking });

      const result = await orderService.trackOrder('order-1');

      expect(result).toEqual(mockTracking);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/orders/order-1/tracking',
        expect.any(Object)
      );
    });

    it('should throw on error', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Not found'));

      await expect(orderService.trackOrder('order-1')).rejects.toThrow();
    });
  });

  describe('status and permission helpers', () => {
    describe('getOrderStatusText', () => {
      it('should return Spanish text for order status', () => {
        expect(orderService.getOrderStatusText('CREATED')).toBe('Pedido creado');
        expect(orderService.getOrderStatusText('PAID')).toBe('Pago confirmado');
        expect(orderService.getOrderStatusText('SHIPPED')).toBe('Enviado');
        expect(orderService.getOrderStatusText('DELIVERED')).toBe('Entregado');
        expect(orderService.getOrderStatusText('CANCELLED')).toBe('Cancelado');
        expect(orderService.getOrderStatusText('REFUNDED')).toBe('Reembolsado');
      });

      it('should handle unknown status', () => {
        expect(orderService.getOrderStatusText('UNKNOWN' as OrderStatus)).toBe(
          'Estado desconocido'
        );
      });
    });

    describe('getPaymentStatusText', () => {
      it('should return Spanish text for payment status', () => {
        expect(orderService.getPaymentStatusText('PENDING')).toBe('Pendiente');
        expect(orderService.getPaymentStatusText('APPROVED')).toBe('Aprobado');
        expect(orderService.getPaymentStatusText('REJECTED')).toBe('Rechazado');
        expect(orderService.getPaymentStatusText('CANCELLED')).toBe('Cancelado');
        expect(orderService.getPaymentStatusText('REFUNDED')).toBe('Reembolsado');
      });

      it('should handle unknown status', () => {
        expect(orderService.getPaymentStatusText('UNKNOWN' as PaymentStatus)).toBe(
          'Estado desconocido'
        );
      });
    });

    describe('canCancelOrder', () => {
      it('should allow cancellation for early order states', () => {
        expect(orderService.canCancelOrder({ status: 'CREATED' } as any)).toBe(true);
        expect(orderService.canCancelOrder({ status: 'PAYMENT_PENDING' } as any)).toBe(true);
        expect(orderService.canCancelOrder({ status: 'PAID' } as any)).toBe(true);
      });

      it('should prevent cancellation for late order states', () => {
        expect(orderService.canCancelOrder({ status: 'SHIPPED' } as any)).toBe(false);
        expect(orderService.canCancelOrder({ status: 'DELIVERED' } as any)).toBe(false);
        expect(orderService.canCancelOrder({ status: 'CANCELLED' } as any)).toBe(false);
      });
    });

    describe('canRefundOrder', () => {
      it('should allow refund for paid and shipped orders', () => {
        expect(
          orderService.canRefundOrder({
            status: 'PAID',
            paymentStatus: 'APPROVED',
          } as any)
        ).toBe(true);

        expect(
          orderService.canRefundOrder({
            status: 'SHIPPED',
            paymentStatus: 'APPROVED',
          } as any)
        ).toBe(true);
      });

      it('should prevent refund if payment not approved', () => {
        expect(
          orderService.canRefundOrder({
            status: 'PAID',
            paymentStatus: 'PENDING',
          } as any)
        ).toBe(false);
      });

      it('should prevent refund for invalid order states', () => {
        expect(
          orderService.canRefundOrder({
            status: 'CREATED',
            paymentStatus: 'APPROVED',
          } as any)
        ).toBe(false);

        expect(
          orderService.canRefundOrder({
            status: 'CANCELLED',
            paymentStatus: 'APPROVED',
          } as any)
        ).toBe(false);
      });
    });
  });

  describe('getOrderById', () => {
    it('should fetch order by ID', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'TIF-001',
        status: 'PAID',
      };

      mockHttpClient.get.mockResolvedValue({ order: mockOrder });

      const result = await orderService.getOrderById('order-1');

      expect(result).toEqual(mockOrder);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/orders/order-1',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-auth-token' },
        })
      );
    });

    it('should throw on error', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Not found'));

      await expect(orderService.getOrderById('order-1')).rejects.toThrow();
    });
  });
});
