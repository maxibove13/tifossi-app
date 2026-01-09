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

      // Fetch favorites from server
      await useFavoritesStore.getState().fetchFromServer();
    } catch {}
  }

  async onLogout(): Promise<void> {
    try {
      // Ensure cart behaves as guest before clearing to avoid auth requests
      useCartStore.getState().setAuthToken(null);

      // Clear cart
      await useCartStore.getState().clearCart();

      // Clear favorites (reset to local state)
      useFavoritesStore.setState((state) => ({
        ...state,
        productIds: [],
        error: null,
        isLoading: false,
        actionStatus: 'idle',
        pendingOperations: [],
        lastSyncTimestamp: null,
      }));

      // Clear current payment session
      usePaymentStore.getState().clearPaymentState();
    } catch {}
  }

  onTokenChange(token: string | null): void {
    try {
      // Update cart auth token
      useCartStore.getState().setAuthToken(token);

      if (token) {
        const favoritesState = useFavoritesStore.getState();
        if (favoritesState.pendingOperations.includes('sync')) {
          favoritesState.syncWithServer();
        }
      }
    } catch {}
  }
}

// Create singleton instance
export const storeSynchronizer = new StoreSynchronizer();

// IMPORTANT: Do NOT call storeSynchronizer.initialize() at module level!
// Module-level initialization runs before React Native's bridge is fully ready,
// which can cause crashes when native modules are accessed during store rehydration.
// Instead, call storeSynchronizer.initialize() from _layout.tsx after component mounts.

const utilityExport = {
  name: 'StoreSynchronizer',
  version: '1.0.0',
};

export default utilityExport;
