import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import mercadoPagoService, {
  OrderData,
  PaymentPreference,
  PaymentResult,
  PaymentStatus,
} from '../_services/payment/mercadoPago';

// Setup MMKV storage
const storage = new MMKV({ id: 'payment-storage' });
const mmkvStorage = createJSONStorage(() => ({
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.delete(name),
}));

export interface Order {
  id?: string;
  orderNumber: string;
  status: string;
  items: any[];
  total: number;
  createdAt?: string;
  paidAt?: string;
  mpPreferenceId?: string;
  mpPaymentId?: string;
}

interface PaymentState {
  // Current order/payment state
  currentOrder: Order | null;
  currentPreference: PaymentPreference | null;
  paymentStatus:
    | 'idle'
    | 'creating_order'
    | 'creating_preference'
    | 'processing_payment'
    | 'success'
    | 'error';

  // User orders
  orders: Order[];

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Actions
  createOrder: (orderData: OrderData) => Promise<Order>;
  initiatePayment: (order: Order) => Promise<PaymentResult>;
  processPaymentCallback: (result: PaymentResult) => Promise<void>;
  verifyPayment: (paymentId: string) => Promise<PaymentStatus>;
  getUserOrders: (page?: number, pageSize?: number) => Promise<void>;
  getOrder: (orderId: string) => Promise<Order>;
  requestRefund: (orderId: string, reason?: string) => Promise<any>;
  clearCurrentPayment: () => void;
  setError: (error: string | null) => void;
  setPaymentStatus: (status: PaymentState['paymentStatus']) => void;

  // Test utility methods
  setCurrentOrder: (order: Order | null) => void;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      currentOrder: null,
      currentPreference: null,
      paymentStatus: 'idle',
      orders: [],
      isLoading: false,
      error: null,

      createOrder: async (orderData: OrderData): Promise<Order> => {
        try {
          set({ isLoading: true, error: null, paymentStatus: 'creating_order' });

          // Validate order data
          const validationErrors = mercadoPagoService.validateOrderData(orderData);
          if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
          }

          // Generate order number if not provided
          if (!orderData.orderNumber) {
            orderData.orderNumber = mercadoPagoService.generateOrderNumber();
          }

          // Create payment preference
          const preference = await mercadoPagoService.createPaymentPreference(orderData);

          // Create order object
          const order: Order = {
            orderNumber: orderData.orderNumber,
            status: 'CREATED',
            items: orderData.items,
            total: orderData.total,
            createdAt: new Date().toISOString(),
            mpPreferenceId: preference.id,
          };

          set({
            currentOrder: order,
            currentPreference: preference,
            paymentStatus: 'idle',
            isLoading: false,
          });

          return order;
        } catch (error) {
          console.error('Error creating order:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
          set({
            error: errorMessage,
            paymentStatus: 'error',
            isLoading: false,
          });
          throw error;
        }
      },

