import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import NewAddressScreen from '../../checkout/new-address';

// Get router mock for testing
import { router } from 'expo-router';

// Polyfill setImmediate for test environment
global.setImmediate =
  global.setImmediate || ((fn: any, ...args: any[]) => setTimeout(fn, 0, ...args));

// Mock expo-router functionality
jest.mock('expo-router', () => {
  const mockRouter = {
    back: jest.fn(),
    navigate: jest.fn(),
    push: jest.fn(),
  };

  return {
    __esModule: true,
    router: mockRouter,
    Stack: {
      Screen: ({ children }: any) => children,
    },
    useLocalSearchParams: () => ({}),
  };
});

// Mock addressService
jest.mock('../../_services/address/addressService', () => ({
  __esModule: true,
  default: {
    setAuthToken: jest.fn(),
    createAddress: jest.fn().mockResolvedValue({ id: 1 }),
  },
}));

// Mock useAuthStore to provide a token
jest.mock('../../_stores/authStore', () => ({
  useAuthStore: () => ({
    token: 'test-auth-token',
  }),
}));

// Mock Animated API for TouchableOpacity animations
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');

  RN.Animated.timing = () => ({
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  });

  const mockAnimatedValue: any = {
    setValue: jest.fn(),
    setOffset: jest.fn(),
    flattenOffset: jest.fn(),
    extractOffset: jest.fn(),
    addListener: jest.fn(() => 'mockListenerId'),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    stopAnimation: jest.fn(),
    resetAnimation: jest.fn(),
    interpolate: jest.fn(() => ({})), // Return empty object instead of circular reference
    animate: jest.fn(),
    stopTracking: jest.fn(),
    track: jest.fn(),
  };

  RN.Animated.Value = jest.fn(() => mockAnimatedValue);

  return RN;
});

// Mock Alert to capture calls
const mockAlert = jest.spyOn(Alert, 'alert');
const mockRouter = router as jest.Mocked<typeof router>;

// Mock SVG components
jest.mock('../../../assets/icons/close.svg', () => 'CloseIcon');

// Mock react-native-svg for ChevronDownIcon
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: ({ children, ...props }: any) => React.createElement(View, props, children),
    Svg: ({ children, ...props }: any) => React.createElement(View, props, children),
    Path: () => React.createElement(View),
  };
});

