/**
 * Order Service
 * Handles order creation, tracking, and management with Strapi backend
 */

import httpClient from '../api/httpClient';
import { handleApiError } from '../api/errorHandler';
import { endpoints } from '../../_config/endpoints';
import { CartItem } from '../cart/cartService';
import { Address } from '../address/addressService';
import mercadoPagoService, { OrderData, UserData } from '../payment/mercadoPago';

export interface OrderItem {
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  price: number;
  discountedPrice?: number;
  size?: string;
  color?: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  shippingAddress: Address;
  shippingMethod: 'delivery' | 'pickup';
  shippingCost: number;
  subtotal: number;
  discount: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  notes?: string;
}

export type OrderStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED';

export interface CreateOrderRequest {
  items: CartItem[];
  shippingAddress?: Address | null; // Optional for pickup orders
  shippingMethod: 'delivery' | 'pickup';
  storeLocationCode?: string;
  notes?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  order?: Order;
  error?: string;
}

export interface OrderListResponse {
  success: boolean;
  orders?: Order[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

class OrderService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = endpoints.baseUrl;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
    // Also set token for MercadoPago service
    if (mercadoPagoService && mercadoPagoService.setAuthToken) {
      mercadoPagoService.setAuthToken(token || '');
    }
  }

  /**
   * Check if user data represents a guest user
   */
  private isGuestUser(userData: UserData): boolean {
    return typeof userData.id === 'string' && userData.id.startsWith('guest-');
  }

  /**
   * Create a new order
   */
  async createOrder(
    orderRequest: CreateOrderRequest,
    userData: UserData
  ): Promise<CreateOrderResponse> {
    try {
      const isGuest = this.isGuestUser(userData);

      // Only require auth for non-guest orders
      if (!isGuest && !this.authToken) {
        throw new Error('Authentication token required');
      }

      // Validate order request
      const validation = this.validateOrderRequest(orderRequest);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }

      // Calculate order totals
      const totals = await this.calculateOrderTotals(orderRequest.items);

      // Generate order number
      const orderNumber = this.generateOrderNumber();

      if (isGuest) {
        // Create guest order data
        const guestOrderData = {
          orderNumber,
          items: orderRequest.items,
          guestEmail: userData.email,
          guestName: `${userData.firstName} ${userData.lastName}`.trim(),
          guestPhone: userData.phone?.number,
          shippingAddress: orderRequest.shippingAddress,
          shippingMethod: orderRequest.shippingMethod,
          storeLocationCode: orderRequest.storeLocationCode,
          shippingCost: totals.shippingCost,
          subtotal: totals.subtotal,
          discount: totals.discount,
          total: totals.total,
          status: 'CREATED' as OrderStatus,
          paymentStatus: 'PENDING' as PaymentStatus,
          notes: orderRequest.notes,
        };

        const response = await httpClient.post('/orders/guest', guestOrderData);
        const order = response.order || response.data?.order || response.data;

        return {
          success: true,
          order,
        };
      }

      // Create order data for authenticated users
      const orderData = {
        orderNumber,
        items: orderRequest.items,
        user: userData,
        shippingAddress: orderRequest.shippingAddress,
        shippingMethod: orderRequest.shippingMethod,
        storeLocationCode: orderRequest.storeLocationCode,
        shippingCost: totals.shippingCost,
        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,
        status: 'CREATED' as OrderStatus,
        paymentStatus: 'PENDING' as PaymentStatus,
        notes: orderRequest.notes,
      };

      const response = await httpClient.post('/orders', orderData, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      const order = response.order || response.data?.order || response.data;

      return {
        success: true,
        order,
      };
    } catch (error) {
      const apiError = handleApiError(error, 'createOrder');
      return {
        success: false,
        error: apiError.message,
      };
    }
  }

