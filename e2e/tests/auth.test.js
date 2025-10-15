const { device, expect, element, by, waitFor } = require('detox');

describe('Authentication Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await testUtils.waitForApp();
  });

  afterEach(async () => {
    await testUtils.logout().catch(() => {
      // User might not be logged in
    });
  });

  describe('User Registration', () => {
    it('should allow new user to register successfully', async () => {
      // Navigate to signup screen
      await element(by.id('signup-button')).tap();

      // Wait for signup screen to load
      await waitFor(element(by.id('signup-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Fill registration form
      await element(by.id('first-name-input')).typeText('Test');
      await element(by.id('last-name-input')).typeText('User');
      await element(by.id('email-input')).typeText('test.user@example.com');
      await element(by.id('password-input')).typeText('SecurePass123!');
      await element(by.id('confirm-password-input')).typeText('SecurePass123!');

      // Accept terms and conditions
      await element(by.id('terms-checkbox')).tap();

      // Submit registration
      await element(by.id('submit-signup')).tap();

      // Wait for email verification screen
      await waitFor(element(by.id('email-verification-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Verify success message
      await expect(element(by.text('Please check your email'))).toBeVisible();
    });

    it('should show validation errors for invalid input', async () => {
      await element(by.id('signup-button')).tap();

      await waitFor(element(by.id('signup-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Try to submit with empty fields
      await element(by.id('submit-signup')).tap();

      // Check for validation errors
      await expect(element(by.text('First name is required'))).toBeVisible();
      await expect(element(by.text('Email is required'))).toBeVisible();
      await expect(element(by.text('Password is required'))).toBeVisible();
    });

    it('should show error for existing email', async () => {
      await element(by.id('signup-button')).tap();

      await waitFor(element(by.id('signup-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Fill form with existing email
      await element(by.id('first-name-input')).typeText('Test');
      await element(by.id('last-name-input')).typeText('User');
      await element(by.id('email-input')).typeText('existing@example.com');
      await element(by.id('password-input')).typeText('SecurePass123!');
      await element(by.id('confirm-password-input')).typeText('SecurePass123!');
      await element(by.id('terms-checkbox')).tap();

      await element(by.id('submit-signup')).tap();

      // Wait for error message
      await waitFor(element(by.text('Email already exists')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('User Login', () => {
    it('should allow existing user to login successfully', async () => {
      await testUtils.loginTestUser();

      // Verify successful login by checking for home screen
      await expect(element(by.id('home-screen'))).toBeVisible();

      // Verify user is logged in by checking profile tab
      await element(by.id('profile-tab')).tap();
      await expect(element(by.text('test@tifossi.com'))).toBeVisible();
    });

    it('should show error for invalid credentials', async () => {
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Enter invalid credentials
      await element(by.id('email-input')).typeText('invalid@example.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      await element(by.id('submit-login')).tap();

      // Wait for error message
      await waitFor(element(by.text('Invalid email or password')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should handle forgot password flow', async () => {
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap forgot password link
      await element(by.id('forgot-password-link')).tap();

      // Wait for forgot password screen
      await waitFor(element(by.id('forgot-password-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Enter email
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('submit-reset')).tap();

      // Wait for success message
      await waitFor(element(by.text('Password reset email sent')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('User Logout', () => {
    beforeEach(async () => {
      await testUtils.loginTestUser();
    });

    it('should allow user to logout successfully', async () => {
      // Navigate to profile tab
      await element(by.id('profile-tab')).tap();

      // Tap logout button
      await element(by.id('logout-button')).tap();

      // Confirm logout in dialog
      await element(by.text('Logout')).tap();

      // Wait for auth screen to appear
      await waitFor(element(by.id('auth-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify login button is visible
      await expect(element(by.id('login-button'))).toBeVisible();
    });
  });

  describe('Email Verification', () => {
    it('should handle email verification flow', async () => {
      // This would typically involve:
      // 1. Registering a new user
      // 2. Receiving verification code (mocked)
      // 3. Entering verification code
      // 4. Confirming account activation

      await element(by.id('signup-button')).tap();

      // Fill minimal registration form
      await element(by.id('email-input')).typeText('verify@example.com');
      await element(by.id('password-input')).typeText('SecurePass123!');
      await element(by.id('terms-checkbox')).tap();
      await element(by.id('submit-signup')).tap();

      // Wait for verification screen
      await waitFor(element(by.id('email-verification-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Enter verification code (mocked)
      await element(by.id('verification-code-input')).typeText('123456');
      await element(by.id('verify-email-button')).tap();

      // Wait for success screen
      await waitFor(element(by.id('verification-success-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.text('Email verified successfully'))).toBeVisible();
    });
  });
});
