/**
 * Custom Jest Matchers for Tifossi App Testing
 *
 * This file provides custom Jest matchers for common assertions
 * specific to the Tifossi app domain logic.
 *
 * Following TESTING_PRINCIPLES.md:
 * - Test behavior, not implementation
 * - Use meaningful assertions
 * - Make tests readable and maintainable
 */

import { Product, ProductCardData } from '../../_types/product';
import { User } from '../../_types/auth';
import { CartItem } from '../../_stores/cartStore';
import { Address } from '../../_services/address/addressService';

// Extend Jest matchers interface
declare global {
  namespace jest {
    interface Matchers<R> {
      // Price and currency matchers
      toBeValidPrice(): R;
      toBeFormattedAsUruguayanPrice(): R;
      toHaveDiscountPercentage(percentage: number): R;

      // Product matchers
      toBeValidProduct(): R;
      toHaveProductStatus(status: string): R;
      toHaveAvailableColors(): R;
      toHaveAvailableSizes(): R;
      toBeInStock(): R;
      toBeOutOfStock(): R;

      // Cart matchers
      toBeValidCartItem(): R;
      toHaveCartQuantity(quantity: number): R;
      toBeInCart(cartItems: CartItem[]): R;

      // User matchers
      toBeValidUser(): R;
      toBeVerifiedUser(): R;
      toBeUnverifiedUser(): R;
      toHaveProvider(provider: 'email' | 'google' | 'apple'): R;

      // Address matchers
      toBeValidAddress(): R;
      toBeDefaultAddress(): R;
      toBeUruguayanAddress(): R;

      // Authentication state matchers
      toBeLoggedIn(): R;
      toBeLoggedOut(): R;
      toHaveAuthError(): R;
      toBeAuthLoading(): R;

      // Cart state matchers
      toBeEmptyCart(): R;
      toHaveCartItems(count: number): R;
      toHaveCartTotal(total: number): R;

      // UI state matchers
      toBeLoading(): R;
      toHaveError(message?: string): R;
      toBeSuccessState(): R;
    }
  }
}

/**
 * Price and Currency Matchers
 */

const toBeValidPrice = function (received: any) {
  const pass = typeof received === 'number' && received >= 0 && Number.isFinite(received);

  if (pass) {
    return {
      message: () => `expected ${received} not to be a valid price`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected ${received} to be a valid price (positive number)`,
      pass: false,
    };
  }
};

const toBeFormattedAsUruguayanPrice = function (received: string) {
  // Uruguayan price format: "$ 1.234" or "$1234"
  const uruguayanPriceRegex = /^\$\s?[\d,.]+(\.00)?$/;
  const pass = typeof received === 'string' && uruguayanPriceRegex.test(received);

  if (pass) {
    return {
      message: () => `expected "${received}" not to be formatted as Uruguayan price`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected "${received}" to be formatted as Uruguayan price (e.g., "$ 1.234")`,
      pass: false,
    };
  }
};

const toHaveDiscountPercentage = function (
  received: Product | ProductCardData,
  expectedPercentage: number
) {
  const { price, discountedPrice } = received;

  if (!discountedPrice) {
    return {
      message: () => `expected product to have a discount, but discountedPrice is not set`,
      pass: false,
    };
  }

  const actualPercentage = Math.round(((price - discountedPrice) / price) * 100);
  const pass = actualPercentage === expectedPercentage;

  if (pass) {
    return {
      message: () => `expected product not to have ${expectedPercentage}% discount`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `expected product to have ${expectedPercentage}% discount, but got ${actualPercentage}%`,
      pass: false,
    };
  }
};

/**
 * Product Matchers
 */

