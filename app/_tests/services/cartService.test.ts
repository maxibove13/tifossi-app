/**
 * Cart Service Unit Tests
 * Tests cart sync, merge, and persistence logic
 * Following testing principles: mock only at httpClient boundary
 */

import httpClient from '../../_services/api/httpClient';
import { cartService } from '../../_services/cart/cartService';
import type { CartItem } from '../../_services/cart/cartService';

// Mock httpClient at the boundary
jest.mock('../../_services/api/httpClient');
const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cartService.setAuthToken('test-auth-token');
  });

  const mockCartItem: CartItem = {
    productId: 'prod-1',
    quantity: 2,
    color: 'red',
    size: 'M',
  };

  const mockCartItems: CartItem[] = [
    mockCartItem,
    { productId: 'prod-2', quantity: 1, color: 'blue', size: 'L' },
    { productId: 'prod-3', quantity: 3 },
  ];

  describe('fetchUserCart', () => {
    it('should fetch user cart from server', async () => {
      mockHttpClient.get.mockResolvedValue({ cart: mockCartItems });

      const result = await cartService.fetchUserCart();

      expect(result).toEqual(mockCartItems);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/users/me?populate=cart');
    });

    it('should handle different response formats', async () => {
      // Test response.data.cart format
      mockHttpClient.get.mockResolvedValue({ data: { cart: mockCartItems } });
      let result = await cartService.fetchUserCart();
      expect(result).toEqual(mockCartItems);

      // Test empty response
      mockHttpClient.get.mockResolvedValue({});
      result = await cartService.fetchUserCart();
      expect(result).toEqual([]);

      // Test response.cart format
      mockHttpClient.get.mockResolvedValue({ cart: mockCartItems });
      result = await cartService.fetchUserCart();
      expect(result).toEqual(mockCartItems);
    });

    it('should require authentication', async () => {
      cartService.setAuthToken(null);

      await expect(cartService.fetchUserCart()).rejects.toThrow();
    });

    it('should throw on API error', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'));

      await expect(cartService.fetchUserCart()).rejects.toThrow();
    });
  });

  describe('syncCart', () => {
    it('should sync cart items with server for authenticated user', async () => {
      mockHttpClient.put.mockResolvedValue({ cart: mockCartItems });

      const result = await cartService.syncCart(mockCartItems);

      expect(result.success).toBe(true);
      expect(result.items).toEqual(mockCartItems);
      expect(mockHttpClient.put).toHaveBeenCalledWith('/user-profile/me', {
        cart: mockCartItems,
      });
    });

    it('should return items without syncing for guest users', async () => {
      cartService.setAuthToken(null);

      const result = await cartService.syncCart(mockCartItems);

      expect(result.success).toBe(true);
      expect(result.items).toEqual(mockCartItems);
      expect(mockHttpClient.put).not.toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      mockHttpClient.put.mockRejectedValue(new Error('Sync failed'));

      const result = await cartService.syncCart(mockCartItems);

      expect(result.success).toBe(false);
      expect(result.items).toEqual(mockCartItems);
      expect(result.error).toBeDefined();
    });
  });

  describe('migrateGuestCart', () => {
    const guestItems: CartItem[] = [
      { productId: 'prod-1', quantity: 1, color: 'red', size: 'M' }, // Existing item
      { productId: 'prod-4', quantity: 2, color: 'green', size: 'S' }, // New item
    ];

    it('should merge guest cart with user cart on login', async () => {
      const userItems: CartItem[] = [
        { productId: 'prod-1', quantity: 2, color: 'red', size: 'M' },
        { productId: 'prod-2', quantity: 1 },
      ];

      mockHttpClient.get.mockResolvedValue({ cart: userItems });
      mockHttpClient.put.mockResolvedValue({
        cart: [
          { productId: 'prod-1', quantity: 3, color: 'red', size: 'M' }, // Combined quantities
          { productId: 'prod-2', quantity: 1 },
          { productId: 'prod-4', quantity: 2, color: 'green', size: 'S' },
        ],
      });

      const result = await cartService.migrateGuestCart(guestItems);

      expect(result.success).toBe(true);
      expect(result.mergedItems).toHaveLength(3);
      expect(result.mergedItems[0].quantity).toBe(3); // 2 + 1 = 3
    });

    it('should handle empty guest cart', async () => {
      const userItems = [{ productId: 'prod-1', quantity: 1 }];
      mockHttpClient.get.mockResolvedValue({ cart: userItems });

      const result = await cartService.migrateGuestCart([]);

      expect(result.success).toBe(true);
      expect(result.mergedItems).toEqual(userItems);
      expect(mockHttpClient.put).not.toHaveBeenCalled(); // No sync needed
    });

    it('should handle empty user cart', async () => {
      mockHttpClient.get.mockResolvedValue({ cart: [] });
      mockHttpClient.put.mockResolvedValue({ cart: guestItems });

      const result = await cartService.migrateGuestCart(guestItems);

      expect(result.success).toBe(true);
      expect(result.mergedItems).toEqual(guestItems);
    });

    it('should handle fetch error and assume empty cart', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Fetch failed'));
      mockHttpClient.put.mockResolvedValue({ cart: guestItems });

      const result = await cartService.migrateGuestCart(guestItems);

      expect(result.success).toBe(true);
      expect(result.mergedItems).toEqual(guestItems);
    });

    it('should require authentication', async () => {
      cartService.setAuthToken(null);

      const result = await cartService.migrateGuestCart(guestItems);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication token required');
      expect(result.mergedItems).toEqual(guestItems); // Fallback to guest items
    });

    it('should handle sync failure after merge', async () => {
      mockHttpClient.get.mockResolvedValue({ cart: [] });
      mockHttpClient.put.mockRejectedValue(new Error('Sync failed'));

      const result = await cartService.migrateGuestCart(guestItems);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.mergedItems).toEqual(guestItems); // Fallback to guest items
    });

    it('should correctly merge items with same product but different variants', async () => {
      const userItems: CartItem[] = [
        { productId: 'prod-1', quantity: 1, color: 'red', size: 'M' },
        { productId: 'prod-1', quantity: 2, color: 'blue', size: 'L' },
      ];

      const guestItemsWithVariants: CartItem[] = [
        { productId: 'prod-1', quantity: 1, color: 'red', size: 'M' }, // Same variant
        { productId: 'prod-1', quantity: 1, color: 'green', size: 'S' }, // Different variant
      ];

      mockHttpClient.get.mockResolvedValue({ cart: userItems });
      mockHttpClient.put.mockResolvedValue({
        cart: [
          { productId: 'prod-1', quantity: 2, color: 'red', size: 'M' }, // Combined
          { productId: 'prod-1', quantity: 2, color: 'blue', size: 'L' }, // Unchanged
          { productId: 'prod-1', quantity: 1, color: 'green', size: 'S' }, // New
        ],
      });

      const result = await cartService.migrateGuestCart(guestItemsWithVariants);

      expect(result.success).toBe(true);
      expect(result.mergedItems).toHaveLength(3);
    });
  });

  describe('clearCart', () => {
    it('should clear cart by syncing empty array', async () => {
      mockHttpClient.put.mockResolvedValue({ cart: [] });

      const result = await cartService.clearCart();

      expect(result.success).toBe(true);
      expect(result.items).toEqual([]);
      expect(mockHttpClient.put).toHaveBeenCalledWith('/user-profile/me', {
        cart: [],
      });
    });
  });

  describe('addToCart', () => {
    it('should add new item to empty cart', async () => {
      mockHttpClient.get.mockResolvedValue({ cart: [] });
      mockHttpClient.put.mockResolvedValue({ cart: [mockCartItem] });

      const result = await cartService.addToCart(mockCartItem);

      expect(result.success).toBe(true);
      expect(result.items).toEqual([mockCartItem]);
    });

    it('should update quantity for existing item', async () => {
      const existingItems = [{ productId: 'prod-1', quantity: 2, color: 'red', size: 'M' }];
      const newItem = { productId: 'prod-1', quantity: 3, color: 'red', size: 'M' };

      mockHttpClient.get.mockResolvedValue({ cart: existingItems });
      mockHttpClient.put.mockResolvedValue({
        cart: [{ productId: 'prod-1', quantity: 5, color: 'red', size: 'M' }],
      });

      const result = await cartService.addToCart(newItem);

      expect(result.success).toBe(true);
      expect(result.items[0].quantity).toBe(5); // 2 + 3 = 5
    });

    it('should handle fetch error gracefully', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Fetch failed'));
      mockHttpClient.put.mockResolvedValue({ cart: [mockCartItem] });

      const result = await cartService.addToCart(mockCartItem);

      expect(result.success).toBe(true);
      expect(result.items).toEqual([mockCartItem]);
    });

    it('should work for guest users', async () => {
      cartService.setAuthToken(null);

      const result = await cartService.addToCart(mockCartItem);

      expect(result.success).toBe(true);
      expect(result.items).toEqual([mockCartItem]);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      mockHttpClient.get.mockResolvedValue({ cart: mockCartItems });
      mockHttpClient.put.mockResolvedValue({
        cart: mockCartItems.filter((item) => item.productId !== 'prod-1'),
      });

      const result = await cartService.removeFromCart('prod-1', 'red', 'M');

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(2);
      expect(result.items.find((item) => item.productId === 'prod-1')).toBeUndefined();
    });

    it('should match all variant properties when removing', async () => {
      const items: CartItem[] = [
        { productId: 'prod-1', quantity: 1, color: 'red', size: 'M' },
        { productId: 'prod-1', quantity: 2, color: 'blue', size: 'M' },
        { productId: 'prod-1', quantity: 3, color: 'red', size: 'L' },
      ];

      mockHttpClient.get.mockResolvedValue({ cart: items });
      mockHttpClient.put.mockResolvedValue({
        cart: [
          { productId: 'prod-1', quantity: 2, color: 'blue', size: 'M' },
          { productId: 'prod-1', quantity: 3, color: 'red', size: 'L' },
        ],
      });

      const result = await cartService.removeFromCart('prod-1', 'red', 'M');

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(2);
      expect(
        result.items.find(
          (item) => item.productId === 'prod-1' && item.color === 'red' && item.size === 'M'
        )
      ).toBeUndefined();
    });
  });

  describe('updateCartItemQuantity', () => {
    it('should update item quantity', async () => {
      mockHttpClient.get.mockResolvedValue({ cart: mockCartItems });
      mockHttpClient.put.mockResolvedValue({
        cart: mockCartItems.map((item) =>
          item.productId === 'prod-1' ? { ...item, quantity: 5 } : item
        ),
      });

      const result = await cartService.updateCartItemQuantity('prod-1', 5, 'red', 'M');

      expect(result.success).toBe(true);
      const updatedItem = result.items.find((item) => item.productId === 'prod-1');
      expect(updatedItem?.quantity).toBe(5);
    });

    it('should remove item when quantity is 0', async () => {
      mockHttpClient.get.mockResolvedValue({ cart: mockCartItems });
      mockHttpClient.put.mockResolvedValue({
        cart: mockCartItems.filter((item) => item.productId !== 'prod-1'),
      });

      const result = await cartService.updateCartItemQuantity('prod-1', 0, 'red', 'M');

      expect(result.success).toBe(true);
      expect(result.items.find((item) => item.productId === 'prod-1')).toBeUndefined();
    });

    it('should remove item when quantity is negative', async () => {
      mockHttpClient.get.mockResolvedValue({ cart: mockCartItems });
      mockHttpClient.put.mockResolvedValue({
        cart: mockCartItems.filter((item) => item.productId !== 'prod-1'),
      });

      const result = await cartService.updateCartItemQuantity('prod-1', -1, 'red', 'M');

      expect(result.success).toBe(true);
      expect(result.items.find((item) => item.productId === 'prod-1')).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'));

      const result = await cartService.updateCartItemQuantity('prod-1', 5, 'red', 'M');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('calculateCartValue', () => {
    it('should calculate correct totals for empty cart', () => {
      const result = cartService.calculateCartValue([], {});

      expect(result).toEqual({
        itemCount: 0,
        subtotal: 0,
        totalItems: 0,
      });
    });

    it('should calculate correct totals for single item', () => {
      const items = [{ productId: '1', quantity: 2, color: 'red' }];
      const prices = { '1': 99.99 };

      const result = cartService.calculateCartValue(items, prices);

      expect(result).toEqual({
        itemCount: 1,
        subtotal: 199.98,
        totalItems: 2,
      });
    });

    it('should calculate correct totals for multiple items', () => {
      const items = [
        { productId: '1', quantity: 2, color: 'red' },
        { productId: '2', quantity: 1, color: 'blue' },
        { productId: '3', quantity: 3 },
      ];
      const prices = {
        '1': 99.99,
        '2': 49.5,
        '3': 25.0,
      };

      const result = cartService.calculateCartValue(items, prices);

      expect(result).toEqual({
        itemCount: 3,
        subtotal: 324.48, // (99.99*2) + (49.50*1) + (25.00*3)
        totalItems: 6,
      });
    });

    it('should handle missing prices gracefully', () => {
      const items = [
        { productId: '1', quantity: 2 },
        { productId: '2', quantity: 1 }, // No price for this product
      ];
      const prices = { '1': 99.99 }; // Missing price for product 2

      const result = cartService.calculateCartValue(items, prices);

      expect(result).toEqual({
        itemCount: 2,
        subtotal: 199.98, // Only counts product 1
        totalItems: 3,
      });
    });

    it('should handle decimal prices correctly', () => {
      const items = [{ productId: '1', quantity: 3 }];
      const prices = { '1': 33.33 };

      const result = cartService.calculateCartValue(items, prices);

      expect(result.subtotal).toBeCloseTo(99.99, 2);
    });
  });

  describe('validateCartItem', () => {
    it('should return no errors for valid item', () => {
      const item = { productId: '1', quantity: 5, color: 'red' };

      const errors = cartService.validateCartItem(item);

      expect(errors).toEqual([]);
    });

    it('should validate missing product ID', () => {
      const item = { productId: '', quantity: 1 };

      const errors = cartService.validateCartItem(item);

      expect(errors).toContain('Product ID is required');
    });

    it('should validate invalid quantity', () => {
      const item = { productId: '1', quantity: 0 };

      const errors = cartService.validateCartItem(item);

      expect(errors).toContain('Valid quantity is required');
    });

    it('should validate negative quantity', () => {
      const item = { productId: '1', quantity: -5 };

      const errors = cartService.validateCartItem(item);

      expect(errors).toContain('Valid quantity is required');
    });

    it('should validate quantity exceeding maximum', () => {
      const item = { productId: '1', quantity: 100 };

      const errors = cartService.validateCartItem(item);

      expect(errors).toContain('Quantity cannot exceed 99');
    });

    it('should return multiple validation errors', () => {
      const item = { productId: '', quantity: 100 };

      const errors = cartService.validateCartItem(item);

      expect(errors).toHaveLength(2);
      expect(errors).toContain('Product ID is required');
      expect(errors).toContain('Quantity cannot exceed 99');
    });
  });

  describe('getCartItemKey', () => {
    it('should generate unique key for item with all properties', () => {
      const item = { productId: '123', quantity: 1, color: 'red', size: 'M' };

      const key = cartService.getCartItemKey(item);

      expect(key).toBe('123-red-M');
    });

    it('should generate unique key for item without color', () => {
      const item = { productId: '123', quantity: 1, size: 'M' };

      const key = cartService.getCartItemKey(item);

      expect(key).toBe('123--M');
    });

    it('should generate unique key for item without size', () => {
      const item = { productId: '123', quantity: 1, color: 'red' };

      const key = cartService.getCartItemKey(item);

      expect(key).toBe('123-red-');
    });

    it('should generate unique key for item with only productId', () => {
      const item = { productId: '123', quantity: 1 };

      const key = cartService.getCartItemKey(item);

      expect(key).toBe('123--');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Network timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      mockHttpClient.get.mockRejectedValue(timeoutError);

      await expect(cartService.fetchUserCart()).rejects.toThrow();
    });

    it('should handle malformed server responses', async () => {
      mockHttpClient.get.mockResolvedValue('invalid response');

      const result = await cartService.fetchUserCart();

      expect(result).toEqual([]);
    });

    it('should handle concurrent cart updates', async () => {
      const item1 = { productId: 'prod-1', quantity: 1 };
      const item2 = { productId: 'prod-2', quantity: 2 };

      mockHttpClient.get
        .mockResolvedValueOnce({ cart: [] })
        .mockResolvedValueOnce({ cart: [item1] });

      mockHttpClient.put
        .mockResolvedValueOnce({ cart: [item1] })
        .mockResolvedValueOnce({ cart: [item1, item2] });

      const [result1, result2] = await Promise.all([
        cartService.addToCart(item1),
        cartService.addToCart(item2),
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });
});
