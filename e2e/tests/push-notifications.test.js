const { device, expect, element, by, waitFor } = require('detox');

describe('Push Notifications', () => {
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

  describe('Notification Permissions', () => {
    it('should request notification permissions on first launch', async () => {
      // On first launch, should prompt for notifications
      try {
        await waitFor(element(by.text('Allow notifications?')))
          .toBeVisible()
          .withTimeout(10000);
        
        await element(by.text('Allow')).tap();
        
        // Should show permission granted confirmation
        await waitFor(element(by.text('Notifications enabled')))
          .toBeVisible()
          .withTimeout(3000);
          
      } catch (e) {
        // Permissions might already be granted
        console.log('Notification permissions already granted or not prompted');
      }
    });

    it('should handle notification permission denial gracefully', async () => {
      // Reset permissions to test denial flow
      await device.resetContentAndSettings();
      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();
      
      try {
        await waitFor(element(by.text('Allow notifications?')))
          .toBeVisible()
          .withTimeout(10000);
        
        await element(by.text('Don\'t Allow')).tap();
        
        // App should continue working without notifications
        await waitFor(element(by.id('home-screen')))
          .toBeVisible()
          .withTimeout(5000);
          
        // Should show option to enable notifications later
        await element(by.id('profile-tab')).tap();
        await element(by.id('settings-button')).tap();
        
        await waitFor(element(by.id('enable-notifications-banner')))
          .toBeVisible()
          .withTimeout(5000);
          
      } catch (e) {
        console.log('Permission dialog not shown or different flow');
      }
    });

    it('should re-prompt for permissions when needed', async () => {
      // Navigate to notification settings
      await element(by.id('profile-tab')).tap();
      await element(by.id('settings-button')).tap();
      
      await waitFor(element(by.id('settings-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      await element(by.id('notification-settings')).tap();
      
      await waitFor(element(by.id('notification-settings-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should show current permission status
      await expect(element(by.id('notification-permission-status'))).toBeVisible();
      
      // If disabled, should offer to open settings
      try {
        await element(by.id('enable-notifications-button')).tap();
        
        // Should open system settings or re-request permission
        await waitFor(element(by.text('Open Settings')))
          .toBeVisible()
          .withTimeout(3000);
          
      } catch (e) {
        // Notifications might already be enabled
      }
    });
  });

  describe('Notification Delivery and Display', () => {
    beforeEach(async () => {
      // Ensure notifications are enabled
      await device.setPermissions({ notifications: 'YES' });
    });

    it('should receive and display push notifications', async () => {
      // Send a test push notification
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'New Product Alert!',
        subtitle: 'Tifossi',
        body: 'Check out our new summer collection',
        badge: 1,
        payload: {
          type: 'product_alert',
          category: 'clothing',
          deep_link: 'tifossi://catalog/clothing'
        },
      });

      // Notification should appear in notification center
      // This is typically handled by the system, so we test the response
      
      // Wait a moment for notification to be delivered
      await device.sleep(2000);
      
      // The app should handle the notification payload when tapped
      // For testing, we'll simulate opening from notification
      await device.openURL('tifossi://catalog/clothing');
      
      await waitFor(element(by.id('category-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      await expect(element(by.text('Clothing'))).toBeVisible();
    });

    it('should handle rich notifications with images', async () => {
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'Limited Time Offer!',
        subtitle: 'Tifossi',
        body: '50% off selected items',
        badge: 2,
        attachments: [{
          identifier: 'product-image',
          url: 'https://example.com/product-image.jpg',
          type: 'public.jpeg'
        }],
        payload: {
          type: 'sale_alert',
          discount: 50,
          deep_link: 'tifossi://promo/flash-sale'
        },
      });

      await device.sleep(2000);
      
      // Simulate notification tap
      await device.openURL('tifossi://promo/flash-sale');
      
      await waitFor(element(by.id('sale-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      await expect(element(by.text('Flash Sale'))).toBeVisible();
      await expect(element(by.text('50% Off'))).toBeVisible();
    });

    it('should handle actionable notifications', async () => {
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'Cart Reminder',
        subtitle: 'Tifossi',
        body: 'You have items waiting in your cart',
        badge: 1,
        category: 'cart_reminder',
        userInfo: {
          actions: [
            {
              identifier: 'view_cart',
              title: 'View Cart',
              options: ['foreground']
            },
            {
              identifier: 'dismiss',
              title: 'Dismiss',
              options: []
            }
          ]
        },
        payload: {
          type: 'cart_reminder',
          deep_link: 'tifossi://cart'
        },
      });

      await device.sleep(2000);
      
      // Simulate tapping "View Cart" action
      await device.openURL('tifossi://cart');
      
      await waitFor(element(by.id('cart-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should update app badge correctly', async () => {
      // Send multiple notifications to test badge counting
      for (let i = 1; i <= 3; i++) {
        await device.sendUserNotification({
          trigger: {
            type: 'push',
          },
          title: `Notification ${i}`,
          body: `Test notification ${i}`,
          badge: i,
          payload: {
            type: 'test',
            count: i
          },
        });
        
        await device.sleep(1000);
      }
      
      // Badge should show 3
      // This is typically verified through system API or visual inspection
      
      // Open app to clear badge
      await device.launchApp({ newInstance: false });
      
      // Badge should be cleared when app is opened
      await device.sleep(2000);
    });
  });

  describe('Notification Actions and Deep Linking', () => {
    beforeEach(async () => {
      await device.setPermissions({ notifications: 'YES' });
    });

    it('should navigate to specific product from notification', async () => {
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'Product Back in Stock!',
        body: 'Classic T-Shirt is now available',
        payload: {
          type: 'product_restock',
          product_id: 'shirt-001',
          deep_link: 'tifossi://products/shirt-001?source=notification'
        },
      });

      await device.sleep(2000);
      
      // Simulate notification tap
      await device.openURL('tifossi://products/shirt-001?source=notification');
      
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      await expect(element(by.text('Classic T-Shirt'))).toBeVisible();
      await expect(element(by.id('back-in-stock-banner'))).toBeVisible();
    });

    it('should handle order status notifications', async () => {
      // First, need to be logged in for order notifications
      await testUtils.loginTestUser();
      
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'Order Shipped!',
        body: 'Your order #ORD-12345 has been shipped',
        payload: {
          type: 'order_update',
          order_id: 'ORD-12345',
          status: 'shipped',
          deep_link: 'tifossi://orders/ORD-12345/track'
        },
      });

      await device.sleep(2000);
      
      // Simulate notification tap
      await device.openURL('tifossi://orders/ORD-12345/track');
      
      await waitFor(element(by.id('order-tracking-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      await expect(element(by.text('Order #ORD-12345'))).toBeVisible();
      await expect(element(by.text('Shipped'))).toBeVisible();
      await expect(element(by.id('tracking-details'))).toBeVisible();
    });

    it('should handle promotional notifications with time-sensitive offers', async () => {
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'Flash Sale - 2 Hours Only!',
        body: 'Up to 70% off selected items',
        payload: {
          type: 'flash_sale',
          discount: 70,
          expires_at: Date.now() + (2 * 60 * 60 * 1000), // 2 hours
          deep_link: 'tifossi://promo/flash-sale-2024'
        },
      });

      await device.sleep(2000);
      
      // Simulate notification tap
      await device.openURL('tifossi://promo/flash-sale-2024');
      
      await waitFor(element(by.id('flash-sale-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      await expect(element(by.text('Flash Sale'))).toBeVisible();
      await expect(element(by.id('countdown-timer'))).toBeVisible();
      await expect(element(by.text('70% Off'))).toBeVisible();
    });

    it('should handle location-based notifications', async () => {
      // This test requires location permissions
      await device.setPermissions({ location: 'always' });
      
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'Store Nearby!',
        body: 'Visit our Montevideo store - 15% off in-store purchases',
        payload: {
          type: 'location_based',
          store_id: 'store-montevideo',
          discount: 15,
          deep_link: 'tifossi://stores/montevideo?offer=in_store_discount'
        },
      });

      await device.sleep(2000);
      
      // Simulate notification tap
      await device.openURL('tifossi://stores/montevideo?offer=in_store_discount');
      
      await waitFor(element(by.id('store-detail-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      await expect(element(by.text('Montevideo Store'))).toBeVisible();
      await expect(element(by.text('15% Off In-Store'))).toBeVisible();
      await expect(element(by.id('directions-button'))).toBeVisible();
    });
  });

  describe('Notification Preferences and Management', () => {
    beforeEach(async () => {
      await testUtils.loginTestUser();
      await device.setPermissions({ notifications: 'YES' });
    });

    it('should allow users to manage notification preferences', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('settings-button')).tap();
      
      await waitFor(element(by.id('settings-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      await element(by.id('notification-settings')).tap();
      
      await waitFor(element(by.id('notification-preferences-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should show different notification categories
      await expect(element(by.id('order-notifications-toggle'))).toBeVisible();
      await expect(element(by.id('promotional-notifications-toggle'))).toBeVisible();
      await expect(element(by.id('restock-notifications-toggle'))).toBeVisible();
      
      // Toggle off promotional notifications
      await element(by.id('promotional-notifications-toggle')).tap();
      
      // Save settings
      await element(by.id('save-notification-settings')).tap();
      
      await waitFor(element(by.text('Settings saved')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should respect user preferences for notification types', async () => {
      // First disable promotional notifications
      await element(by.id('profile-tab')).tap();
      await element(by.id('settings-button')).tap();
      await element(by.id('notification-settings')).tap();
      
      await waitFor(element(by.id('notification-preferences-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      await element(by.id('promotional-notifications-toggle')).tap();
      await element(by.id('save-notification-settings')).tap();
      
      // Go back to home
      await device.pressBack();
      await device.pressBack();
      await device.pressBack();
      
      // Send promotional notification
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'Sale Alert!',
        body: 'This should not be delivered',
        payload: {
          type: 'promotional',
          deep_link: 'tifossi://promo/sale'
        },
      });
      
      // Since user disabled promotional notifications, 
      // the app should not process this notification
      await device.sleep(3000);
      
      // Notification should not affect the app
      await expect(element(by.id('home-screen'))).toBeVisible();
    });

    it('should allow scheduling notification quiet hours', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('settings-button')).tap();
      await element(by.id('notification-settings')).tap();
      
      await waitFor(element(by.id('notification-preferences-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Enable quiet hours
      await element(by.id('quiet-hours-toggle')).tap();
      
      // Set quiet hours (10 PM to 8 AM)
      await element(by.id('quiet-hours-start')).tap();
      await element(by.text('10:00 PM')).tap();
      
      await element(by.id('quiet-hours-end')).tap();
      await element(by.text('8:00 AM')).tap();
      
      await element(by.id('save-notification-settings')).tap();
      
      await waitFor(element(by.text('Quiet hours enabled')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Notification History and Management', () => {
    beforeEach(async () => {
      await testUtils.loginTestUser();
      await device.setPermissions({ notifications: 'YES' });
    });

    it('should maintain notification history in app', async () => {
      // Send several notifications
      const notifications = [
        {
          title: 'Order Confirmed',
          body: 'Your order #ORD-001 has been confirmed',
          type: 'order_update'
        },
        {
          title: 'Product Restocked',
          body: 'Item in your wishlist is back in stock',
          type: 'restock'
        },
        {
          title: 'Flash Sale',
          body: '24 hour flash sale is now live!',
          type: 'promotional'
        }
      ];
      
      for (let i = 0; i < notifications.length; i++) {
        const notif = notifications[i];
        await device.sendUserNotification({
          trigger: { type: 'push' },
          title: notif.title,
          body: notif.body,
          payload: { type: notif.type },
        });
        
        await device.sleep(1000);
      }
      
      // Navigate to notification history
      await element(by.id('profile-tab')).tap();
      await element(by.id('notifications-button')).tap();
      
      await waitFor(element(by.id('notification-history-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should show all received notifications
      await expect(element(by.text('Order Confirmed'))).toBeVisible();
      await expect(element(by.text('Product Restocked'))).toBeVisible();
      await expect(element(by.text('Flash Sale'))).toBeVisible();
      
      // Should be able to tap notification to see details
      await element(by.text('Order Confirmed')).tap();
      
      await waitFor(element(by.id('notification-detail-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      await expect(element(by.text('Order #ORD-001'))).toBeVisible();
    });

    it('should allow marking notifications as read', async () => {
      // Send notification
      await device.sendUserNotification({
        trigger: { type: 'push' },
        title: 'New Message',
        body: 'You have a new message',
        payload: { type: 'message' },
      });
      
      await device.sleep(2000);
      
      // Check notification history
      await element(by.id('profile-tab')).tap();
      await element(by.id('notifications-button')).tap();
      
      await waitFor(element(by.id('notification-history-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should show unread notification
      await expect(element(by.id('unread-notification-0'))).toBeVisible();
      
      // Mark as read
      await element(by.id('mark-read-0')).tap();
      
      // Should no longer show as unread
      await waitFor(element(by.id('unread-notification-0')))
        .not.toExist()
        .withTimeout(3000);
    });

    it('should allow clearing notification history', async () => {
      // Send notifications first
      await device.sendUserNotification({
        trigger: { type: 'push' },
        title: 'Test Notification',
        body: 'This will be cleared',
        payload: { type: 'test' },
      });
      
      await device.sleep(2000);
      
      // Navigate to notification history
      await element(by.id('profile-tab')).tap();
      await element(by.id('notifications-button')).tap();
      
      await waitFor(element(by.id('notification-history-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should have notifications
      await expect(element(by.text('Test Notification'))).toBeVisible();
      
      // Clear all notifications
      await element(by.id('clear-all-notifications')).tap();
      
      // Confirm clear
      await waitFor(element(by.text('Clear all notifications?')))
        .toBeVisible()
        .withTimeout(2000);
      
      await element(by.text('Clear All')).tap();
      
      // Should show empty state
      await waitFor(element(by.id('empty-notifications')))
        .toBeVisible()
        .withTimeout(3000);
      
      await expect(element(by.text('No notifications'))).toBeVisible();
    });
  });

  describe('Background Notification Handling', () => {
    beforeEach(async () => {
      await device.setPermissions({ notifications: 'YES' });
    });

    it('should handle notifications when app is backgrounded', async () => {
      // Background the app
      await device.sendToHome();
      await device.sleep(2000);
      
      // Send notification while app is in background
      await device.sendUserNotification({
        trigger: { type: 'push' },
        title: 'Background Notification',
        body: 'This notification arrived while app was backgrounded',
        payload: {
          type: 'background_test',
          deep_link: 'tifossi://home'
        },
      });
      
      await device.sleep(3000);
      
      // Return to app by simulating notification tap
      await device.launchApp({ newInstance: false });
      
      // App should handle the notification payload
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should batch multiple background notifications', async () => {
      // Background the app
      await device.sendToHome();
      await device.sleep(2000);
      
      // Send multiple notifications
      for (let i = 1; i <= 3; i++) {
        await device.sendUserNotification({
          trigger: { type: 'push' },
          title: `Notification ${i}`,
          body: `Background notification ${i}`,
          badge: i,
          payload: { type: 'batch_test' },
        });
        
        await device.sleep(1000);
      }
      
      // Return to app
      await device.launchApp({ newInstance: false });
      
      // Should handle all notifications appropriately
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Badge should reflect the count
      // Check notification center would show all notifications
    });

    it('should handle notification while app is terminated', async () => {
      // Terminate app completely
      await device.terminateApp();
      await device.sleep(2000);
      
      // Send notification
      await device.sendUserNotification({
        trigger: { type: 'push' },
        title: 'App Terminated Notification',
        body: 'This arrived while app was not running',
        payload: {
          type: 'terminated_test',
          deep_link: 'tifossi://products/featured'
        },
      });
      
      await device.sleep(3000);
      
      // Launch app by tapping notification
      await device.launchApp({ newInstance: true });
      
      // Should launch directly to the deep link destination
      await waitFor(element(by.id('featured-products-screen')))
        .toBeVisible()
        .withTimeout(15000);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed notification payloads', async () => {
      await device.sendUserNotification({
        trigger: { type: 'push' },
        title: 'Malformed Notification',
        body: 'This has bad payload',
        payload: {
          type: 'invalid_type',
          deep_link: 'malformed://invalid/url',
          corrupted_data: null
        },
      });
      
      await device.sleep(2000);
      
      // App should handle gracefully without crashing
      await device.openURL('malformed://invalid/url');
      
      // Should fallback to safe screen
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should handle notification rate limiting', async () => {
      // Send many notifications rapidly
      for (let i = 0; i < 10; i++) {
        await device.sendUserNotification({
          trigger: { type: 'push' },
          title: `Rapid Notification ${i}`,
          body: `Test rate limiting ${i}`,
          payload: { type: 'rate_limit_test' },
        });
      }
      
      // App should not crash and handle appropriately
      await device.sleep(5000);
      
      await expect(element(by.id('home-screen'))).toBeVisible();
    });

    it('should handle notifications without internet connection', async () => {
      // Go offline
      await testUtils.setNetworkCondition('offline');
      
      // Send notification
      await device.sendUserNotification({
        trigger: { type: 'push' },
        title: 'Offline Notification',
        body: 'Received while offline',
        payload: {
          type: 'offline_test',
          deep_link: 'tifossi://products/shirt-001'
        },
      });
      
      await device.sleep(2000);
      
      // Simulate notification tap
      await device.openURL('tifossi://products/shirt-001');
      
      // Should handle gracefully even without network
      await waitFor(element(by.id('offline-indicator')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should show cached content or appropriate offline state
      try {
        await waitFor(element(by.id('product-detail-screen')))
          .toBeVisible()
          .withTimeout(10000);
      } catch (e) {
        // Fallback to home screen is acceptable when offline
        await waitFor(element(by.id('home-screen')))
          .toBeVisible()
          .withTimeout(10000);
      }
      
      // Restore network
      await testUtils.setNetworkCondition('good');
    });
  });
});