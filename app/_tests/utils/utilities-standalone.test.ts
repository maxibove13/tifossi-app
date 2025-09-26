/**
 * Standalone Test of Test Utilities
 *
 * This test verifies that the test utilities work correctly
 * without depending on stores that might have native module dependencies.
 */

import { productFactory, userFactory, cartItemFactory } from './test-data';
import { setupCustomMatchers } from './custom-matchers';
import { ProductStatus } from '../../_types/product-status';

// Setup custom matchers
setupCustomMatchers();

describe('Test Utilities Standalone', () => {
  describe('Product Factory', () => {
    it('should create valid products', () => {
      const product = productFactory.create();

      expect(product).toBeValidProduct();
      expect(product.price).toBeValidPrice();
      expect(product.title).toBeDefined();
      expect(product.id).toBeDefined();
      expect(product.colors).toBeDefined();
      expect(product.statuses).toBeDefined();
    });

    it('should create products with discounts', () => {
      const saleProduct = productFactory.createOnSale();

      expect(saleProduct).toBeValidProduct();
      expect(saleProduct).toHaveProductStatus('sale');
      expect(saleProduct.discountedPrice).toBeDefined();
      expect(saleProduct.discountedPrice!).toBeLessThan(saleProduct.price);
    });

    it('should create out of stock products', () => {
      const outOfStockProduct = productFactory.createOutOfStock();

      expect(outOfStockProduct).toBeValidProduct();
      expect(outOfStockProduct).toBeOutOfStock();
    });

    it('should create multiple products', () => {
      const products = productFactory.createMany(3);

      expect(products).toHaveLength(3);
      products.forEach((product) => {
        expect(product).toBeValidProduct();
      });
    });
  });

  describe('User Factory', () => {
    it('should create valid users', () => {
      const user = userFactory.create();

      expect(user).toBeValidUser();
      expect(user.id).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.email).toBeDefined();
    });

    it('should create verified users', () => {
      const verifiedUser = userFactory.create({ isEmailVerified: true });

      expect(verifiedUser).toBeValidUser();
      expect(verifiedUser).toBeVerifiedUser();
    });

    it('should create unverified users', () => {
      const unverifiedUser = userFactory.createUnverified();

      expect(unverifiedUser).toBeValidUser();
      expect(unverifiedUser).toBeUnverifiedUser();
    });

    it('should create Apple users', () => {
      const appleUser = userFactory.createWithApple();

      expect(appleUser).toBeValidUser();
      expect(appleUser).toHaveProvider('apple');
    });
  });

  describe('Cart Item Factory', () => {
    it('should create valid cart items', () => {
      const cartItem = cartItemFactory.create();

      expect(cartItem).toBeValidCartItem();
      expect(cartItem.productId).toBeDefined();
      expect(cartItem.quantity).toBeGreaterThan(0);
    });

    it('should create cart items with specific quantities', () => {
      const cartItem = cartItemFactory.create({ quantity: 5 });

      expect(cartItem).toBeValidCartItem();
      expect(cartItem).toHaveCartQuantity(5);
    });

    it('should create multiple cart items', () => {
      const cartItems = cartItemFactory.createMany(3);

      expect(cartItems).toHaveLength(3);
      cartItems.forEach((item) => {
        expect(item).toBeValidCartItem();
      });
    });
  });

  describe('Custom Matchers', () => {
    it('should validate prices', () => {
      expect(100).toBeValidPrice();
      expect(0).toBeValidPrice();
      expect(-1).not.toBeValidPrice();
      expect('100').not.toBeValidPrice();
    });

    it('should validate Uruguayan price format', () => {
      expect('$ 1.234').toBeFormattedAsUruguayanPrice();
      expect('$1234').toBeFormattedAsUruguayanPrice();
      expect('$1,234.00').toBeFormattedAsUruguayanPrice();
      expect('1234').not.toBeFormattedAsUruguayanPrice();
      expect('USD 1234').not.toBeFormattedAsUruguayanPrice();
    });

    it('should validate discount percentages', () => {
      const discountedProduct = productFactory.create({
        price: 1000,
        discountedPrice: 800,
      });

      expect(discountedProduct).toHaveDiscountPercentage(20);
      expect(discountedProduct).not.toHaveDiscountPercentage(25);
    });

    it('should validate product status', () => {
      const newProduct = productFactory.create({ statuses: [ProductStatus.NEW] });
      const saleProduct = productFactory.create({ statuses: [ProductStatus.SALE] });

      expect(newProduct).toHaveProductStatus('new');
      expect(saleProduct).toHaveProductStatus('sale');
      expect(newProduct).not.toHaveProductStatus('sale');
    });

    it('should validate cart operations', () => {
      const cartItem = cartItemFactory.create({ productId: 'product-123' });
      const cart = [cartItem];

      expect({ productId: 'product-123' }).toBeInCart(cart);
      expect({ productId: 'product-456' }).not.toBeInCart(cart);
    });

    it('should validate auth states', () => {
      const loggedInState = {
        isLoggedIn: true,
        user: userFactory.create(),
        error: null,
        isLoading: false,
      };

      const loggedOutState = {
        isLoggedIn: false,
        user: null,
        error: null,
        isLoading: false,
      };

      const errorState = {
        isLoggedIn: false,
        user: null,
        error: 'Login failed',
        isLoading: false,
      };

      const loadingState = {
        isLoggedIn: false,
        user: null,
        error: null,
        isLoading: true,
      };

      expect(loggedInState).toBeLoggedIn();
      expect(loggedOutState).toBeLoggedOut();
      expect(errorState).toHaveAuthError();
      expect(loadingState).toBeAuthLoading();
    });

    it('should validate cart states', () => {
      const emptyCart = { items: [] };
      const cartWithItems = { items: cartItemFactory.createMany(3) };

      expect(emptyCart).toBeEmptyCart();
      expect(cartWithItems).toHaveCartItems(3);
      expect(cartWithItems).not.toBeEmptyCart();
    });

    it('should validate loading states', () => {
      const loadingState = { isLoading: true };
      const idleState = { isLoading: false };
      const errorState = { error: 'Something went wrong' };
      const noErrorState = { error: null };

      expect(loadingState).toBeLoading();
      expect(idleState).not.toBeLoading();
      expect(errorState).toHaveError();
      expect(noErrorState).not.toHaveError();
    });
  });

  describe('Data Realism', () => {
    it('should create realistic product names', () => {
      const products = productFactory.createMany(10);

      // Check that product names don't contain test-related words
      products.forEach((product) => {
        expect(product.title).not.toMatch(/test|foo|bar|mock/i);
        expect(product.title.length).toBeGreaterThan(5);
      });
    });

    it('should create realistic user data', () => {
      const users = userFactory.createMany(10);

      users.forEach((user) => {
        // Check realistic names and emails
        expect(user.name).toBeDefined();
        expect(user.name).not.toMatch(/test|foo|bar|mock/i);
        expect(user.email).toMatch(/@/);
        expect(user.email).toMatch(/gmail\.com$/);

        // Check phone format for Uruguay
        if (user.phone) {
          expect(user.phone).toMatch(/^\+598 9\d{7}$/);
        }
      });
    });

    it('should create realistic prices', () => {
      const products = productFactory.createMany(20);

      products.forEach((product) => {
        // Prices should be reasonable for clothing in Uruguay
        expect(product.price).toBeGreaterThanOrEqual(1000);
        expect(product.price).toBeLessThanOrEqual(20000);
        // Should be rounded to hundreds
        expect(product.price % 100).toBe(0);
      });
    });

    it('should create realistic color and size combinations', () => {
      const product = productFactory.create();

      product.colors.forEach((color) => {
        expect(color.colorName).not.toMatch(/test|foo|bar|mock/i);
        expect(['Negro', 'Blanco', 'Azul Marino', 'Gris', 'Rojo', 'Verde', 'Rosa']).toContain(
          color.colorName
        );
        expect(color.quantity).toBeGreaterThanOrEqual(0);
        expect(color.quantity).toBeLessThanOrEqual(50);
      });

      if (product.sizes) {
        product.sizes.forEach((size) => {
          expect(['XS', 'S', 'M', 'L', 'XL', 'XXL']).toContain(size.value);
          expect(typeof size.available).toBe('boolean');
        });
      }
    });
  });
});
