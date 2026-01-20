import { create } from 'zustand';
import { router } from 'expo-router';
import type { Address } from '../_services/address/addressService';

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

// Unified guest checkout data - contact info always present, address fields optional (for pickup)
export interface GuestCheckoutData {
  // Contact info (always required)
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  // Delivery address fields (optional - only for delivery, not pickup)
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Type aliases for backward compatibility during refactor
export type GuestAddress = GuestCheckoutData;
export type GuestContactInfo = GuestCheckoutData;

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

  // Selected address for logged-in delivery (passed from shipping-address screen)
  selectedAddress: Address | null;

  // Guest checkout data (unified contact + optional address info)
  guestData: GuestCheckoutData | null;

  // Pending buy now item - product being purchased via "Comprar ahora" flow
  // This allows checkout without adding to cart until order is confirmed
  pendingBuyNowItem: PendingBuyNowItem | null;

  // Product ID where checkout flow originated (for close navigation)
  originProductId: string | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentOrder: (orderNumber: string | null, orderId: string | null) => void;
  setSelectedStore: (store: SelectedStore | null) => void;
  setSelectedAddress: (address: Address | null) => void;
  setGuestData: (data: GuestCheckoutData | null) => void;
  setPendingBuyNowItem: (item: PendingBuyNowItem | null) => void;
  setOriginProductId: (productId: string | null) => void;
  clearPaymentState: () => void;
  closeCheckoutFlow: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const usePaymentStore = create<PaymentUIState>((set, get) => ({
  // Initial state
  currentOrderNumber: null,
  currentOrderId: null,
  selectedStore: null,
  selectedAddress: null,
  guestData: null,
  pendingBuyNowItem: null,
  originProductId: null,
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

  setSelectedAddress: (address) => {
    set({ selectedAddress: address });
  },

  setGuestData: (data) => {
    set({ guestData: data });
  },

  setPendingBuyNowItem: (item) => {
    set({ pendingBuyNowItem: item });
  },

  setOriginProductId: (productId) => {
    set({ originProductId: productId });
  },

  clearPaymentState: () => {
    set({
      currentOrderNumber: null,
      currentOrderId: null,
      selectedStore: null,
      selectedAddress: null,
      guestData: null,
      pendingBuyNowItem: null,
      originProductId: null,
      isLoading: false,
      error: null,
    });
  },

  closeCheckoutFlow: () => {
    // Get origin product ID before clearing state
    const originProductId = get().originProductId;

    // Clear all payment state
    set({
      currentOrderNumber: null,
      currentOrderId: null,
      selectedStore: null,
      selectedAddress: null,
      guestData: null,
      pendingBuyNowItem: null,
      originProductId: null,
      isLoading: false,
      error: null,
    });

    // Navigate back to origin product or home
    if (originProductId) {
      router.replace(`/products/${originProductId}`);
    } else {
      router.navigate('/(tabs)');
    }
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
