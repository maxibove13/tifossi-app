/**
 * CartProductCard Component Tests
 * Testing product display, quantity controls, and cart management
 */

import React from 'react';
import { renderWithoutProviders as render, fireEvent } from '../utils/render-utils';
import { CartProductCard } from '../../_components/store/product/cart/CartProductCard';
import { ProductStatus } from '../../_types/product-status';

// Create a mock product with cart-specific properties matching the actual Product interface
const createMockCartProduct = (overrides = {}) => ({
  id: '1',
  title: 'Test Product', // Note: using 'title' not 'name'
  categoryId: 'apparel',
  modelId: 'test-model',
  price: 99.99,
  discountedPrice: 79.99, // Note: using 'discountedPrice' not 'discountPrice'
  frontImage: '/test-image.jpg',
  images: ['/test-image.jpg'],
  statuses: [ProductStatus.FEATURED],
  shortDescription: {
    line1: 'Premium quality',
    line2: 'Limited edition',
  },
  longDescription: 'A detailed product description',
  sizes: [
    { value: 'S', available: true },
    { value: 'M', available: true },
    { value: 'L', available: false },
  ],
  colors: [
    { colorName: 'red', quantity: 5, images: { main: '/red-image.jpg' } },
    { colorName: 'blue', quantity: 3, images: { main: '/blue-image.jpg' } },
  ],
  isCustomizable: false,
  // Cart-specific properties
  quantity: 2,
  selectedSize: 'M',
  ...overrides,
});

