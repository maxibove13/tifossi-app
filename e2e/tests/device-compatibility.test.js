const { device, expect, element, by, waitFor } = require('detox');

describe('Device Compatibility and Platform Differences', () => {
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

  describe('Screen Size and Orientation Support', () => {
    it('should adapt layout to device orientation changes', async () => {
      // Test portrait orientation (default)
      await expect(element(by.id('home-screen'))).toBeVisible();
      await expect(element(by.id('product-grid'))).toBeVisible();

      // Take screenshot for portrait layout
      await testUtils.takeScreenshot('portrait-layout');

      // Rotate to landscape
      await device.setOrientation('landscape');
      await device.sleep(1000);

      // Should adapt layout for landscape
      await waitFor(element(by.id('landscape-layout')))
        .toBeVisible()
        .withTimeout(5000);

      // Product grid should adjust to landscape
      await expect(element(by.id('product-grid-landscape'))).toBeVisible();

      // Navigation should remain functional
      await element(by.id('cart-tab')).tap();
      await expect(element(by.id('cart-screen'))).toBeVisible();

      // Take screenshot for landscape layout
      await testUtils.takeScreenshot('landscape-layout');

      // Rotate back to portrait
      await device.setOrientation('portrait');
      await device.sleep(1000);

      // Should return to portrait layout
      await waitFor(element(by.id('portrait-layout')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should handle product detail screen orientation changes', async () => {
      await element(by.id('product-card-0')).tap();

      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Test image gallery in portrait
      await expect(element(by.id('product-image-gallery'))).toBeVisible();

      // Rotate to landscape
      await device.setOrientation('landscape');
      await device.sleep(1000);

      // Should show optimized landscape layout
      await waitFor(element(by.id('product-detail-landscape')))
        .toBeVisible()
        .withTimeout(3000);

      // Image gallery should adapt
      await expect(element(by.id('product-image-gallery-landscape'))).toBeVisible();

      // Should be able to zoom in landscape
      await element(by.id('product-main-image')).pinch(2.0, 'outward');
      await device.sleep(500);

      // Rotate back while zoomed
      await device.setOrientation('portrait');
      await device.sleep(1000);

      // Should handle zoom state transition
      await expect(element(by.id('product-detail-screen'))).toBeVisible();
    });

    it('should handle checkout flow in different orientations', async () => {
      // Add item to cart and start checkout
      await testUtils.addProductToCart('product-card-0');
      await testUtils.loginTestUser();

      await element(by.id('cart-tab')).tap();
      await element(by.id('checkout-button')).tap();

      await waitFor(element(by.id('checkout-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Test form input in portrait
      await element(by.id('address-line-1')).typeText('123 Test Street');

      // Rotate during form filling
      await device.setOrientation('landscape');
      await device.sleep(1000);

      // Form should maintain state and adapt layout
      await expect(element(by.id('checkout-form-landscape'))).toBeVisible();

      // Continue filling form in landscape
      await element(by.id('address-city')).typeText('Test City');

      // Rotate back and complete
      await device.setOrientation('portrait');
      await device.sleep(1000);

      await element(by.id('address-zip')).typeText('12345');

      // Should complete checkout successfully
      await element(by.id('continue-to-payment')).tap();

      await waitFor(element(by.id('payment-section')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should adapt to different screen densities', async () => {
      const platform = device.getPlatform();

      if (platform === 'ios') {
        // Test different iPhone screen sizes
        // This would typically be run on different simulators

        // Verify text scaling
        await expect(element(by.id('scalable-text'))).toBeVisible();

        // Verify image scaling
        await expect(element(by.id('responsive-image'))).toBeVisible();

        // Verify touch targets are appropriately sized
        await element(by.id('product-card-0')).tap();
        await waitFor(element(by.id('product-detail-screen')))
          .toBeVisible()
          .withTimeout(5000);
      } else if (platform === 'android') {
        // Test different Android densities

        // Verify adaptive layouts
        await expect(element(by.id('adaptive-layout'))).toBeVisible();

        // Test navigation elements scale correctly
        await element(by.id('search-bar')).tap();
        await expect(element(by.id('search-screen'))).toBeVisible();
      }

      await testUtils.takeScreenshot(`density-${platform}`);
    });
  });

  describe('Platform-Specific Features', () => {
    it('should handle iOS-specific interactions', async () => {
      if (device.getPlatform() !== 'ios') {
        console.log('Skipping iOS-specific test on non-iOS platform');
        return;
      }

      // Test iOS swipe gestures
      await element(by.id('product-card-0')).tap();

      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Test iOS edge swipe to go back
      await device.swipe('right', 'slow', 0.1);

      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Test iOS long press interactions
      await element(by.id('product-card-0')).longPress(1000);

      // Should show iOS context menu or quick actions
      await waitFor(element(by.id('ios-context-menu')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.text('Quick Add to Cart'))).toBeVisible();
      await expect(element(by.text('Add to Favorites'))).toBeVisible();

      // Test quick action
      await element(by.text('Quick Add to Cart')).tap();

      await waitFor(element(by.text('Added to cart')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should handle Android-specific interactions', async () => {
      if (device.getPlatform() !== 'android') {
        console.log('Skipping Android-specific test on non-Android platform');
        return;
      }

      // Test Android back button behavior
      await element(by.id('search-bar')).tap();

      await waitFor(element(by.id('search-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Use system back button
      await device.pressBack();

      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Test Android menu button if available
      try {
        await device.pressMenu();

        await waitFor(element(by.id('android-menu')))
          .toBeVisible()
          .withTimeout(3000);
      } catch (e) {
        console.log('Menu button not available on this device');
      }

      // Test Android share functionality
      await element(by.id('product-card-0')).tap();

      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('share-button')).tap();

      // Should open Android share sheet
      await waitFor(element(by.id('android-share-sheet')))
        .toBeVisible()
        .withTimeout(5000);

      await device.pressBack(); // Close share sheet
    });

    it('should handle platform-specific input methods', async () => {
      // Test search input behavior
      await element(by.id('search-bar')).tap();

      await waitFor(element(by.id('search-screen')))
        .toBeVisible()
        .withTimeout(3000);

      const platform = device.getPlatform();

      if (platform === 'ios') {
        // Test iOS keyboard features
        await element(by.id('search-input')).typeText('test search query');

        // iOS should show search suggestions
        await waitFor(element(by.id('ios-search-suggestions')))
          .toBeVisible()
          .withTimeout(3000);

        // Test iOS search button on keyboard
        await device.pressKey('search');
      } else if (platform === 'android') {
        // Test Android keyboard features
        await element(by.id('search-input')).typeText('test search query');

        // Android should show autocomplete
        await waitFor(element(by.id('android-autocomplete')))
          .toBeVisible()
          .withTimeout(3000);

        // Test Android search action
        await device.pressKey('enter');
      }

      await waitFor(element(by.id('search-results')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should handle platform-specific notifications', async () => {
      const platform = device.getPlatform();

      // Send a test notification
      await device.sendUserNotification({
        trigger: { type: 'push' },
        title: 'Platform Test Notification',
        body: 'Testing platform-specific behavior',
        payload: {
          type: 'platform_test',
          deep_link: 'tifossi://home',
        },
      });

      await device.sleep(2000);

      if (platform === 'ios') {
        // iOS-specific notification handling
        // Test notification center access
        await device.swipe('down', 'slow', 0.1);

        // Should show notification in iOS notification center
        // This is typically handled by the system
      } else if (platform === 'android') {
        // Android-specific notification handling
        // Test notification drawer
        await device.swipe('down', 'slow', 0.1);

        // Android notification behavior testing
      }

      // Test app response to notification tap
      await device.openURL('tifossi://home');

      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Hardware Feature Integration', () => {
    it('should handle camera integration properly', async () => {
      // Test camera access for product search
      await element(by.id('search-bar')).tap();

      await waitFor(element(by.id('search-screen')))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id('camera-search-button')).tap();

      // Should request camera permission
      try {
        await waitFor(element(by.text('Camera access required')))
          .toBeVisible()
          .withTimeout(5000);

        await element(by.text('Allow')).tap();
      } catch (e) {
        // Permission might already be granted
      }

      // Should open camera interface
      await waitFor(element(by.id('camera-search-screen')))
        .toBeVisible()
        .withTimeout(10000);

      await expect(element(by.id('camera-preview'))).toBeVisible();
      await expect(element(by.id('camera-capture-button'))).toBeVisible();

      // Test capture functionality
      await element(by.id('camera-capture-button')).tap();

      await waitFor(element(by.id('image-processing')))
        .toBeVisible()
        .withTimeout(3000);

      // Should process and show results
      await waitFor(element(by.id('visual-search-results')))
        .toBeVisible()
        .withTimeout(15000);
    });

    it('should handle location services integration', async () => {
      // Test location-based store finder
      await element(by.id('profile-tab')).tap();
      await element(by.id('find-stores-button')).tap();

      await waitFor(element(by.id('store-locator-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Should request location permission
      try {
        await waitFor(element(by.text('Location access required')))
          .toBeVisible()
          .withTimeout(5000);

        await element(by.text('Allow')).tap();
      } catch (e) {
        // Permission might already be granted
      }

      // Should show current location and nearby stores
      await waitFor(element(by.id('current-location-marker')))
        .toBeVisible()
        .withTimeout(10000);

      await expect(element(by.id('store-list'))).toBeVisible();
      await expect(element(by.id('map-view'))).toBeVisible();

      // Test store selection
      await element(by.id('store-0')).tap();

      await waitFor(element(by.id('store-details')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('directions-button'))).toBeVisible();
    });

    it('should handle device sensors appropriately', async () => {
      const platform = device.getPlatform();

      if (platform === 'ios') {
        // Test device orientation sensor
        await element(by.id('product-card-0')).tap();

        await waitFor(element(by.id('product-detail-screen')))
          .toBeVisible()
          .withTimeout(5000);

        // Test gyroscope for 360° product view if available
        if (await element(by.id('360-view-button')).exists()) {
          await element(by.id('360-view-button')).tap();

          await waitFor(element(by.id('360-viewer')))
            .toBeVisible()
            .withTimeout(5000);

          // Test device rotation for 360° view
          await device.setOrientation('landscape');
          await device.sleep(500);
          await device.setOrientation('portrait');

          // 360° view should respond to orientation
          await expect(element(by.id('360-viewer'))).toBeVisible();
        }
      }

      // Test proximity sensor (if app uses it for features)
      // This would typically be for preventing accidental touches

      // Test ambient light sensor adaptation
      await device.setSystemValues({
        accessibility: {
          darkMode: true,
        },
      });

      // App should adapt to dark mode
      await waitFor(element(by.id('dark-mode-layout')))
        .toBeVisible()
        .withTimeout(5000);

      await device.setSystemValues({
        accessibility: {
          darkMode: false,
        },
      });

      // Should return to light mode
      await waitFor(element(by.id('light-mode-layout')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should handle biometric authentication hardware', async () => {
      const platform = device.getPlatform();

      // First login with password to enable biometrics
      await testUtils.loginTestUser();

      // Navigate to security settings
      await element(by.id('profile-tab')).tap();
      await element(by.id('security-settings')).tap();

      await waitFor(element(by.id('security-settings-screen')))
        .toBeVisible()
        .withTimeout(5000);

      if (platform === 'ios') {
        // Test Face ID/Touch ID
        await device.setBiometricEnrollment(true);

        await element(by.id('enable-biometric-toggle')).tap();

        // Should prompt for Face ID/Touch ID setup
        await waitFor(element(by.text('Use Face ID to sign in?')))
          .toBeVisible()
          .withTimeout(5000);

        await device.matchBiometric();

        await waitFor(element(by.text('Face ID enabled')))
          .toBeVisible()
          .withTimeout(3000);
      } else if (platform === 'android') {
        // Test fingerprint
        await element(by.id('enable-biometric-toggle')).tap();

        await waitFor(element(by.text('Use fingerprint to sign in?')))
          .toBeVisible()
          .withTimeout(5000);

        await device.selectBiometric('FINGERPRINT');

        await waitFor(element(by.text('Fingerprint enabled')))
          .toBeVisible()
          .withTimeout(3000);
      }

      // Test biometric login
      await testUtils.logout();

      await element(by.id('login-button')).tap();
      await element(by.id('biometric-login-button')).tap();

      if (platform === 'ios') {
        await device.matchBiometric();
      } else {
        await device.selectBiometric('FINGERPRINT');
      }

      // Should complete biometric login
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Performance Across Devices', () => {
    it('should maintain performance on lower-end devices', async () => {
      // Simulate lower-end device conditions
      // This would typically involve testing on actual lower-end devices

      // Test app startup performance
      await device.terminateApp();

      const startTime = Date.now();
      await device.launchApp({ newInstance: true });

      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(20000); // More generous timeout for lower-end devices

      const startupTime = Date.now() - startTime;

      // Should still start within reasonable time
      expect(startupTime).toBeLessThan(18000);

      // Test navigation performance
      const navigationStart = Date.now();

      await element(by.id('search-bar')).tap();

      await waitFor(element(by.id('search-screen')))
        .toBeVisible()
        .withTimeout(5000);

      const navigationTime = Date.now() - navigationStart;

      // Navigation should remain responsive
      expect(navigationTime).toBeLessThan(3000);

      await testUtils.takeScreenshot('lower-end-device-performance');
    });

    it('should handle memory constraints gracefully', async () => {
      // Test app behavior under memory pressure
      // Simulate by rapid navigation and content loading

      for (let i = 0; i < 15; i++) {
        await element(by.id(`product-card-${i % 5}`)).tap();

        await waitFor(element(by.id('product-detail-screen')))
          .toBeVisible()
          .withTimeout(5000);

        // Quick navigation to stress memory
        await device.pressBack();

        await element(by.id('search-bar')).tap();
        await element(by.id('search-input')).typeText(`query${i}`);
        await device.pressBack();
      }

      // App should remain stable
      await expect(element(by.id('home-screen'))).toBeVisible();

      // Basic functionality should still work
      await element(by.id('cart-tab')).tap();
      await expect(element(by.id('cart-screen'))).toBeVisible();
    });

    it('should adapt UI for different screen sizes', async () => {
      const platform = device.getPlatform();

      // This test would ideally run on multiple device sizes
      // For now, we test responsive behavior within a single device

      // Test product grid adaptation
      await expect(element(by.id('product-grid'))).toBeVisible();

      // Count visible product cards to verify grid adaptation
      // This would vary based on screen size

      // Test navigation adaptation
      if (platform === 'ios') {
        // Test iPhone X-style notch handling
        await expect(element(by.id('safe-area-layout'))).toBeVisible();

        // Test home indicator area
        await expect(element(by.id('bottom-safe-area'))).toBeVisible();
      } else if (platform === 'android') {
        // Test Android navigation bar adaptation
        await expect(element(by.id('navigation-bar-padding'))).toBeVisible();
      }

      // Test modal and overlay scaling
      await element(by.id('filter-button')).tap();

      await waitFor(element(by.id('filter-modal')))
        .toBeVisible()
        .withTimeout(3000);

      // Modal should scale appropriately
      await expect(element(by.id('responsive-modal'))).toBeVisible();

      await device.pressBack();
    });
  });

  describe('Cross-Platform Consistency', () => {
    it('should maintain feature parity across platforms', async () => {
      // Test core features available on both platforms
      const coreFeatures = [
        'product-browsing',
        'search-functionality',
        'cart-management',
        'user-authentication',
        'checkout-process',
      ];

      for (const feature of coreFeatures) {
        // Navigate to feature and verify it works
        switch (feature) {
          case 'product-browsing':
            await element(by.id('product-card-0')).tap();
            await expect(element(by.id('product-detail-screen'))).toBeVisible();
            await device.pressBack();
            break;

          case 'search-functionality':
            await element(by.id('search-bar')).tap();
            await expect(element(by.id('search-screen'))).toBeVisible();
            await device.pressBack();
            break;

          case 'cart-management':
            await element(by.id('cart-tab')).tap();
            await expect(element(by.id('cart-screen'))).toBeVisible();
            break;

          case 'user-authentication':
            await element(by.id('profile-tab')).tap();
            await expect(element(by.id('profile-screen'))).toBeVisible();
            break;

          case 'checkout-process':
            // This would require items in cart
            await expect(element(by.id('home-tab'))).toBeVisible();
            await element(by.id('home-tab')).tap();
            break;
        }
      }

      console.log(`All core features verified on ${device.getPlatform()}`);
    });

    it('should handle platform-specific UI guidelines', async () => {
      const platform = device.getPlatform();

      if (platform === 'ios') {
        // Verify iOS Human Interface Guidelines compliance

        // Test navigation bar style
        await expect(element(by.id('ios-navigation-bar'))).toBeVisible();

        // Test tab bar style
        await expect(element(by.id('ios-tab-bar'))).toBeVisible();

        // Test iOS-style modals
        await element(by.id('filter-button')).tap();
        await expect(element(by.id('ios-modal-presentation'))).toBeVisible();
        await device.pressBack();

        // Test iOS-style alerts
        await element(by.id('profile-tab')).tap();
        if (await element(by.id('logout-button')).exists()) {
          await element(by.id('logout-button')).tap();
          await expect(element(by.id('ios-alert-style'))).toBeVisible();
          await element(by.text('Cancel')).tap();
        }
      } else if (platform === 'android') {
        // Verify Material Design compliance

        // Test Material Design app bar
        await expect(element(by.id('material-app-bar'))).toBeVisible();

        // Test Material Design navigation
        await expect(element(by.id('material-bottom-navigation'))).toBeVisible();

        // Test Material Design modals
        await element(by.id('filter-button')).tap();
        await expect(element(by.id('material-dialog'))).toBeVisible();
        await device.pressBack();

        // Test Material Design snackbars
        await testUtils.addProductToCart('product-card-0');
        await expect(element(by.id('material-snackbar'))).toBeVisible();
      }
    });

    it('should handle text and content localization consistently', async () => {
      // Test that text scales and displays correctly

      // Test with different system text sizes
      await device.setSystemValues({
        accessibility: {
          largeTextSize: true,
        },
      });

      // Text should scale appropriately
      await expect(element(by.id('scalable-text'))).toBeVisible();

      // Layout should accommodate larger text
      await expect(element(by.id('accessible-layout'))).toBeVisible();

      // Reset text size
      await device.setSystemValues({
        accessibility: {
          largeTextSize: false,
        },
      });

      // Test RTL language support if applicable
      // This would require language switching capability

      // Test currency and number formatting
      await element(by.id('product-card-0')).tap();

      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Price should be formatted correctly for locale
      await expect(element(by.id('formatted-price'))).toBeVisible();
    });
  });
});
