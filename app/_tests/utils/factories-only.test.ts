/**
 * Test Data Factories Test
 *
 * This test verifies that the test data factories work correctly
 * without depending on any stores or Firebase modules.
 */

import { productFactory, userFactory, cartItemFactory, addressFactory } from './test-data';
import { setupCustomMatchers } from './custom-matchers';

// Setup custom matchers
setupCustomMatchers();

describe('Test Data Factories', () => {
  describe('Product Factory', () => {
    test('creates valid products', () => {
      const product = productFactory.create();

      expect(product).toBeValidProduct();
      expect(product.price).toBeValidPrice();
      expect(product.title).toBeTruthy();
      expect(product.id).toBeTruthy();
      expect(product.colors).toBeTruthy();
      expect(product.statuses).toBeTruthy();
      expect(Array.isArray(product.colors)).toBe(true);
      expect(Array.isArray(product.statuses)).toBe(true);
    });

    test('creates products with discounts', () => {
      const saleProduct = productFactory.createOnSale();

      expect(saleProduct).toBeValidProduct();
      expect(saleProduct).toHaveProductStatus('sale');
      expect(saleProduct.discountedPrice).toBeDefined();
      expect(saleProduct.discountedPrice!).toBeLessThan(saleProduct.price);
    });

    test('creates out of stock products', () => {
      const outOfStockProduct = productFactory.createOutOfStock();

      expect(outOfStockProduct).toBeValidProduct();
      expect(outOfStockProduct).toBeOutOfStock();
    });

    test('creates multiple products', () => {
      const products = productFactory.createMany(3);

      expect(products).toHaveLength(3);
      products.forEach((product) => {
        expect(product).toBeValidProduct();
      });
    });
  });

  describe('User Factory', () => {
    test('creates valid users', () => {
      const user = userFactory.create();

      expect(user).toBeValidUser();
      expect(user.id).toBeTruthy();
      expect(user.name).toBeTruthy();
      expect(user.email).toBeTruthy();
    });

    test('creates verified users', () => {
      const verifiedUser = userFactory.create({ isEmailVerified: true });

      expect(verifiedUser).toBeValidUser();
      expect(verifiedUser).toBeVerifiedUser();
    });

    test('creates unverified users', () => {
      const unverifiedUser = userFactory.createUnverified();

      expect(unverifiedUser).toBeValidUser();
      expect(unverifiedUser).toBeUnverifiedUser();
    });

    test('creates Apple users', () => {
      const appleUser = userFactory.createWithApple();

      expect(appleUser).toBeValidUser();
      expect(appleUser).toHaveProvider('apple');
    });
  });

  describe('Cart Item Factory', () => {
    test('creates valid cart items', () => {
      const cartItem = cartItemFactory.create();

      expect(cartItem).toBeValidCartItem();
      expect(cartItem.productId).toBeTruthy();
      expect(cartItem.quantity).toBeGreaterThan(0);
    });

    test('creates cart items with specific quantities', () => {
      const cartItem = cartItemFactory.create({ quantity: 5 });

      expect(cartItem).toBeValidCartItem();
      expect(cartItem).toHaveCartQuantity(5);
    });
  });

  describe('Address Factory', () => {
    test('creates valid addresses', () => {
      const address = addressFactory.create();

      expect(address).toBeValidAddress();
      expect(address).toBeUruguayanAddress();
    });

    test('creates default addresses', () => {
      const address = addressFactory.create({ isDefault: true });

      expect(address).toBeValidAddress();
      expect(address).toBeDefaultAddress();
    });
  });

  describe('Custom Matchers', () => {
    test('validates prices', () => {
      expect(100).toBeValidPrice();
      expect(0).toBeValidPrice();
      expect(-1).not.toBeValidPrice();
    });

    test('validates discount percentages', () => {
      const discountedProduct = productFactory.create({
        price: 1000,
        discountedPrice: 800,
      });

      expect(discountedProduct).toHaveDiscountPercentage(20);
    });
  });

  describe('Data Realism', () => {
    test('creates realistic product names', () => {
      const products = productFactory.createMany(5);

      products.forEach((product) => {
        expect(product.title).not.toMatch(/test|foo|bar|mock/i);
        expect(product.title.length).toBeGreaterThan(5);
      });
    });

    test('creates realistic user data', () => {
      const users = userFactory.createMany(5);

      users.forEach((user) => {
        expect(user.name).toBeTruthy();
        expect(user.name).not.toMatch(/test|foo|bar|mock/i);
        expect(user.email).toMatch(/@/);
      });
    });
  });
});

// Test just the exports to make sure everything is accessible
describe('Test Utilities Exports', () => {
  test('exports all required functions', () => {
    expect(typeof productFactory.create).toBe('function');
    expect(typeof productFactory.createMany).toBe('function');
    expect(typeof productFactory.createOnSale).toBe('function');
    expect(typeof productFactory.createOutOfStock).toBe('function');

    expect(typeof userFactory.create).toBe('function');
    expect(typeof userFactory.createMany).toBe('function');
    expect(typeof userFactory.createUnverified).toBe('function');
    expect(typeof userFactory.createWithApple).toBe('function');

    expect(typeof cartItemFactory.create).toBe('function');
    expect(typeof cartItemFactory.createMany).toBe('function');

    expect(typeof addressFactory.create).toBe('function');
    expect(typeof addressFactory.createMany).toBe('function');
  });
});