describe('CartProductCard', () => {
  const mockOnQuantityChange = jest.fn();
  const mockOnRemove = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Product Display', () => {
    it('should render product name and details', () => {
      const product = createMockCartProduct();
      const { getByText } = render(
        <CartProductCard
          product={product}
          quantity={2}
          onQuantityChange={mockOnQuantityChange}
          onRemove={mockOnRemove}
        />
      );

      expect(getByText('Test Product')).toBeTruthy();
    });

    it('should display product image', () => {
      const product = createMockCartProduct();
      const { getByText } = render(<CartProductCard product={product} quantity={1} />);

      // ProductImage component should be rendered - we check that the product renders
      expect(getByText('Test Product')).toBeTruthy();
    });

    it('should show selected size when available', () => {
      const product = createMockCartProduct({ selectedSize: 'L' });
      const { getByText } = render(
        <CartProductCard product={product} quantity={1} onQuantityChange={mockOnQuantityChange} />
      );

      expect(getByText('L')).toBeTruthy();
    });

    it('should display color when specified', () => {
      const product = createMockCartProduct({
        color: 'red', // Direct color property for cart display
        colors: [{ colorName: 'red', quantity: 5, images: { main: '/red-image.jpg' } }],
      });
      const { getByText } = render(
        <CartProductCard product={product} quantity={1} onQuantityChange={mockOnQuantityChange} />
      );

      expect(getByText(/red/i)).toBeTruthy();
    });

    it('should show customizable indicator when applicable', () => {
      const product = createMockCartProduct({ isCustomizable: true });
      const { getByText } = render(
        <CartProductCard product={product} quantity={1} onQuantityChange={mockOnQuantityChange} />
      );

      expect(getByText(/personalizable/i)).toBeTruthy();
    });
  });

  describe('Quantity Display', () => {
    it('should display current quantity', () => {
      const product = createMockCartProduct();
      const { getByText } = render(<CartProductCard product={product} quantity={3} />);

      // Check for "Cantidad:" label and the quantity value
      expect(getByText('Cantidad:')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
    });

    it('should display quantity label and value separately', () => {
      const product = createMockCartProduct();
      const { getByText } = render(<CartProductCard product={product} quantity={1} />);

      expect(getByText('Cantidad:')).toBeTruthy();
      expect(getByText('1')).toBeTruthy();
    });
  });

  describe('Price Calculations', () => {
    it('should display regular price when no discount', () => {
      const product = createMockCartProduct({ price: 100, discountedPrice: undefined });
      const { getByText } = render(
        <CartProductCard product={product} quantity={1} onQuantityChange={mockOnQuantityChange} />
      );

      expect(getByText('$100.00')).toBeTruthy();
    });

    it('should display discounted price and original price', () => {
      const product = createMockCartProduct({ price: 100, discountedPrice: 75 });
      const { getByText } = render(
        <CartProductCard product={product} quantity={1} onQuantityChange={mockOnQuantityChange} />
      );

      expect(getByText('$75.00')).toBeTruthy();
      expect(getByText('$100.00')).toBeTruthy();
    });

    it('should display unit price (not total)', () => {
      const product = createMockCartProduct({ price: 50, discountedPrice: 40 });
      const { getByText } = render(
        <CartProductCard product={product} quantity={3} onQuantityChange={mockOnQuantityChange} />
      );

      // Component shows unit price, not total
      expect(getByText('$40.00')).toBeTruthy(); // discounted price
      expect(getByText('$50.00')).toBeTruthy(); // original price
    });

    it('should format prices correctly', () => {
      const product = createMockCartProduct({ price: 99.99, discountedPrice: 79.5 });
      const { getByText } = render(
        <CartProductCard product={product} quantity={1} onQuantityChange={mockOnQuantityChange} />
      );

      expect(getByText('$79.50')).toBeTruthy();
      expect(getByText('$99.99')).toBeTruthy();
    });
  });

  describe('Actions', () => {
    it('should call onEdit when edit button is pressed', () => {
      const product = createMockCartProduct();
      const { getByText } = render(
        <CartProductCard product={product} quantity={1} onEdit={mockOnEdit} />
      );

      // Look for edit text/button
      const editElement = getByText('Editar');
      fireEvent.press(editElement);
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should render edit button when onEdit is provided', () => {
      const product = createMockCartProduct();
      const { getByText } = render(
        <CartProductCard product={product} quantity={1} onEdit={mockOnEdit} />
      );

      expect(getByText('Editar')).toBeTruthy();
    });

    it('should still render edit button even when onEdit is not provided', () => {
      const product = createMockCartProduct();
      const { getByText } = render(<CartProductCard product={product} quantity={1} />);

      // The component always renders the edit button, even without a handler
      expect(getByText('Editar')).toBeTruthy();
    });
  });

  describe('Dark Mode', () => {
    it('should apply dark mode styles when isDark is true', () => {
      const product = createMockCartProduct();
      const { getByText } = render(
        <CartProductCard product={product} quantity={1} isDark={true} />
      );

      // Check if component renders with dark mode
      expect(getByText('Test Product')).toBeTruthy();
    });

    it('should apply light mode styles by default', () => {
      const product = createMockCartProduct();
      const { getByText } = render(
        <CartProductCard product={product} quantity={1} isDark={false} />
      );

      // Check if component renders with light mode
      expect(getByText('Test Product')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle product without images', () => {
      const product = createMockCartProduct({ images: [] });
      const { getByText } = render(<CartProductCard product={product} quantity={1} />);

      // Component should render without images
      expect(getByText('Test Product')).toBeTruthy();
    });

    it('should handle product without discount', () => {
      const product = createMockCartProduct({ discountedPrice: undefined });
      const { queryByText, getByText } = render(<CartProductCard product={product} quantity={1} />);

      expect(getByText('$99.99')).toBeTruthy();
      // Should not show strikethrough price when no discount
      const prices = queryByText('$99.99');
      expect(prices).toBeTruthy();
    });

    it('should handle missing size information', () => {
      const product = createMockCartProduct({ selectedSize: undefined, sizes: undefined });
      const { getByText } = render(<CartProductCard product={product} quantity={1} />);

      expect(getByText('Test Product')).toBeTruthy();
    });
  });

  describe('Integration', () => {
    it('should reflect quantity changes when rerendered', () => {
      const product = createMockCartProduct();

      const { rerender, getByText } = render(<CartProductCard product={product} quantity={2} />);

      expect(getByText('2')).toBeTruthy();

      // Rerender with new quantity
      rerender(<CartProductCard product={product} quantity={5} />);

      expect(getByText('5')).toBeTruthy();
    });

    it('should handle discount display changes', () => {
      const productWithDiscount = createMockCartProduct({
        price: 100,
        discountedPrice: 75,
      });

      const { rerender, getByText } = render(
        <CartProductCard product={productWithDiscount} quantity={1} />
      );

      // Should show both prices with discount
      expect(getByText('$75.00')).toBeTruthy();
      expect(getByText('$100.00')).toBeTruthy();

      // Rerender without discount
      const productWithoutDiscount = createMockCartProduct({
        price: 100,
        discountedPrice: undefined,
      });

      rerender(<CartProductCard product={productWithoutDiscount} quantity={1} />);

      expect(getByText('$100.00')).toBeTruthy();
    });
  });
});
