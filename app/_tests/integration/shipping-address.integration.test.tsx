/**
 * Shipping Address Integration Tests
 * Tests the complete address management and selection flows
 * This is a Priority 1 (Revenue-Critical) test suite
 *
 * Testing approach:
 * - Uses real Zustand stores (no mocking)
 * - Tests complete user flows end-to-end
 * - Validates address CRUD operations and selection
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import type { Address } from '../../_services/address/addressService';

// Component
import ShippingAddressScreen from '../../checkout/shipping-address';

// Stores
import { useAuthStore } from '../../_stores/authStore';

const httpClientMock: any = require('../../_services/api/httpClient').default;

// Mock expo-router
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  router: {
    push: (params: any) => mockPush(params),
    back: () => mockBack(),
    navigate: (path: string) => mockNavigate(path),
  },
  useLocalSearchParams: () => ({}),
  Stack: {
    Screen: () => null,
  },
}));

// Mock SVG icons
jest.mock('../../../assets/icons/close.svg', () => 'CloseIcon');
jest.mock('../../../assets/icons/plus_circle.svg', () => 'PlusCircle');

// Note: We don't mock addressService - it uses the mocked httpClient (boundary mocking)
// httpClient is already mocked in setup.ts to return proper Strapi-formatted responses

describe('Shipping Address Flow - Integration', () => {
  // Simple wrapper for tests - no need for full navigation setup
  const TestWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockPush.mockClear();
    mockBack.mockClear();
    mockNavigate.mockClear();

    if (httpClientMock.__resetAddressMock) {
      httpClientMock.__resetAddressMock();
    }
    httpClientMock.__setAddressScenario?.('default');

    // Setup default auth state
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

    // Note: httpClient is already mocked in setup.ts
    // addressService will use the mocked httpClient responses
  });

  describe('Address List Display', () => {
    it('should display loading state initially', async () => {
      const { getByText, getAllByText } = render(
        <TestWrapper>
          <ShippingAddressScreen />
        </TestWrapper>
      );

      expect(getByText('Cargando direcciones...')).toBeTruthy();
    });

    it('should display user addresses after loading', async () => {
      const addresses: Address[] = httpClientMock.__getMockAddresses?.() ?? [];

      const { queryByText, getAllByLabelText, getByText, getAllByText } = render(
        <TestWrapper>
          <ShippingAddressScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(queryByText('Cargando direcciones...')).toBeNull();
      });

      await waitFor(() => {
        expect(getAllByLabelText('address-item')).toHaveLength(addresses.length);
      });

      if (addresses.length > 0) {
        const defaultAddress = addresses.find((addr) => addr.isDefault);
        expect(defaultAddress).toBeDefined();
        expect(getByText(/Por defecto/i)).toBeTruthy();
        const defaultAddressNumber = defaultAddress!.number;
        expect(defaultAddressNumber).toBeTruthy();
        expect(getAllByText(new RegExp(defaultAddressNumber, 'i')).length).toBeGreaterThan(0);
      }
    });

    it('should pre-select default address', async () => {
      const { UNSAFE_getAllByProps } = render(
        <TestWrapper>
          <ShippingAddressScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const selected = UNSAFE_getAllByProps({ selected: true });
        expect(selected).toHaveLength(1);
      });
    });

    it('should handle no addresses scenario', async () => {
      httpClientMock.__setAddressScenario?.('empty');

      const { getByText, queryAllByLabelText } = render(
        <TestWrapper>
          <ShippingAddressScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText(/ninguna dirección guardada/i)).toBeTruthy();
      });

      expect(queryAllByLabelText('address-item')).toHaveLength(0);
      expect(getByText(/dirección nueva/i)).toBeTruthy();
    });

    it('should handle error loading addresses', async () => {
      httpClientMock.__setAddressScenario?.('error');

      const { getByText, getAllByText } = render(
        <TestWrapper>
          <ShippingAddressScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Failed to load addresses. Please try again.')).toBeTruthy();
        expect(getByText('Reintentar')).toBeTruthy();
      });
    });
  });

  describe('Address Selection', () => {
    it('should allow selecting different addresses', async () => {
      const addresses: Address[] = httpClientMock.__getMockAddresses?.() ?? [];

      const { getAllByLabelText, getByLabelText } = render(
        <TestWrapper>
          <ShippingAddressScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getAllByLabelText('address-item')).toHaveLength(addresses.length);
      });

      if (addresses.length > 1) {
        const secondAddress = addresses[1];
        const addressOptions = getAllByLabelText('address-item');
        fireEvent.press(addressOptions[1]);

        const nextButton = getByLabelText('address-next-button');
        fireEvent.press(nextButton);

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith({
            pathname: '/checkout/payment-selection',
            params: { selectedAddressId: secondAddress.id },
          });
        });
      }
    });

    it('should proceed to payment with selected address', async () => {
      const addresses: Address[] = httpClientMock.__getMockAddresses?.() ?? [];
      const defaultAddress = addresses.find((addr) => addr.isDefault);

      const { getAllByLabelText, getByLabelText } = render(
        <TestWrapper>
          <ShippingAddressScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getAllByLabelText('address-item')).toHaveLength(addresses.length);
      });

      const continueButton = getByLabelText('address-next-button');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/checkout/payment-selection',
          params: { selectedAddressId: defaultAddress?.id },
        });
      });
    });
  });

  describe('Address Management Actions', () => {
    it('should navigate to add new address screen', async () => {
      const addresses: Address[] = httpClientMock.__getMockAddresses?.() ?? [];

      const { getByText, getAllByLabelText } = render(
        <TestWrapper>
          <ShippingAddressScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getAllByLabelText('address-item')).toHaveLength(addresses.length);
      });

      const addButtons = getAllByLabelText('address-add-button');
      fireEvent.press(addButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/checkout/new-address');
    });

    it('should handle back navigation', async () => {
      const { getByText, getAllByText } = render(
        <TestWrapper>
          <ShippingAddressScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Atrás')).toBeTruthy();
      });

      const backButton = getByText('Atrás');
      fireEvent.press(backButton);

      expect(mockBack).toHaveBeenCalled();
    });

    it('should handle close navigation to home', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <ShippingAddressScreen />
        </TestWrapper>
      );

      const closeButton = getByTestId('address-close-button');
      fireEvent.press(closeButton);

      expect(mockNavigate).toHaveBeenCalledWith('/(tabs)');
    });
  });

  describe('Guest User Flow', () => {
    it('should show empty state for guest users and disable continue', async () => {
      // Set auth state to not logged in
      useAuthStore.setState({
        isLoggedIn: false,
        token: null,
        user: null,
      });

      const { getByText, getByLabelText } = render(
        <TestWrapper>
          <ShippingAddressScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText(/ninguna dirección guardada/i)).toBeTruthy();
      });

      const nextButton = getByLabelText('address-next-button');
      fireEvent.press(nextButton);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('should allow retrying after error', async () => {
      httpClientMock.__setAddressScenario?.('error');

      const { getByText, getAllByText } = render(
        <TestWrapper>
          <ShippingAddressScreen />
        </TestWrapper>
      );

      // Wait for error
      await waitFor(() => {
        expect(getByText('Failed to load addresses. Please try again.')).toBeTruthy();
      });

      // Press retry
      const retryButton = getByText('Reintentar');
      httpClientMock.__setAddressScenario?.('default');
      fireEvent.press(retryButton);

      // Should load addresses successfully
      await waitFor(() => {
        expect(getByText(/Por defecto/i)).toBeTruthy();
      });
    });
  });

  describe('Address Formatting', () => {
    it('should format addresses correctly with apartment', async () => {
      const { getByText, getAllByText } = render(
        <TestWrapper>
          <ShippingAddressScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText(/Apto\. 4A/i)).toBeTruthy();
        expect(getByText(/Rambla República de México/i)).toBeTruthy();
      });
    });

    it('should display all address fields correctly', async () => {
      const addresses: Address[] = httpClientMock.__getMockAddresses?.() ?? [];

      const { getByText, getAllByText } = render(
        <TestWrapper>
          <ShippingAddressScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        addresses.forEach((address) => {
          expect(getAllByText(new RegExp(address.country, 'i')).length).toBeGreaterThan(0);
          expect(getAllByText(new RegExp(address.city.split(' ')[0], 'i')).length).toBeGreaterThan(
            0
          );
        });
      });
    });
  });

  describe('Complete Address Selection Flow', () => {
    it('should complete full address selection flow', async () => {
      const addresses: Address[] = httpClientMock.__getMockAddresses?.() ?? [];

      const { getByText, getAllByLabelText, getByLabelText } = render(
        <TestWrapper>
          <ShippingAddressScreen />
        </TestWrapper>
      );

      // Wait for addresses to load
      await waitFor(() => {
        expect(getAllByLabelText('address-item')).toHaveLength(addresses.length);
      });

      // Verify header
      expect(getByText('Direcciones de envío')).toBeTruthy();

      // Select a different address (second one)
      if (addresses.length > 1) {
        fireEvent.press(getAllByLabelText('address-item')[1]);
      }

      // Continue to payment
      fireEvent.press(getByLabelText('address-next-button'));

      // Verify navigation with selected address
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/checkout/payment-selection',
          params: { selectedAddressId: expect.any(String) },
        });
      });

      // Note: addressService uses the mocked httpClient internally
    });
  });
});
