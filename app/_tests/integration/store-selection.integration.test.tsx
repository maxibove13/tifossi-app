/**
 * Store Selection Integration Tests
 * Tests the complete store locator and pickup selection flows
 * This is a Priority 2 (UX-Critical) test suite
 *
 * Testing approach:
 * - Uses real Zustand stores (no mocking)
 * - Tests complete user flows end-to-end
 * - Validates store filtering, selection, and pickup flow
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

// Components
import ShippingPickupScreen from '../../checkout/shipping-pickup';
import ShippingPickupZoneScreen from '../../checkout/shipping-pickup-zone';
import StoreSelectionScreen from '../../checkout/store-selection';

// Stores and data
import { useCartStore } from '../../_stores/cartStore';
import { usePaymentStore } from '../../_stores/paymentStore';
import { useAuthStore } from '../../_stores/authStore';
import { storesData } from '../../_data/stores';

// Get the mocked expo-router functions from the global mock
import { useLocalSearchParams, router } from 'expo-router';

// Create our own mock functions to track calls
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockNavigate = jest.fn();

// Cast to jest mocks to access mockReturnValue
const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<
  typeof useLocalSearchParams
>;

// Override the router methods to use our tracking functions
(router.push as jest.Mock) = mockPush;
(router.back as jest.Mock) = mockBack;
(router.navigate as jest.Mock) = mockNavigate;

// Set default return value
mockUseLocalSearchParams.mockReturnValue({
  cityId: 'mvd',
  zoneId: 'centro',
  cityName: 'Montevideo',
});

// Mock Linear Gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock SVG icons
jest.mock('../../../assets/icons/close.svg', () => 'CloseIcon');

describe('Store Selection Flow - Integration', () => {
  // Simple wrapper for tests - no need for full navigation setup
  const TestWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

  beforeEach(() => {
    // Reset stores
    useCartStore.setState({
      items: [],
      isLoading: false,
      error: null,
    });

    usePaymentStore.setState({
      currentOrderNumber: null,
      currentOrderId: null,
      isLoading: false,
      error: null,
    });

    // Set up logged in user (store selection tests assume logged in user)
    useAuthStore.setState({
      isLoggedIn: true,
      token: 'test-token',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        profilePicture: null,
        firstName: 'Test',
        lastName: 'User',
      },
    });

    // Clear mock calls
    mockPush.mockClear();
    mockBack.mockClear();
    mockNavigate.mockClear();
  });

  describe('City Selection for Pickup', () => {
    it('should display all available cities', () => {
      const { getByText } = render(
        <TestWrapper>
          <ShippingPickupScreen />
        </TestWrapper>
      );

      // Should show Montevideo and Punta del Este
      expect(getByText('Montevideo')).toBeTruthy();
      expect(getByText('Punta del Este')).toBeTruthy();
      expect(getByText('Recoge tu pedido')).toBeTruthy();
      expect(getByText('Ciudad')).toBeTruthy();
    });

    it('should navigate to zone selection when city has multiple zones', async () => {
      const { getByText } = render(
        <TestWrapper>
          <ShippingPickupScreen />
        </TestWrapper>
      );

      // Select Montevideo (has 2 zones: centro and plaza_italia)
      const montevideoOption = getByText('Montevideo');
      fireEvent.press(montevideoOption);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/checkout/shipping-pickup-zone',
          params: { cityId: 'mvd', cityName: 'Montevideo' },
        });
      });
    });

    it('should navigate directly to store when city has one zone', async () => {
      const { getByText } = render(
        <TestWrapper>
          <ShippingPickupScreen />
        </TestWrapper>
      );

      // Select Punta del Este (has 1 zone)
      const pdeOption = getByText('Punta del Este');
      fireEvent.press(pdeOption);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/checkout/store-selection',
          params: { cityId: 'pde', zoneId: 'punta_del_este' },
        });
      });
    });
  });

  describe('Zone Selection', () => {
    it('should display zones for selected city', () => {
      // Mock the useLocalSearchParams to return Montevideo
      mockUseLocalSearchParams.mockReturnValue({
        cityId: 'mvd',
        cityName: 'Montevideo',
      });

      const { getByText } = render(
        <TestWrapper>
          <ShippingPickupZoneScreen />
        </TestWrapper>
      );

      // Should show zones for Montevideo
      expect(getByText('Recoge tu pedido')).toBeTruthy();
      expect(getByText('Montevideo')).toBeTruthy();
      expect(getByText('Centro')).toBeTruthy();
      expect(getByText('Plaza Italia')).toBeTruthy();
    });

    it('should navigate to store selection when zone is selected', async () => {
      mockUseLocalSearchParams.mockReturnValue({
        cityId: 'mvd',
        cityName: 'Montevideo',
      });

      const { getByText } = render(
        <TestWrapper>
          <ShippingPickupZoneScreen />
        </TestWrapper>
      );

      // Select Centro zone
      const centroOption = getByText('Centro');
      fireEvent.press(centroOption);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/checkout/store-selection',
          params: { cityId: 'mvd', zoneId: 'centro' },
        });
      });
    });
  });

  describe('Store Details and Selection', () => {
    it('should display store information correctly', () => {
      // Mock params for centro store
      mockUseLocalSearchParams.mockReturnValue({
        cityId: 'mvd',
        zoneId: 'centro',
      });

      const { getByText } = render(
        <TestWrapper>
          <StoreSelectionScreen />
        </TestWrapper>
      );

      // Should display store details
      expect(getByText('Seleccionar local')).toBeTruthy();
      expect(getByText('Centro')).toBeTruthy();
      expect(getByText('Wilson Ferreira Aldunate 1341, esq. 18 de Julio.')).toBeTruthy();
      expect(getByText('Lun. a Vier. 11:00 - 19:00 hs.\nSab. 10:00 - 14:00 hs.')).toBeTruthy();
    });

    it('should handle store not found', () => {
      // Mock invalid store params
      mockUseLocalSearchParams.mockReturnValue({
        cityId: 'invalid',
        zoneId: 'invalid',
      });

      const { getByText } = render(
        <TestWrapper>
          <StoreSelectionScreen />
        </TestWrapper>
      );

      expect(getByText('Tienda no encontrada.')).toBeTruthy();
      expect(getByText('Volver')).toBeTruthy();
    });

    it('should confirm store selection and proceed to payment', async () => {
      mockUseLocalSearchParams.mockReturnValue({
        cityId: 'mvd',
        zoneId: 'centro',
      });

      const { getByText } = render(
        <TestWrapper>
          <StoreSelectionScreen />
        </TestWrapper>
      );

      // Press confirm button
      const confirmButton = getByText('Confirmar');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/checkout/payment-selection');
      });
    });

    it('should handle back navigation', async () => {
      mockUseLocalSearchParams.mockReturnValue({
        cityId: 'mvd',
        zoneId: 'centro',
      });

      const { getByText } = render(
        <TestWrapper>
          <StoreSelectionScreen />
        </TestWrapper>
      );

      // Press back button
      const backButton = getByText('Atrás');
      fireEvent.press(backButton);

      await waitFor(() => {
        expect(mockBack).toHaveBeenCalled();
      });
    });

    it('should handle close navigation to home', async () => {
      mockUseLocalSearchParams.mockReturnValue({
        cityId: 'mvd',
        zoneId: 'centro',
      });

      const { getByTestId } = render(
        <TestWrapper>
          <StoreSelectionScreen />
        </TestWrapper>
      );

      const closeButton = getByTestId('store-detail-close-button');
      fireEvent.press(closeButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/(tabs)');
      });
    });
  });

  describe('Complete Pickup Flow', () => {
    it('should complete full pickup selection flow', async () => {
      // Step 1: Start with cart items
      await act(async () => {
        useCartStore.setState({
          items: [
            {
              productId: 'prod-1',
              quantity: 1,
              price: 2500,
              color: 'Red',
              size: 'M',
            },
          ],
        });
      });

      // Step 2: Select city
      const { getByText, rerender } = render(
        <TestWrapper>
          <ShippingPickupScreen />
        </TestWrapper>
      );

      fireEvent.press(getByText('Montevideo'));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/checkout/shipping-pickup-zone',
        params: { cityId: 'mvd', cityName: 'Montevideo' },
      });

      // Step 3: Select zone
      mockUseLocalSearchParams.mockReturnValue({
        cityId: 'mvd',
        cityName: 'Montevideo',
      });

      rerender(
        <TestWrapper>
          <ShippingPickupZoneScreen />
        </TestWrapper>
      );

      fireEvent.press(getByText('Plaza Italia'));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/checkout/store-selection',
        params: { cityId: 'mvd', zoneId: 'plaza_italia' },
      });

      // Step 4: Confirm store selection
      mockUseLocalSearchParams.mockReturnValue({
        cityId: 'mvd',
        zoneId: 'plaza_italia',
      });

      rerender(
        <TestWrapper>
          <StoreSelectionScreen />
        </TestWrapper>
      );

      expect(getByText('Plaza Italia Shopping')).toBeTruthy();
      expect(getByText('Av. Italia XXXX - Piso 3, Local 14')).toBeTruthy();

      fireEvent.press(getByText('Confirmar'));
      expect(mockPush).toHaveBeenCalledWith('/checkout/payment-selection');

      // Note: In real implementation, store selection should be saved
      // Currently it's not implemented in the component code
    });
  });

  describe('Store Data Validation', () => {
    it('should have valid store data structure', () => {
      // Validate all stores have required fields
      storesData.forEach((store) => {
        expect(store.id).toBeTruthy();
        expect(store.cityId).toBeTruthy();
        expect(store.zoneId).toBeTruthy();
        expect(store.name).toBeTruthy();
        expect(store.address).toBeTruthy();
        expect(store.hours).toBeTruthy();
        expect(store.image).toBeDefined();
      });
    });

    it('should have unique store IDs', () => {
      const storeIds = storesData.map((store) => store.id);
      const uniqueIds = new Set(storeIds);
      expect(uniqueIds.size).toBe(storeIds.length);
    });

    it('should group stores correctly by city and zone', () => {
      const montevideoStores = storesData.filter((s) => s.cityId === 'mvd');
      const pdeStores = storesData.filter((s) => s.cityId === 'pde');

      expect(montevideoStores.length).toBe(2); // Centro and Plaza Italia
      expect(pdeStores.length).toBe(1); // Punta del Este

      // Check Montevideo zones
      const mvdZones = montevideoStores.map((s) => s.zoneId);
      expect(mvdZones).toContain('centro');
      expect(mvdZones).toContain('plaza_italia');
    });
  });
});
