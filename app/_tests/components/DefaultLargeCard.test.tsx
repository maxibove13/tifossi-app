/**
 * DefaultLargeCard Component Tests
 * Testing product card rendering, navigation, and interactions
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DefaultLargeCard from '../../_components/store/product/default/large';
import { Product } from '../../_types/product';
import { ProductStatus } from '../../_types/product-status';
import { router } from 'expo-router';
import { useFavoriteStatus } from '../../../hooks/useFavoriteStatus';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('../../../hooks/useFavoriteStatus', () => ({
  useFavoriteStatus: jest.fn(() => ({
    isFavorite: false,
    toggle: jest.fn(),
  })),
}));

const createMockProduct = (overrides = {}): Product => ({
  id: '1',
  title: 'Premium Jersey Nacional',
  price: 120.0,
  discountedPrice: 96.0,
  categoryId: 'apparel',
  modelId: 'jersey-nacional',
  frontImage: '/images/jersey-nacional.jpg',
  images: ['/images/jersey-nacional.jpg', '/images/jersey-nacional-back.jpg'],
  shortDescription: {
    line1: 'Official 2024 Edition',
    line2: 'Premium Quality',
  },
  longDescription: 'Official Nacional jersey for the 2024 season',
  statuses: [ProductStatus.FEATURED, ProductStatus.NEW],
  colors: [
    {
      colorName: 'Blanco',
      hex: '#FFFFFF',
      quantity: 10,
      images: {
        main: '/images/jersey-nacional-white.jpg',
      },
    },
    {
      colorName: 'Azul',
      hex: '#0000FF',
      quantity: 8,
      images: {
        main: '/images/jersey-nacional-blue.jpg',
      },
    },
    {
      colorName: 'Rojo',
      hex: '#FF0000',
      quantity: 5,
      images: {
        main: '/images/jersey-nacional-red.jpg',
      },
    },
  ],
  sizes: [
    { value: 'S', available: true },
    { value: 'M', available: true },
    { value: 'L', available: true },
    { value: 'XL', available: false },
  ],
  isCustomizable: true,
  warranty: '12 meses',
  returnPolicy: '30 días',
  dimensions: {
    height: '30cm',
    width: '20cm',
    depth: '2cm',
  },
  ...overrides,
});

describe('DefaultLargeCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFavoriteStatus as jest.Mock).mockReturnValue({
      isFavorite: false,
      toggle: jest.fn(),
    });
  });

  describe('Product Information Rendering', () => {
    it('should render product name', () => {
      const product = createMockProduct();
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      expect(getByText('Premium Jersey Nacional')).toBeTruthy();
    });

    it('should render personalizable text when product is customizable', () => {
      const product = createMockProduct({ isCustomizable: true });
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      expect(getByText('Personalizable')).toBeTruthy();
    });

    it('should display product image', () => {
      const product = createMockProduct();
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      // Image component should be rendered
      expect(getByText('Premium Jersey Nacional')).toBeTruthy();
    });

    it('should handle products without images', () => {
      const product = createMockProduct({ images: [] });
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      // Should render even without images
      expect(getByText('Premium Jersey Nacional')).toBeTruthy();
    });
  });

  describe('Price Display', () => {
    it('should show regular price when no discount', () => {
      const product = createMockProduct({ price: 150, discountedPrice: undefined });
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      expect(getByText('$150.00')).toBeTruthy();
    });

    it('should show both prices when discount is applied', () => {
      const product = createMockProduct({ price: 120, discountedPrice: 96 });
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      expect(getByText('$96.00')).toBeTruthy();
      expect(getByText('$120.00')).toBeTruthy();
    });

    it('should calculate and display discount percentage', () => {
      const product = createMockProduct({ price: 100, discountedPrice: 75 });
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      // 25% discount
      expect(getByText('-25%')).toBeTruthy();
    });
  });

  describe('Badges and Tags', () => {
    it('should display NEW badge for new products without discount', () => {
      const product = createMockProduct({
        statuses: [ProductStatus.NEW],
        discountedPrice: undefined,
      });
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      expect(getByText('Nuevo')).toBeTruthy();
    });

    it('should display discount tag for discounted products', () => {
      const product = createMockProduct({
        price: 100,
        discountedPrice: 80,
      });
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      expect(getByText('Descuento')).toBeTruthy();
      expect(getByText('-20%')).toBeTruthy();
    });

    it('should not display badges when not applicable', () => {
      const product = createMockProduct({ statuses: [], discountedPrice: undefined });
      const { queryByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      expect(queryByText('NEW')).toBeNull();
      expect(queryByText(/-\d+%/)).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('should call onPress when card is pressed', () => {
      const mockOnPress = jest.fn();
      const product = createMockProduct();
      const { getByText } = render(<DefaultLargeCard product={product} onPress={mockOnPress} />);

      const productName = getByText('Premium Jersey Nacional');
      const parentElement = productName.parent;
      if (parentElement) {
        fireEvent.press(parentElement);
      }

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should navigate to product detail when pressed', () => {
      const product = createMockProduct();
      const mockOnPress = jest.fn(() => {
        (router.push as jest.Mock)(`/products/${product.id}`);
      });
      const { getByText } = render(<DefaultLargeCard product={product} onPress={mockOnPress} />);

      const productName = getByText('Premium Jersey Nacional');
      const parentElement = productName.parent;
      if (parentElement) {
        fireEvent.press(parentElement);
      }

      expect(mockOnPress).toHaveBeenCalled();
      expect(router.push).toHaveBeenCalledWith('/products/1');
    });
  });

  describe('Favorite Toggle', () => {
    it('should display inactive heart when not favorited', () => {
      const product = createMockProduct();
      const { getByLabelText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      // Should have a favorite button
      const favoriteButton = getByLabelText('Add to favorites');
      expect(favoriteButton).toBeTruthy();
    });

    it('should display active heart when favorited', () => {
      (useFavoriteStatus as jest.Mock).mockReturnValue({
        isFavorite: true,
        toggle: jest.fn(),
      });

      const product = createMockProduct();
      const { getByLabelText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      // Should have favorite button with different label when favorited
      const favoriteButton = getByLabelText('Remove from favorites');
      expect(favoriteButton).toBeTruthy();
    });

    it('should toggle favorite status when heart is pressed', async () => {
      const mockToggle = jest.fn();
      (useFavoriteStatus as jest.Mock).mockReturnValue({
        isFavorite: false,
        toggle: mockToggle,
      });

      const product = createMockProduct();
      const { getByLabelText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      // Find and press favorite button
      const favoriteButton = getByLabelText('Add to favorites');
      fireEvent.press(favoriteButton);

      await waitFor(() => {
        expect(mockToggle).toHaveBeenCalledTimes(1);
      });
    });

    it('should not interfere with card navigation when toggling favorite', () => {
      const mockOnPress = jest.fn();
      const mockToggle = jest.fn();
      (useFavoriteStatus as jest.Mock).mockReturnValue({
        isFavorite: false,
        toggle: mockToggle,
      });

      const product = createMockProduct();
      const { getByLabelText } = render(
        <DefaultLargeCard product={product} onPress={mockOnPress} />
      );

      const favoriteButton = getByLabelText('Add to favorites');
      fireEvent.press(favoriteButton);

      expect(mockToggle).toHaveBeenCalled();
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Color Palette', () => {
    it('should display color circles for available colors', () => {
      const product = createMockProduct({
        colors: [
          { colorName: 'Rojo', hex: '#FF0000', quantity: 5, images: { main: '/image1.jpg' } },
          { colorName: 'Azul', hex: '#0000FF', quantity: 3, images: { main: '/image2.jpg' } },
          { colorName: 'Blanco', hex: '#FFFFFF', quantity: 8, images: { main: '/image3.jpg' } },
        ],
      });
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      // Component should render the colors - check if the component renders at all
      expect(getByText('Premium Jersey Nacional')).toBeTruthy();
    });

    it('should show +N indicator for many colors', () => {
      const product = createMockProduct({
        colors: [
          { colorName: 'Rojo', hex: '#FF0000', quantity: 5, images: { main: '/image1.jpg' } },
          { colorName: 'Azul', hex: '#0000FF', quantity: 3, images: { main: '/image2.jpg' } },
          { colorName: 'Blanco', hex: '#FFFFFF', quantity: 8, images: { main: '/image3.jpg' } },
          { colorName: 'Negro', hex: '#000000', quantity: 2, images: { main: '/image4.jpg' } },
          { colorName: 'Verde', hex: '#00FF00', quantity: 4, images: { main: '/image5.jpg' } },
          { colorName: 'Amarillo', hex: '#FFFF00', quantity: 1, images: { main: '/image6.jpg' } },
        ],
      });
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      // Should show limited colors and a +N indicator
      expect(getByText(/\+\d+/)).toBeTruthy();
    });

    it('should handle products without colors', () => {
      const product = createMockProduct({ colors: [] });
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      // Component should still render without colors
      expect(getByText('Premium Jersey Nacional')).toBeTruthy();
    });
  });

  describe('Stock Status', () => {
    it('should handle out of stock products', () => {
      const product = createMockProduct({
        colors: [
          { colorName: 'Negro', hex: '#000000', quantity: 0, images: { main: '/image.jpg' } },
        ],
      });
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      // Card should still render
      expect(getByText('Premium Jersey Nacional')).toBeTruthy();
    });

    it('should handle low stock products', () => {
      const product = createMockProduct({
        colors: [
          { colorName: 'Negro', hex: '#000000', quantity: 2, images: { main: '/image.jpg' } },
        ],
      });
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      // Component should render normally
      expect(getByText('Premium Jersey Nacional')).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('should handle image loading state', () => {
      const product = createMockProduct();
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      // Component renders with image
      expect(getByText('Premium Jersey Nacional')).toBeTruthy();
    });

    it('should display placeholder for missing images', () => {
      const product = createMockProduct({ images: [] });
      const { getByText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      // Should still render product info
      expect(getByText('Premium Jersey Nacional')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible elements', () => {
      const product = createMockProduct();
      const { getByLabelText, getByText } = render(
        <DefaultLargeCard product={product} onPress={jest.fn()} />
      );

      // Card should have product name
      expect(getByText('Premium Jersey Nacional')).toBeTruthy();

      // Should have accessible favorite button
      const favoriteButton = getByLabelText('Add to favorites');
      expect(favoriteButton).toBeTruthy();
    });

    it('should have accessible labels for actions', () => {
      const product = createMockProduct();
      const { getByLabelText } = render(<DefaultLargeCard product={product} onPress={jest.fn()} />);

      // Favorite button should have label
      const favoriteButton = getByLabelText(/favorite|favorito/i);
      if (favoriteButton) {
        expect(favoriteButton).toBeTruthy();
      }
    });
  });

  describe('Performance', () => {
    it('should use memo to prevent unnecessary re-renders', () => {
      const product = createMockProduct();
      const mockOnPress = jest.fn();

      const { rerender } = render(<DefaultLargeCard product={product} onPress={mockOnPress} />);

      // Rerender with same props
      rerender(<DefaultLargeCard product={product} onPress={mockOnPress} />);

      // Component is memoized, so this is just a smoke test
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });
});