      initiatePayment: async (_order: Order): Promise<PaymentResult> => {
        try {
          set({ isLoading: true, error: null, paymentStatus: 'processing_payment' });

          const { currentPreference } = get();
          if (!currentPreference) {
            throw new Error('No payment preference found');
          }

          // Initiate payment using MercadoPago service
          const result = await mercadoPagoService.initiatePayment(currentPreference);

          if (result.success) {
            set({ paymentStatus: 'processing_payment', isLoading: false });
          } else {
            set({
              paymentStatus: 'error',
              error: result.error || 'Payment initiation failed',
              isLoading: false,
            });
          }

          return result;
        } catch (error) {
          console.error('Error initiating payment:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to initiate payment';
          set({
            error: errorMessage,
            paymentStatus: 'error',
            isLoading: false,
          });
          throw error;
        }
      },

      processPaymentCallback: async (result: PaymentResult): Promise<void> => {
        try {
          set({ isLoading: true, error: null });

          if (result.success && result.status === 'approved') {
            // Payment successful
            const { currentOrder } = get();
            if (currentOrder) {
              const updatedOrder: Order = {
                ...currentOrder,
                status: 'PAID',
                paidAt: new Date().toISOString(),
                mpPaymentId: result.paymentId,
              };

              set({
                currentOrder: updatedOrder,
                paymentStatus: 'success',
                isLoading: false,
              });

              // Add to orders list
              const { orders } = get();
              set({ orders: [updatedOrder, ...orders] });
            }
          } else if (result.status === 'pending') {
            // Payment pending
            set({ paymentStatus: 'processing_payment', isLoading: false });
          } else {
            // Payment failed
            set({
              paymentStatus: 'error',
              error: result.error || 'Payment failed',
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Error processing payment callback:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to process payment callback',
            paymentStatus: 'error',
            isLoading: false,
          });
        }
      },

      verifyPayment: async (paymentId: string): Promise<PaymentStatus> => {
        try {
          set({ isLoading: true, error: null });

          const paymentStatus = await mercadoPagoService.verifyPaymentStatus(paymentId);

          // Update current order if it matches
          const { currentOrder } = get();
          if (currentOrder && paymentStatus.orderId === currentOrder.id) {
            const updatedOrder: Order = {
              ...currentOrder,
              status: paymentStatus.status,
              mpPaymentId: paymentStatus.paymentInfo?.id,
            };

            set({ currentOrder: updatedOrder });
          }

          set({ isLoading: false });
          return paymentStatus;
        } catch (error) {
          console.error('Error verifying payment:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to verify payment',
            isLoading: false,
          });
          throw error;
        }
      },

      getUserOrders: async (page = 1, pageSize = 10): Promise<void> => {
        try {
          set({ isLoading: true, error: null });

          const orders = await mercadoPagoService.getUserOrders(page, pageSize);

          if (page === 1) {
            set({ orders, isLoading: false });
          } else {
            // Append to existing orders for pagination
            const { orders: existingOrders } = get();
            set({ orders: [...existingOrders, ...orders], isLoading: false });
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch orders',
            isLoading: false,
          });
        }
      },

      getOrder: async (orderId: string): Promise<Order> => {
        try {
          set({ isLoading: true, error: null });

          const order = await mercadoPagoService.getOrder(orderId);

          set({ isLoading: false });
          return order;
        } catch (error) {
          console.error('Error fetching order:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch order',
            isLoading: false,
          });
          throw error;
        }
      },

      requestRefund: async (orderId: string, reason?: string): Promise<any> => {
        try {
          set({ isLoading: true, error: null });

          const refundResult = await mercadoPagoService.requestRefund(orderId, reason);

          // Update order in orders list
          const { orders } = get();
          const updatedOrders = orders.map((order) =>
            order.id === orderId ? { ...order, status: 'REFUNDED' } : order
          );

          set({ orders: updatedOrders, isLoading: false });
          return refundResult;
        } catch (error) {
          console.error('Error requesting refund:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to request refund',
            isLoading: false,
          });
          throw error;
        }
      },

      clearCurrentPayment: () => {
        set({
          currentOrder: null,
          currentPreference: null,
          paymentStatus: 'idle',
          error: null,
        });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setPaymentStatus: (paymentStatus: PaymentState['paymentStatus']) => {
        set({ paymentStatus });
      },

      // Test utility methods
      setCurrentOrder: (order: Order | null) => {
        set({ currentOrder: order });
      },
    }),
    {
      name: 'tifossi-payment-store',
      storage: mmkvStorage,
      // Don't persist sensitive data
      partialize: (state) => ({
        orders: state.orders,
        // Don't persist current payment session data for security
      }),
    }
  )
);

// Helper functions
export const PaymentHelpers = {
  /**
   * Get user-friendly status message
   */
  getStatusMessage: (status: string): string => {
    return mercadoPagoService.getStatusMessage(status);
  },

  /**
   * Check if order can be refunded
   */
  canRefund: (order: Order): boolean => {
    return order.status === 'PAID' && !!order.paidAt;
  },

  /**
   * Calculate order totals from cart items
   */
  calculateOrderTotals: (items: any[], shippingCost = 0, discount = 0) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal - discount + shippingCost;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      shippingCost: Number(shippingCost.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  },

  /**
   * Format cart items for order creation
   */
  formatCartItemsForOrder: (cartItems: any[]) => {
    return cartItems.map((item) => ({
      productId: item.productId,
      productName: item.productName || item.name,
      description: item.description || '',
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      color: item.color,
    }));
  },
};

// Auth token synchronization will be handled via proper subscription patterns
// This prevents potential issues with module-level store subscriptions
console.log('[Payment Store] Payment service initialized, auth sync will be handled separately');

const utilityExport = {
  name: 'PaymentStore',
  version: '1.0.0',
};

export default utilityExport;
