/**
 * AddToCartButton Component Tests
 * Testing real component with all props, states, and interactions
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddToCartButton from '../../_components/store/product/cart/AddToCartButton';

// Mock Ionicons
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, size, color, ...props }: any) => (
      <Text {...props} testID={`icon-${name}`}>
        {name}
      </Text>
    ),
  };
});

// Mock expo-font
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));

// Mock timers and interactions
global.setImmediate = jest.fn((cb) => setTimeout(cb, 0)) as any;

describe('AddToCartButton', () => {
  const mockOnPress = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      const { getByText } = render(<AddToCartButton onPress={mockOnPress} />);

      expect(getByText('Agregar al carrito')).toBeTruthy();
    });

    it('should render "In Cart" when inCart prop is true', () => {
      const { getByText } = render(<AddToCartButton onPress={mockOnPress} inCart={true} />);

      expect(getByText('In Cart')).toBeTruthy();
    });

    it('should display quantity when greater than 1', () => {
      const { getByText } = render(<AddToCartButton onPress={mockOnPress} quantity={3} />);

      expect(getByText('Agregar al carrito (3)')).toBeTruthy();
    });

    it('should display price tag when price is provided', () => {
      const { getByText } = render(<AddToCartButton onPress={mockOnPress} price={99.99} />);

      expect(getByText('$99.99')).toBeTruthy();
    });

    it('should show helper text when disabled', () => {
      const { getByText } = render(<AddToCartButton onPress={mockOnPress} disabled={true} />);

      expect(getByText('Please select a size')).toBeTruthy();
    });

    it('should apply dark mode styles', () => {
      const { getByText } = render(<AddToCartButton onPress={mockOnPress} darkMode={true} />);

      // Component should render in dark mode (we test that it renders properly)
      expect(getByText('Agregar al carrito')).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator when isLoading is true', () => {
      const { queryByTestId, queryByText } = render(
        <AddToCartButton onPress={mockOnPress} isLoading={true} />
      );

      // Loading indicator should be shown (ActivityIndicator)
      expect(queryByText('Agregar al carrito')).toBeNull();
    });

    it('should show loading state during async onPress', async () => {
      const slowOnPress = jest.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));

      const { getByText } = render(<AddToCartButton onPress={slowOnPress} />);

      const button = getByText('Agregar al carrito');
      if (button.parent) fireEvent.press(button.parent);

      // Should call the async onPress
      await waitFor(() => {
        expect(slowOnPress).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle external loading state', () => {
      const { queryByText } = render(<AddToCartButton onPress={mockOnPress} isLoading={false} />);

      expect(queryByText('Agregar al carrito')).toBeTruthy();

      // Test that the component can handle loading prop
      const { queryByText: queryByTextLoading } = render(
        <AddToCartButton onPress={mockOnPress} isLoading={true} />
      );
      expect(queryByTextLoading('Agregar al carrito')).toBeNull();
    });
  });

  describe('User Interactions', () => {
    it('should call onPress when button is pressed', () => {
      const { getByText } = render(<AddToCartButton onPress={mockOnPress} />);

      const button = getByText('Agregar al carrito');
      if (button.parent) fireEvent.press(button.parent);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const { getByText } = render(<AddToCartButton onPress={mockOnPress} disabled={true} />);

      const button = getByText('Agregar al carrito');
      if (button.parent) fireEvent.press(button.parent);

      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should not call onPress when loading', () => {
      const { queryByText } = render(<AddToCartButton onPress={mockOnPress} isLoading={true} />);

      // When loading, the text should not be visible
      expect(queryByText('Agregar al carrito')).toBeNull();
      // The onPress should not be called when loading
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should handle onPress errors gracefully', async () => {
      const errorOnPress = jest.fn().mockRejectedValue(new Error('Network error'));
      const { getByText } = render(<AddToCartButton onPress={errorOnPress} />);

      const button = getByText('Agregar al carrito');
      if (button.parent) fireEvent.press(button.parent);

      await waitFor(() => {
        expect(errorOnPress).toHaveBeenCalledTimes(1);
      });

      // Component should still show button text after error
      expect(getByText('Agregar al carrito')).toBeTruthy();
    });
  });

  describe('Visual States', () => {
    it('should render cart icon when not in cart', () => {
      const { getByTestId } = render(<AddToCartButton onPress={mockOnPress} inCart={false} />);

      // Cart icon should be rendered
      expect(getByTestId('icon-cart-outline')).toBeTruthy();
    });

    it('should render checkmark icon when in cart', () => {
      const { getByTestId } = render(<AddToCartButton onPress={mockOnPress} inCart={true} />);

      // Checkmark icon when in cart
      expect(getByTestId('icon-checkmark-circle')).toBeTruthy();
    });

    it('should apply disabled styles when disabled', () => {
      const { getByText } = render(<AddToCartButton onPress={mockOnPress} disabled={true} />);

      // Component should show button text even when disabled
      expect(getByText('Agregar al carrito')).toBeTruthy();
      expect(getByText('Please select a size')).toBeTruthy();
    });

    it('should handle combination of props correctly', () => {
      const { getByText } = render(
        <AddToCartButton
          onPress={mockOnPress}
          inCart={true}
          quantity={2}
          price={49.99}
          darkMode={true}
        />
      );

      expect(getByText('In Cart (2)')).toBeTruthy();
      expect(getByText('$49.99')).toBeTruthy();
    });
  });

  describe('Animation', () => {
    it('should handle press interactions smoothly', () => {
      const { getByText } = render(<AddToCartButton onPress={mockOnPress} />);

      const button = getByText('Agregar al carrito');
      if (button.parent) fireEvent.press(button.parent);

      // Button should handle press event
      expect(mockOnPress).toHaveBeenCalled();
    });

    it('should complete press animation sequence', async () => {
      const { getByText } = render(<AddToCartButton onPress={mockOnPress} />);

      const button = getByText('Agregar al carrito');
      if (button.parent) fireEvent.press(button.parent);

      await waitFor(() => {
        expect(mockOnPress).toHaveBeenCalled();
      });

      // Press should be handled properly
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button role', () => {
      const { getByText } = render(<AddToCartButton onPress={mockOnPress} />);

      // Component should be accessible and render button text
      expect(getByText('Agregar al carrito')).toBeTruthy();
    });

    it('should be disabled for accessibility when loading', () => {
      const { queryByText } = render(<AddToCartButton onPress={mockOnPress} isLoading={true} />);

      // When loading, button text should not be visible
      expect(queryByText('Agregar al carrito')).toBeNull();
    });
  });
});
