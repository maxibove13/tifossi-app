/**
 * Cart Service
 * Handles cart operations with Strapi backend
 */

import httpClient from '../api/httpClient';
import { handleApiError } from '../api/errorHandler';
import { endpoints } from '../../_config/endpoints';

export interface CartItem {
  productId: string;
  quantity: number;
  color?: string;
  size?: string;
}

export interface CartSyncResult {
  success: boolean;
  items: CartItem[];
  error?: string;
}

export interface GuestCartMigrationResult {
  success: boolean;
  mergedItems: CartItem[];
  error?: string;
}

class CartService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = endpoints.baseUrl;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  /**
   * Fetch user's cart from server
   */
  async fetchUserCart(): Promise<CartItem[]> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication token required');
      }

      const response = await httpClient.get('/users/me/cart', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      // Handle different response formats
      const cartData = response.cart || response.data?.cart || [];

      return cartData;
    } catch (error) {
      const apiError = handleApiError(error, 'fetchUserCart');
      throw new Error(apiError.message);
    }
  }

  /**
   * Sync cart items with server
   */
  async syncCart(items: CartItem[]): Promise<CartSyncResult> {
    try {
      if (!this.authToken) {
        // For guests, we can't sync to server but return success for local storage
        return { success: true, items };
      }

      const response = await httpClient.put(
        '/users/me/cart',
        { cart: items },
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        }
      );

      return {
        success: true,
        items: response.cart || response.data?.cart || items,
      };
    } catch (error) {
      const apiError = handleApiError(error, 'syncCart');

      return {
        success: false,
        items,
        error: apiError.message,
      };
    }
  }

  /**
   * Merge guest cart with user cart on login
   */
  async migrateGuestCart(guestCartItems: CartItem[]): Promise<GuestCartMigrationResult> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication token required for cart migration');
      }

      if (guestCartItems.length === 0) {
        // No guest cart to migrate, just fetch user cart
        const userCart = await this.fetchUserCart();
        return { success: true, mergedItems: userCart };
      }

      // Fetch existing user cart
      let userCartItems: CartItem[] = [];
      try {
        userCartItems = await this.fetchUserCart();
      } catch {
        // If fetching fails, assume empty cart
        userCartItems = [];
      }

      // Merge carts - combine quantities for same items
      const mergedItems = this.mergeCartItems(userCartItems, guestCartItems);

      // Sync merged cart to server
      const syncResult = await this.syncCart(mergedItems);

      if (!syncResult.success) {
        throw new Error(syncResult.error || 'Failed to sync merged cart');
      }

      return {
        success: true,
        mergedItems: syncResult.items,
      };
    } catch (error) {
      const apiError = handleApiError(error, 'migrateGuestCart');

      return {
        success: false,
        mergedItems: guestCartItems, // Fallback to guest cart
        error: apiError.message,
      };
    }
  }

  /**
   * Clear user's cart
   */
  async clearCart(): Promise<CartSyncResult> {
    return this.syncCart([]);
  }

  /**
   * Add item to cart
   */
  async addToCart(item: CartItem): Promise<CartSyncResult> {
    try {
      // Fetch current cart
      let currentItems: CartItem[] = [];

      if (this.authToken) {
        try {
          currentItems = await this.fetchUserCart();
        } catch (error) {
          // For adding items, we can start with empty cart if fetch fails
          // This allows offline-first behavior
          console.warn('Could not fetch current cart, starting with empty cart:', error);
          currentItems = [];
        }
      }

      // Add or update item
      const updatedItems = this.addOrUpdateCartItem(currentItems, item);

      // Sync updated cart
      return this.syncCart(updatedItems);
    } catch (error) {
      const apiError = handleApiError(error, 'addToCart');
      return {
        success: false,
        items: [],
        error: apiError.message,
      };
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(productId: string, color?: string, size?: string): Promise<CartSyncResult> {
    try {
      // Fetch current cart
      let currentItems: CartItem[] = [];

      if (this.authToken) {
        try {
          currentItems = await this.fetchUserCart();
        } catch (error) {
          // If we can't fetch the cart, we can't safely remove items
          // This is a critical error that should bubble up
          const apiError = handleApiError(error, 'removeFromCart');
          return {
            success: false,
            items: [],
            error: apiError.message,
          };
        }
      }

      // Remove item
      const updatedItems = currentItems.filter(
        (item) => !(item.productId === productId && item.color === color && item.size === size)
      );

      // Sync updated cart
      return this.syncCart(updatedItems);
    } catch (error) {
      const apiError = handleApiError(error, 'removeFromCart');
      return {
        success: false,
        items: [],
        error: apiError.message,
      };
    }
  }

  /**
   * Update item quantity in cart
   */
  async updateCartItemQuantity(
    productId: string,
    quantity: number,
    color?: string,
    size?: string
  ): Promise<CartSyncResult> {
    try {
      if (quantity <= 0) {
        return this.removeFromCart(productId, color, size);
      }

      // Fetch current cart
      let currentItems: CartItem[] = [];

      if (this.authToken) {
        try {
          currentItems = await this.fetchUserCart();
        } catch (error) {
          // If we can't fetch the cart, we can't safely update it
          // This is a critical error that should bubble up
          const apiError = handleApiError(error, 'updateCartItemQuantity');
          return {
            success: false,
            items: [],
            error: apiError.message,
          };
        }
      }

      // Update item quantity
      const updatedItems = currentItems.map((item) => {
        if (item.productId === productId && item.color === color && item.size === size) {
          return { ...item, quantity };
        }
        return item;
      });

      // Sync updated cart
      return this.syncCart(updatedItems);
    } catch (error) {
      const apiError = handleApiError(error, 'updateCartItemQuantity');
      return {
        success: false,
        items: [],
        error: apiError.message,
      };
    }
  }

  // --- Private Helper Methods ---

  /**
   * Merge two cart arrays, combining quantities for identical items
   */
  private mergeCartItems(userItems: CartItem[], guestItems: CartItem[]): CartItem[] {
    const merged = [...userItems];

    for (const guestItem of guestItems) {
      const existingIndex = merged.findIndex(
        (item) =>
          item.productId === guestItem.productId &&
          item.color === guestItem.color &&
          item.size === guestItem.size
      );

      if (existingIndex > -1) {
        // Item exists, combine quantities
        merged[existingIndex] = {
          ...merged[existingIndex],
          quantity: merged[existingIndex].quantity + guestItem.quantity,
        };
      } else {
        // New item, add to cart
        merged.push(guestItem);
      }
    }

    return merged;
  }

  /**
   * Add or update item in cart array
   */
  private addOrUpdateCartItem(items: CartItem[], newItem: CartItem): CartItem[] {
    const existingIndex = items.findIndex(
      (item) =>
        item.productId === newItem.productId &&
        item.color === newItem.color &&
        item.size === newItem.size
    );

    if (existingIndex > -1) {
      // Item exists, update quantity
      const updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + newItem.quantity,
      };
      return updated;
    } else {
      // New item, add to cart
      return [...items, newItem];
    }
  }

  /**
   * Validate cart item data
   */
  validateCartItem(item: CartItem): string[] {
    const errors: string[] = [];

    if (!item.productId) {
      errors.push('Product ID is required');
    }

    if (!item.quantity || item.quantity <= 0) {
      errors.push('Valid quantity is required');
    }

    if (item.quantity > 99) {
      errors.push('Quantity cannot exceed 99');
    }

    return errors;
  }

  /**
   * Calculate cart totals
   */
  calculateCartValue(
    items: CartItem[],
    productPrices: Record<string, number>
  ): {
    itemCount: number;
    subtotal: number;
    totalItems: number;
  } {
    let itemCount = 0;
    let subtotal = 0;
    let totalItems = 0;

    for (const item of items) {
      const price = productPrices[item.productId] || 0;
      itemCount += 1;
      totalItems += item.quantity;
      subtotal += price * item.quantity;
    }

    return { itemCount, subtotal, totalItems };
  }

  /**
   * Get cart item key for unique identification
   */
  getCartItemKey(item: CartItem): string {
    return `${item.productId}-${item.color || ''}-${item.size || ''}`;
  }
}

// Export singleton instance
export const cartService = new CartService();
export default cartService;
