/**
 * Price Calculation Integration Tests
 * REVENUE CRITICAL: Tests that ensure price calculations are correct
 * These tests would wake us up at 3 AM if they fail!
 */

import { useCartStore } from '../../_stores/cartStore';
import { renderHook, act } from '@testing-library/react-native';

describe('Price Calculations - Revenue Critical Tests', () => {
  beforeEach(() => {
    // Reset cart store before each test
    act(() => {
      useCartStore.setState({ items: [] });
    });
  });

  describe('getSubtotal - Original price calculations', () => {
    it('should calculate correct subtotal with no discounts', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 2,
            price: 99.99,
          } as any,
          {
            productId: '2',
            quantity: 1,
            price: 49.5,
          } as any,
        ]);
      });

      const subtotal = result.current.getSubtotal();

      expect(subtotal).toBe(249.48); // (99.99 * 2) + (49.50 * 1)
    });

    it('should use original price when both original and discounted prices exist', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 3,
            originalPrice: 100.0,
            discountedPrice: 75.0,
            price: 75.0,
          } as any,
        ]);
      });

      const subtotal = result.current.getSubtotal();

      expect(subtotal).toBe(300.0); // Uses originalPrice: 100.00 * 3
    });

    it('should handle mixed items with and without discounts', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 2,
            originalPrice: 100.0,
            discountedPrice: 80.0,
            price: 80.0,
          } as any,
          {
            productId: '2',
            quantity: 1,
            price: 50.0, // No discount
          } as any,
        ]);
      });

      const subtotal = result.current.getSubtotal();

      expect(subtotal).toBe(250.0); // (100.00 * 2) + (50.00 * 1)
    });

    it('should handle legacy unit_price field', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 2,
            unit_price: 99.99, // Legacy field
          } as any,
        ]);
      });

      const subtotal = result.current.getSubtotal();

      expect(subtotal).toBe(199.98);
    });

    it('should handle empty cart', () => {
      const { result } = renderHook(() => useCartStore());

      const subtotal = result.current.getSubtotal();

      expect(subtotal).toBe(0);
    });

    it('should handle decimal precision correctly', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 3,
            price: 33.33,
          } as any,
        ]);
      });

      const subtotal = result.current.getSubtotal();

      expect(subtotal).toBeCloseTo(99.99, 2);
    });
  });

  describe('getDiscountTotal - Discount calculations', () => {
    it('should calculate correct discount for single item', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 2,
            originalPrice: 100.0,
            discountedPrice: 75.0,
            price: 75.0,
          } as any,
        ]);
      });

      const discount = result.current.getDiscountTotal();

      expect(discount).toBe(50.0); // (100 - 75) * 2
    });

    it('should calculate discount across multiple items', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 2,
            originalPrice: 100.0,
            discountedPrice: 80.0,
            price: 80.0,
          } as any,
          {
            productId: '2',
            quantity: 1,
            originalPrice: 50.0,
            discountedPrice: 30.0,
            price: 30.0,
          } as any,
        ]);
      });

      const discount = result.current.getDiscountTotal();

      expect(discount).toBe(60.0); // ((100-80) * 2) + ((50-30) * 1)
    });

    it('should return 0 discount for items without discounts', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 3,
            price: 99.99,
          } as any,
        ]);
      });

      const discount = result.current.getDiscountTotal();

      expect(discount).toBe(0);
    });

    it('should handle mixed discounted and non-discounted items', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 1,
            originalPrice: 100.0,
            discountedPrice: 75.0,
            price: 75.0,
          } as any,
          {
            productId: '2',
            quantity: 2,
            price: 50.0, // No discount
          } as any,
        ]);
      });

      const discount = result.current.getDiscountTotal();

      expect(discount).toBe(25.0); // Only from first item
    });

    it('should not return negative discounts', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 1,
            originalPrice: 50.0,
            discountedPrice: 75.0, // Price increased (shouldn't happen)
            price: 75.0,
          } as any,
        ]);
      });

      const discount = result.current.getDiscountTotal();

      expect(discount).toBe(0); // Should not be negative
    });
  });

  describe('getTotalPrice - Final price calculation', () => {
    it('should calculate total with discounts applied', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 2,
            originalPrice: 100.0,
            discountedPrice: 80.0,
            price: 80.0,
          } as any,
          {
            productId: '2',
            quantity: 1,
            price: 50.0,
          } as any,
        ]);
      });

      const total = result.current.getTotalPrice();

      // Total should be sum of discounted prices
      expect(total).toBe(210.0); // (80 * 2) + (50 * 1)
    });

    it('should handle large quantities correctly', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 99, // Maximum allowed quantity
            price: 10.0,
          } as any,
        ]);
      });

      const total = result.current.getTotalPrice();

      expect(total).toBe(990.0);
    });

    it('should handle very small prices', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 5,
            price: 0.01,
          } as any,
        ]);
      });

      const total = result.current.getTotalPrice();

      expect(total).toBeCloseTo(0.05, 2);
    });
  });

  describe('getTotalItems and getTotalQuantity', () => {
    it('should count total number of items', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          { productId: '1', quantity: 3 } as any,
          { productId: '2', quantity: 2 } as any,
          { productId: '3', quantity: 1 } as any,
        ]);
      });

      expect(result.current.getTotalItems()).toBe(6);
      expect(result.current.getTotalQuantity()).toBe(6);
    });

    it('should return 0 for empty cart', () => {
      const { result } = renderHook(() => useCartStore());

      expect(result.current.getTotalItems()).toBe(0);
      expect(result.current.getTotalQuantity()).toBe(0);
    });
  });

  describe('Edge cases and precision', () => {
    it('should handle floating point arithmetic correctly', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 3,
            price: 19.99,
          } as any,
        ]);
      });

      const total = result.current.getTotalPrice();

      expect(total).toBeCloseTo(59.97, 2);
    });

    it('should handle extreme prices', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 1,
            price: 999999.99,
          } as any,
        ]);
      });

      const total = result.current.getTotalPrice();

      expect(total).toBe(999999.99);
    });

    it('should handle multiple items with same productId but different variants', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: '1',
            quantity: 2,
            color: 'red',
            size: 'M',
            price: 50.0,
          } as any,
          {
            productId: '1',
            quantity: 1,
            color: 'blue',
            size: 'L',
            price: 50.0,
          } as any,
        ]);
      });

      const total = result.current.getTotalPrice();
      const items = result.current.getTotalItems();

      expect(total).toBe(150.0); // (50 * 2) + (50 * 1)
      expect(items).toBe(3);
    });

    it('should recalculate when items are updated', () => {
      const { result } = renderHook(() => useCartStore());

      // Initial state
      act(() => {
        result.current.setItems([{ productId: '1', quantity: 1, price: 100.0 } as any]);
      });

      expect(result.current.getTotalPrice()).toBe(100.0);

      // Update items
      act(() => {
        result.current.addItem({
          productId: '2',
          quantity: 2,
          price: 50.0,
        } as any);
      });

      expect(result.current.getTotalPrice()).toBe(200.0);

      // Remove an item
      act(() => {
        result.current.removeItem('1', undefined, undefined);
      });

      expect(result.current.getTotalPrice()).toBe(100.0);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical shopping cart', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: 'shirt-1',
            quantity: 2,
            color: 'blue',
            size: 'M',
            originalPrice: 59.99,
            discountedPrice: 47.99,
            price: 47.99,
          } as any,
          {
            productId: 'pants-1',
            quantity: 1,
            color: 'black',
            size: '32',
            price: 89.99,
          } as any,
          {
            productId: 'shoes-1',
            quantity: 1,
            color: 'white',
            size: '10',
            originalPrice: 120.0,
            discountedPrice: 96.0,
            price: 96.0,
          } as any,
        ]);
      });

      const subtotal = result.current.getSubtotal();
      const discount = result.current.getDiscountTotal();
      const total = result.current.getTotalPrice();
      const itemCount = result.current.getTotalItems();

      expect(subtotal).toBeCloseTo(329.97, 2); // (59.99*2) + 89.99 + 120.00
      expect(discount).toBeCloseTo(48.0, 2); // (12*2) + 24
      expect(total).toBeCloseTo(281.97, 2); // 329.97 - 48.00
      expect(itemCount).toBe(4); // 2 + 1 + 1 = 4 items
    });

    it('should handle Black Friday scenario with heavy discounts', () => {
      const { result } = renderHook(() => useCartStore());

      act(() => {
        result.current.setItems([
          {
            productId: 'item-1',
            quantity: 3,
            originalPrice: 100.0,
            discountedPrice: 25.0, // 75% off
            price: 25.0,
          } as any,
          {
            productId: 'item-2',
            quantity: 2,
            originalPrice: 200.0,
            discountedPrice: 100.0, // 50% off
            price: 100.0,
          } as any,
        ]);
      });

      const subtotal = result.current.getSubtotal();
      const discount = result.current.getDiscountTotal();
      const total = result.current.getTotalPrice();

      expect(subtotal).toBe(700.0); // (100*3) + (200*2)
      expect(discount).toBe(425.0); // (75*3) + (100*2)
      expect(total).toBe(275.0); // 700 - 425
    });
  });
});
