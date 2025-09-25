import { create } from 'zustand';

/**
 * Minimal Payment Store for UI State Management
 *
 * This store only manages transient UI state for the payment flow.
 * Actual payment logic is handled by:
 * - orderService.createOrderWithPayment() for order creation
 * - mercadoPagoService for payment processing
 * - Backend webhooks for payment status updates
 */

interface PaymentUIState {
  // Current order info for display purposes only
  currentOrderNumber: string | null;
  currentOrderId: string | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentOrder: (orderNumber: string | null, orderId: string | null) => void;
  clearPaymentState: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const usePaymentStore = create<PaymentUIState>((set) => ({
  // Initial state
  currentOrderNumber: null,
  currentOrderId: null,
  isLoading: false,
  error: null,

  // Actions
  setCurrentOrder: (orderNumber, orderId) => {
    set({
      currentOrderNumber: orderNumber,
      currentOrderId: orderId,
      error: null,
    });
  },

  clearPaymentState: () => {
    set({
      currentOrderNumber: null,
      currentOrderId: null,
      isLoading: false,
      error: null,
    });
  },

  setError: (error) => {
    set({ error, isLoading: false });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },
}));

// Alias for backward compatibility with storeSynchronizer
export const clearCurrentPayment = () => {
  usePaymentStore.getState().clearPaymentState();
};
