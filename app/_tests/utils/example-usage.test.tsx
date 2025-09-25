/**
 * Example Usage of Test Utilities
 *
 * This test file demonstrates how to use the comprehensive test utilities
 * created for the Tifossi Expo app.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { render, fireEvent, waitFor } from './render-utils';
import {
  productFactory,
  userFactory,
  cartItemFactory,
  storeUtils,
  setupAuthenticatedUserWithCart,
  setupGuestUser,
} from './index';

// Example component to test
const ExampleProductCard: React.FC<{ product: any; onAddToCart?: () => void }> = ({
  product,
  onAddToCart,
}) => {
  return (
    <View testID="product-card">
      <Text testID="product-name">{product.title}</Text>
      <Text testID="product-price">${product.price}</Text>
      {product.discountedPrice && <Text testID="discounted-price">${product.discountedPrice}</Text>}
      <TouchableOpacity testID="add-to-cart-button" onPress={onAddToCart}>
        <Text>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('Test Utilities Example Usage', () => {
  describe('Product Factory Usage', () => {
    it('should create realistic products', () => {
      // Create a single product
      const product = productFactory.create();

      // Test with custom matchers
      expect(product).toBeValidProduct();
      expect(product.price).toBeValidPrice();
      expect(product).toBeInStock();

      // Create multiple products
      const products = productFactory.createMany(3);
      expect(products).toHaveLength(3);

      // Create specific product types
      const saleProduct = productFactory.createOnSale();
      expect(saleProduct).toHaveProductStatus('sale');
      expect(saleProduct).toHaveDiscountPercentage(30);

      const outOfStockProduct = productFactory.createOutOfStock();
      expect(outOfStockProduct).toBeOutOfStock();
    });
  });

  describe('User Factory Usage', () => {
    it('should create realistic users', () => {
      // Create a verified user
      const user = userFactory.create({ isEmailVerified: true });

      expect(user).toBeValidUser();
      expect(user).toBeVerifiedUser();
      expect(user.email).toMatch(/@gmail\.com$/);

      // Create Apple user
      const appleUser = userFactory.createWithApple();
      expect(appleUser).toHaveProvider('apple');

      // Create unverified user
      const unverifiedUser = userFactory.createUnverified();
      expect(unverifiedUser).toBeUnverifiedUser();
    });
  });

  describe('Store Utils Usage', () => {
    it('should manage auth store state', () => {
      // Setup logged in user
      const user = storeUtils.auth.setupLoggedInUser();
      const authState = storeUtils.auth.getState();

      expect(authState).toBeLoggedIn();
      expect(authState.user).toEqual(user);

      // Setup logged out user
      storeUtils.auth.setupLoggedOutUser();
      const loggedOutState = storeUtils.auth.getState();

      expect(loggedOutState).toBeLoggedOut();
    });

    it('should manage cart store state', () => {
      // Setup cart with items
      const cartItems = storeUtils.cart.setupWithItems();
      const cartState = storeUtils.cart.getState();

      expect(cartState).toHaveCartItems(cartItems.length);
      expect(cartState.items).toEqual(cartItems);

      // Setup empty cart
      storeUtils.cart.setupEmpty();
      const emptyCartState = storeUtils.cart.getState();

      expect(emptyCartState).toBeEmptyCart();
    });

    it('should setup complete test scenarios', () => {
      // Setup authenticated user with cart
      const { cartItems, addresses } = setupAuthenticatedUserWithCart();

      expect(storeUtils.auth.getState()).toBeLoggedIn();
      expect(storeUtils.cart.getState()).toHaveCartItems(cartItems.length);
      expect(storeUtils.user.getState().addresses).toEqual(addresses);

      // Setup guest user
      const { cartItems: guestCartItems } = setupGuestUser();

      expect(storeUtils.auth.getState()).toBeLoggedOut();
      expect(storeUtils.cart.getState()).toHaveCartItems(guestCartItems.length);
    });
  });

  describe('Render Utils Usage', () => {
    it('should render components with all providers', () => {
      const product = productFactory.create();
      const onAddToCart = jest.fn();

      const { getByTestId, getByText } = render(
        <ExampleProductCard product={product} onAddToCart={onAddToCart} />
      );

      // Component is rendered with navigation, QueryClient, and gesture handler
      expect(getByTestId('product-card')).toBeTruthy();
      expect(getByTestId('product-name')).toHaveTextContent(product.title);
      expect(getByTestId('product-price')).toHaveTextContent(`$${product.price}`);

      // Test user interaction
      fireEvent.press(getByText('Add to Cart'));
      expect(onAddToCart).toHaveBeenCalledTimes(1);
    });

    it('should render with minimal providers', () => {
      const product = productFactory.create();

      const { getByTestId } = render(<ExampleProductCard product={product} />, {
        withNavigation: false,
        withQueryClient: false,
        withGestureHandler: false,
      });

      expect(getByTestId('product-card')).toBeTruthy();
    });
  });

  describe('Custom Matchers Usage', () => {
    it('should use product-specific matchers', () => {
      const product = productFactory.create();

      expect(product).toBeValidProduct();
      expect(product.price).toBeValidPrice();
      expect(product).toHaveAvailableColors();
      expect(product).toHaveAvailableSizes();
    });

    it('should use cart-specific matchers', () => {
      const cartItem = cartItemFactory.create();
      const cart = [cartItem];

      expect(cartItem).toBeValidCartItem();
      expect(cartItem).toHaveCartQuantity(cartItem.quantity);
      expect({ productId: cartItem.productId }).toBeInCart(cart);
    });

    it('should use auth-specific matchers', () => {
      const user = userFactory.create({ isEmailVerified: true });

      expect(user).toBeValidUser();
      expect(user).toBeVerifiedUser();

      // Test auth states
      storeUtils.auth.setupLoggedInUser(user);
      expect(storeUtils.auth.getState()).toBeLoggedIn();

      storeUtils.auth.setupErrorState('Login failed');
      expect(storeUtils.auth.getState()).toHaveAuthError();
    });
  });

  describe('Async Store Testing', () => {
    it('should wait for store updates', async () => {
      // Setup initial state
      storeUtils.auth.setupLoggedOutUser();

      // Simulate async login
      setTimeout(() => {
        const user = userFactory.create();
        storeUtils.auth.setupLoggedInUser(user);
      }, 100);

      // Wait for the store to update
      await storeUtils.auth.waitFor((state) => state.isLoggedIn === true, 2000);

      expect(storeUtils.auth.getState()).toBeLoggedIn();
    });
  });
});

// Example integration test using all utilities together
describe('Integration Test Example', () => {
  it('should test complete product to cart flow', async () => {
    // Setup test data
    const product = productFactory.createForCart();
    const user = userFactory.create();

    // Setup authenticated user
    storeUtils.auth.setupLoggedInUser(user);
    storeUtils.cart.setupEmpty();

    // Mock add to cart action
    const onAddToCart = jest.fn(() => {
      const cartItem = cartItemFactory.create({
        productId: product.id,
        color: product.colors[0].colorName,
        quantity: 1,
      });
      storeUtils.cart.setupWithItems([cartItem]);
    });

    // Render product card
    const { getByText } = render(
      <ExampleProductCard product={product} onAddToCart={onAddToCart} />
    );

    // User adds product to cart
    fireEvent.press(getByText('Add to Cart'));

    // Wait for cart update
    await waitFor(() => {
      expect(storeUtils.cart.getState()).toHaveCartItems(1);
    });

    // Verify product is in cart
    const cartState = storeUtils.cart.getState();
    expect({ productId: product.id }).toBeInCart(cartState.items);
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });
});
