const { device, expect, element, by, waitFor } = require('detox');

describe('Shopping Flow', () => {
  beforeEach(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {
        notifications: 'YES',
        location: 'inuse',
        camera: 'YES',
      },
    });
    await testUtils.waitForApp();
  });

  describe('Product Discovery with Gestures', () => {
    it('should display product catalog on home screen', async () => {
      // Wait for home screen to load
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Check that products are displayed
      await expect(element(by.id('product-grid'))).toBeVisible();
      await expect(element(by.id('product-card-0'))).toBeVisible();

      // Test pull-to-refresh gesture
      await element(by.id('product-grid')).swipe('down', 'slow', 0.8);

      // Should show loading indicator during refresh
      await waitFor(element(by.id('pull-refresh-loading')))
        .toBeVisible()
        .withTimeout(2000);

      // Loading should disappear
      await waitFor(element(by.id('pull-refresh-loading')))
        .not.toBeVisible()
        .withTimeout(5000);
    });

    it('should support infinite scroll with smooth animations', async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Scroll down to trigger infinite loading
      for (let i = 0; i < 3; i++) {
        await element(by.id('product-grid')).scroll(500, 'down');
        await testUtils.waitForLoading('infinite-loading-indicator');
      }

      // Should have loaded more products
      await expect(element(by.id('product-card-12'))).toBeVisible();

      // Test smooth scroll to top
      await element(by.id('product-grid')).scrollTo('top');
      await expect(element(by.id('product-card-0'))).toBeVisible();
    });

    it('should allow browsing products by category with swipe gestures', async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Swipe through category carousel
      await element(by.id('category-carousel')).swipe('left', 'fast', 0.8);
      await element(by.id('category-carousel')).swipe('left', 'fast', 0.8);

      // Tap on a category
      await element(by.id('category-clothing')).tap();

      // Wait for category screen with animation
      await waitFor(element(by.id('category-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify category products are shown with slide transition
      await expect(element(by.text('Clothing'))).toBeVisible();
      await expect(element(by.id('category-product-list'))).toBeVisible();

      // Test category filter swipe
      await element(by.id('category-filters')).swipe('left', 'fast', 0.6);
      await element(by.id('filter-shirts')).tap();

      // Should animate filter application
      await waitFor(element(by.id('filter-loading-animation')))
        .toBeVisible()
        .withTimeout(2000);

      await waitFor(element(by.id('filter-loading-animation')))
        .not.toBeVisible()
        .withTimeout(5000);
    });

    it('should support advanced search with voice and camera', async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Tap search bar
      await element(by.id('search-bar')).tap();

      // Wait for search screen
      await waitFor(element(by.id('search-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Test voice search
      await element(by.id('voice-search-button')).tap();

      // Should request microphone permission and show voice UI
      await waitFor(element(by.id('voice-search-animation')))
        .toBeVisible()
        .withTimeout(3000);

      // Simulate voice input completion
      await device.pressBack(); // Cancel voice search

      // Test visual search (camera)
      await element(by.id('camera-search-button')).tap();

      // Should open camera interface
      await waitFor(element(by.id('camera-search-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Should show camera preview
      await expect(element(by.id('camera-preview'))).toBeVisible();

      // Take photo for visual search
      await element(by.id('camera-capture-button')).tap();

      // Should show processing animation
      await waitFor(element(by.id('visual-search-processing')))
        .toBeVisible()
        .withTimeout(3000);

      // Mock visual search results
      await waitFor(element(by.id('visual-search-results')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should display product details with interactive elements', async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Tap on first product
      await element(by.id('product-card-0')).tap();

      // Wait for product detail screen with slide transition
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Test product image gallery gestures
      await element(by.id('product-image-gallery')).swipe('left', 'fast', 0.8);
      await element(by.id('product-image-gallery')).swipe('left', 'fast', 0.8);

      // Test pinch to zoom on product image
      await element(by.id('product-image-0')).pinch(1.5, 'outward');
      await element(by.id('product-image-0')).pinch(0.5, 'inward');

      // Test 360-degree product view
      if (await element(by.id('product-360-view')).exists()) {
        await element(by.id('product-360-view')).tap();

        await waitFor(element(by.id('360-viewer')))
          .toBeVisible()
          .withTimeout(3000);

        // Drag to rotate 360 view
        await element(by.id('360-viewer')).swipe('right', 'slow', 0.5);
        await element(by.id('360-viewer')).swipe('left', 'slow', 0.5);
      }

      // Verify product details are shown
      await expect(element(by.id('product-name'))).toBeVisible();
      await expect(element(by.id('product-price'))).toBeVisible();
      await expect(element(by.id('product-description'))).toBeVisible();
      await expect(element(by.id('add-to-cart-button'))).toBeVisible();
    });

    it('should handle product variant selection with animations', async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.id('product-card-clothing-0')).tap();

      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Test size selection with animation
      await element(by.id('size-selector')).tap();

      await waitFor(element(by.id('size-options')))
        .toBeVisible()
        .withTimeout(2000);

      await element(by.id('size-M')).tap();

      // Should animate size selection
      await waitFor(element(by.id('size-selection-animation')))
        .toBeVisible()
        .withTimeout(1000);

      // Test color selection with swipe
      await element(by.id('color-selector')).swipe('left', 'fast', 0.6);
      await element(by.id('color-blue')).tap();

      // Should update product images with fade transition
      await waitFor(element(by.id('product-image-variant-blue')))
        .toBeVisible()
        .withTimeout(3000);

      // Price should update with animation
      await expect(element(by.id('price-update-animation'))).toBeVisible();
    });
  });

  describe('Advanced Product Filtering and Sorting', () => {
    beforeEach(async () => {
      // Navigate to a category with multiple products
      await element(by.id('category-clothing')).tap();
      await waitFor(element(by.id('category-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should allow complex filtering with slider interactions', async () => {
      // Open filters with slide-up animation
      await element(by.id('filter-button')).tap();

      await waitFor(element(by.id('filter-modal')))
        .toBeVisible()
        .withTimeout(3000);

      // Test price range slider
      await element(by.id('price-range-slider')).swipe('right', 'slow', 0.3);
      await element(by.id('price-range-slider')).swipe('right', 'slow', 0.2);

      // Test size multi-selection
      await element(by.id('size-filter-S')).tap();
      await element(by.id('size-filter-M')).tap();
      await element(by.id('size-filter-L')).tap();

      // Test color picker wheel
      await element(by.id('color-picker')).swipe('right', 'slow', 0.4);
      await element(by.id('color-red')).tap();

      // Test brand search within filter
      await element(by.id('brand-search-input')).typeText('Nike');
      await waitFor(element(by.id('brand-nike-option')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.id('brand-nike-option')).tap();

      // Apply filters with animation
      await element(by.id('apply-filters-button')).tap();

      // Should show filter application animation
      await waitFor(element(by.id('filter-applying-animation')))
        .toBeVisible()
        .withTimeout(2000);

      // Verify filtered results
      await waitFor(element(by.id('category-product-list')))
        .toBeVisible()
        .withTimeout(5000);

      // Should show active filter chips
      await expect(element(by.id('active-filter-price'))).toBeVisible();
      await expect(element(by.id('active-filter-size'))).toBeVisible();
    });

    it('should support sorting with visual feedback', async () => {
      // Open sort options with slide animation
      await element(by.id('sort-button')).tap();

      await waitFor(element(by.id('sort-modal')))
        .toBeVisible()
        .withTimeout(3000);

      // Select price low to high with tap animation
      await element(by.id('sort-price-low-high')).tap();

      // Should show sorting animation
      await waitFor(element(by.id('sorting-animation')))
        .toBeVisible()
        .withTimeout(2000);

      // Verify sorting is applied with re-arranged items
      await waitFor(element(by.id('category-product-list')))
        .toBeVisible()
        .withTimeout(5000);

      // First item should be lowest priced
      await expect(element(by.id('product-card-0'))).toHaveText(expect.stringMatching(/\$19\.99/));
    });

    it('should handle quick filter chips with haptic feedback', async () => {
      // Test quick filter chips at top
      await element(by.id('quick-filter-sale')).tap();

      // Should provide haptic feedback and animation
      await waitFor(element(by.id('quick-filter-animation')))
        .toBeVisible()
        .withTimeout(1000);

      // Should filter to sale items only
      await waitFor(element(by.id('sale-badge-0')))
        .toBeVisible()
        .withTimeout(3000);

      // Test removing filter
      await element(by.id('quick-filter-sale')).tap();

      // Should remove filter with animation
      await waitFor(element(by.id('filter-removal-animation')))
        .toBeVisible()
        .withTimeout(1000);
    });
  });

  describe('Shopping Cart with Animations', () => {
    beforeEach(async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should add products to cart with animation feedback', async () => {
      // Add first product to cart with animation
      await element(by.id('product-card-0')).tap();

      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Should animate add to cart button press
      await element(by.id('add-to-cart-button')).tap();

      // Should show add to cart animation (flying cart icon)
      await waitFor(element(by.id('add-to-cart-animation')))
        .toBeVisible()
        .withTimeout(2000);

      // Should show success toast with slide animation
      await waitFor(element(by.text('Added to cart')))
        .toBeVisible()
        .withTimeout(3000);

      // Cart badge should animate with number update
      await waitFor(element(by.id('cart-badge-animated')))
        .toBeVisible()
        .withTimeout(2000);

      // Navigate to cart
      await element(by.id('cart-tab')).tap();

      // Should slide in cart screen
      await waitFor(element(by.id('cart-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify product is in cart with entrance animation
      await expect(element(by.id('cart-item-0'))).toBeVisible();
      await expect(element(by.id('cart-total'))).toBeVisible();
    });

    it('should update product quantity with smooth transitions', async () => {
      // Add product to cart first
      await testUtils.addProductToCart('product-card-0');

      // Navigate to cart
      await element(by.id('cart-tab')).tap();

      await waitFor(element(by.id('cart-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Test quantity increase with animation
      await element(by.id('increase-quantity-0')).tap();

      // Should animate quantity change
      await waitFor(element(by.id('quantity-change-animation')))
        .toBeVisible()
        .withTimeout(1000);

      // Should update price with count-up animation
      await waitFor(element(by.id('price-animation-0')))
        .toBeVisible()
        .withTimeout(2000);

      // Verify quantity increased
      await waitFor(element(by.id('quantity-text-0')))
        .toHaveText('2')
        .withTimeout(3000);

      // Test quantity decrease
      await element(by.id('decrease-quantity-0')).tap();

      await waitFor(element(by.id('quantity-text-0')))
        .toHaveText('1')
        .withTimeout(3000);
    });

    it('should remove products from cart with swipe gesture', async () => {
      // Add product to cart first
      await testUtils.addProductToCart('product-card-0');

      // Navigate to cart
      await element(by.id('cart-tab')).tap();

      await waitFor(element(by.id('cart-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Swipe to reveal delete action
      await element(by.id('cart-item-0')).swipe('left', 'fast', 0.75);

      // Should show delete button with slide animation
      await waitFor(element(by.id('delete-item-button-0')))
        .toBeVisible()
        .withTimeout(2000);

      await element(by.id('delete-item-button-0')).tap();

      // Should show removal confirmation with bounce animation
      await waitFor(element(by.id('removal-confirmation')))
        .toBeVisible()
        .withTimeout(2000);

      await element(by.text('Remove')).tap();

      // Should animate item removal (slide out)
      await waitFor(element(by.id('item-removal-animation')))
        .toBeVisible()
        .withTimeout(2000);

      // Verify cart is empty with empty state animation
      await waitFor(element(by.id('empty-cart-animation')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('empty-cart'))).toBeVisible();
    });

    it('should show cart total updates with animated transitions', async () => {
      // Add multiple products with different prices
      await testUtils.addProductToCart('product-card-0'); // $29.99
      await device.pressBack();
      await testUtils.addProductToCart('product-card-1'); // $39.99

      // Navigate to cart
      await element(by.id('cart-tab')).tap();

      await waitFor(element(by.id('cart-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify animated total calculation
      await waitFor(element(by.id('cart-subtotal-animation')))
        .toBeVisible()
        .withTimeout(3000);

      // Should show breakdown animation
      await expect(element(by.id('cart-subtotal'))).toBeVisible();
      await expect(element(by.id('cart-tax-animated'))).toBeVisible();
      await expect(element(by.id('cart-total-animated'))).toBeVisible();

      // Test coupon application animation
      await element(by.id('apply-coupon-button')).tap();

      await waitFor(element(by.id('coupon-input')))
        .toBeVisible()
        .withTimeout(2000);

      await element(by.id('coupon-input')).typeText('SAVE10');
      await element(by.id('apply-coupon-submit')).tap();

      // Should animate discount application
      await waitFor(element(by.id('discount-animation')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('discount-line-item'))).toBeVisible();
    });
  });

  describe('Favorites with Gesture Support', () => {
    beforeEach(async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should add products to favorites with heart animation', async () => {
      // Tap favorite button on first product with animation
      await element(by.id('favorite-button-0')).tap();

      // Should show heart fill animation
      await waitFor(element(by.id('heart-fill-animation-0')))
        .toBeVisible()
        .withTimeout(2000);

      // Should provide haptic feedback
      await testUtils.takeScreenshot('heart-animation-feedback');

      // Navigate to favorites
      await element(by.id('favorites-tab')).tap();

      // Should slide in favorites screen
      await waitFor(element(by.id('favorites-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify product is in favorites with entrance animation
      await waitFor(element(by.id('favorite-item-animation-0')))
        .toBeVisible()
        .withTimeout(2000);

      await expect(element(by.id('favorite-item-0'))).toBeVisible();
    });

    it('should support batch operations on favorites', async () => {
      // Add multiple items to favorites first
      await element(by.id('favorite-button-0')).tap();
      await element(by.id('favorite-button-1')).tap();
      await element(by.id('favorite-button-2')).tap();

      // Navigate to favorites
      await element(by.id('favorites-tab')).tap();

      await waitFor(element(by.id('favorites-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Enter selection mode
      await element(by.id('select-favorites-button')).tap();

      await waitFor(element(by.id('selection-mode')))
        .toBeVisible()
        .withTimeout(2000);

      // Select multiple items with checkbox animations
      await element(by.id('select-favorite-0')).tap();
      await element(by.id('select-favorite-1')).tap();

      // Should show selection count animation
      await waitFor(element(by.id('selection-counter-animation')))
        .toBeVisible()
        .withTimeout(1000);

      // Test batch add to cart
      await element(by.id('batch-add-to-cart')).tap();

      // Should show batch operation animation
      await waitFor(element(by.id('batch-operation-animation')))
        .toBeVisible()
        .withTimeout(3000);

      // Should show success message
      await waitFor(element(by.text('Added 2 items to cart')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should remove products from favorites with swipe gestures', async () => {
      // Add to favorites first
      await element(by.id('favorite-button-0')).tap();

      // Navigate to favorites
      await element(by.id('favorites-tab')).tap();

      await waitFor(element(by.id('favorites-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Swipe to remove from favorites
      await element(by.id('favorite-item-0')).swipe('right', 'fast', 0.8);

      // Should show unfavorite animation
      await waitFor(element(by.id('unfavorite-animation-0')))
        .toBeVisible()
        .withTimeout(2000);

      // Should animate item removal
      await waitFor(element(by.id('favorite-removal-animation')))
        .toBeVisible()
        .withTimeout(2000);

      // Verify favorites is empty with animation
      await waitFor(element(by.id('empty-favorites-animation')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('empty-favorites'))).toBeVisible();
    });
  });

  describe('Product Search with Advanced Features', () => {
    it('should support autocomplete with real-time suggestions', async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.id('search-bar')).tap();

      await waitFor(element(by.id('search-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Type with real-time suggestions
      await element(by.id('search-input')).typeText('sh');

      // Should show autocomplete suggestions
      await waitFor(element(by.id('autocomplete-suggestions')))
        .toBeVisible()
        .withTimeout(2000);

      await expect(element(by.id('suggestion-shirt'))).toBeVisible();
      await expect(element(by.id('suggestion-shoes'))).toBeVisible();

      // Tap suggestion
      await element(by.id('suggestion-shirt')).tap();

      // Should fill search and perform search
      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(5000);

      // Should highlight search terms in results
      await expect(element(by.id('highlighted-search-term'))).toBeVisible();
    });

    it('should support barcode scanning for product search', async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.id('search-bar')).tap();

      await waitFor(element(by.id('search-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Open barcode scanner
      await element(by.id('barcode-scan-button')).tap();

      // Should open camera for barcode scanning
      await waitFor(element(by.id('barcode-scanner')))
        .toBeVisible()
        .withTimeout(5000);

      // Should show scanning overlay
      await expect(element(by.id('barcode-scanning-overlay'))).toBeVisible();

      // Mock barcode detection
      await testUtils.mockApiResponse('/products/barcode/123456789', {
        status: 200,
        product: {
          id: 'shirt-001',
          name: 'Classic T-Shirt',
        },
      });

      // Simulate barcode found
      await element(by.id('mock-barcode-found')).tap();

      // Should navigate to product
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should save and manage search history', async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.id('search-bar')).tap();

      // Perform several searches
      await element(by.id('search-input')).typeText('sneakers');
      await element(by.id('search-submit')).tap();

      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(5000);

      // Go back and search again
      await device.pressBack();
      await element(by.id('search-input')).clearText();
      await element(by.id('search-input')).typeText('jackets');
      await element(by.id('search-submit')).tap();

      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(5000);

      // Check search history
      await device.pressBack();

      // Should show recent searches
      await waitFor(element(by.id('recent-searches')))
        .toBeVisible()
        .withTimeout(2000);

      await expect(element(by.text('sneakers'))).toBeVisible();
      await expect(element(by.text('jackets'))).toBeVisible();

      // Should be able to clear history
      await element(by.id('clear-search-history')).tap();

      await waitFor(element(by.id('empty-search-history')))
        .toBeVisible()
        .withTimeout(2000);
    });
  });

  describe('Guest Shopping Experience', () => {
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

      // Verify success with guest-specific messaging
      await waitFor(element(by.text('Added to cart')))
        .toBeVisible()
        .withTimeout(3000);

      // Should show guest cart notification
      await waitFor(element(by.text('Sign up to save your cart')))
        .toBeVisible()
        .withTimeout(3000);

      // Navigate to cart
      await element(by.id('cart-tab')).tap();

      // Verify guest cart works with limitations
      await waitFor(element(by.id('guest-cart-notice')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('cart-item-0'))).toBeVisible();
    });

    it('should prompt guest to login during checkout', async () => {
      // Add product to cart as guest
      await testUtils.addProductToCart('product-card-0');

      // Navigate to cart and proceed to checkout
      await element(by.id('cart-tab')).tap();
      await element(by.id('checkout-button')).tap();

      // Should show guest checkout options
      await waitFor(element(by.id('guest-checkout-options')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.text('Continue as guest'))).toBeVisible();
      await expect(element(by.text('Sign in for faster checkout'))).toBeVisible();

      // Test continue as guest
      await element(by.text('Continue as guest')).tap();

      // Should proceed to guest checkout
      await waitFor(element(by.id('guest-checkout-form')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should offer account creation with cart preservation', async () => {
      // Add items to guest cart
      await testUtils.addProductToCart('product-card-0');
      await device.pressBack();
      await testUtils.addProductToCart('product-card-1');

      // Navigate to cart
      await element(by.id('cart-tab')).tap();

      // Should show account creation prompt
      await waitFor(element(by.id('create-account-prompt')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('create-account-button')).tap();

      // Should show signup with cart preservation message
      await waitFor(element(by.id('signup-screen')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.text('Your cart will be saved'))).toBeVisible();

      // Fill signup form
      await element(by.id('email-input')).typeText('newuser@example.com');
      await element(by.id('password-input')).typeText('Password123!');
      await element(by.id('terms-checkbox')).tap();
      await element(by.id('submit-signup')).tap();

      // Should preserve cart after signup
      await waitFor(element(by.text('Cart saved to your account')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Accessibility and Performance', () => {
    it('should support accessibility features', async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Test VoiceOver navigation
      await expect(element(by.id('product-card-0'))).toHaveAccessibilityLabel(
        'Product: Classic T-Shirt, Price: $29.99'
      );

      // Test high contrast mode
      await device.setSystemValues({ accessibility: { highContrastMode: true } });

      // Should adapt to high contrast
      await expect(element(by.id('high-contrast-product-card'))).toBeVisible();

      // Test large text support
      await device.setSystemValues({ accessibility: { largeTextSize: true } });

      // Should scale text appropriately
      await expect(element(by.id('large-text-product-name'))).toBeVisible();
    });

    it('should handle performance under stress conditions', async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Test rapid scrolling
      for (let i = 0; i < 10; i++) {
        await element(by.id('product-grid')).scroll(300, 'down');
      }

      // Should maintain smooth performance
      await expect(element(by.id('product-grid'))).toBeVisible();

      // Test rapid tab switching
      for (let i = 0; i < 5; i++) {
        await element(by.id('favorites-tab')).tap();
        await element(by.id('cart-tab')).tap();
        await element(by.id('home-tab')).tap();
      }

      // Should maintain responsiveness
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should handle offline scenarios gracefully', async () => {
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Set network condition to offline
      await testUtils.setNetworkCondition('offline');

      // Should show offline indicator
      await waitFor(element(by.id('offline-indicator')))
        .toBeVisible()
        .withTimeout(3000);

      // Try to search (should show cached results)
      await element(by.id('search-bar')).tap();
      await element(by.id('search-input')).typeText('shirt');
      await element(by.id('search-submit')).tap();

      // Should show offline search results
      await waitFor(element(by.id('offline-search-results')))
        .toBeVisible()
        .withTimeout(5000);

      // Try to add to cart offline
      await element(by.id('product-card-0')).tap();
      await element(by.id('add-to-cart-button')).tap();

      // Should queue for sync
      await waitFor(element(by.text('Added to cart (will sync when online)')))
        .toBeVisible()
        .withTimeout(3000);

      // Restore network
      await testUtils.setNetworkCondition('good');

      // Should sync automatically
      await waitFor(element(by.text('Cart synced')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });
});
