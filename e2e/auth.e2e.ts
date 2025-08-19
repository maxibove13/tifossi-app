const { device, expect, element, by, waitFor } = require('detox');

describe('Authentication Flow', () => {
  beforeEach(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {
        notifications: 'YES',
        camera: 'YES',
        faceid: 'YES',
        location: 'inuse',
      },
    });
    await testUtils.waitForApp();
  });

  afterEach(async () => {
    await testUtils.logout().catch(() => {
      // User might not be logged in
    });
  });

  describe('Biometric Authentication', () => {
    beforeEach(async () => {
      // Enable biometrics on the device
      if (device.getPlatform() === 'ios') {
        await device.setBiometricEnrollment(true);
      }
    });

    it('should enable biometric login after successful password login', async () => {
      // First login with password
      await testUtils.loginTestUser();

      // Navigate to profile settings
      await element(by.id('profile-tab')).tap();
      await element(by.id('security-settings')).tap();

      await waitFor(element(by.id('security-settings-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Enable biometric login
      await element(by.id('enable-biometric-toggle')).tap();

      // Should prompt for biometric confirmation
      if (device.getPlatform() === 'ios') {
        await waitFor(element(by.text('Use Face ID to sign in?')))
          .toBeVisible()
          .withTimeout(3000);

        await device.matchBiometric();
      }

      // Verify biometric is enabled
      await waitFor(element(by.text('Biometric login enabled')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should login with biometric authentication', async () => {
      // Assuming biometric is already set up
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap biometric login option
      await element(by.id('biometric-login-button')).tap();

      // Simulate successful biometric authentication
      if (device.getPlatform() === 'ios') {
        await device.matchBiometric();
      } else {
        await device.selectBiometric('FINGERPRINT');
      }

      // Should be logged in successfully
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should fallback to password when biometric fails', async () => {
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('biometric-login-button')).tap();

      // Simulate failed biometric authentication
      if (device.getPlatform() === 'ios') {
        await device.unmatchBiometric();
      }

      // Should show fallback to password
      await waitFor(element(by.text('Use password instead')))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.text('Use password instead')).tap();

      // Should show password fields
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
    });

    it('should handle biometric permission denial', async () => {
      // Disable biometrics
      await device.setBiometricEnrollment(false);

      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Biometric button should not be visible
      await expect(element(by.id('biometric-login-button'))).not.toExist();

      // Should show only password login
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
    });
  });

  describe('Session Management', () => {
    it('should maintain session across app restarts', async () => {
      await testUtils.loginTestUser();

      // Verify logged in state
      await expect(element(by.id('home-screen'))).toBeVisible();

      // Restart the app
      await device.terminateApp();
      await device.launchApp();
      await testUtils.waitForApp();

      // Should still be logged in
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should handle session expiry gracefully', async () => {
      await testUtils.loginTestUser();

      // Mock session expiry by clearing token
      await testUtils.mockApiResponse('/auth/verify', {
        status: 401,
        error: 'Token expired',
      });

      // Try to access protected resource
      await element(by.id('profile-tab')).tap();

      // Should redirect to login
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.text('Session expired. Please login again'))).toBeVisible();
    });

    it('should handle concurrent login from different device', async () => {
      await testUtils.loginTestUser();

      // Mock concurrent login response
      await testUtils.mockApiResponse('/auth/status', {
        status: 409,
        error: 'Account logged in elsewhere',
      });

      // Navigate to trigger auth check
      await element(by.id('cart-tab')).tap();

      // Should show concurrent session dialog
      await waitFor(element(by.text('Account accessed from another device')))
        .toBeVisible()
        .withTimeout(5000);

      // User can choose to continue or logout
      await expect(element(by.text('Continue here'))).toBeVisible();
      await expect(element(by.text('Logout'))).toBeVisible();
    });

    it('should handle background/foreground transitions', async () => {
      await testUtils.loginTestUser();

      // Send app to background
      await device.sendToHome();

      // Wait for background state
      await testUtils.waitForLoading();

      // Return to foreground
      await device.launchApp({ newInstance: false });

      // Should maintain session
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // But should prompt for biometric re-authentication if enabled
      try {
        await waitFor(element(by.text('Authenticate to continue')))
          .toBeVisible()
          .withTimeout(2000);

        if (device.getPlatform() === 'ios') {
          await device.matchBiometric();
        }
      } catch {
        // Biometric re-auth not required for this test
      }
    });
  });

  describe('Two-Factor Authentication', () => {
    it('should enable 2FA from security settings', async () => {
      await testUtils.loginTestUser();

      await element(by.id('profile-tab')).tap();
      await element(by.id('security-settings')).tap();

      await waitFor(element(by.id('security-settings-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Enable 2FA
      await element(by.id('enable-2fa-toggle')).tap();

      // Should show QR code for authenticator setup
      await waitFor(element(by.id('qr-code-setup')))
        .toBeVisible()
        .withTimeout(3000);

      // Enter verification code
      await element(by.id('2fa-verification-code')).typeText('123456');
      await element(by.id('confirm-2fa-setup')).tap();

      // Should show success message
      await waitFor(element(by.text('Two-factor authentication enabled')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should require 2FA code during login when enabled', async () => {
      // Mock user with 2FA enabled
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('email-input')).typeText('2fa-user@tifossi.com');
      await element(by.id('password-input')).typeText('testpass123');
      await element(by.id('submit-login')).tap();

      // Should show 2FA verification screen
      await waitFor(element(by.id('2fa-verification-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Enter 2FA code
      await element(by.id('2fa-code-input')).typeText('123456');
      await element(by.id('verify-2fa-code')).tap();

      // Should complete login
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should show backup codes for 2FA recovery', async () => {
      await testUtils.loginTestUser();

      await element(by.id('profile-tab')).tap();
      await element(by.id('security-settings')).tap();

      await waitFor(element(by.id('security-settings-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('view-backup-codes')).tap();

      await waitFor(element(by.id('backup-codes-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Should show backup codes
      await expect(element(by.id('backup-code-0'))).toBeVisible();
      await expect(element(by.id('backup-code-1'))).toBeVisible();

      // Should be able to regenerate codes
      await element(by.id('regenerate-codes')).tap();

      await waitFor(element(by.text('New backup codes generated')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Account Security', () => {
    beforeEach(async () => {
      await testUtils.loginTestUser();
    });

    it('should allow changing password with current password verification', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('security-settings')).tap();

      await waitFor(element(by.id('security-settings-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('change-password-button')).tap();

      await waitFor(element(by.id('change-password-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Fill password change form
      await element(by.id('current-password-input')).typeText('testpass123');
      await element(by.id('new-password-input')).typeText('NewPass123!');
      await element(by.id('confirm-new-password-input')).typeText('NewPass123!');

      await element(by.id('submit-password-change')).tap();

      // Should show success message
      await waitFor(element(by.text('Password changed successfully')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show login history and active sessions', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('security-settings')).tap();

      await waitFor(element(by.id('security-settings-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('login-history-button')).tap();

      await waitFor(element(by.id('login-history-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Should show login entries
      await expect(element(by.id('login-entry-0'))).toBeVisible();
      await expect(element(by.id('current-session'))).toBeVisible();

      // Should be able to terminate other sessions
      await expect(element(by.id('terminate-other-sessions'))).toBeVisible();
    });

    it('should handle account lockout after failed attempts', async () => {
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await element(by.id('email-input')).clearText();
        await element(by.id('password-input')).clearText();

        await element(by.id('email-input')).typeText('test@tifossi.com');
        await element(by.id('password-input')).typeText('wrongpassword');
        await element(by.id('submit-login')).tap();

        if (i < 4) {
          await waitFor(element(by.text('Invalid email or password')))
            .toBeVisible()
            .withTimeout(3000);
        }
      }

      // Should show account lockout message
      await waitFor(element(by.text('Account temporarily locked')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.text('Too many failed attempts'))).toBeVisible();
    });
  });

  describe('Social Login', () => {
    it('should allow Google OAuth login', async () => {
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('google-login-button')).tap();

      // Should open OAuth WebView
      await waitFor(element(by.id('oauth-webview')))
        .toBeVisible()
        .withTimeout(10000);

      // Mock successful OAuth flow
      await testUtils.mockApiResponse('/auth/oauth/callback', {
        status: 200,
        user: {
          email: 'test@gmail.com',
          name: 'Test User',
        },
      });

      // Should complete login
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(15000);
    });

    it('should handle OAuth cancellation', async () => {
      await element(by.id('login-button')).tap();

      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('google-login-button')).tap();

      await waitFor(element(by.id('oauth-webview')))
        .toBeVisible()
        .withTimeout(10000);

      // Cancel OAuth flow
      await element(by.id('oauth-cancel-button')).tap();

      // Should return to login screen
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Deep Link Authentication', () => {
    it('should handle password reset deep link', async () => {
      await device.launchApp({
        url: 'tifossi://auth/reset-password?token=test-token&email=test@example.com',
        newInstance: true,
      });

      // Should open password reset screen directly
      await waitFor(element(by.id('reset-password-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Email should be pre-filled
      await expect(element(by.id('email-display'))).toHaveText('test@example.com');

      // Enter new password
      await element(by.id('new-password-input')).typeText('NewPassword123!');
      await element(by.id('confirm-password-input')).typeText('NewPassword123!');

      await element(by.id('submit-reset')).tap();

      // Should show success message
      await waitFor(element(by.text('Password reset successfully')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should handle email verification deep link', async () => {
      await device.launchApp({
        url: 'tifossi://auth/verify-email?token=verify-token&email=new@example.com',
        newInstance: true,
      });

      // Should show email verification success
      await waitFor(element(by.id('email-verified-screen')))
        .toBeVisible()
        .withTimeout(10000);

      await expect(element(by.text('Email verified successfully'))).toBeVisible();
      await expect(element(by.id('continue-to-login'))).toBeVisible();
    });

    it('should handle magic link authentication', async () => {
      await device.launchApp({
        url: 'tifossi://auth/magic-login?token=magic-token&email=magic@example.com',
        newInstance: true,
      });

      // Should automatically log in via magic link
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(15000);

      // Should show magic link success notification
      await waitFor(element(by.text('Logged in via magic link')))
        .toBeVisible()
        .withTimeout(3000);
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
