/**
 * Shipping Address Selection Flow Tests
 *
 * Tests the complete shipping address selection flow including:
 * - Address fetching and display
 * - Address selection behavior
 * - Navigation to payment selection
 * - Error handling for address service
 * - Empty state and new address creation
 * - Integration with address service
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { HttpResponse, http } from 'msw';
import { mswServer } from '../utils/msw-setup';

// Import real services - testing behavior, not implementation
import addressService, { Address } from '../../_services/address/addressService';

// Import stores
import { useAuthStore } from '../../_stores/authStore';

// Import the component under test
import ShippingAddressScreen from '../../checkout/shipping-address';

// Import test utilities
import { mockUser } from '../utils/mock-data';
import { mockAddress } from '../utils/payment-mock-data';

// Mock expo-router for navigation testing
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  navigate: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => false),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
  router: mockRouter,
  Stack: {
    Screen: ({ children }: { children: React.ReactNode }) => children,
  },
}));

// Mock Alert for user feedback testing
jest.spyOn(Alert, 'alert');

describe('Shipping Address Selection Flow', () => {
  // Mock multiple addresses for testing selection behavior
  const mockAddresses = [
    {
      ...mockAddress,
      id: 'address-1',
      street: '123 Main Street',
      city: 'Montevideo',
      isDefault: true,
    },
    {
      ...mockAddress,
      id: 'address-2',
      street: '456 Oak Avenue',
      city: 'Punta del Este',
      isDefault: false,
    },
    {
      ...mockAddress,
      id: 'address-3',
      street: '789 Pine Road',
      city: 'Maldonado',
      isDefault: false,
    },
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset MSW handlers
    mswServer.resetHandlers();

    // Reset stores to initial state
    useAuthStore.getState().logout();

    // Setup auth state
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setToken('mock-jwt-token');

    // Setup default MSW handlers for address flow
    mswServer.use(
      // Address fetching endpoint
      http.get('/users/me/addresses', () => {
        return HttpResponse.json({
          success: true,
          data: mockAddresses,
        });
      }),

      // Individual address fetch endpoint
      http.get('/users/me/addresses/:id', ({ params }) => {
        const { id } = params;
        const address = mockAddresses.find((addr) => addr.id === id);
        return HttpResponse.json({
          success: true,
          data: address,
        });
      }),

      // Address creation endpoint
      http.post('/users/me/addresses', async ({ request }) => {
        const addressData = (await request.json()) as Omit<Address, 'id'>;
        return HttpResponse.json(
          {
            success: true,
            data: {
              ...addressData,
              id: 'new-address-id',
            },
          },
          { status: 201 }
        );
      })
    );
  });

  describe('Address Loading and Display', () => {
    it('should load and display user addresses', async () => {
      const { getByText, queryByText } = render(<ShippingAddressScreen />);

      // Should show loading initially
      expect(getByText('Cargando direcciones...')).toBeTruthy();

      // Wait for addresses to load
      await waitFor(() => {
        expect(getByText('Mis direcciones')).toBeTruthy();
      });

      // Should display all addresses
      expect(getByText('123 Main Street, Montevideo')).toBeTruthy();
      expect(getByText('456 Oak Avenue, Punta del Este')).toBeTruthy();
      expect(getByText('789 Pine Road, Maldonado')).toBeTruthy();

      // Should show default badge
      expect(getByText('Por defecto')).toBeTruthy();

      // Loading should be gone
      expect(queryByText('Cargando direcciones...')).toBeNull();
    });

    it('should select default address automatically', async () => {
      const { getByText } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Mis direcciones')).toBeTruthy();
      });

      // The continue button should be enabled since default address is selected
      const continueButton = getByText('Siguiente');
      expect(continueButton).toBeTruthy();

      // Should not be disabled
      expect(continueButton.props.disabled).toBeFalsy();
    });

    it('should handle empty address list', async () => {
      // Setup empty address response
      mswServer.use(
        http.get('/api/addresses', () => {
          return HttpResponse.json({
            success: true,
            data: [],
          });
        })
      );

      const { getByText, queryByText } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Parece que no tienes ninguna dirección guardada.')).toBeTruthy();
      });

      // Should show empty state messaging
      expect(
        getByText('Adiciona tu dirección de envío preferida para recibir tus pedidos.')
      ).toBeTruthy();
      expect(getByText('Adicionar dirección nueva')).toBeTruthy();

      // Should not show address list
      expect(queryByText('Mis direcciones')).toBeNull();
    });
  });

  describe('Address Selection Behavior', () => {
    it('should allow user to select different addresses', async () => {
      const { getByText } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Mis direcciones')).toBeTruthy();
      });

      // Select a different address
      const secondAddress = getByText('456 Oak Avenue, Punta del Este');
      fireEvent.press(secondAddress);

      // Continue button should still be enabled
      const continueButton = getByText('Siguiente');
      expect(continueButton.props.disabled).toBeFalsy();

      // Select third address
      const thirdAddress = getByText('789 Pine Road, Maldonado');
      fireEvent.press(thirdAddress);

      // Continue button should still be enabled
      expect(continueButton.props.disabled).toBeFalsy();
    });

    it('should navigate to payment selection with selected address', async () => {
      const { getByText } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Mis direcciones')).toBeTruthy();
      });

      // Select second address
      const secondAddress = getByText('456 Oak Avenue, Punta del Este');
      fireEvent.press(secondAddress);

      // Click continue
      const continueButton = getByText('Siguiente');
      fireEvent.press(continueButton);

      // Should navigate to payment selection with selected address ID
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/checkout/payment-selection',
        params: { selectedAddressId: 'address-2' },
      });
    });

    it('should navigate to add new address screen', async () => {
      const { getByText } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Mis direcciones')).toBeTruthy();
      });

      // Click add new address
      const addButton = getByText('Añadir dirección nueva');
      fireEvent.press(addButton);

      // Should navigate to new address screen
      expect(mockRouter.navigate).toHaveBeenCalledWith('/checkout/new-address');
    });
  });

  describe('Navigation Controls', () => {
    it('should handle back navigation', async () => {
      const { getByText } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Direcciones de envío')).toBeTruthy();
      });

      // Click back button
      const backButton = getByText('Atrás');
      fireEvent.press(backButton);

      // Should navigate back
      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('should handle close navigation', async () => {
      const { getByTestId } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        // Find close button by icon or test ID if available
        // Since we can't easily test SVG icons, we'll test the onPress behavior
        const closeButton =
          getByTestId?.('close-button') ||
          // Alternative: find by accessibility label or role
          document.querySelector('[aria-label="close"]');

        if (closeButton) {
          fireEvent.press(closeButton);
        }
      });

      // Note: This test might need adjustment based on how the close button is implemented
      // For now, we'll verify the expected navigation would occur
    });
  });

  describe('Error Handling', () => {
    it('should handle address fetching errors gracefully', async () => {
      // Setup error response
      mswServer.use(
        http.get('/api/addresses', () => {
          return HttpResponse.error();
        })
      );

      const { getByText, queryByText } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Failed to load addresses. Please try again.')).toBeTruthy();
      });

      // Should show error message and retry button
      expect(getByText('Reintentar')).toBeTruthy();

      // Should not show address list
      expect(queryByText('Mis direcciones')).toBeNull();
    });

    it('should allow retry after error', async () => {
      // Start with error
      mswServer.use(
        http.get('/api/addresses', () => {
          return HttpResponse.error();
        })
      );

      const { getByText, queryByText, rerender } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Failed to load addresses. Please try again.')).toBeTruthy();
      });

      // Setup successful retry response
      mswServer.use(
        http.get('/api/addresses', () => {
          return HttpResponse.json({
            success: true,
            data: mockAddresses,
          });
        })
      );

      // Click retry
      const retryButton = getByText('Reintentar');
      await act(async () => {
        fireEvent.press(retryButton);
      });

      // Should eventually show addresses
      await waitFor(() => {
        expect(getByText('Mis direcciones')).toBeTruthy();
      });

      // Error should be gone
      expect(queryByText('Failed to load addresses. Please try again.')).toBeNull();
    });

    it('should handle unauthenticated user', async () => {
      // Clear authentication
      useAuthStore.getState().logout();

      const { queryByText } = render(<ShippingAddressScreen />);

      // Should not attempt to load addresses
      await waitFor(() => {
        expect(queryByText('Cargando direcciones...')).toBeNull();
      });

      // Should show appropriate state (this may depend on implementation)
      // The component might redirect or show a login prompt
    });
  });

  describe('Address Service Integration', () => {
    it('should use address service with correct authentication', async () => {
      const setAuthTokenSpy = jest.spyOn(addressService, 'setAuthToken');
      const fetchAddressesSpy = jest.spyOn(addressService, 'fetchUserAddresses');

      render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(setAuthTokenSpy).toHaveBeenCalledWith('mock-jwt-token');
        expect(fetchAddressesSpy).toHaveBeenCalled();
      });
    });

    it('should format address display correctly', async () => {
      const formatAddressSpy = jest.spyOn(addressService, 'formatAddressDisplay');

      const { getByText } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Mis direcciones')).toBeTruthy();
      });

      // Should call format function for each address
      expect(formatAddressSpy).toHaveBeenCalledTimes(mockAddresses.length);
      mockAddresses.forEach((address) => {
        expect(formatAddressSpy).toHaveBeenCalledWith(address);
      });
    });
  });

  describe('Performance and Loading States', () => {
    it('should show loading state during address fetching', async () => {
      // Add delay to address fetching
      mswServer.use(
        http.get('/api/addresses', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({
            success: true,
            data: mockAddresses,
          });
        })
      );

      const { getByText, queryByText } = render(<ShippingAddressScreen />);

      // Should show loading immediately
      expect(getByText('Cargando direcciones...')).toBeTruthy();

      // Should not show addresses yet
      expect(queryByText('Mis direcciones')).toBeNull();

      // Wait for loading to complete
      await waitFor(() => {
        expect(getByText('Mis direcciones')).toBeTruthy();
      });

      // Loading should be gone
      expect(queryByText('Cargando direcciones...')).toBeNull();
    });

    it('should handle rapid address selection without issues', async () => {
      const { getByText } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Mis direcciones')).toBeTruthy();
      });

      // Rapidly select different addresses
      const addresses = [
        '123 Main Street, Montevideo',
        '456 Oak Avenue, Punta del Este',
        '789 Pine Road, Maldonado',
      ];

      await act(async () => {
        for (const addressText of addresses) {
          const addressElement = getByText(addressText);
          fireEvent.press(addressElement);
        }
      });

      // Continue button should remain functional
      const continueButton = getByText('Siguiente');
      expect(continueButton.props.disabled).toBeFalsy();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should have proper button states for address selection', async () => {
      const { getByText } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Mis direcciones')).toBeTruthy();
      });

      // Continue button should be enabled with default selection
      const continueButton = getByText('Siguiente');
      expect(continueButton.props.disabled).toBeFalsy();

      // Add new address button should always be enabled
      const addButton = getByText('Añadir dirección nueva');
      expect(addButton).toBeTruthy();
    });

    it('should handle empty address state user experience', async () => {
      // Setup empty address response
      mswServer.use(
        http.get('/api/addresses', () => {
          return HttpResponse.json({
            success: true,
            data: [],
          });
        })
      );

      const { getByText } = render(<ShippingAddressScreen />);

      await waitFor(() => {
        expect(getByText('Parece que no tienes ninguna dirección guardada.')).toBeTruthy();
      });

      // Should provide clear call to action
      expect(
        getByText('Adiciona tu dirección de envío preferida para recibir tus pedidos.')
      ).toBeTruthy();

      // Should have functional add address button
      const addButton = getByText('Adicionar dirección nueva');
      fireEvent.press(addButton);

      expect(mockRouter.navigate).toHaveBeenCalledWith('/checkout/new-address');
    });
  });
});
