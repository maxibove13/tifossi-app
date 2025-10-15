/**
 * Mock Firebase Authentication Service
 *
 * This service provides a comprehensive mock implementation of Firebase
 * Authentication for testing the Tifossi backend migration. It supports
 * all major authentication flows, user management, and security features.
 */

const EventEmitter = require('events');
const crypto = require('crypto');

/**
 * Mock Firebase Authentication Service
 * Simulates Firebase Auth SDK behavior for testing
 */
class MockFirebaseAuth extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      apiKey: 'mock-api-key-AIzaSyExample',
      authDomain: 'tifossi-test.firebaseapp.com',
      projectId: 'tifossi-test',
      storageBucket: 'tifossi-test.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:mockappid123',
      responseDelay: config.responseDelay || 300,
      errorRate: config.errorRate || 0.01,
      enableCustomClaims: config.enableCustomClaims !== false,
      ...config,
    };

    // Service state
    this.users = new Map();
    this.sessions = new Map();
    this.verificationCodes = new Map();
    this.refreshTokens = new Map();
    this.customTokens = new Map();
    this.requestCount = 0;
    this.serviceHealth = 'healthy'; // healthy, degraded, down

    // Initialize test data
    this.initializeTestUsers();

    // Start cleanup processes
    this.startSessionCleanup();
    this.startVerificationCodeCleanup();
  }

  /**
   * Initialize test users for consistent testing
   */
  initializeTestUsers() {
    const testUsers = [
      {
        uid: 'firebase-test-user-1',
        email: 'test@tifossi.com',
        password: 'Test123!',
        emailVerified: true,
        displayName: 'Test User',
        photoURL: 'https://example.com/avatar1.jpg',
        disabled: false,
        phoneNumber: '+59899123456',
        customClaims: { role: 'customer', plan: 'premium' },
        createdAt: new Date('2023-01-01').toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
      {
        uid: 'firebase-test-user-2',
        email: 'unverified@tifossi.com',
        password: 'Test123!',
        emailVerified: false,
        displayName: 'Unverified User',
        photoURL: null,
        disabled: false,
        phoneNumber: null,
        customClaims: { role: 'customer' },
        createdAt: new Date('2024-01-01').toISOString(),
        lastSignInTime: null,
      },
      {
        uid: 'firebase-test-user-3',
        email: 'disabled@tifossi.com',
        password: 'Test123!',
        emailVerified: true,
        displayName: 'Disabled User',
        photoURL: null,
        disabled: true,
        phoneNumber: null,
        customClaims: {},
        createdAt: new Date('2023-06-01').toISOString(),
        lastSignInTime: new Date('2023-12-01').toISOString(),
      },
      {
        uid: 'firebase-admin-user',
        email: 'admin@tifossi.com',
        password: 'Admin123!',
        emailVerified: true,
        displayName: 'Admin User',
        photoURL: null,
        disabled: false,
        phoneNumber: '+59899654321',
        customClaims: { role: 'admin', permissions: ['read', 'write', 'admin'] },
        createdAt: new Date('2022-01-01').toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
    ];

    testUsers.forEach((user) => {
      this.users.set(user.email, {
        ...user,
        providerData: [
          {
            uid: user.email,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            providerId: 'password',
          },
        ],
      });
    });
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmailAndPassword(email, password) {
    await this.simulateDelay();
    this.requestCount++;

    if (this.shouldSimulateError()) {
      throw new FirebaseAuthError('auth/network-request-failed', 'Network error occurred');
    }

    const user = this.users.get(email);
    if (!user) {
      throw new FirebaseAuthError('auth/user-not-found', 'No user record found for this email');
    }

    if (user.disabled) {
      throw new FirebaseAuthError('auth/user-disabled', 'User account has been disabled');
    }

    if (user.password !== password) {
      throw new FirebaseAuthError('auth/wrong-password', 'Password is incorrect');
    }

    // Update last sign in time
    user.lastSignInTime = new Date().toISOString();

    const tokens = this.generateTokens(user);
    const session = this.createUserSession(user, tokens);

    this.emit('user.signedIn', { user: this.formatUser(user), tokens });

    return {
      user: this.formatUser(user),
      credential: null,
      operationType: 'signIn',
      additionalUserInfo: null,
      ...tokens,
    };
  }

  /**
   * Create user with email and password
   */
  async createUserWithEmailAndPassword(email, password, displayName) {
    await this.simulateDelay();
    this.requestCount++;

    if (this.shouldSimulateError()) {
      throw new FirebaseAuthError('auth/network-request-failed', 'Network error occurred');
    }

    if (this.users.has(email)) {
      throw new FirebaseAuthError('auth/email-already-in-use', 'Email address is already in use');
    }

    // Validate password strength
    if (!this.validatePassword(password)) {
      throw new FirebaseAuthError(
        'auth/weak-password',
        'Password must be at least 6 characters long'
      );
    }

    const user = {
      uid: this.generateUID(),
      email: email,
      password: password,
      emailVerified: false,
      displayName: displayName || null,
      photoURL: null,
      disabled: false,
      phoneNumber: null,
      customClaims: { role: 'customer' },
      createdAt: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
      providerData: [
        {
          uid: email,
          displayName: displayName || null,
          email: email,
          photoURL: null,
          providerId: 'password',
        },
      ],
    };

    this.users.set(email, user);

    const tokens = this.generateTokens(user);
    const session = this.createUserSession(user, tokens);

    this.emit('user.created', { user: this.formatUser(user), tokens });

    return {
      user: this.formatUser(user),
      credential: null,
      operationType: 'signIn',
      additionalUserInfo: { isNewUser: true },
      ...tokens,
    };
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(idToken) {
    await this.simulateDelay();
    this.requestCount++;

    const session = this.validateSession(idToken);
    const user = session.user;

    if (user.emailVerified) {
      throw new FirebaseAuthError('auth/email-already-verified', 'Email is already verified');
    }

    const verificationCode = Math.random().toString().substr(2, 6);
    this.verificationCodes.set(user.email, {
      code: verificationCode,
      expires: Date.now() + 600000, // 10 minutes
      type: 'email_verification',
    });

    // Simulate email sending
    console.log(`[Mock Firebase] Email verification code for ${user.email}: ${verificationCode}`);

    this.emit('email.verification_sent', { email: user.email, code: verificationCode });

    return { success: true };
  }

  /**
   * Confirm email verification
   */
  async confirmEmailVerification(email, code) {
    await this.simulateDelay();
    this.requestCount++;

    const verification = this.verificationCodes.get(email);
    if (!verification || verification.expires < Date.now()) {
      throw new FirebaseAuthError('auth/expired-action-code', 'Verification code has expired');
    }

    if (verification.code !== code) {
      throw new FirebaseAuthError('auth/invalid-action-code', 'Invalid verification code');
    }

    const user = this.users.get(email);
    if (!user) {
      throw new FirebaseAuthError('auth/user-not-found', 'User not found');
    }

    user.emailVerified = true;
    this.verificationCodes.delete(email);

    this.emit('email.verified', { user: this.formatUser(user) });

    return { success: true };
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email) {
    await this.simulateDelay();
    this.requestCount++;

    // Firebase doesn't reveal whether email exists or not for security
    const resetCode = Math.random().toString().substr(2, 8);
    console.log(`[Mock Firebase] Password reset code for ${email}: ${resetCode}`);

    if (this.users.has(email)) {
      this.verificationCodes.set(email, {
        code: resetCode,
        expires: Date.now() + 3600000, // 1 hour
        type: 'password_reset',
      });

      this.emit('password.reset_sent', { email, code: resetCode });
    }

    return { success: true };
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(email, code, newPassword) {
    await this.simulateDelay();
    this.requestCount++;

    const verification = this.verificationCodes.get(email);
    if (
      !verification ||
      verification.expires < Date.now() ||
      verification.type !== 'password_reset'
    ) {
      throw new FirebaseAuthError('auth/expired-action-code', 'Reset code has expired');
    }

    if (verification.code !== code) {
      throw new FirebaseAuthError('auth/invalid-action-code', 'Invalid reset code');
    }

    if (!this.validatePassword(newPassword)) {
      throw new FirebaseAuthError(
        'auth/weak-password',
        'Password must be at least 6 characters long'
      );
    }

    const user = this.users.get(email);
    if (!user) {
      throw new FirebaseAuthError('auth/user-not-found', 'User not found');
    }

    user.password = newPassword;
    this.verificationCodes.delete(email);

    // Invalidate all existing sessions for this user
    this.invalidateUserSessions(user.uid);

    this.emit('password.reset', { user: this.formatUser(user) });

    return { success: true };
  }

  /**
   * Verify ID token
   */
  async verifyIdToken(idToken) {
    await this.simulateDelay(100); // Faster for token verification
    this.requestCount++;

    const session = this.validateSession(idToken);
    const user = session.user;

    const decodedToken = {
      uid: user.uid,
      email: user.email,
      email_verified: user.emailVerified,
      name: user.displayName,
      picture: user.photoURL,
      phone_number: user.phoneNumber,

      // JWT standard claims
      iss: `https://securetoken.google.com/${this.config.projectId}`,
      aud: this.config.projectId,
      auth_time: Math.floor(new Date(session.createdAt).getTime() / 1000),
      exp: Math.floor(session.expires / 1000),
      iat: Math.floor(new Date(session.createdAt).getTime() / 1000),
      sub: user.uid,

      // Firebase custom claims
      firebase: {
        identities: {
          email: [user.email],
        },
        sign_in_provider: 'password',
      },
    };

    // Add custom claims if enabled
    if (this.config.enableCustomClaims && user.customClaims) {
      Object.assign(decodedToken, user.customClaims);
    }

    return decodedToken;
  }

  /**
   * Get user by UID (Admin SDK simulation)
   */
  async getUser(uid) {
    await this.simulateDelay();
    this.requestCount++;

    const user = Array.from(this.users.values()).find((u) => u.uid === uid);
    if (!user) {
      throw new FirebaseAuthError('auth/user-not-found', 'No user record found');
    }

    return this.formatUser(user);
  }

  /**
   * Get user by email (Admin SDK simulation)
   */
  async getUserByEmail(email) {
    await this.simulateDelay();
    this.requestCount++;

    const user = this.users.get(email);
    if (!user) {
      throw new FirebaseAuthError('auth/user-not-found', 'No user record found');
    }

    return this.formatUser(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(idToken, profileData) {
    await this.simulateDelay();
    this.requestCount++;

    const session = this.validateSession(idToken);
    const user = session.user;

    if (profileData.displayName !== undefined) {
      user.displayName = profileData.displayName;
      user.providerData[0].displayName = profileData.displayName;
    }

    if (profileData.photoURL !== undefined) {
      user.photoURL = profileData.photoURL;
      user.providerData[0].photoURL = profileData.photoURL;
    }

    this.emit('user.updated', { user: this.formatUser(user), changes: profileData });

    return { user: this.formatUser(user) };
  }

  /**
   * Update user email
   */
  async updateEmail(idToken, newEmail) {
    await this.simulateDelay();
    this.requestCount++;

    if (this.users.has(newEmail)) {
      throw new FirebaseAuthError('auth/email-already-in-use', 'Email address is already in use');
    }

    const session = this.validateSession(idToken);
    const user = session.user;
    const oldEmail = user.email;

    // Move user to new email key
    this.users.delete(oldEmail);
    user.email = newEmail;
    user.emailVerified = false; // Reset verification status
    user.providerData[0].email = newEmail;
    this.users.set(newEmail, user);

    this.emit('email.updated', {
      user: this.formatUser(user),
      oldEmail,
      newEmail,
    });

    return { user: this.formatUser(user) };
  }

  /**
   * Update user password
   */
  async updatePassword(idToken, newPassword) {
    await this.simulateDelay();
    this.requestCount++;

    if (!this.validatePassword(newPassword)) {
      throw new FirebaseAuthError(
        'auth/weak-password',
        'Password must be at least 6 characters long'
      );
    }

    const session = this.validateSession(idToken);
    const user = session.user;

    user.password = newPassword;

    // Invalidate other sessions for security
    this.invalidateUserSessions(user.uid, session.sessionId);

    this.emit('password.updated', { user: this.formatUser(user) });

    return { success: true };
  }

  /**
   * Delete user account
   */
  async deleteUser(idToken) {
    await this.simulateDelay();
    this.requestCount++;

    const session = this.validateSession(idToken);
    const user = session.user;

    // Remove user from storage
    this.users.delete(user.email);

    // Invalidate all sessions
    this.invalidateUserSessions(user.uid);

    // Clean up verification codes
    this.verificationCodes.delete(user.email);

    this.emit('user.deleted', { uid: user.uid, email: user.email });

    return { success: true };
  }

  /**
   * Refresh ID token
   */
  async refreshIdToken(refreshToken) {
    await this.simulateDelay();
    this.requestCount++;

    const tokenData = this.refreshTokens.get(refreshToken);
    if (!tokenData || tokenData.expires < Date.now()) {
      throw new FirebaseAuthError('auth/invalid-refresh-token', 'Invalid refresh token');
    }

    const user = this.users.get(tokenData.email);
    if (!user) {
      throw new FirebaseAuthError('auth/user-not-found', 'User not found');
    }

    // Generate new tokens
    const newTokens = this.generateTokens(user);

    // Remove old refresh token
    this.refreshTokens.delete(refreshToken);

    // Update session with new tokens
    const session = Array.from(this.sessions.values()).find((s) => s.refreshToken === refreshToken);

    if (session) {
      Object.assign(session, newTokens);
    }

    return newTokens;
  }

  /**
   * Sign out user
   */
  async signOut(idToken) {
    await this.simulateDelay();
    this.requestCount++;

    const session = this.sessions.get(idToken);
    if (session) {
      this.sessions.delete(idToken);
      this.refreshTokens.delete(session.refreshToken);

      this.emit('user.signedOut', {
        uid: session.user.uid,
        sessionId: session.sessionId,
      });
    }

    return { success: true };
  }

  /**
   * Sign out all devices for a user
   */
  async signOutEverywhere(uid) {
    await this.simulateDelay();
    this.requestCount++;

    this.invalidateUserSessions(uid);

    this.emit('user.signedOutEverywhere', { uid });

    return { success: true };
  }

  /**
   * Create custom token (Admin SDK)
   */
  async createCustomToken(uid, additionalClaims = {}) {
    await this.simulateDelay();
    this.requestCount++;

    const user = Array.from(this.users.values()).find((u) => u.uid === uid);
    if (!user) {
      throw new FirebaseAuthError('auth/user-not-found', 'No user record found');
    }

    const customToken = this.generateCustomToken(user, additionalClaims);

    this.customTokens.set(customToken, {
      uid,
      additionalClaims,
      expires: Date.now() + 3600000, // 1 hour
      createdAt: new Date().toISOString(),
    });

    return customToken;
  }

  /**
   * Set custom user claims (Admin SDK)
   */
  async setCustomUserClaims(uid, customClaims) {
    await this.simulateDelay();
    this.requestCount++;

    const user = Array.from(this.users.values()).find((u) => u.uid === uid);
    if (!user) {
      throw new FirebaseAuthError('auth/user-not-found', 'No user record found');
    }

    user.customClaims = customClaims;

    // Invalidate existing sessions to force token refresh
    this.invalidateUserSessions(uid);

    this.emit('user.customClaimsSet', { uid, customClaims });

    return { success: true };
  }

  /**
   * List users (Admin SDK) - paginated
   */
  async listUsers(pageSize = 1000, pageToken = null) {
    await this.simulateDelay();
    this.requestCount++;

    const users = Array.from(this.users.values());
    const startIndex = pageToken ? parseInt(pageToken) : 0;
    const endIndex = Math.min(startIndex + pageSize, users.length);
    const pageUsers = users.slice(startIndex, endIndex);

    return {
      users: pageUsers.map((user) => this.formatUser(user)),
      pageToken: endIndex < users.length ? endIndex.toString() : undefined,
    };
  }

  // Utility Methods

  validateSession(idToken) {
    const session = this.sessions.get(idToken);
    if (!session || session.expires < Date.now()) {
      throw new FirebaseAuthError('auth/id-token-expired', 'ID token has expired');
    }
    return session;
  }

  validatePassword(password) {
    return password && password.length >= 6;
  }

  generateTokens(user) {
    const now = Date.now();
    const idToken = this.generateIdToken(user);
    const refreshToken = this.generateRefreshToken(user);
    const accessToken = this.generateAccessToken(user);

    // Store refresh token
    this.refreshTokens.set(refreshToken, {
      email: user.email,
      uid: user.uid,
      expires: now + 2592000000, // 30 days
      createdAt: new Date().toISOString(),
    });

    return {
      idToken,
      refreshToken,
      accessToken,
      expiresIn: '3600', // 1 hour
    };
  }

  createUserSession(user, tokens) {
    const sessionId = this.generateSessionId();
    const session = {
      sessionId,
      user,
      ...tokens,
      expires: Date.now() + 3600000, // 1 hour
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(tokens.idToken, session);
    return session;
  }

  invalidateUserSessions(uid, exceptSessionId = null) {
    const sessionsToDelete = [];

    for (const [idToken, session] of this.sessions.entries()) {
      if (session.user.uid === uid && session.sessionId !== exceptSessionId) {
        sessionsToDelete.push(idToken);
        this.refreshTokens.delete(session.refreshToken);
      }
    }

    sessionsToDelete.forEach((idToken) => {
      this.sessions.delete(idToken);
    });

    return sessionsToDelete.length;
  }

  formatUser(user) {
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      disabled: user.disabled,
      metadata: {
        creationTime: user.createdAt,
        lastSignInTime: user.lastSignInTime,
        lastRefreshTime: new Date().toISOString(),
      },
      customClaims: user.customClaims || {},
      providerData: user.providerData || [],
      tokensValidAfterTime: user.createdAt,
    };
  }

  generateUID() {
    return `mock-uid-${crypto.randomBytes(16).toString('hex')}`;
  }

  generateIdToken(user) {
    return `mock-firebase-id-token-${user.uid}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  generateRefreshToken(user) {
    return `mock-firebase-refresh-token-${user.uid}-${Date.now()}-${crypto.randomBytes(12).toString('hex')}`;
  }

  generateAccessToken(user) {
    return `mock-firebase-access-token-${user.uid}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  generateCustomToken(user, additionalClaims) {
    const payload = {
      uid: user.uid,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      aud: `https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit`,
      iss: `firebase-adminsdk@${this.config.projectId}.iam.gserviceaccount.com`,
      sub: `firebase-adminsdk@${this.config.projectId}.iam.gserviceaccount.com`,
      ...additionalClaims,
    };

    return `mock-custom-token-${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
  }

  generateSessionId() {
    return `session-${crypto.randomBytes(16).toString('hex')}`;
  }

  startSessionCleanup() {
    setInterval(() => {
      const now = Date.now();
      const expiredSessions = [];

      for (const [idToken, session] of this.sessions.entries()) {
        if (session.expires < now) {
          expiredSessions.push(idToken);
          this.refreshTokens.delete(session.refreshToken);
        }
      }

      expiredSessions.forEach((idToken) => {
        this.sessions.delete(idToken);
      });

      if (expiredSessions.length > 0) {
        console.log(`[Mock Firebase] Cleaned up ${expiredSessions.length} expired sessions`);
      }
    }, 60000); // Every minute
  }

  startVerificationCodeCleanup() {
    setInterval(() => {
      const now = Date.now();
      const expiredCodes = [];

      for (const [email, verification] of this.verificationCodes.entries()) {
        if (verification.expires < now) {
          expiredCodes.push(email);
        }
      }

      expiredCodes.forEach((email) => {
        this.verificationCodes.delete(email);
      });

      if (expiredCodes.length > 0) {
        console.log(`[Mock Firebase] Cleaned up ${expiredCodes.length} expired verification codes`);
      }
    }, 300000); // Every 5 minutes
  }

  async simulateDelay(customDelay = null) {
    const delay = customDelay || this.config.responseDelay;

    if (this.serviceHealth === 'degraded') {
      await new Promise((resolve) => setTimeout(resolve, delay * 2));
    } else if (this.serviceHealth === 'down') {
      throw new FirebaseAuthError('auth/network-request-failed', 'Firebase service is unavailable');
    } else {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  shouldSimulateError() {
    return Math.random() < this.config.errorRate;
  }

  // Service Control Methods (for testing)

  setServiceHealth(health) {
    this.serviceHealth = health; // healthy, degraded, down
    this.emit('service.health_changed', health);
  }

  setErrorRate(rate) {
    this.config.errorRate = Math.max(0, Math.min(1, rate));
  }

  setResponseDelay(delay) {
    this.config.responseDelay = Math.max(0, delay);
  }

  getMetrics() {
    return {
      requestCount: this.requestCount,
      userCount: this.users.size,
      activeSessionCount: this.sessions.size,
      refreshTokenCount: this.refreshTokens.size,
      verificationCodeCount: this.verificationCodes.size,
      customTokenCount: this.customTokens.size,
      serviceHealth: this.serviceHealth,
      errorRate: this.config.errorRate,
      responseDelay: this.config.responseDelay,
    };
  }

  getUserStats() {
    const users = Array.from(this.users.values());
    return {
      total: users.length,
      verified: users.filter((u) => u.emailVerified).length,
      disabled: users.filter((u) => u.disabled).length,
      withCustomClaims: users.filter(
        (u) => u.customClaims && Object.keys(u.customClaims).length > 0
      ).length,
      signedInRecently: users.filter((u) => {
        if (!u.lastSignInTime) return false;
        return Date.now() - new Date(u.lastSignInTime).getTime() < 86400000; // 24 hours
      }).length,
    };
  }

  reset() {
    // Preserve test users but clear sessions and tokens
    this.sessions.clear();
    this.refreshTokens.clear();
    this.verificationCodes.clear();
    this.customTokens.clear();
    this.requestCount = 0;
    this.serviceHealth = 'healthy';

    // Reset test users to initial state
    this.users.clear();
    this.initializeTestUsers();

    this.emit('service.reset');
    console.log('[Mock Firebase Auth] Service reset');
  }
}

/**
 * Firebase Auth Error Class
 */
class FirebaseAuthError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'FirebaseAuthError';
    this.code = code;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
      timestamp: this.timestamp,
    };
  }
}

/**
 * Mock Firebase Auth Factory
 * Creates configured instances for different test scenarios
 */
class MockFirebaseAuthFactory {
  static createForTesting(scenario = 'normal') {
    const scenarios = {
      normal: {
        errorRate: 0.01,
        responseDelay: 300,
        enableCustomClaims: true,
      },

      high_error: {
        errorRate: 0.1,
        responseDelay: 800,
        enableCustomClaims: true,
      },

      slow_network: {
        errorRate: 0.01,
        responseDelay: 2000,
        enableCustomClaims: true,
      },

      degraded_service: {
        errorRate: 0.05,
        responseDelay: 1000,
        enableCustomClaims: true,
        initialHealth: 'degraded',
      },

      fast_testing: {
        errorRate: 0,
        responseDelay: 50,
        enableCustomClaims: false,
      },
    };

    const config = scenarios[scenario] || scenarios.normal;
    const auth = new MockFirebaseAuth(config);

    if (config.initialHealth) {
      auth.setServiceHealth(config.initialHealth);
    }

    return auth;
  }
}

module.exports = {
  MockFirebaseAuth,
  FirebaseAuthError,
  MockFirebaseAuthFactory,
};

// Export default instance
module.exports.default = MockFirebaseAuth;