const toBeValidProduct = function (received: any) {
  const errors: string[] = [];

  if (typeof received !== 'object' || received === null) {
    errors.push('not an object');
  } else {
    if (!received.id || typeof received.id !== 'string') {
      errors.push('missing or invalid id');
    }
    if (!received.title || typeof received.title !== 'string') {
      errors.push('missing or invalid title');
    }
    if (typeof received.price !== 'number' || received.price < 0) {
      errors.push('missing or invalid price');
    }
    if (!received.frontImage) {
      errors.push('missing frontImage');
    }
    if (!Array.isArray(received.statuses)) {
      errors.push('missing or invalid statuses array');
    }
    if (!Array.isArray(received.colors)) {
      errors.push('missing or invalid colors array');
    }
  }

  const pass = errors.length === 0;

  if (pass) {
    return {
      message: () => `expected ${JSON.stringify(received)} not to be a valid product`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected product to be valid, but found errors: ${errors.join(', ')}`,
      pass: false,
    };
  }
};

const toHaveProductStatus = function (received: Product, expectedStatus: string) {
  const hasStatus = received.statuses && received.statuses.includes(expectedStatus as any);

  if (hasStatus) {
    return {
      message: () => `expected product not to have status "${expectedStatus}"`,
      pass: true,
    };
  } else {
    const actualStatuses = received.statuses ? received.statuses.join(', ') : 'none';
    return {
      message: () =>
        `expected product to have status "${expectedStatus}", but has: ${actualStatuses}`,
      pass: false,
    };
  }
};

const toHaveAvailableColors = function (received: Product) {
  const hasAvailableColors = received.colors && received.colors.some((color) => color.quantity > 0);

  if (hasAvailableColors) {
    return {
      message: () => `expected product not to have available colors`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected product to have at least one color with quantity > 0`,
      pass: false,
    };
  }
};

const toHaveAvailableSizes = function (received: Product) {
  const hasAvailableSizes = received.sizes && received.sizes.some((size) => size.available);

  if (hasAvailableSizes) {
    return {
      message: () => `expected product not to have available sizes`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected product to have at least one available size`,
      pass: false,
    };
  }
};

const toBeInStock = function (received: Product) {
  const inStock = received.colors && received.colors.some((color) => color.quantity > 0);

  if (inStock) {
    return {
      message: () => `expected product not to be in stock`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected product to be in stock (have colors with quantity > 0)`,
      pass: false,
    };
  }
};

const toBeOutOfStock = function (received: Product) {
  const outOfStock = !received.colors || received.colors.every((color) => color.quantity === 0);

  if (outOfStock) {
    return {
      message: () => `expected product not to be out of stock`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected product to be out of stock (all colors have quantity = 0)`,
      pass: false,
    };
  }
};

/**
 * Cart Matchers
 */

const toBeValidCartItem = function (received: any) {
  const errors: string[] = [];

  if (typeof received !== 'object' || received === null) {
    errors.push('not an object');
  } else {
    if (!received.productId || typeof received.productId !== 'string') {
      errors.push('missing or invalid productId');
    }
    if (typeof received.quantity !== 'number' || received.quantity <= 0) {
      errors.push('missing or invalid quantity');
    }
  }

  const pass = errors.length === 0;

  if (pass) {
    return {
      message: () => `expected ${JSON.stringify(received)} not to be a valid cart item`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected cart item to be valid, but found errors: ${errors.join(', ')}`,
      pass: false,
    };
  }
};

const toHaveCartQuantity = function (received: CartItem, expectedQuantity: number) {
  const pass = received.quantity === expectedQuantity;

  if (pass) {
    return {
      message: () => `expected cart item not to have quantity ${expectedQuantity}`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `expected cart item to have quantity ${expectedQuantity}, but got ${received.quantity}`,
      pass: false,
    };
  }
};

const toBeInCart = function (
  received: { productId: string; color?: string; size?: string },
  cartItems: CartItem[]
) {
  const inCart = cartItems.some(
    (item) =>
      item.productId === received.productId &&
      (received.color === undefined || item.color === received.color) &&
      (received.size === undefined || item.size === received.size)
  );

  if (inCart) {
    return {
      message: () => `expected product not to be in cart`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected product ${received.productId} to be in cart`,
      pass: false,
    };
  }
};

/**
 * User Matchers
 */

const toBeValidUser = function (received: any) {
  const errors: string[] = [];

  if (typeof received !== 'object' || received === null) {
    errors.push('not an object');
  } else {
    if (!received.id || typeof received.id !== 'string') {
      errors.push('missing or invalid id');
    }
    if (received.email !== null && (!received.email || typeof received.email !== 'string')) {
      errors.push('invalid email');
    }
  }

  const pass = errors.length === 0;

  if (pass) {
    return {
      message: () => `expected ${JSON.stringify(received)} not to be a valid user`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected user to be valid, but found errors: ${errors.join(', ')}`,
      pass: false,
    };
  }
};