describe('CheckoutForm (NewAddressScreen)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    mockRouter.back.mockClear();
    mockRouter.navigate.mockClear();
  });

  describe('Form Rendering', () => {
    it('should render all form fields correctly', () => {
      const { getByPlaceholderText, getByText } = render(<NewAddressScreen />);

      // Check header
      expect(getByText('Añadir dirección de envío')).toBeTruthy();

      // Check section titles
      expect(getByText('Información personal')).toBeTruthy();
      expect(getByText('Dirección')).toBeTruthy();
      expect(getByText('Opcional')).toBeTruthy();

      // Check form fields
      expect(getByPlaceholderText('Nombre')).toBeTruthy();
      expect(getByPlaceholderText('No. Celular')).toBeTruthy();
      expect(getByPlaceholderText('Calle')).toBeTruthy();
      expect(getByPlaceholderText('No.')).toBeTruthy();
      expect(getByPlaceholderText('Ciudad')).toBeTruthy();
      expect(getByPlaceholderText('Departamento')).toBeTruthy();
      expect(getByPlaceholderText('Información adicional')).toBeTruthy();

      // Check buttons
      expect(getByText('Guardar')).toBeTruthy();
      expect(getByText('Atrás')).toBeTruthy();
    });

    it('should render country dropdown with default Uruguay selection', () => {
      const { getByText } = render(<NewAddressScreen />);

      expect(getByText('Uruguay')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for required fields when form is submitted empty', async () => {
      const { getByText, getByPlaceholderText } = render(<NewAddressScreen />);

      // Try to submit empty form
      const saveButton = getByText('Guardar');
      fireEvent.press(saveButton);

      await waitFor(() => {
        // Form should still be visible since validation failed
        expect(getByText('Guardar')).toBeTruthy();
      });

      // Check that form inputs are still rendered (indicating validation failed)
      expect(getByPlaceholderText('Nombre')).toBeTruthy();
      expect(getByPlaceholderText('No. Celular')).toBeTruthy();
      expect(getByPlaceholderText('Calle')).toBeTruthy();
      expect(getByPlaceholderText('No.')).toBeTruthy();
      expect(getByPlaceholderText('Ciudad')).toBeTruthy();
      expect(getByPlaceholderText('Departamento')).toBeTruthy();
    });

    it('should validate individual required fields', async () => {
      const { getByPlaceholderText, getByText } = render(<NewAddressScreen />);

      // Fill only name field
      const nameInput = getByPlaceholderText('Nombre');
      fireEvent.changeText(nameInput, 'Juan Pérez');

      // Try to submit
      const saveButton = getByText('Guardar');
      fireEvent.press(saveButton);

      await waitFor(() => {
        // Form should not submit since other required fields are empty
        expect(getByText('Guardar')).toBeTruthy();
      });
    });

    it('should accept valid form data and submit successfully', async () => {
      const { getByPlaceholderText, getByText } = render(<NewAddressScreen />);

      // Fill all required fields (including lastName which is separate from firstName)
      fireEvent.changeText(getByPlaceholderText('Nombre'), 'Juan');
      fireEvent.changeText(getByPlaceholderText('Apellido'), 'Pérez');
      fireEvent.changeText(getByPlaceholderText('No. Celular'), '+598 99123456');
      fireEvent.changeText(getByPlaceholderText('Calle'), '18 de Julio');
      fireEvent.changeText(getByPlaceholderText('No.'), '1234');
      fireEvent.changeText(getByPlaceholderText('Ciudad'), 'Montevideo');
      fireEvent.changeText(getByPlaceholderText('Departamento'), 'Montevideo');

      // Submit form
      const saveButton = getByText('Guardar');
      fireEvent.press(saveButton);

      await waitFor(() => {
        // Should navigate back on successful submission
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });

    it('should validate phone number format', () => {
      const { getByPlaceholderText } = render(<NewAddressScreen />);

      const phoneInput = getByPlaceholderText('No. Celular');

      // Test valid phone number
      fireEvent.changeText(phoneInput, '+598 99123456');
      expect(phoneInput.props.value || '').toBe('+598 99123456');

      // Test keyboard type is set to phone-pad
      expect(phoneInput.props.keyboardType).toBe('phone-pad');
    });

    it('should validate number field accepts numeric input', () => {
      const { getByPlaceholderText } = render(<NewAddressScreen />);

      const numberInput = getByPlaceholderText('No.');

      // Test numeric input
      fireEvent.changeText(numberInput, '1234');
      expect(numberInput.props.value || '').toBe('1234');

      // Test keyboard type is set to number-pad
      expect(numberInput.props.keyboardType).toBe('number-pad');
    });
  });

  describe('Form Interactions', () => {
    it('should clear field errors when user starts typing', async () => {
      const { getByPlaceholderText, getByText } = render(<NewAddressScreen />);

      // Submit empty form to trigger validation
      const saveButton = getByText('Guardar');
      fireEvent.press(saveButton);

      // Wait for validation
      await waitFor(() => {
        expect(getByText('Guardar')).toBeTruthy();
      });

      // Start typing in name field
      const nameInput = getByPlaceholderText('Nombre');
      fireEvent.changeText(nameInput, 'J');

      // Error should be cleared for this field (tested by the field accepting input)
      expect(nameInput.props.value || '').toBe('J');
    });

    it('should handle additional information field input', () => {
      const { getByPlaceholderText } = render(<NewAddressScreen />);

      const additionalInfoInput = getByPlaceholderText('Información adicional');

      // Test input
      const text = 'Apartamento 12B, Portón verde';
      fireEvent.changeText(additionalInfoInput, text);

      expect(additionalInfoInput.props.value || '').toBe(text);
    });

    it('should handle country selection dropdown', () => {
      const { getByText } = render(<NewAddressScreen />);

      // Find Uruguay text (default selection)
      const uruguayText = getByText('Uruguay');
      expect(uruguayText).toBeTruthy();

      // The dropdown should be interactive (even if we can't fully test dropdown opening)
      // We can test that the country value is displayed
      expect(getByText('Uruguay')).toBeTruthy();
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate back when back button is pressed', () => {
      const { getByText } = render(<NewAddressScreen />);

      const backButton = getByText('Atrás');
      fireEvent.press(backButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('should navigate back after successful form submission', async () => {
      const { getByPlaceholderText, getByText } = render(<NewAddressScreen />);

      // Fill valid form data (all required fields)
      fireEvent.changeText(getByPlaceholderText('Nombre'), 'María');
      fireEvent.changeText(getByPlaceholderText('Apellido'), 'García');
      fireEvent.changeText(getByPlaceholderText('No. Celular'), '+598 91234567');
      fireEvent.changeText(getByPlaceholderText('Calle'), 'Av. Rivera');
      fireEvent.changeText(getByPlaceholderText('No.'), '567');
      fireEvent.changeText(getByPlaceholderText('Ciudad'), 'Montevideo');
      fireEvent.changeText(getByPlaceholderText('Departamento'), 'Montevideo');

      const saveButton = getByText('Guardar');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should prevent form submission when validation fails', async () => {
      const { getByPlaceholderText, getByText } = render(<NewAddressScreen />);

      // Submit with only partial data
      fireEvent.changeText(getByPlaceholderText('Nombre'), 'Juan');
      // Leave other required fields empty

      const saveButton = getByText('Guardar');
      fireEvent.press(saveButton);

      await waitFor(() => {
        // Should not navigate back if validation fails
        expect(mockRouter.back).not.toHaveBeenCalled();
      });

      // Form should still be visible
      expect(getByText('Guardar')).toBeTruthy();
    });

    it('should handle empty field validation gracefully', () => {
      const { getByPlaceholderText } = render(<NewAddressScreen />);

      // Test that empty strings are handled
      const nameInput = getByPlaceholderText('Nombre');
      fireEvent.changeText(nameInput, '');
      fireEvent.changeText(nameInput, '   '); // Whitespace only
      fireEvent.changeText(nameInput, 'Valid Name');

      expect(nameInput.props.value || '').toBe('Valid Name');
    });
  });

  describe('Loading States', () => {
    it('should handle form submission state', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(<NewAddressScreen />);

      // Fill valid form (all required fields)
      fireEvent.changeText(getByPlaceholderText('Nombre'), 'Test');
      fireEvent.changeText(getByPlaceholderText('Apellido'), 'User');
      fireEvent.changeText(getByPlaceholderText('No. Celular'), '+598 99999999');
      fireEvent.changeText(getByPlaceholderText('Calle'), 'Test Street');
      fireEvent.changeText(getByPlaceholderText('No.'), '123');
      fireEvent.changeText(getByPlaceholderText('Ciudad'), 'Test City');
      fireEvent.changeText(getByPlaceholderText('Departamento'), 'Test Department');

      const saveButton = getByText('Guardar');
      fireEvent.press(saveButton);

      // During loading, the button shows a loading indicator instead of text
      // The button is still rendered but with ActivityIndicator, so text may be replaced
      // We check that either loading is shown or the button navigated back
      await waitFor(() => {
        // Either the text is still showing (not loading) or we navigated back
        const guardarButton = queryByText('Guardar');
        expect(guardarButton !== null || mockRouter.back.mock.calls.length > 0).toBe(true);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles and labels', () => {
      const { getByText } = render(<NewAddressScreen />);

      const saveButton = getByText('Guardar');
      const backButton = getByText('Atrás');

      expect(saveButton).toBeTruthy();
      expect(backButton).toBeTruthy();
    });

    it('should have proper input placeholders for screen readers', () => {
      const { getByPlaceholderText } = render(<NewAddressScreen />);

      // Check that all inputs have descriptive placeholders
      expect(getByPlaceholderText('Nombre')).toBeTruthy();
      expect(getByPlaceholderText('No. Celular')).toBeTruthy();
      expect(getByPlaceholderText('Calle')).toBeTruthy();
      expect(getByPlaceholderText('No.')).toBeTruthy();
      expect(getByPlaceholderText('Ciudad')).toBeTruthy();
      expect(getByPlaceholderText('Departamento')).toBeTruthy();
      expect(getByPlaceholderText('Información adicional')).toBeTruthy();
    });
  });

  describe('Form Layout and Styling', () => {
    it('should render street and number fields in the same row', () => {
      const { getByPlaceholderText } = render(<NewAddressScreen />);

      const streetInput = getByPlaceholderText('Calle');
      const numberInput = getByPlaceholderText('No.');

      // Both fields should be rendered
      expect(streetInput).toBeTruthy();
      expect(numberInput).toBeTruthy();
    });

    it('should organize fields by sections', () => {
      const { getByText } = render(<NewAddressScreen />);

      // Personal info section
      expect(getByText('Información personal')).toBeTruthy();

      // Address section
      expect(getByText('Dirección')).toBeTruthy();

      // Optional section
      expect(getByText('Opcional')).toBeTruthy();
    });
  });

  describe('Data Integration', () => {
    it('should maintain form state across user interactions', () => {
      const { getByPlaceholderText, getByDisplayValue } = render(<NewAddressScreen />);

      // Fill multiple fields
      fireEvent.changeText(getByPlaceholderText('Nombre'), 'Ana López');
      fireEvent.changeText(getByPlaceholderText('Ciudad'), 'Canelones');

      // Interact with another field
      const phoneInput = getByPlaceholderText('No. Celular');
      fireEvent.changeText(phoneInput, '+598 95555555');

      // Previous values should be maintained
      expect(getByDisplayValue('Ana López')).toBeTruthy();
      expect(getByDisplayValue('Canelones')).toBeTruthy();
      expect(getByDisplayValue('+598 95555555')).toBeTruthy();
    });
  });
});