  /**
   * Create order and initiate MercadoPago payment
   */
  async createOrderWithPayment(
    orderRequest: CreateOrderRequest,
    userData: UserData
  ): Promise<{
    success: boolean;
    order?: Order;
    paymentUrl?: string;
    error?: string;
  }> {
    try {
      // First, create the order
      const orderResult = await this.createOrder(orderRequest, userData);

      if (!orderResult.success || !orderResult.order) {
        return {
          success: false,
          error: orderResult.error || 'Failed to create order',
        };
      }

      // Prepare MercadoPago order data
      const mpOrderData: OrderData = {
        id: orderResult.order.id,
        orderNumber: orderResult.order.orderNumber,
        items: orderResult.order.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          description: item.description,
          quantity: item.quantity,
          price: item.discountedPrice || item.price,
          size: item.size,
          color: item.color,
        })),
        user: userData,
        shippingAddress: orderRequest.shippingAddress
          ? {
              addressLine1: orderRequest.shippingAddress.addressLine1,
              addressLine2: orderRequest.shippingAddress.addressLine2,
              city: orderRequest.shippingAddress.city,
              state: orderRequest.shippingAddress.state,
              country: orderRequest.shippingAddress.country,
              postalCode: orderRequest.shippingAddress.postalCode,
            }
          : null,
        shippingMethod: orderRequest.shippingMethod,
        shippingCost: orderResult.order.shippingCost,
        subtotal: orderResult.order.subtotal,
        discount: orderResult.order.discount,
        total: orderResult.order.total,
      };

      // Create MercadoPago payment preference
      const preference = await mercadoPagoService.createPaymentPreference(mpOrderData);

      return {
        success: true,
        order: orderResult.order,
        paymentUrl: preference.initPoint,
      };
    } catch (error) {
      const apiError = handleApiError(error, 'createOrderWithPayment');
      return {
        success: false,
        error: apiError.message,
      };
    }
  }

  /**
   * Get user's orders
   */
  async getUserOrders(
    page: number = 1,
    pageSize: number = 10,
    status?: OrderStatus
  ): Promise<OrderListResponse> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication token required');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(status && { status }),
      });

      const response = await httpClient.get(`/orders?${params}`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      const orders = response.orders || response.data?.orders || response.data || [];
      const pagination = response.pagination || response.data?.pagination;

      return {
        success: true,
        orders,
        pagination,
      };
    } catch (error) {
      const apiError = handleApiError(error, 'getUserOrders');
      return {
        success: false,
        error: apiError.message,
      };
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication token required');
      }

      const response = await httpClient.get(`/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      const order = response.order || response.data?.order || response.data;
      return order || null;
    } catch (error) {
      const apiError = handleApiError(error, 'getOrderById');
      throw new Error(apiError.message);
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication token required');
      }

      await httpClient.put(
        `/orders/${orderId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        }
      );

      return true;
    } catch (error) {
      const _apiError = handleApiError(error, 'updateOrderStatus');
      return false;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<boolean> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication token required');
      }

      await httpClient.put(
        `/orders/${orderId}/cancel`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        }
      );

      return true;
    } catch (error) {
      const _apiError = handleApiError(error, 'cancelOrder');
      return false;
    }
  }

  /**
   * Track order
   */
  async trackOrder(orderId: string): Promise<{
    order: Order;
    trackingEvents: {
      status: OrderStatus;
      timestamp: string;
      description: string;
      location?: string;
    }[];
  } | null> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication token required');
      }

      const response = await httpClient.get(`/orders/${orderId}/tracking`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      return response.data || null;
    } catch (error) {
      const apiError = handleApiError(error, 'trackOrder');
      throw new Error(apiError.message);
    }
  }

  /**
   * Calculate order totals
   */
  private async calculateOrderTotals(items: CartItem[]): Promise<{
    subtotal: number;
    shippingCost: number;
    discount: number;
    total: number;
  }> {
    // This would typically fetch current product prices from the API
    // For now, we'll use mock calculations
    let subtotal = 0;

    for (const item of items) {
      // In a real implementation, fetch current price from product API
      const price = 29.99; // Mock price
      subtotal += price * item.quantity;
    }

    const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const discount = 0; // Apply any discounts here
    const total = subtotal + shippingCost - discount;

    return {
      subtotal,
      shippingCost,
      discount,
      total,
    };
  }

  /**
   * Validate order request
   */
  private validateOrderRequest(orderRequest: CreateOrderRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!orderRequest.items || orderRequest.items.length === 0) {
      errors.push('Order must contain at least one item');
    }

    // Shipping address required only for delivery, not pickup
    if (orderRequest.shippingMethod === 'delivery' && !orderRequest.shippingAddress) {
      errors.push('Shipping address is required for delivery orders');
    }

    if (!orderRequest.shippingMethod) {
      errors.push('Shipping method is required');
    }

    if (!['delivery', 'pickup'].includes(orderRequest.shippingMethod)) {
      errors.push('Invalid shipping method');
    }

    // Validate each item
    orderRequest.items?.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate order number
   */
  private generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    // Use timestamp (last 4 digits) + random (2 digits) for better uniqueness
    const timestamp = now.getTime().toString().slice(-4);
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0');

    return `TIF-${year}${month}${day}-${timestamp}${random}`;
  }

  /**
   * Get order status display text
   */
  getOrderStatusText(status: OrderStatus): string {
    const statusTexts: Record<OrderStatus, string> = {
      CREATED: 'Pedido creado',
      PAYMENT_PENDING: 'Esperando pago',
      PAID: 'Pago confirmado',
      PROCESSING: 'Procesando',
      SHIPPED: 'Enviado',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
      REFUNDED: 'Reembolsado',
    };

    return statusTexts[status] || 'Estado desconocido';
  }

  /**
   * Get payment status display text
   */
  getPaymentStatusText(status: PaymentStatus): string {
    const statusTexts: Record<PaymentStatus, string> = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobado',
      REJECTED: 'Rechazado',
      CANCELLED: 'Cancelado',
      REFUNDED: 'Reembolsado',
    };

    return statusTexts[status] || 'Estado desconocido';
  }

  /**
   * Check if order can be cancelled
   */
  canCancelOrder(order: Order): boolean {
    const cancellableStatuses: OrderStatus[] = ['CREATED', 'PAYMENT_PENDING', 'PAID'];
    return cancellableStatuses.includes(order.status);
  }

  /**
   * Check if order can be refunded
   */
  canRefundOrder(order: Order): boolean {
    const refundableStatuses: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED'];
    return refundableStatuses.includes(order.status) && order.paymentStatus === 'APPROVED';
  }
}

// Export singleton instance
export const orderService = new OrderService();
export default orderService;
