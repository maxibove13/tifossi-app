const { device, expect, element, by, waitFor } = require('detox');

describe('Network Conditions and Offline Support', () => {
  beforeEach(async () => {
    await device.launchApp({ 
      newInstance: true,
      permissions: { 
        notifications: 'YES',
        location: 'inuse'
      }
    });
    await testUtils.waitForApp();
  });

  afterEach(async () => {
    // Always restore good network condition after tests
    await testUtils.setNetworkCondition('good');
  });

  describe('Offline Functionality', () => {
    it('should detect network status and show offline indicator', async () => {
      // Start with good network
      await expect(element(by.id('offline-indicator'))).not.toExist();
      
      // Go offline
      await testUtils.setNetworkCondition('offline');
      
      // Should show offline indicator
      await waitFor(element(by.id('offline-indicator')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.text('No internet connection'))).toBeVisible();
      
      // Restore network
      await testUtils.setNetworkCondition('good');
      
      // Offline indicator should disappear
      await waitFor(element(by.id('offline-indicator')))
        .not.toBeVisible()
        .withTimeout(5000);
    });

    it('should cache product data for offline browsing', async () => {
      // Browse products while online to populate cache
      await element(by.id('product-card-0')).tap();
      
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      await device.pressBack();
      
      // Browse category to cache more data
      await element(by.id('category-clothing')).tap();
      
      await waitFor(element(by.id('category-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      await device.pressBack();
      
      // Now go offline
      await testUtils.setNetworkCondition('offline');
      
      // Should still be able to browse cached content
      await element(by.id('product-card-0')).tap();
      
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should show cached content with offline indicator
      await expect(element(by.id('offline-indicator'))).toBeVisible();
      await expect(element(by.id('product-name'))).toBeVisible();
      
      await device.pressBack();
      
      // Category browsing should also work offline
      await element(by.id('category-clothing')).tap();
      
      await waitFor(element(by.id('category-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.text('Clothing'))).toBeVisible();
      await expect(element(by.id('category-product-list'))).toBeVisible();
    });

    it('should queue user actions for sync when back online', async () => {
      // Go offline
      await testUtils.setNetworkCondition('offline');
      
      // Try to add product to favorites while offline
      await element(by.id('favorite-button-0')).tap();
      
      // Should show queued action indicator
      await waitFor(element(by.text('Added to favorites (will sync when online)')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Try to add to cart offline
      await element(by.id('product-card-0')).tap();
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      await element(by.id('add-to-cart-button')).tap();
      
      await waitFor(element(by.text('Added to cart (will sync when online)')))
        .toBeVisible()
        .withTimeout(3000);
      
      await device.pressBack();
      
      // Go back online
      await testUtils.setNetworkCondition('good');
      
      // Should show sync in progress
      await waitFor(element(by.text('Syncing your changes...')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should complete sync
      await waitFor(element(by.text('All changes synced')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Verify changes were synced
      await element(by.id('favorites-tab')).tap();
      await expect(element(by.id('favorite-item-0'))).toBeVisible();
      
      await element(by.id('cart-tab')).tap();
      await expect(element(by.id('cart-item-0'))).toBeVisible();
    });

    it('should handle offline search with cached results', async () => {
      // Perform searches while online to populate cache
      await element(by.id('search-bar')).tap();
      await element(by.id('search-input')).typeText('shirt');
      await element(by.id('search-submit')).tap();
      
      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(5000);
      
      await device.pressBack();
      await device.pressBack();
      
      // Now go offline
      await testUtils.setNetworkCondition('offline');
      
      // Try to search offline
      await element(by.id('search-bar')).tap();
      await element(by.id('search-input')).typeText('shirt');
      await element(by.id('search-submit')).tap();
      
      // Should show cached results with offline notice
      await waitFor(element(by.id('offline-search-results')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.text('Showing cached results'))).toBeVisible();
      await expect(element(by.id('offline-indicator'))).toBeVisible();
      
      // Should still show relevant results
      await expect(element(by.text('shirt'))).toBeVisible();
    });

    it('should handle offline checkout flow appropriately', async () => {
      // Add item to cart while online
      await testUtils.addProductToCart('product-card-0');
      
      // Go offline
      await testUtils.setNetworkCondition('offline');
      
      // Navigate to cart
      await element(by.id('cart-tab')).tap();
      
      // Try to checkout while offline
      await element(by.id('checkout-button')).tap();
      
      // Should show offline checkout message
      await waitFor(element(by.id('offline-checkout-message')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.text('Checkout requires internet connection'))).toBeVisible();
      await expect(element(by.id('retry-when-online-button'))).toBeVisible();
      
      // Should offer to save cart for later
      await expect(element(by.id('save-cart-offline-button'))).toBeVisible();
      
      await element(by.id('save-cart-offline-button')).tap();
      
      await waitFor(element(by.text('Cart saved for checkout when online')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should handle user authentication offline', async () => {
      // Go offline
      await testUtils.setNetworkCondition('offline');
      
      // Try to access profile (requires auth)
      await element(by.id('profile-tab')).tap();
      
      // Should show offline auth message
      await waitFor(element(by.id('offline-auth-message')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.text('Login requires internet connection'))).toBeVisible();
      
      // Should still allow browsing other tabs
      await element(by.id('home-tab')).tap();
      await expect(element(by.id('home-screen'))).toBeVisible();
      
      // Should remember the attempted action
      await testUtils.setNetworkCondition('good');
      
      // When online, should prompt to login for profile access
      await element(by.id('profile-tab')).tap();
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Slow Network Conditions', () => {
    it('should show appropriate loading states for slow network', async () => {
      await testUtils.setNetworkCondition('slow');
      
      // Should show slow network indicator
      await waitFor(element(by.id('slow-network-indicator')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Test search with slow network
      await element(by.id('search-bar')).tap();
      await element(by.id('search-input')).typeText('shoes');
      await element(by.id('search-submit')).tap();
      
      // Should show extended loading state
      await waitFor(element(by.id('search-loading')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Should show slow network message
      await waitFor(element(by.text('Slow connection detected')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should eventually load results
      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(30000);
    });

    it('should implement progressive loading for slow connections', async () => {
      await testUtils.setNetworkCondition('slow');
      
      // Navigate to product detail
      await element(by.id('product-card-0')).tap();
      
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Should load basic info first
      await expect(element(by.id('product-name'))).toBeVisible();
      await expect(element(by.id('product-price'))).toBeVisible();
      
      // Should show progressive loading indicators
      await waitFor(element(by.id('images-loading')))
        .toBeVisible()
        .withTimeout(3000);
      
      await waitFor(element(by.id('description-loading')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Should eventually load all content
      await waitFor(element(by.id('product-main-image')))
        .toBeVisible()
        .withTimeout(20000);
      
      await waitFor(element(by.id('product-description')))
        .toBeVisible()
        .withTimeout(20000);
    });

    it('should provide option to reduce data usage', async () => {
      await testUtils.setNetworkCondition('slow');
      
      // Should prompt user about data saving mode
      await waitFor(element(by.id('data-saver-prompt')))
        .toBeVisible()
        .withTimeout(10000);
      
      await expect(element(by.text('Enable data saver mode?'))).toBeVisible();
      await expect(element(by.id('enable-data-saver'))).toBeVisible();
      
      await element(by.id('enable-data-saver')).tap();
      
      // Should show confirmation
      await waitFor(element(by.text('Data saver enabled')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Should show lower quality images
      await element(by.id('product-card-0')).tap();
      
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Should indicate reduced quality mode
      await expect(element(by.id('low-quality-image-indicator'))).toBeVisible();
    });

    it('should handle timeout scenarios gracefully', async () => {
      await testUtils.setNetworkCondition('slow');
      
      // Try an operation that might timeout
      await element(by.id('search-bar')).tap();
      await element(by.id('search-input')).typeText('timeout-test');
      await element(by.id('search-submit')).tap();
      
      // Should show loading for reasonable time
      await waitFor(element(by.id('search-loading')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should eventually show timeout message
      await waitFor(element(by.text('Request timed out')))
        .toBeVisible()
        .withTimeout(35000);
      
      // Should offer retry option
      await expect(element(by.id('retry-button'))).toBeVisible();
      
      // Test retry functionality
      await element(by.id('retry-button')).tap();
      
      await waitFor(element(by.id('search-loading')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Network Interruption and Recovery', () => {
    it('should handle network disconnection during operations', async () => {
      // Start a search operation
      await element(by.id('search-bar')).tap();
      await element(by.id('search-input')).typeText('interruption-test');
      await element(by.id('search-submit')).tap();
      
      // Wait for loading to start
      await waitFor(element(by.id('search-loading')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Interrupt network during operation
      await testUtils.setNetworkCondition('offline');
      
      // Should handle gracefully
      await waitFor(element(by.text('Connection lost')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.id('offline-indicator'))).toBeVisible();
      
      // Should offer to retry when online
      await expect(element(by.id('retry-when-online'))).toBeVisible();
      
      // Restore network
      await testUtils.setNetworkCondition('good');
      
      // Should auto-retry
      await waitFor(element(by.text('Reconnected - retrying...')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should complete the original operation
      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should handle intermittent connectivity', async () => {
      // Simulate intermittent connectivity
      for (let i = 0; i < 3; i++) {
        // Go offline briefly
        await testUtils.setNetworkCondition('offline');
        await device.sleep(2000);
        
        // Come back online
        await testUtils.setNetworkCondition('good');
        await device.sleep(3000);
      }
      
      // App should remain stable
      await expect(element(by.id('home-screen'))).toBeVisible();
      
      // Should be able to perform operations normally
      await element(by.id('search-bar')).tap();
      await element(by.id('search-input')).typeText('stable');
      await element(by.id('search-submit')).tap();
      
      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should sync pending actions when connectivity is restored', async () => {
      // Perform actions while online
      await testUtils.addProductToCart('product-card-0');
      
      // Go offline and perform more actions
      await testUtils.setNetworkCondition('offline');
      
      await element(by.id('favorite-button-1')).tap();
      await element(by.id('favorite-button-2')).tap();
      
      // Should queue these actions
      await waitFor(element(by.text('Actions will sync when online')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Restore network
      await testUtils.setNetworkCondition('good');
      
      // Should start syncing immediately
      await waitFor(element(by.text('Syncing pending actions...')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should complete sync
      await waitFor(element(by.text('Sync completed')))
        .toBeVisible()
        .withTimeout(15000);
      
      // Verify all actions were synced
      await element(by.id('favorites-tab')).tap();
      await expect(element(by.id('favorite-item-0'))).toBeVisible();
      await expect(element(by.id('favorite-item-1'))).toBeVisible();
      
      await element(by.id('cart-tab')).tap();
      await expect(element(by.id('cart-item-0'))).toBeVisible();
    });

    it('should handle conflicting sync operations', async () => {
      // Login first to enable cloud sync
      await testUtils.loginTestUser();
      
      // Add item to cart
      await testUtils.addProductToCart('product-card-0');
      
      // Simulate different device modifying same cart
      await testUtils.mockApiResponse('/cart/sync', {
        status: 409,
        error: 'Conflict: Cart modified by another device',
        server_cart: [
          { id: 'product-001', quantity: 2 },
          { id: 'product-002', quantity: 1 }
        ]
      });
      
      // Go offline and modify cart
      await testUtils.setNetworkCondition('offline');
      
      await element(by.id('cart-tab')).tap();
      await element(by.id('increase-quantity-0')).tap();
      
      // Go back online
      await testUtils.setNetworkCondition('good');
      
      // Should detect conflict during sync
      await waitFor(element(by.text('Cart sync conflict detected')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Should offer resolution options
      await expect(element(by.text('Keep local changes'))).toBeVisible();
      await expect(element(by.text('Use server version'))).toBeVisible();
      await expect(element(by.text('Merge changes'))).toBeVisible();
      
      // Test merge option
      await element(by.text('Merge changes')).tap();
      
      await waitFor(element(by.text('Cart merged successfully')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Data Management in Poor Network Conditions', () => {
    it('should implement smart caching strategies', async () => {
      // Browse content to populate cache
      const productIds = ['product-card-0', 'product-card-1', 'product-card-2'];
      
      for (const productId of productIds) {
        await element(by.id(productId)).tap();
        await waitFor(element(by.id('product-detail-screen')))
          .toBeVisible()
          .withTimeout(5000);
        await device.pressBack();
      }
      
      // Go offline
      await testUtils.setNetworkCondition('offline');
      
      // Should access cached content instantly
      for (const productId of productIds) {
        const startTime = Date.now();
        
        await element(by.id(productId)).tap();
        await waitFor(element(by.id('product-detail-screen')))
          .toBeVisible()
          .withTimeout(3000);
        
        const loadTime = Date.now() - startTime;
        
        // Cached content should load very quickly
        expect(loadTime).toBeLessThan(1000);
        
        await device.pressBack();
      }
    });

    it('should prioritize critical data over non-critical', async () => {
      await testUtils.setNetworkCondition('slow');
      
      await element(by.id('product-card-0')).tap();
      
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Critical data should load first
      await expect(element(by.id('product-name'))).toBeVisible();
      await expect(element(by.id('product-price'))).toBeVisible();
      await expect(element(by.id('add-to-cart-button'))).toBeVisible();
      
      // Non-critical data should load later
      await waitFor(element(by.id('product-reviews-section')))
        .toBeVisible()
        .withTimeout(20000);
      
      await waitFor(element(by.id('related-products-section')))
        .toBeVisible()
        .withTimeout(25000);
    });

    it('should handle partial data loading gracefully', async () => {
      await testUtils.setNetworkCondition('slow');
      
      // Navigate to search
      await element(by.id('search-bar')).tap();
      await element(by.id('search-input')).typeText('partial-load-test');
      await element(by.id('search-submit')).tap();
      
      // Should show loading skeleton
      await waitFor(element(by.id('search-results-skeleton')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Should progressively load results
      await waitFor(element(by.id('partial-search-results')))
        .toBeVisible()
        .withTimeout(15000);
      
      // Should indicate more results are loading
      await expect(element(by.text('Loading more results...'))).toBeVisible();
      
      // Should eventually load complete results
      await waitFor(element(by.id('complete-search-results')))
        .toBeVisible()
        .withTimeout(30000);
    });

    it('should implement background prefetching when network improves', async () => {
      // Start with slow network
      await testUtils.setNetworkCondition('slow');
      
      // Browse some content
      await element(by.id('category-clothing')).tap();
      
      await waitFor(element(by.id('category-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Improve network conditions
      await testUtils.setNetworkCondition('good');
      
      // Should start background prefetching
      await waitFor(element(by.id('prefetching-indicator')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should prefetch related content
      await device.sleep(3000);
      
      // Navigate to prefetched content - should load instantly
      await element(by.id('product-card-0')).tap();
      
      const startTime = Date.now();
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      const loadTime = Date.now() - startTime;
      
      // Prefetched content should load very quickly
      expect(loadTime).toBeLessThan(1000);
    });

    it('should handle storage quota exceeded gracefully', async () => {
      // This test simulates running out of local storage space
      // In a real scenario, this would involve filling up device storage
      
      // Mock storage quota exceeded error
      await testUtils.mockApiResponse('/cache/store', {
        status: 507,
        error: 'Insufficient storage space'
      });
      
      // Try to cache large amount of data
      for (let i = 0; i < 20; i++) {
        await element(by.id(`product-card-${i % 5}`)).tap();
        await waitFor(element(by.id('product-detail-screen')))
          .toBeVisible()
          .withTimeout(5000);
        await device.pressBack();
      }
      
      // Should show storage management options
      await waitFor(element(by.text('Storage space low')))
        .toBeVisible()
        .withTimeout(10000);
      
      await expect(element(by.text('Clear cache'))).toBeVisible();
      await expect(element(by.text('Manage storage'))).toBeVisible();
      
      // Test cache clearing
      await element(by.text('Clear cache')).tap();
      
      await waitFor(element(by.text('Cache cleared')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should continue working normally
      await expect(element(by.id('home-screen'))).toBeVisible();
    });
  });
});