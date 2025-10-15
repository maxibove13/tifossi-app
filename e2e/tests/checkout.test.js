const { device, expect, element, by, waitFor } = require('detox');

describe('Checkout Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await testUtils.waitForApp();

    // Login as test user
    await testUtils.loginTestUser();

    // Add a product to cart for checkout
    await testUtils.addProductToCart('product-card-0');
  });

  afterEach(async () => {
    await testUtils.logout();
  });

  describe('Shipping Address', () => {
    beforeEach(async () => {
      // Navigate to cart and start checkout
      await element(by.id('cart-tab')).tap();
      await element(by.id('checkout-button')).tap();

      await waitFor(element(by.id('checkout-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should allow selecting existing shipping address', async () => {
      // Wait for shipping address section
      await waitFor(element(by.id('shipping-address-section')))
        .toBeVisible()
        .withTimeout(5000);

      // Select existing address
      await element(by.id('address-option-0')).tap();

      // Verify address is selected
      await expect(element(by.id('selected-address-0'))).toBeVisible();

      // Continue to next step
      await element(by.id('continue-to-payment')).tap();

      await waitFor(element(by.id('payment-section')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should allow adding new shipping address', async () => {
      await waitFor(element(by.id('shipping-address-section')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap add new address
      await element(by.id('add-new-address')).tap();

      await waitFor(element(by.id('new-address-form')))
        .toBeVisible()
        .withTimeout(3000);

      // Fill address form
      await element(by.id('address-line-1')).typeText('123 Test Street');
      await element(by.id('address-city')).typeText('Test City');
      await element(by.id('address-state')).typeText('TS');
      await element(by.id('address-zip')).typeText('12345');
      await element(by.id('address-country')).typeText('Test Country');

      // Save address
      await element(by.id('save-address')).tap();

      // Verify address was added
      await waitFor(element(by.text('123 Test Street')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should validate required address fields', async () => {
      await waitFor(element(by.id('shipping-address-section')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('add-new-address')).tap();

      await waitFor(element(by.id('new-address-form')))
        .toBeVisible()
        .withTimeout(3000);

      // Try to save without filling required fields
      await element(by.id('save-address')).tap();

      // Check for validation errors
      await expect(element(by.text('Address is required'))).toBeVisible();
      await expect(element(by.text('City is required'))).toBeVisible();
      await expect(element(by.text('ZIP code is required'))).toBeVisible();
    });
  });

  describe('Shipping Method', () => {
    beforeEach(async () => {
      // Navigate to checkout and select address
      await element(by.id('cart-tab')).tap();
      await element(by.id('checkout-button')).tap();

      await waitFor(element(by.id('shipping-address-section')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('address-option-0')).tap();
      await element(by.id('continue-to-shipping')).tap();
    });

    it('should display available shipping methods', async () => {
      await waitFor(element(by.id('shipping-method-section')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify shipping options are displayed
      await expect(element(by.id('shipping-standard'))).toBeVisible();
      await expect(element(by.id('shipping-express'))).toBeVisible();
      await expect(element(by.id('shipping-overnight'))).toBeVisible();
    });

    it('should allow selecting shipping method', async () => {
      await waitFor(element(by.id('shipping-method-section')))
        .toBeVisible()
        .withTimeout(5000);

      // Select express shipping
      await element(by.id('shipping-express')).tap();

      // Verify selection
      await expect(element(by.id('selected-shipping-express'))).toBeVisible();

      // Verify total is updated with shipping cost
      await expect(element(by.id('updated-total'))).toBeVisible();
    });

    it('should show pickup option for local stores', async () => {
      await waitFor(element(by.id('shipping-method-section')))
        .toBeVisible()
        .withTimeout(5000);

      // Check for pickup option
      await expect(element(by.id('pickup-option'))).toBeVisible();

      // Select pickup
      await element(by.id('pickup-option')).tap();

      // Should show store selection
      await waitFor(element(by.id('store-selection')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('store-option-0'))).toBeVisible();
    });
  });

  describe('Payment Method', () => {
    beforeEach(async () => {
      // Navigate through checkout steps to payment
      await element(by.id('cart-tab')).tap();
      await element(by.id('checkout-button')).tap();

      // Select address
      await waitFor(element(by.id('shipping-address-section')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('address-option-0')).tap();
      await element(by.id('continue-to-shipping')).tap();

      // Select shipping method
      await waitFor(element(by.id('shipping-method-section')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('shipping-standard')).tap();
      await element(by.id('continue-to-payment')).tap();
    });

    it('should display available payment methods', async () => {
      await waitFor(element(by.id('payment-method-section')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify payment options
      await expect(element(by.id('payment-credit-card'))).toBeVisible();
      await expect(element(by.id('payment-paypal'))).toBeVisible();
      await expect(element(by.id('payment-apple-pay'))).toBeVisible();
    });

    it('should allow entering credit card information', async () => {
      await waitFor(element(by.id('payment-method-section')))
        .toBeVisible()
        .withTimeout(5000);

      // Select credit card
      await element(by.id('payment-credit-card')).tap();

      await waitFor(element(by.id('credit-card-form')))
        .toBeVisible()
        .withTimeout(3000);

      // Fill credit card form
      await element(by.id('card-number')).typeText('4242424242424242');
      await element(by.id('card-expiry')).typeText('12/25');
      await element(by.id('card-cvc')).typeText('123');
      await element(by.id('card-name')).typeText('Test User');

      // Verify form is filled
      await expect(element(by.id('payment-ready'))).toBeVisible();
    });

    it('should validate credit card information', async () => {
      await waitFor(element(by.id('payment-method-section')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('payment-credit-card')).tap();

      await waitFor(element(by.id('credit-card-form')))
        .toBeVisible()
        .withTimeout(3000);

      // Enter invalid card number
      await element(by.id('card-number')).typeText('1234');
      await element(by.id('card-expiry')).typeText('01/20'); // Past date
      await element(by.id('card-cvc')).typeText('12'); // Too short

      // Try to continue
      await element(by.id('continue-to-review')).tap();

      // Check for validation errors
      await expect(element(by.text('Invalid card number'))).toBeVisible();
      await expect(element(by.text('Card has expired'))).toBeVisible();
      await expect(element(by.text('Invalid CVC'))).toBeVisible();
    });
  });

  describe('Order Review and Placement', () => {
    beforeEach(async () => {
      // Complete all checkout steps to reach review
      await element(by.id('cart-tab')).tap();
      await element(by.id('checkout-button')).tap();

      // Select address
      await waitFor(element(by.id('shipping-address-section')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('address-option-0')).tap();
      await element(by.id('continue-to-shipping')).tap();

      // Select shipping
      await waitFor(element(by.id('shipping-method-section')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('shipping-standard')).tap();
      await element(by.id('continue-to-payment')).tap();

      // Select payment
      await waitFor(element(by.id('payment-method-section')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('payment-credit-card')).tap();

      // Fill payment form (using test card)
      await element(by.id('card-number')).typeText('4242424242424242');
      await element(by.id('card-expiry')).typeText('12/25');
      await element(by.id('card-cvc')).typeText('123');
      await element(by.id('card-name')).typeText('Test User');

      await element(by.id('continue-to-review')).tap();
    });

    it('should display order review summary', async () => {
      await waitFor(element(by.id('order-review-section')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify order summary sections
      await expect(element(by.id('order-items-summary'))).toBeVisible();
      await expect(element(by.id('shipping-address-summary'))).toBeVisible();
      await expect(element(by.id('shipping-method-summary'))).toBeVisible();
      await expect(element(by.id('payment-method-summary'))).toBeVisible();
      await expect(element(by.id('order-total-summary'))).toBeVisible();
    });

    it('should allow editing order details from review', async () => {
      await waitFor(element(by.id('order-review-section')))
        .toBeVisible()
        .withTimeout(5000);

      // Edit shipping address
      await element(by.id('edit-shipping-address')).tap();

      await waitFor(element(by.id('shipping-address-section')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify we're back at address selection
      await expect(element(by.id('address-option-0'))).toBeVisible();
    });

    it('should successfully place order', async () => {
      await waitFor(element(by.id('order-review-section')))
        .toBeVisible()
        .withTimeout(5000);

      // Place order
      await element(by.id('place-order-button')).tap();

      // Wait for order confirmation
      await waitFor(element(by.id('order-success-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Verify success elements
      await expect(element(by.text('Order placed successfully!'))).toBeVisible();
      await expect(element(by.id('order-number'))).toBeVisible();
      await expect(element(by.id('estimated-delivery'))).toBeVisible();
    });

    it('should handle payment failure gracefully', async () => {
      await waitFor(element(by.id('order-review-section')))
        .toBeVisible()
        .withTimeout(5000);

      // Mock payment failure by using declined test card
      await element(by.id('edit-payment-method')).tap();

      await waitFor(element(by.id('credit-card-form')))
        .toBeVisible()
        .withTimeout(3000);

      // Clear and enter declined card
      await element(by.id('card-number')).clearText();
      await element(by.id('card-number')).typeText('4000000000000002'); // Declined card

      await element(by.id('continue-to-review')).tap();
      await element(by.id('place-order-button')).tap();

      // Wait for error message
      await waitFor(element(by.text('Payment was declined')))
        .toBeVisible()
        .withTimeout(10000);

      // Verify user is still on checkout
      await expect(element(by.id('order-review-section'))).toBeVisible();
    });
  });

  describe('Order Confirmation', () => {
    beforeEach(async () => {
      // Complete a successful order first
      await element(by.id('cart-tab')).tap();
      await element(by.id('checkout-button')).tap();

      // Quick checkout flow
      await waitFor(element(by.id('shipping-address-section')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('address-option-0')).tap();
      await element(by.id('continue-to-shipping')).tap();

      await waitFor(element(by.id('shipping-method-section')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('shipping-standard')).tap();
      await element(by.id('continue-to-payment')).tap();

      await waitFor(element(by.id('payment-method-section')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('payment-credit-card')).tap();

      await element(by.id('card-number')).typeText('4242424242424242');
      await element(by.id('card-expiry')).typeText('12/25');
      await element(by.id('card-cvc')).typeText('123');
      await element(by.id('card-name')).typeText('Test User');

      await element(by.id('continue-to-review')).tap();

      await waitFor(element(by.id('order-review-section')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('place-order-button')).tap();

      await waitFor(element(by.id('order-success-screen')))
        .toBeVisible()
        .withTimeout(15000);
    });

    it('should display order confirmation details', async () => {
      // Verify order confirmation elements
      await expect(element(by.id('order-number'))).toBeVisible();
      await expect(element(by.id('order-total'))).toBeVisible();
      await expect(element(by.id('estimated-delivery'))).toBeVisible();
      await expect(element(by.id('shipping-address-confirmation'))).toBeVisible();
    });

    it('should allow continuing shopping after order', async () => {
      // Continue shopping
      await element(by.id('continue-shopping-button')).tap();

      // Should return to home screen
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Cart should be empty
      await element(by.id('cart-tab')).tap();
      await expect(element(by.id('empty-cart'))).toBeVisible();
    });

    it('should allow viewing order details', async () => {
      // View order details
      await element(by.id('view-order-details')).tap();

      await waitFor(element(by.id('order-details-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify order details are shown
      await expect(element(by.id('order-items-list'))).toBeVisible();
      await expect(element(by.id('order-status'))).toBeVisible();
      await expect(element(by.id('tracking-info'))).toBeVisible();
    });
  });
});
