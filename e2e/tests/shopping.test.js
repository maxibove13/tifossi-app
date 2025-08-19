const { device, expect, element, by, waitFor } = require('detox');

describe('Shopping Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await testUtils.waitForApp();
  });

  describe('Product Discovery', () => {
    it('should display product catalog on home screen', async () => {
      // Wait for home screen to load
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Check that products are displayed
      await expect(element(by.id('product-grid'))).toBeVisible();
      await expect(element(by.id('product-card-0'))).toBeVisible();
    });

    it('should allow browsing products by category', async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Tap on a category
      await element(by.id('category-electronics')).tap();

      // Wait for category screen
      await waitFor(element(by.id('category-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify category products are shown
      await expect(element(by.text('Electronics'))).toBeVisible();
      await expect(element(by.id('category-product-list'))).toBeVisible();
    });

    it('should allow searching for products', async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Tap search bar
      await element(by.id('search-bar')).tap();

      // Enter search query
      await testUtils.searchProducts('smartphone');

      // Verify search results
      await expect(element(by.id('search-results'))).toBeVisible();
      await expect(element(by.text('smartphone'))).toBeVisible();
    });

    it('should display product details when tapped', async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Tap on first product
      await element(by.id('product-card-0')).tap();

      // Wait for product detail screen
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify product details are shown
      await expect(element(by.id('product-name'))).toBeVisible();
      await expect(element(by.id('product-price'))).toBeVisible();
      await expect(element(by.id('product-description'))).toBeVisible();
      await expect(element(by.id('add-to-cart-button'))).toBeVisible();
    });
  });

  describe('Product Filtering and Sorting', () => {
    beforeEach(async () => {
      // Navigate to a category with multiple products
      await element(by.id('category-electronics')).tap();
      await waitFor(element(by.id('category-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should allow filtering products by price range', async () => {
      // Open filters
      await element(by.id('filter-button')).tap();
      
      await waitFor(element(by.id('filter-overlay')))
        .toBeVisible()
        .withTimeout(3000);

      // Set price range
      await element(by.id('price-range-slider')).multiTap(2); // Simulate slider interaction
      await element(by.id('apply-filters-button')).tap();

      // Verify filtered results
      await waitFor(element(by.id('category-product-list')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should allow sorting products by price', async () => {
      // Open sort options
      await element(by.id('sort-button')).tap();
      
      await waitFor(element(by.id('sort-overlay')))
        .toBeVisible()
        .withTimeout(3000);

      // Select price low to high
      await element(by.id('sort-price-low-high')).tap();

      // Verify sorting is applied
      await waitFor(element(by.id('category-product-list')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Shopping Cart', () => {
    beforeEach(async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should add products to cart', async () => {
      // Add first product to cart
      await testUtils.addProductToCart('product-card-0');

      // Navigate to cart
      await element(by.id('cart-tab')).tap();

      // Verify product is in cart
      await waitFor(element(by.id('cart-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.id('cart-item-0'))).toBeVisible();
      await expect(element(by.id('cart-total'))).toBeVisible();
    });

    it('should update product quantity in cart', async () => {
      // Add product to cart first
      await testUtils.addProductToCart('product-card-0');

      // Navigate to cart
      await element(by.id('cart-tab')).tap();
      
      await waitFor(element(by.id('cart-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Get initial quantity
      const initialQuantity = await element(by.id('quantity-text-0')).getAttributes();

      // Increase quantity
      await element(by.id('increase-quantity-0')).tap();

      // Verify quantity increased
      await waitFor(element(by.id('quantity-text-0')))
        .toHaveText('2')
        .withTimeout(3000);
    });

    it('should remove products from cart', async () => {
      // Add product to cart first
      await testUtils.addProductToCart('product-card-0');

      // Navigate to cart
      await element(by.id('cart-tab')).tap();
      
      await waitFor(element(by.id('cart-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Remove product
      await element(by.id('remove-item-0')).tap();

      // Confirm removal
      await element(by.text('Remove')).tap();

      // Verify cart is empty
      await expect(element(by.id('empty-cart'))).toBeVisible();
    });

    it('should show cart total correctly', async () => {
      // Add multiple products
      await testUtils.addProductToCart('product-card-0');
      await device.pressBack(); // Go back to home
      await testUtils.addProductToCart('product-card-1');

      // Navigate to cart
      await element(by.id('cart-tab')).tap();
      
      await waitFor(element(by.id('cart-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify total calculation
      await expect(element(by.id('cart-subtotal'))).toBeVisible();
      await expect(element(by.id('cart-tax'))).toBeVisible();
      await expect(element(by.id('cart-total'))).toBeVisible();
    });
  });

  describe('Favorites', () => {
    beforeEach(async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should add products to favorites', async () => {
      // Tap favorite button on first product
      await element(by.id('favorite-button-0')).tap();

      // Navigate to favorites
      await element(by.id('favorites-tab')).tap();

      // Verify product is in favorites
      await waitFor(element(by.id('favorites-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.id('favorite-item-0'))).toBeVisible();
    });

    it('should remove products from favorites', async () => {
      // Add to favorites first
      await element(by.id('favorite-button-0')).tap();

      // Navigate to favorites
      await element(by.id('favorites-tab')).tap();
      
      await waitFor(element(by.id('favorites-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Remove from favorites
      await element(by.id('favorite-button-0')).tap();

      // Verify favorites is empty
      await expect(element(by.id('empty-favorites'))).toBeVisible();
    });
  });

  describe('Guest Shopping', () => {
    it('should allow guest users to browse and add to cart', async () => {
      // Ensure not logged in
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Browse products as guest
      await element(by.id('product-card-0')).tap();
      
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Add to cart as guest
      await element(by.id('add-to-cart-button')).tap();
      
      // Verify success
      await waitFor(element(by.text('Added to cart')))
        .toBeVisible()
        .withTimeout(3000);

      // Navigate to cart
      await element(by.id('cart-tab')).tap();
      
      // Verify guest cart works
      await expect(element(by.id('cart-item-0'))).toBeVisible();
    });

    it('should prompt guest to login during checkout', async () => {
      // Add product to cart as guest
      await testUtils.addProductToCart('product-card-0');

      // Navigate to cart and proceed to checkout
      await element(by.id('cart-tab')).tap();
      await element(by.id('checkout-button')).tap();

      // Should prompt for login
      await waitFor(element(by.id('login-prompt')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.text('Please login to continue'))).toBeVisible();
    });
  });
});