const toBeVerifiedUser = function (received: User) {
  const pass = received.isEmailVerified === true;

  if (pass) {
    return {
      message: () => `expected user not to be verified`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected user to be verified (isEmailVerified: true)`,
      pass: false,
    };
  }
};

const toBeUnverifiedUser = function (received: User) {
  const pass = received.isEmailVerified === false;

  if (pass) {
    return {
      message: () => `expected user not to be unverified`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected user to be unverified (isEmailVerified: false)`,
      pass: false,
    };
  }
};

const toHaveProvider = function (received: User, expectedProvider: 'email' | 'google' | 'apple') {
  const actualProvider = received.metadata?.provider;
  const pass = actualProvider === expectedProvider;

  if (pass) {
    return {
      message: () => `expected user not to have provider "${expectedProvider}"`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `expected user to have provider "${expectedProvider}", but got "${actualProvider}"`,
      pass: false,
    };
  }
};

/**
 * Address Matchers
 */

const toBeValidAddress = function (received: any) {
  const errors: string[] = [];

  if (typeof received !== 'object' || received === null) {
    errors.push('not an object');
  } else {
    // Required fields for new Address interface
    const requiredFields = [
      'firstName',
      'lastName',
      'addressLine1',
      'city',
      'state',
      'country',
      'type',
    ];
    requiredFields.forEach((field) => {
      if (!received[field] || typeof received[field] !== 'string') {
        errors.push(`missing or invalid ${field}`);
      }
    });

    if (!['shipping', 'billing', 'both'].includes(received.type)) {
      errors.push('type must be "shipping", "billing", or "both"');
    }

    if (typeof received.isDefault !== 'boolean') {
      errors.push('isDefault must be boolean');
    }
  }

  const pass = errors.length === 0;

  if (pass) {
    return {
      message: () => `expected address not to be valid`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected address to be valid, but found errors: ${errors.join(', ')}`,
      pass: false,
    };
  }
};

const toBeDefaultAddress = function (received: Address) {
  const pass = received.isDefault === true;

  if (pass) {
    return {
      message: () => `expected address not to be default`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected address to be default (isDefault: true)`,
      pass: false,
    };
  }
};

const toBeUruguayanAddress = function (received: Address) {
  const pass = received.country === 'UY';

  if (pass) {
    return {
      message: () => `expected address not to be Uruguayan`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `expected address to be Uruguayan (country: "UY"), but got "${received.country}"`,
      pass: false,
    };
  }
};

/**
 * Authentication State Matchers
 */

const toBeLoggedIn = function (received: any) {
  const pass = received.isLoggedIn === true && received.user !== null;

  if (pass) {
    return {
      message: () => `expected auth state not to be logged in`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected auth state to be logged in (isLoggedIn: true and user not null)`,
      pass: false,
    };
  }
};

const toBeLoggedOut = function (received: any) {
  const pass = received.isLoggedIn === false && received.user === null;

  if (pass) {
    return {
      message: () => `expected auth state not to be logged out`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected auth state to be logged out (isLoggedIn: false and user null)`,
      pass: false,
    };
  }
};

const toHaveAuthError = function (received: any) {
  const pass = received.error !== null && typeof received.error === 'string';

  if (pass) {
    return {
      message: () => `expected auth state not to have error`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected auth state to have error, but error is: ${received.error}`,
      pass: false,
    };
  }
};

const toBeAuthLoading = function (received: any) {
  const pass = received.isLoading === true;

  if (pass) {
    return {
      message: () => `expected auth state not to be loading`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected auth state to be loading (isLoading: true)`,
      pass: false,
    };
  }
};

/**
 * Cart State Matchers
 */

const toBeEmptyCart = function (received: any) {
  const pass = Array.isArray(received.items) && received.items.length === 0;

  if (pass) {
    return {
      message: () => `expected cart not to be empty`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `expected cart to be empty, but has ${received.items?.length || 'invalid'} items`,
      pass: false,
    };
  }
};

