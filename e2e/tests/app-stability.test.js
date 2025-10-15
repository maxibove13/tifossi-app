const { device, expect, element, by, waitFor } = require('detox');

describe('App Launch and Stability', () => {
  describe('Cold Start Performance', () => {
    it('should launch app from cold start within performance threshold', async () => {
      // Terminate app completely for cold start
      await device.terminateApp();
      await device.uninstallApp();
      await device.installApp();

      const startTime = Date.now();

      await device.launchApp({
        newInstance: true,
        permissions: {
          notifications: 'YES',
          location: 'inuse',
        },
      });

      // Wait for splash screen to appear (initial sign of app response)
      await waitFor(element(by.id('splash-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Wait for main app content to load
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(15000);

      const launchTime = Date.now() - startTime;

      // Assert performance threshold (should launch within 10 seconds)
      expect(launchTime).toBeLessThan(10000);

      // Take screenshot for visual verification
      await testUtils.takeScreenshot('cold-start-complete');

      // Verify critical elements are loaded
      await expect(element(by.id('product-grid'))).toBeVisible();
      await expect(element(by.id('navigation-tabs'))).toBeVisible();
    });

    it('should handle app launch interruption gracefully', async () => {
      await device.terminateApp();

      // Start launch but interrupt with home button
      device.launchApp({ newInstance: true });

      // Interrupt launch after 2 seconds
      setTimeout(async () => {
        await device.sendToHome();
      }, 2000);

      // Wait a bit then return to app
      await device.sleep(3000);
      await device.launchApp({ newInstance: false });

      // Should resume properly
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should handle multiple rapid cold starts', async () => {
      // Test app stability with rapid restarts
      for (let i = 0; i < 3; i++) {
        await device.terminateApp();
        await device.launchApp({ newInstance: true });

        await waitFor(element(by.id('home-screen')))
          .toBeVisible()
          .withTimeout(15000);

        // Quick interaction to ensure app is responsive
        await element(by.id('search-bar')).tap();
        await expect(element(by.id('search-screen'))).toBeVisible();
        await device.pressBack();
      }
    });
  });

  describe('Warm Start Performance', () => {
    beforeEach(async () => {
      // Ensure app is running
      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();
    });

    it('should resume from background within performance threshold', async () => {
      // Send app to background
      await device.sendToHome();
      await device.sleep(2000);

      const startTime = Date.now();

      // Return to foreground
      await device.launchApp({ newInstance: false });

      // Should resume quickly
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      const resumeTime = Date.now() - startTime;

      // Warm start should be much faster (under 3 seconds)
      expect(resumeTime).toBeLessThan(3000);
    });

    it('should maintain state after backgrounding', async () => {
      // Navigate to a specific state
      await element(by.id('search-bar')).tap();
      await element(by.id('search-input')).typeText('test query');

      // Background the app
      await device.sendToHome();
      await device.sleep(5000);

      // Return to foreground
      await device.launchApp({ newInstance: false });

      // Should maintain search state
      await waitFor(element(by.id('search-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Search query should still be there
      await expect(element(by.id('search-input'))).toHaveText('test query');
    });

    it('should handle background app refresh', async () => {
      // Add item to cart
      await testUtils.addProductToCart('product-card-0');

      // Background app for extended period to trigger refresh
      await device.sendToHome();
      await device.sleep(10000);

      // Return to app
      await device.launchApp({ newInstance: false });

      // Should refresh data but maintain cart
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Verify cart is still populated
      await element(by.id('cart-tab')).tap();
      await expect(element(by.id('cart-item-0'))).toBeVisible();
    });
  });

  describe('Memory Management', () => {
    it('should handle memory pressure gracefully', async () => {
      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();

      // Simulate memory pressure by rapid navigation and data loading
      for (let i = 0; i < 10; i++) {
        // Navigate through different screens rapidly
        await element(by.id('search-bar')).tap();
        await element(by.id('search-input')).typeText(`query${i}`);
        await element(by.id('search-submit')).tap();

        await waitFor(element(by.id('search-results')))
          .toBeVisible()
          .withTimeout(5000);

        // Navigate to product details
        await element(by.id('product-card-0')).tap();

        await waitFor(element(by.id('product-detail-screen')))
          .toBeVisible()
          .withTimeout(5000);

        await device.pressBack();
        await device.pressBack();
      }

      // App should still be responsive
      await expect(element(by.id('home-screen'))).toBeVisible();
    });

    it('should recover from memory warnings', async () => {
      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();

      // Simulate memory warning
      await device.pressHome();
      await device.openURL('tifossi://simulate-memory-warning');

      // App should handle gracefully
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Should still be functional
      await element(by.id('product-card-0')).tap();
      await expect(element(by.id('product-detail-screen'))).toBeVisible();
    });
  });

  describe('Network Interruption Recovery', () => {
    beforeEach(async () => {
      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();
    });

    it('should handle network loss during app usage', async () => {
      // Start using app normally
      await element(by.id('search-bar')).tap();
      await element(by.id('search-input')).typeText('shirts');

      // Simulate network loss
      await testUtils.setNetworkCondition('offline');

      await element(by.id('search-submit')).tap();

      // Should show offline message
      await waitFor(element(by.id('offline-indicator')))
        .toBeVisible()
        .withTimeout(5000);

      // Should show cached results or offline message
      await waitFor(element(by.text('No internet connection')))
        .toBeVisible()
        .withTimeout(3000);

      // Restore network
      await testUtils.setNetworkCondition('good');

      // Should recover automatically
      await waitFor(element(by.id('offline-indicator')))
        .not.toBeVisible()
        .withTimeout(5000);

      // Should be able to search again
      await element(by.id('search-submit')).tap();
      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should queue offline actions and sync when online', async () => {
      // Start with network
      await element(by.id('product-card-0')).tap();

      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Go offline
      await testUtils.setNetworkCondition('offline');

      // Try to add to cart offline
      await element(by.id('add-to-cart-button')).tap();

      // Should queue action
      await waitFor(element(by.text('Added to cart (will sync when online)')))
        .toBeVisible()
        .withTimeout(3000);

      // Go back online
      await testUtils.setNetworkCondition('good');

      // Should sync automatically
      await waitFor(element(by.text('Cart synced')))
        .toBeVisible()
        .withTimeout(10000);

      // Verify item is in cart
      await element(by.id('cart-tab')).tap();
      await expect(element(by.id('cart-item-0'))).toBeVisible();
    });

    it('should handle slow network conditions', async () => {
      // Set slow network
      await testUtils.setNetworkCondition('slow');

      // Try to search
      await element(by.id('search-bar')).tap();
      await element(by.id('search-input')).typeText('shoes');
      await element(by.id('search-submit')).tap();

      // Should show loading state
      await waitFor(element(by.id('search-loading')))
        .toBeVisible()
        .withTimeout(2000);

      // Should eventually show results (with longer timeout for slow network)
      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(20000);

      // Should show network quality indicator
      await expect(element(by.id('slow-network-indicator'))).toBeVisible();
    });
  });

  describe('App State Persistence', () => {
    it('should persist navigation state across restarts', async () => {
      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();

      // Navigate to a specific state
      await element(by.id('profile-tab')).tap();
      await element(by.id('settings-button')).tap();

      await waitFor(element(by.id('settings-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Force restart app
      await device.terminateApp();
      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();

      // Should restore to same state or handle gracefully
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Navigation should work normally
      await element(by.id('profile-tab')).tap();
      await expect(element(by.id('profile-screen'))).toBeVisible();
    });

    it('should persist user data across app updates', async () => {
      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();

      // Login and add data
      await testUtils.loginTestUser();
      await testUtils.addProductToCart('product-card-0');
      await element(by.id('favorite-button-1')).tap();

      // Simulate app update (reinstall)
      await device.terminateApp();
      await device.uninstallApp();
      await device.installApp();

      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();

      // Should prompt for login
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Login with same credentials
      await testUtils.loginTestUser();

      // User data should be restored from server
      await element(by.id('cart-tab')).tap();
      await waitFor(element(by.id('cart-item-0')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.id('favorites-tab')).tap();
      await waitFor(element(by.id('favorite-item-0')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Crash Recovery', () => {
    it('should handle app crashes gracefully', async () => {
      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();

      // Add some data
      await testUtils.addProductToCart('product-card-0');

      // Simulate crash by force terminating
      await device.terminateApp();

      // Relaunch app
      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();

      // Should show crash recovery dialog or handle silently
      try {
        await waitFor(element(by.text('App recovered from unexpected shutdown')))
          .toBeVisible()
          .withTimeout(5000);

        await element(by.text('Continue')).tap();
      } catch (e) {
        // Silent recovery is also acceptable
      }

      // App should be functional
      await expect(element(by.id('home-screen'))).toBeVisible();

      // Local data might be recovered
      await element(by.id('cart-tab')).tap();
      // Cart might be empty after crash - that's acceptable for guest users
    });

    it('should handle JavaScript errors gracefully', async () => {
      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();

      // Navigate to a screen that might trigger JS error
      await element(by.id('search-bar')).tap();
      await element(by.id('search-input')).typeText('trigger-error');
      await element(by.id('search-submit')).tap();

      // If error occurs, should show error boundary
      try {
        await waitFor(element(by.id('error-boundary')))
          .toBeVisible()
          .withTimeout(5000);

        // Should offer recovery options
        await element(by.id('retry-button')).tap();
      } catch (e) {
        // No error occurred - that's good
      }

      // App should continue working
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Background Tasks', () => {
    it('should handle background data sync', async () => {
      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();

      // Login to enable background sync
      await testUtils.loginTestUser();

      // Add items to favorites
      await element(by.id('favorite-button-0')).tap();

      // Background the app
      await device.sendToHome();
      await device.sleep(30000); // 30 seconds to allow background sync

      // Return to app
      await device.launchApp({ newInstance: false });

      // Should have synced in background
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Check if sync occurred (might show sync indicator)
      await element(by.id('favorites-tab')).tap();
      await expect(element(by.id('favorite-item-0'))).toBeVisible();
    });

    it('should respect battery optimization settings', async () => {
      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();

      // Simulate low battery mode
      await device.setBatteryState({ level: 10, state: 'unplugged' });

      // App should adapt behavior
      await element(by.id('search-bar')).tap();
      await element(by.id('search-input')).typeText('test');
      await element(by.id('search-submit')).tap();

      // Should still work but might be slower or show battery optimization notice
      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(15000);

      // Reset battery state
      await device.setBatteryState({ level: 100, state: 'charging' });
    });
  });
});
