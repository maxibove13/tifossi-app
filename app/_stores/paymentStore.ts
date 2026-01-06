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

export interface GuestAddress {
  firstName: string;
  lastName: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  phoneNumber: string;
}

export interface GuestContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

// Pending buy now item - for "Comprar ahora" flow without adding to cart
export interface PendingBuyNowItem {
  productId: string;
  title: string;
  size: string;
  quantity: number;
  color?: string;
  price: number;
  discountedPrice?: number;
  imageUrl?: string;
}

interface PaymentUIState {
  // Current order info for display purposes only
  currentOrderNumber: string | null;
  currentOrderId: string | null;

  // Selected store location for pickup orders
  selectedStore: SelectedStore | null;

  // Guest address for delivery (used when not logged in)
  guestAddress: GuestAddress | null;

  // Guest contact info for pickup (used when not logged in)
  guestContactInfo: GuestContactInfo | null;

  // Pending buy now item - product being purchased via "Comprar ahora" flow
  // This allows checkout without adding to cart until order is confirmed
  pendingBuyNowItem: PendingBuyNowItem | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentOrder: (orderNumber: string | null, orderId: string | null) => void;
  setSelectedStore: (store: SelectedStore | null) => void;
  setGuestAddress: (address: GuestAddress | null) => void;
  setGuestContactInfo: (info: GuestContactInfo | null) => void;
  setPendingBuyNowItem: (item: PendingBuyNowItem | null) => void;
  clearPaymentState: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const usePaymentStore = create<PaymentUIState>((set) => ({
  // Initial state
  currentOrderNumber: null,
  currentOrderId: null,
  selectedStore: null,
  guestAddress: null,
  guestContactInfo: null,
  pendingBuyNowItem: null,
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

  setGuestAddress: (address) => {
    set({ guestAddress: address });
  },

  setGuestContactInfo: (info) => {
    set({ guestContactInfo: info });
  },

  setPendingBuyNowItem: (item) => {
    set({ pendingBuyNowItem: item });
  },

  clearPaymentState: () => {
    set({
      currentOrderNumber: null,
      currentOrderId: null,
      selectedStore: null,
      guestAddress: null,
      guestContactInfo: null,
      pendingBuyNowItem: null,
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
