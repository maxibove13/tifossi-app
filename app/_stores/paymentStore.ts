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

interface SelectedStore {
  id: string;
  cityId: string;
  zoneId: string;
  name: string;
  address: string;
  strapiId?: number; // Optional Strapi store-location document ID
}

interface PaymentUIState {
  // Current order info for display purposes only
  currentOrderNumber: string | null;
  currentOrderId: string | null;

  // Selected store location for pickup orders
  selectedStore: SelectedStore | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentOrder: (orderNumber: string | null, orderId: string | null) => void;
  setSelectedStore: (store: SelectedStore | null) => void;
  clearPaymentState: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const usePaymentStore = create<PaymentUIState>((set) => ({
  // Initial state
  currentOrderNumber: null,
  currentOrderId: null,
  selectedStore: null,
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

  setSelectedStore: (store) => {
    set({ selectedStore: store });
  },

  clearPaymentState: () => {
    set({
      currentOrderNumber: null,
      currentOrderId: null,
      selectedStore: null,
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

// Add default export to fix router warnings
const utilityExport = {
  name: 'PaymentStore',
  version: '1.0.0',
};

export default utilityExport;
