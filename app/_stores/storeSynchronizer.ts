/**
 * Store Synchronizer
 * Handles cross-store communication to avoid circular dependencies
 */

import { useAuthStore } from './authStore';
import { useCartStore } from './cartStore';
import { useFavoritesStore } from './favoritesStore';
import { usePaymentStore } from './paymentStore';

interface StoreSyncActions {
  onLogin: (token: string, user: any) => Promise<void>;
  onLogout: () => Promise<void>;
  onTokenChange: (token: string | null) => void;
}

class StoreSynchronizer implements StoreSyncActions {
  private initialized = false;

  initialize() {
    if (this.initialized) return;

    // Subscribe to auth store changes
    useAuthStore.subscribe((state, previousState) => {
      // Handle login
      if (!previousState?.isLoggedIn && state.isLoggedIn && state.token && state.user) {
        this.onLogin(state.token, state.user);
      }

      // Handle logout
      if (previousState?.isLoggedIn && !state.isLoggedIn) {
        this.onLogout();
      }

      // Handle token changes
      if (state.token !== previousState?.token) {
        this.onTokenChange(state.token);
      }
    });

    this.initialized = true;
  }

  async onLogin(token: string, _user: any): Promise<void> {
    try {
      // Update cart store
      useCartStore.getState().setAuthToken(token);

      // Migrate guest cart if needed
      await useCartStore.getState().migrateGuestCart(token);

      // Clear favorites errors
      useFavoritesStore.getState().clearError();

      // Sync favorites with server
      await useFavoritesStore.getState().syncWithServer();
    } catch (error) {}
  }

  async onLogout(): Promise<void> {
    try {
      // Clear cart
      await useCartStore.getState().clearCart();

      // Clear favorites (reset to local state)
      const favoritesStore = useFavoritesStore.getState();
      favoritesStore.productIds.length = 0; // Clear array in place
      favoritesStore.clearError();

      // Clear current payment session
      usePaymentStore.getState().clearCurrentPayment();
    } catch (error) {}
  }

  onTokenChange(token: string | null): void {
    try {
      // Update cart auth token
      useCartStore.getState().setAuthToken(token);
    } catch (error) {}
  }
}

// Create singleton instance
export const storeSynchronizer = new StoreSynchronizer();

// Auto-initialize when module is loaded
storeSynchronizer.initialize();

const utilityExport = {
  name: 'StoreSynchronizer',
  version: '1.0.0',
};

export default utilityExport;
