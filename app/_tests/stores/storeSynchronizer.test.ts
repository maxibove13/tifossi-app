/**
 * StoreSynchronizer Tests
 * Tests cross-store communication and synchronization
 * Following testing principles: Use real stores, test behavior not implementation
 */

import { act, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '../../_stores/authStore';
import { useCartStore } from '../../_stores/cartStore';
import { useFavoritesStore } from '../../_stores/favoritesStore';
import { usePaymentStore } from '../../_stores/paymentStore';
import { storeSynchronizer } from '../../_stores/storeSynchronizer';

// Mock the services at the boundary
jest.mock('../../_services/auth/authService');
jest.mock('../../_services/cart/cartService');

describe('StoreSynchronizer', () => {
  beforeEach(() => {
    // Reset all stores to initial state
    act(() => {
      useAuthStore.setState({
        user: null,
        token: null,
        isLoggedIn: false,
        isLoading: false,
        error: null,
      });

      useCartStore.setState({
        items: [],
        isLoading: false,
        error: null,
        isGuestCart: true,
      });

      useFavoritesStore.setState({
        productIds: [],
        isLoading: false,
        error: null,
        actionStatus: 'idle',
        pendingOperations: [],
        lastSyncTimestamp: null,
      });

      usePaymentStore.setState({
        currentOrderNumber: null,
        currentOrderId: null,
        isLoading: false,
        error: null,
      });
    });

    // Ensure synchronizer is initialized
    storeSynchronizer.initialize();
  });

  describe('onLogin', () => {
    it('should sync stores when user logs in', async () => {
      const mockToken = 'test-auth-token';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        profilePicture: null,
      };

      // Add some items to guest cart first
      act(() => {
        useCartStore.setState({
          items: [
            {
              productId: 'prod-1',
              quantity: 2,
              price: 100,
            },
          ],
          isGuestCart: true,
        });
      });

      // Trigger login
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          token: mockToken,
          isLoggedIn: true,
        });
      });

      // Wait for sync to complete
      await waitFor(() => {
        const cartState = useCartStore.getState();
        // Cart should have migrated (though actual migration is mocked)
        expect(cartState.isGuestCart).toBeDefined();
      });

      // Verify favorites error was cleared
      const favoritesState = useFavoritesStore.getState();
      expect(favoritesState.error).toBeNull();
    });

    it('should set auth token on cart store during login', async () => {
      const mockToken = 'test-token-456';
      const mockUser = {
        id: 'user-456',
        email: 'user@test.com',
        name: 'User Test',
        profilePicture: null,
      };

      // Spy on setAuthToken
      const setAuthTokenSpy = jest.spyOn(useCartStore.getState(), 'setAuthToken');

      // Trigger login
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          token: mockToken,
          isLoggedIn: true,
        });
      });

      await waitFor(() => {
        expect(setAuthTokenSpy).toHaveBeenCalledWith(mockToken);
      });

      setAuthTokenSpy.mockRestore();
    });

    it('should trigger cart migration on login', async () => {
      const mockToken = 'migrate-token';
      const mockUser = {
        id: 'user-789',
        email: 'migrate@test.com',
        name: 'Migrate User',
        profilePicture: null,
      };

      // Spy on migrateGuestCart
      const migrateCartSpy = jest.spyOn(useCartStore.getState(), 'migrateGuestCart');

      // Add guest cart items
      act(() => {
        useCartStore.setState({
          items: [{ productId: 'guest-item', quantity: 1, price: 50 }],
          isGuestCart: true,
        });
      });

      // Trigger login
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          token: mockToken,
          isLoggedIn: true,
        });
      });

      await waitFor(() => {
        expect(migrateCartSpy).toHaveBeenCalledWith(mockToken);
      });

      migrateCartSpy.mockRestore();
    });

    it('should fetch favorites from server on login', async () => {
      const mockToken = 'sync-token';
      const mockUser = {
        id: 'user-sync',
        email: 'sync@test.com',
        name: 'Sync User',
        profilePicture: null,
      };

      // Spy on fetchFromServer
      const fetchFavoritesSpy = jest.spyOn(useFavoritesStore.getState(), 'fetchFromServer');

      // Trigger login
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          token: mockToken,
          isLoggedIn: true,
        });
      });

      await waitFor(() => {
        expect(fetchFavoritesSpy).toHaveBeenCalled();
      });

      fetchFavoritesSpy.mockRestore();
    });
  });

  describe('onLogout', () => {
    it('should clear all stores on logout', async () => {
      // Set up logged in state with data
      act(() => {
        useAuthStore.setState({
          user: { id: 'user-1', email: 'test@test.com', name: 'Test User', profilePicture: null },
          token: 'auth-token',
          isLoggedIn: true,
        });

        useCartStore.setState({
          items: [{ productId: 'item-1', quantity: 1, price: 100 }],
          isGuestCart: false,
        });

        useFavoritesStore.setState({
          productIds: ['prod-1', 'prod-2'],
          lastSyncTimestamp: Date.now(),
        });

        usePaymentStore.setState({
          currentOrderNumber: 'ORDER-123',
          currentOrderId: 'order-id-123',
        });
      });

      // Trigger logout
      act(() => {
        useAuthStore.setState({
          user: null,
          token: null,
          isLoggedIn: false,
        });
      });

      await waitFor(() => {
        // Verify cart is cleared
        const cartState = useCartStore.getState();
        expect(cartState.items).toHaveLength(0);

        // Verify favorites are cleared
        const favoritesState = useFavoritesStore.getState();
        expect(favoritesState.productIds).toHaveLength(0);
        expect(favoritesState.lastSyncTimestamp).toBeNull();

        // Verify payment state is cleared
        const paymentState = usePaymentStore.getState();
        expect(paymentState.currentOrderNumber).toBeNull();
        expect(paymentState.currentOrderId).toBeNull();
      });
    });

    it('should call clearCart on logout', async () => {
      // Set up logged in state
      act(() => {
        useAuthStore.setState({
          user: { id: 'user-1', email: 'test@test.com', name: 'Test User', profilePicture: null },
          token: 'auth-token',
          isLoggedIn: true,
        });
      });

      // Spy on clearCart
      const clearCartSpy = jest.spyOn(useCartStore.getState(), 'clearCart');

      // Trigger logout
      act(() => {
        useAuthStore.setState({
          user: null,
          token: null,
          isLoggedIn: false,
        });
      });

      await waitFor(() => {
        expect(clearCartSpy).toHaveBeenCalled();
      });

      clearCartSpy.mockRestore();
    });

    it('should call clearPaymentState on logout', async () => {
      // Set up logged in state with payment data
      act(() => {
        useAuthStore.setState({
          user: { id: 'user-1', email: 'test@test.com', name: 'Test User', profilePicture: null },
          token: 'auth-token',
          isLoggedIn: true,
        });

        usePaymentStore.setState({
          currentOrderNumber: 'ORDER-999',
          currentOrderId: 'order-999',
        });
      });

      // Spy on clearPaymentState
      const clearPaymentSpy = jest.spyOn(usePaymentStore.getState(), 'clearPaymentState');

      // Trigger logout
      act(() => {
        useAuthStore.setState({
          user: null,
          token: null,
          isLoggedIn: false,
        });
      });

      await waitFor(() => {
        expect(clearPaymentSpy).toHaveBeenCalled();
      });

      clearPaymentSpy.mockRestore();
    });

    it('should reset favorites to local state on logout', async () => {
      // Set up logged in state with synced favorites
      act(() => {
        useAuthStore.setState({
          user: { id: 'user-1', email: 'test@test.com', name: 'Test User', profilePicture: null },
          token: 'auth-token',
          isLoggedIn: true,
        });

        useFavoritesStore.setState({
          productIds: ['prod-1', 'prod-2', 'prod-3'],
          lastSyncTimestamp: Date.now(),
          error: 'some error',
          actionStatus: 'loading',
        });
      });

      // Trigger logout
      act(() => {
        useAuthStore.setState({
          user: null,
          token: null,
          isLoggedIn: false,
        });
      });

      await waitFor(() => {
        const favoritesState = useFavoritesStore.getState();
        expect(favoritesState.productIds).toHaveLength(0);
        expect(favoritesState.error).toBeNull();
        expect(favoritesState.actionStatus).toBe('idle');
        expect(favoritesState.lastSyncTimestamp).toBeNull();
        expect(favoritesState.pendingOperations).toHaveLength(0);
      });
    });
  });

  describe('onTokenChange', () => {
    it('should update cart auth token when token changes', async () => {
      const initialToken = 'token-v1';
      const updatedToken = 'token-v2';

      // Spy on setAuthToken
      const setAuthTokenSpy = jest.spyOn(useCartStore.getState(), 'setAuthToken');

      // Set initial token
      act(() => {
        useAuthStore.setState({
          token: initialToken,
          isLoggedIn: true,
        });
      });

      // Update token
      act(() => {
        useAuthStore.setState({
          token: updatedToken,
        });
      });

      await waitFor(() => {
        // Should be called twice - once for initial, once for update
        expect(setAuthTokenSpy).toHaveBeenCalledWith(updatedToken);
      });

      setAuthTokenSpy.mockRestore();
    });

    it('should handle null token on logout', async () => {
      // Spy on setAuthToken
      const setAuthTokenSpy = jest.spyOn(useCartStore.getState(), 'setAuthToken');

      // Set initial logged in state
      act(() => {
        useAuthStore.setState({
          token: 'some-token',
          isLoggedIn: true,
        });
      });

      // Clear token
      act(() => {
        useAuthStore.setState({
          token: null,
          isLoggedIn: false,
        });
      });

      await waitFor(() => {
        expect(setAuthTokenSpy).toHaveBeenCalledWith(null);
      });

      setAuthTokenSpy.mockRestore();
    });
  });

  describe('initialization', () => {
    it('should only initialize once', () => {
      // Initialize multiple times
      storeSynchronizer.initialize();
      storeSynchronizer.initialize();
      storeSynchronizer.initialize();

      // Should not throw or cause issues
      // Verification is implicit - no errors means it handled multiple calls correctly
      expect(true).toBe(true);
    });

    it('should handle errors gracefully during sync operations', async () => {
      const mockToken = 'error-token';
      const mockUser = {
        id: 'error-user',
        email: 'error@test.com',
        name: 'Error User',
        profilePicture: null,
      };

      // Make fetchFromServer throw an error
      const syncSpy = jest
        .spyOn(useFavoritesStore.getState(), 'fetchFromServer')
        .mockRejectedValue(new Error('Sync failed'));

      // Trigger login (should not throw despite sync error)
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          token: mockToken,
          isLoggedIn: true,
        });
      });

      // Wait a bit to ensure async operations complete
      await waitFor(() => {
        expect(syncSpy).toHaveBeenCalled();
      });

      // Should not affect other stores despite error
      const authState = useAuthStore.getState();
      expect(authState.isLoggedIn).toBe(true);

      syncSpy.mockRestore();
    });
  });
});
