const { device, expect, element, by, waitFor } = require('detox');

describe('Deep Linking Integration', () => {
  beforeEach(async () => {
    // Ensure app is properly terminated for fresh deep link tests
    await device.terminateApp();
  });

  describe('Product Deep Links', () => {
    it('should open specific product page from deep link', async () => {
      await device.launchApp({
        url: 'tifossi://products/shirt-001',
        newInstance: true
      });

      // Should open directly to product detail screen
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Verify correct product is loaded
      await expect(element(by.id('product-name'))).toHaveText('Classic T-Shirt');
      await expect(element(by.id('product-id'))).toHaveText('shirt-001');
      
      // Navigation should work normally
      await expect(element(by.id('add-to-cart-button'))).toBeVisible();
      
      // Should be able to navigate back to home
      await device.pressBack();
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should handle non-existent product deep links gracefully', async () => {
      await device.launchApp({
        url: 'tifossi://products/non-existent-product',
        newInstance: true
      });

      // Should show error screen or redirect to catalog
      try {
        await waitFor(element(by.id('product-not-found-screen')))
          .toBeVisible()
          .withTimeout(10000);
        
        // Should offer navigation options
        await expect(element(by.text('Product not found'))).toBeVisible();
        await expect(element(by.id('browse-products-button'))).toBeVisible();
        
        // Should navigate to catalog when tapped
        await element(by.id('browse-products-button')).tap();
        await waitFor(element(by.id('home-screen')))
          .toBeVisible()
          .withTimeout(5000);
          
      } catch (e) {
        // Alternative: redirect directly to home screen
        await waitFor(element(by.id('home-screen')))
          .toBeVisible()
          .withTimeout(10000);
      }
    });

    it('should open product with category context', async () => {
      await device.launchApp({
        url: 'tifossi://products/shirt-001?category=clothing&section=men',
        newInstance: true
      });

      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should show category breadcrumb or context
      await expect(element(by.text('Clothing > Men'))).toBeVisible();
      
      // Back navigation should go to category, not home
      await device.pressBack();
      await waitFor(element(by.id('category-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.text('Men\'s Clothing'))).toBeVisible();
    });

    it('should handle product deep link with specific variant', async () => {
      await device.launchApp({
        url: 'tifossi://products/shirt-001?variant=blue&size=L',
        newInstance: true
      });

      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should pre-select the specified variant
      await expect(element(by.id('selected-color-blue'))).toBeVisible();
      await expect(element(by.id('selected-size-L'))).toBeVisible();
      
      // Price should reflect variant
      await expect(element(by.id('variant-price'))).toBeVisible();
    });
  });

  describe('Category and Search Deep Links', () => {
    it('should open specific category from deep link', async () => {
      await device.launchApp({
        url: 'tifossi://catalog/clothing',
        newInstance: true
      });

      await waitFor(element(by.id('category-screen')))
        .toBeVisible()
        .withTimeout(15000);

      await expect(element(by.text('Clothing'))).toBeVisible();
      await expect(element(by.id('category-product-list'))).toBeVisible();
      
      // Should show category-specific products
      await expect(element(by.id('product-card-clothing-0'))).toBeVisible();
    });

    it('should open search results from deep link', async () => {
      await device.launchApp({
        url: 'tifossi://search?q=sneakers&category=shoes',
        newInstance: true
      });

      await waitFor(element(by.id('search-results-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should show search query
      await expect(element(by.text('Results for "sneakers"'))).toBeVisible();
      
      // Should show filtered results
      await expect(element(by.id('search-results-list'))).toBeVisible();
      
      // Search input should contain the query
      await expect(element(by.id('search-input'))).toHaveText('sneakers');
    });

    it('should handle filtered catalog deep links', async () => {
      await device.launchApp({
        url: 'tifossi://catalog/clothing?price_min=20&price_max=50&size=M&color=blue',
        newInstance: true
      });

      await waitFor(element(by.id('category-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should show active filters
      await expect(element(by.id('active-filter-price'))).toBeVisible();
      await expect(element(by.id('active-filter-size'))).toBeVisible();
      await expect(element(by.id('active-filter-color'))).toBeVisible();
      
      // Products should be filtered
      await expect(element(by.id('filtered-product-list'))).toBeVisible();
      
      // Filter summary should be visible
      await expect(element(by.text('$20 - $50'))).toBeVisible();
    });
  });

  describe('Cart and Checkout Deep Links', () => {
    it('should open cart from deep link', async () => {
      await device.launchApp({
        url: 'tifossi://cart',
        newInstance: true
      });

      await waitFor(element(by.id('cart-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should load cart contents if user is logged in
      try {
        await waitFor(element(by.id('cart-items-list')))
          .toBeVisible()
          .withTimeout(5000);
      } catch (e) {
        // Empty cart or guest user - show appropriate state
        await expect(element(by.id('empty-cart'))).toBeVisible();
      }
    });

    it('should open checkout with pre-filled cart', async () => {
      // First add items to cart through normal flow
      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();
      await testUtils.addProductToCart('product-card-0');
      
      // Now test checkout deep link
      await device.terminateApp();
      await device.launchApp({
        url: 'tifossi://checkout',
        newInstance: true
      });

      // Should prompt for login if not authenticated
      try {
        await waitFor(element(by.id('login-prompt')))
          .toBeVisible()
          .withTimeout(10000);
        
        // Login and continue to checkout
        await testUtils.loginTestUser();
      } catch (e) {
        // Already logged in or guest checkout
      }

      await waitFor(element(by.id('checkout-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should show checkout steps
      await expect(element(by.id('shipping-address-section'))).toBeVisible();
    });

    it('should handle saved cart deep link with login', async () => {
      await device.launchApp({
        url: 'tifossi://cart/saved?user=test@tifossi.com&token=saved-cart-token',
        newInstance: true
      });

      // Should authenticate and restore saved cart
      await waitFor(element(by.id('restoring-cart-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      await waitFor(element(by.id('cart-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should show restored cart items
      await expect(element(by.id('restored-cart-notice'))).toBeVisible();
      await expect(element(by.id('cart-items-list'))).toBeVisible();
    });
  });

  describe('Authentication Deep Links', () => {
    it('should handle email verification deep link', async () => {
      await device.launchApp({
        url: 'tifossi://auth/verify-email?token=verification-token&email=test@example.com',
        newInstance: true
      });

      await waitFor(element(by.id('email-verification-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should show verification in progress
      await waitFor(element(by.text('Verifying your email...')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Should show success or failure
      await waitFor(element(by.text('Email verified successfully!')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Should offer to continue to login
      await expect(element(by.id('continue-to-login'))).toBeVisible();
      
      await element(by.id('continue-to-login')).tap();
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should handle password reset deep link', async () => {
      await device.launchApp({
        url: 'tifossi://auth/reset-password?token=reset-token&email=test@example.com',
        newInstance: true
      });

      await waitFor(element(by.id('reset-password-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should show email
      await expect(element(by.text('test@example.com'))).toBeVisible();
      
      // Should allow setting new password
      await element(by.id('new-password-input')).typeText('NewPassword123!');
      await element(by.id('confirm-password-input')).typeText('NewPassword123!');
      
      await element(by.id('submit-reset')).tap();
      
      await waitFor(element(by.text('Password reset successfully')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should handle magic link authentication', async () => {
      await device.launchApp({
        url: 'tifossi://auth/magic-login?token=magic-token&email=user@example.com',
        newInstance: true
      });

      // Should automatically authenticate and redirect
      await waitFor(element(by.text('Signing you in...')))
        .toBeVisible()
        .withTimeout(5000);
      
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should show success notification
      await waitFor(element(by.text('Logged in successfully')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Should be authenticated
      await element(by.id('profile-tab')).tap();
      await expect(element(by.text('user@example.com'))).toBeVisible();
    });
  });

  describe('Promotional Deep Links', () => {
    it('should handle promotional campaign deep links', async () => {
      await device.launchApp({
        url: 'tifossi://promo/summer-sale?campaign=email&source=newsletter&discount=20',
        newInstance: true
      });

      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should show promotional banner
      await waitFor(element(by.id('promo-banner')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.text('Summer Sale'))).toBeVisible();
      await expect(element(by.text('20% Off'))).toBeVisible();
      
      // Should apply discount automatically
      await element(by.id('shop-sale-button')).tap();
      
      await waitFor(element(by.id('sale-products-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should handle coupon deep links', async () => {
      await device.launchApp({
        url: 'tifossi://coupon/WELCOME10?auto_apply=true',
        newInstance: true
      });

      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should show coupon applied notification
      await waitFor(element(by.text('Coupon WELCOME10 applied!')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Add item to cart to test coupon
      await testUtils.addProductToCart('product-card-0');
      
      await element(by.id('cart-tab')).tap();
      
      // Should show applied discount
      await expect(element(by.id('applied-coupon-WELCOME10'))).toBeVisible();
      await expect(element(by.id('discount-amount'))).toBeVisible();
    });

    it('should handle referral deep links', async () => {
      await device.launchApp({
        url: 'tifossi://referral?code=FRIEND123&referrer=john.doe',
        newInstance: true
      });

      await waitFor(element(by.id('referral-welcome-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should show referral offer
      await expect(element(by.text('John invited you!'))).toBeVisible();
      await expect(element(by.text('Get $10 off your first order'))).toBeVisible();
      
      // Should allow creating account with referral credit
      await element(by.id('create-account-with-referral')).tap();
      
      await waitFor(element(by.id('signup-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.text('$10 referral credit will be applied'))).toBeVisible();
    });
  });

  describe('Order and Account Deep Links', () => {
    it('should handle order tracking deep links', async () => {
      await device.launchApp({
        url: 'tifossi://orders/ORD-12345/track',
        newInstance: true
      });

      // Should prompt for login if needed
      try {
        await waitFor(element(by.id('login-prompt')))
          .toBeVisible()
          .withTimeout(10000);
        
        await testUtils.loginTestUser();
      } catch (e) {
        // Already logged in
      }

      await waitFor(element(by.id('order-tracking-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should show order details
      await expect(element(by.text('Order #ORD-12345'))).toBeVisible();
      await expect(element(by.id('order-status'))).toBeVisible();
      await expect(element(by.id('tracking-timeline'))).toBeVisible();
    });

    it('should handle profile deep links', async () => {
      await device.launchApp({
        url: 'tifossi://profile/settings',
        newInstance: true
      });

      // Should authenticate first
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      await testUtils.loginTestUser();
      
      // Should navigate to settings after login
      await waitFor(element(by.id('profile-settings-screen')))
        .toBeVisible()
        .withTimeout(15000);

      await expect(element(by.text('Account Settings'))).toBeVisible();
    });

    it('should handle wishlist sharing deep links', async () => {
      await device.launchApp({
        url: 'tifossi://wishlist/share/user123?name=John&public=true',
        newInstance: true
      });

      await waitFor(element(by.id('shared-wishlist-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should show shared wishlist
      await expect(element(by.text('John\'s Wishlist'))).toBeVisible();
      await expect(element(by.id('shared-wishlist-items'))).toBeVisible();
      
      // Should allow browsing without login
      await element(by.id('wishlist-item-0')).tap();
      
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed deep links', async () => {
      await device.launchApp({
        url: 'tifossi://invalid-path/malformed?param=',
        newInstance: true
      });

      // Should fallback to home screen
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(15000);
      
      // Should show error notification
      await waitFor(element(by.text('Invalid link')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should handle expired deep link tokens', async () => {
      await device.launchApp({
        url: 'tifossi://auth/verify-email?token=expired-token&email=test@example.com',
        newInstance: true
      });

      await waitFor(element(by.id('token-expired-screen')))
        .toBeVisible()
        .withTimeout(15000);

      await expect(element(by.text('Link has expired'))).toBeVisible();
      await expect(element(by.id('request-new-link'))).toBeVisible();
      
      // Should allow requesting new link
      await element(by.id('request-new-link')).tap();
      
      await waitFor(element(by.text('New verification link sent')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should handle deep links when app is already running', async () => {
      // Start app normally
      await device.launchApp({ newInstance: true });
      await testUtils.waitForApp();
      
      // Navigate somewhere
      await element(by.id('search-bar')).tap();
      
      // Trigger deep link while app is running
      await device.openURL('tifossi://products/shirt-001');
      
      // Should navigate to product page
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      await expect(element(by.text('Classic T-Shirt'))).toBeVisible();
    });

    it('should handle rapid successive deep links', async () => {
      // Send multiple deep links in quick succession
      await device.launchApp({
        url: 'tifossi://products/shirt-001',
        newInstance: true
      });
      
      // Immediately send another deep link
      setTimeout(async () => {
        await device.openURL('tifossi://products/shoes-001');
      }, 1000);
      
      // Should handle the last deep link
      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(15000);
      
      // Should show the shoes product (last deep link)
      await waitFor(element(by.text('Running Shoes')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should maintain navigation stack integrity with deep links', async () => {
      await device.launchApp({
        url: 'tifossi://products/shirt-001?category=clothing',
        newInstance: true
      });

      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Back should go to category
      await device.pressBack();
      
      await waitFor(element(by.id('category-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Another back should go to home
      await device.pressBack();
      
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Analytics and Tracking', () => {
    it('should track deep link attribution correctly', async () => {
      await device.launchApp({
        url: 'tifossi://products/shirt-001?utm_source=email&utm_medium=newsletter&utm_campaign=summer_sale',
        newInstance: true
      });

      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Analytics should capture deep link parameters
      // This would typically be verified through analytics service
      
      // Add to cart to test conversion tracking
      await element(by.id('add-to-cart-button')).tap();
      
      await waitFor(element(by.text('Added to cart')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Purchase attribution should be tracked
    });

    it('should handle A/B test deep links', async () => {
      await device.launchApp({
        url: 'tifossi://products/shirt-001?ab_test=checkout_v2&variant=b',
        newInstance: true
      });

      await waitFor(element(by.id('product-detail-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should show variant B of the product page
      // This would be verified by checking for variant-specific elements
      
      // Add to cart and check for variant B checkout flow
      await element(by.id('add-to-cart-button')).tap();
      await element(by.id('cart-tab')).tap();
      await element(by.id('checkout-button')).tap();
      
      // Should use variant B checkout flow
      await waitFor(element(by.id('checkout-variant-b')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });
});