const toHaveCartItems = function (received: any, expectedCount: number) {
  const actualCount = received.items?.length || 0;
  const pass = actualCount === expectedCount;

  if (pass) {
    return {
      message: () => `expected cart not to have ${expectedCount} items`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected cart to have ${expectedCount} items, but got ${actualCount}`,
      pass: false,
    };
  }
};

const toHaveCartTotal = function (received: any, expectedTotal: number) {
  const actualTotal = received.total || 0;
  const pass = Math.abs(actualTotal - expectedTotal) < 0.01; // Allow for floating point precision

  if (pass) {
    return {
      message: () => `expected cart total not to be ${expectedTotal}`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected cart total to be ${expectedTotal}, but got ${actualTotal}`,
      pass: false,
    };
  }
};

/**
 * General UI State Matchers
 */

const toBeLoading = function (received: any) {
  const pass = received.isLoading === true;

  if (pass) {
    return {
      message: () => `expected state not to be loading`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected state to be loading (isLoading: true)`,
      pass: false,
    };
  }
};

const toHaveError = function (received: any, expectedMessage?: string) {
  const hasError = received.error !== null;

  if (!hasError) {
    return {
      message: () => `expected state to have error, but error is null`,
      pass: false,
    };
  }

  if (expectedMessage) {
    const pass = received.error === expectedMessage;
    if (pass) {
      return {
        message: () => `expected state not to have error "${expectedMessage}"`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected state to have error "${expectedMessage}", but got "${received.error}"`,
        pass: false,
      };
    }
  }

  return {
    message: () => `expected state not to have error`,
    pass: true,
  };
};

const toBeSuccessState = function (received: any) {
  const pass = received.status === 'succeeded' || received.actionStatus === 'success';

  if (pass) {
    return {
      message: () => `expected state not to be success`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `expected state to be success (status: "succeeded" or actionStatus: "success")`,
      pass: false,
    };
  }
};

/**
 * Register all custom matchers with Jest
 */
export const setupCustomMatchers = (): void => {
  expect.extend({
    // Price matchers
    toBeValidPrice,
    toBeFormattedAsUruguayanPrice,
    toHaveDiscountPercentage,

    // Product matchers
    toBeValidProduct,
    toHaveProductStatus,
    toHaveAvailableColors,
    toHaveAvailableSizes,
    toBeInStock,
    toBeOutOfStock,

    // Cart matchers
    toBeValidCartItem,
    toHaveCartQuantity,
    toBeInCart,

    // User matchers
    toBeValidUser,
    toBeVerifiedUser,
    toBeUnverifiedUser,
    toHaveProvider,

    // Address matchers
    toBeValidAddress,
    toBeDefaultAddress,
    toBeUruguayanAddress,

    // Auth state matchers
    toBeLoggedIn,
    toBeLoggedOut,
    toHaveAuthError,
    toBeAuthLoading,

    // Cart state matchers
    toBeEmptyCart,
    toHaveCartItems,
    toHaveCartTotal,

    // General UI state matchers
    toBeLoading,
    toHaveError,
    toBeSuccessState,
  });
};

// Export individual matchers for documentation and testing
export const customMatchers = {
  toBeValidPrice,
  toBeFormattedAsUruguayanPrice,
  toHaveDiscountPercentage,
  toBeValidProduct,
  toHaveProductStatus,
  toHaveAvailableColors,
  toHaveAvailableSizes,
  toBeInStock,
  toBeOutOfStock,
  toBeValidCartItem,
  toHaveCartQuantity,
  toBeInCart,
  toBeValidUser,
  toBeVerifiedUser,
  toBeUnverifiedUser,
  toHaveProvider,
  toBeValidAddress,
  toBeDefaultAddress,
  toBeUruguayanAddress,
  toBeLoggedIn,
  toBeLoggedOut,
  toHaveAuthError,
  toBeAuthLoading,
  toBeEmptyCart,
  toHaveCartItems,
  toHaveCartTotal,
  toBeLoading,
  toHaveError,
  toBeSuccessState,
};
