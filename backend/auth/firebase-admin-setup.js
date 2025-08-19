/**
 * Firebase Admin SDK Setup and Configuration
 * 
 * This module initializes and configures Firebase Admin SDK for server-side
 * authentication operations in the Tifossi backend.
 * 
 * Features:
 * - Firebase Admin SDK initialization
 * - Service account authentication
 * - Custom claims management
 * - User management operations
 * - Token verification and validation
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

class FirebaseAdminService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize Firebase Admin SDK
   * @param {Object} config - Configuration options
   * @param {string} config.serviceAccountPath - Path to service account key file
   * @param {string} config.projectId - Firebase project ID
   * @param {string} config.databaseURL - Realtime Database URL (optional)
   * @param {string} config.storageBucket - Storage bucket URL (optional)
   */
  async initialize(config = {}) {
    try {
      if (this.initialized) {
        console.log('Firebase Admin SDK already initialized');
        return this.app;
      }

      // Load service account credentials
      const serviceAccount = this.loadServiceAccount(config.serviceAccountPath);

      // Initialize Firebase Admin
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.projectId || process.env.FIREBASE_PROJECT_ID,
        databaseURL: config.databaseURL || process.env.FIREBASE_DATABASE_URL,
        storageBucket: config.storageBucket || process.env.FIREBASE_STORAGE_BUCKET,
      });

      this.auth = admin.auth(this.app);
      this.db = admin.firestore(this.app);

      this.initialized = true;
      console.log('Firebase Admin SDK initialized successfully');

      // Set up error handling
      this.setupErrorHandling();

      return this.app;
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      throw new Error(`Firebase initialization failed: ${error.message}`);
    }
  }

  /**
   * Load service account credentials from file or environment
   * @param {string} serviceAccountPath - Path to service account key file
   * @returns {Object} Service account credentials
   */
  loadServiceAccount(serviceAccountPath) {
    try {
      // Try to load from file first
      if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
        const serviceAccountKey = fs.readFileSync(serviceAccountPath, 'utf8');
        return JSON.parse(serviceAccountKey);
      }

      // Fall back to environment variables
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      }

      // Construct from individual environment variables
      if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        return {
          type: 'service_account',
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
        };
      }

      throw new Error('Firebase service account credentials not found');
    } catch (error) {
      console.error('Failed to load service account:', error);
      throw error;
    }
  }

  /**
   * Set up error handling for Firebase operations
   */
  setupErrorHandling() {
    process.on('unhandledRejection', (reason, promise) => {
      if (reason && reason.code && reason.code.startsWith('auth/')) {
        console.error('Firebase Auth error:', reason);
      }
    });

    process.on('uncaughtException', (error) => {
      if (error.code && error.code.startsWith('auth/')) {
        console.error('Uncaught Firebase Auth error:', error);
      }
    });
  }

  /**
   * Verify Firebase ID token
   * @param {string} idToken - Firebase ID token to verify
   * @param {boolean} checkRevoked - Whether to check if token is revoked
   * @returns {Promise<Object>} Decoded token payload
   */
  async verifyIdToken(idToken, checkRevoked = true) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      const decodedToken = await this.auth.verifyIdToken(idToken, checkRevoked);

      // Additional security validations
      this.validateTokenClaims(decodedToken);

      return decodedToken;
    } catch (error) {
      console.error('Token verification failed:', error);
      
      // Map Firebase errors to application errors
      if (error.code === 'auth/id-token-expired') {
        throw new Error('Token has expired');
      } else if (error.code === 'auth/id-token-revoked') {
        throw new Error('Token has been revoked');
      } else if (error.code === 'auth/invalid-id-token') {
        throw new Error('Invalid token format');
      } else {
        throw new Error(`Token verification failed: ${error.message}`);
      }
    }
  }

  /**
   * Validate token claims for security
   * @param {Object} decodedToken - Decoded Firebase token
   */
  validateTokenClaims(decodedToken) {
    const now = Math.floor(Date.now() / 1000);

    // Check token age
    if (decodedToken.iat && (now - decodedToken.iat) > 3600) {
      console.warn('Token is older than 1 hour:', decodedToken.iat);
    }

    // Check issuer
    const expectedIssuer = `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID}`;
    if (decodedToken.iss !== expectedIssuer) {
      throw new Error('Invalid token issuer');
    }

    // Check audience
    if (decodedToken.aud !== process.env.FIREBASE_PROJECT_ID) {
      throw new Error('Invalid token audience');
    }

    // Check subject
    if (!decodedToken.sub || decodedToken.sub.length === 0) {
      throw new Error('Invalid token subject');
    }
  }

  /**
   * Get user by Firebase UID
   * @param {string} uid - Firebase user UID
   * @returns {Promise<Object>} Firebase user record
   */
  async getUser(uid) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      const userRecord = await this.auth.getUser(uid);
      return this.sanitizeUserRecord(userRecord);
    } catch (error) {
      console.error('Failed to get user:', error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('User not found');
      }
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email address
   * @returns {Promise<Object>} Firebase user record
   */
  async getUserByEmail(email) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      const userRecord = await this.auth.getUserByEmail(email);
      return this.sanitizeUserRecord(userRecord);
    } catch (error) {
      console.error('Failed to get user by email:', error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('User not found');
      }
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.displayName - User display name
   * @param {boolean} userData.emailVerified - Email verification status
   * @returns {Promise<Object>} Created user record
   */
  async createUser(userData) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      const userRecord = await this.auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        emailVerified: userData.emailVerified || false,
        disabled: false,
      });

      console.log('User created successfully:', userRecord.uid);
      return this.sanitizeUserRecord(userRecord);
    } catch (error) {
      console.error('Failed to create user:', error);
      
      if (error.code === 'auth/email-already-exists') {
        throw new Error('Email already in use');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      }
      
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Update user record
   * @param {string} uid - Firebase user UID
   * @param {Object} updates - User updates
   * @returns {Promise<Object>} Updated user record
   */
  async updateUser(uid, updates) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      const userRecord = await this.auth.updateUser(uid, updates);
      console.log('User updated successfully:', uid);
      return this.sanitizeUserRecord(userRecord);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Delete user
   * @param {string} uid - Firebase user UID
   * @returns {Promise<void>}
   */
  async deleteUser(uid) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      await this.auth.deleteUser(uid);
      console.log('User deleted successfully:', uid);
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Set custom claims for user
   * @param {string} uid - Firebase user UID
   * @param {Object} customClaims - Custom claims object
   * @returns {Promise<void>}
   */
  async setCustomClaims(uid, customClaims) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      await this.auth.setCustomUserClaims(uid, customClaims);
      console.log('Custom claims set successfully:', uid);
    } catch (error) {
      console.error('Failed to set custom claims:', error);
      throw new Error(`Failed to set custom claims: ${error.message}`);
    }
  }

  /**
   * Revoke refresh tokens for user
   * @param {string} uid - Firebase user UID
   * @returns {Promise<void>}
   */
  async revokeRefreshTokens(uid) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      await this.auth.revokeRefreshTokens(uid);
      console.log('Refresh tokens revoked successfully:', uid);
    } catch (error) {
      console.error('Failed to revoke refresh tokens:', error);
      throw new Error(`Failed to revoke tokens: ${error.message}`);
    }
  }

  /**
   * Generate custom token for user
   * @param {string} uid - Firebase user UID
   * @param {Object} additionalClaims - Additional claims (optional)
   * @returns {Promise<string>} Custom token
   */
  async createCustomToken(uid, additionalClaims = {}) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      const customToken = await this.auth.createCustomToken(uid, additionalClaims);
      return customToken;
    } catch (error) {
      console.error('Failed to create custom token:', error);
      throw new Error(`Failed to create custom token: ${error.message}`);
    }
  }

  /**
   * List users with pagination
   * @param {number} maxResults - Maximum results per page
   * @param {string} pageToken - Page token for pagination
   * @returns {Promise<Object>} User list result
   */
  async listUsers(maxResults = 1000, pageToken = undefined) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase Admin SDK not initialized');
      }

      const listUsersResult = await this.auth.listUsers(maxResults, pageToken);
      
      return {
        users: listUsersResult.users.map(user => this.sanitizeUserRecord(user)),
        pageToken: listUsersResult.pageToken,
        totalUsers: listUsersResult.users.length
      };
    } catch (error) {
      console.error('Failed to list users:', error);
      throw new Error(`Failed to list users: ${error.message}`);
    }
  }

  /**
   * Sanitize user record for safe transmission
   * @param {Object} userRecord - Firebase user record
   * @returns {Object} Sanitized user record
   */
  sanitizeUserRecord(userRecord) {
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      phoneNumber: userRecord.phoneNumber,
      disabled: userRecord.disabled,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
        lastRefreshTime: userRecord.metadata.lastRefreshTime,
      },
      customClaims: userRecord.customClaims || {},
      providerData: userRecord.providerData.map(provider => ({
        uid: provider.uid,
        displayName: provider.displayName,
        email: provider.email,
        photoURL: provider.photoURL,
        providerId: provider.providerId,
      })),
    };
  }

  /**
   * Health check for Firebase Admin SDK
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      if (!this.initialized) {
        return { status: 'error', message: 'Firebase Admin SDK not initialized' };
      }

      // Try to verify a dummy token to check connectivity
      const testUID = 'health-check-test';
      const customToken = await this.auth.createCustomToken(testUID);
      
      return {
        status: 'healthy',
        initialized: this.initialized,
        projectId: process.env.FIREBASE_PROJECT_ID,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Gracefully shutdown Firebase Admin SDK
   */
  async shutdown() {
    try {
      if (this.app) {
        await this.app.delete();
        this.initialized = false;
        console.log('Firebase Admin SDK shutdown successfully');
      }
    } catch (error) {
      console.error('Error during Firebase Admin SDK shutdown:', error);
    }
  }
}

// Export singleton instance
const firebaseAdmin = new FirebaseAdminService();

module.exports = {
  FirebaseAdminService,
  firebaseAdmin,
  
  // Convenience methods
  initialize: (config) => firebaseAdmin.initialize(config),
  verifyIdToken: (token, checkRevoked) => firebaseAdmin.verifyIdToken(token, checkRevoked),
  getUser: (uid) => firebaseAdmin.getUser(uid),
  getUserByEmail: (email) => firebaseAdmin.getUserByEmail(email),
  createUser: (userData) => firebaseAdmin.createUser(userData),
  updateUser: (uid, updates) => firebaseAdmin.updateUser(uid, updates),
  deleteUser: (uid) => firebaseAdmin.deleteUser(uid),
  setCustomClaims: (uid, claims) => firebaseAdmin.setCustomClaims(uid, claims),
  revokeRefreshTokens: (uid) => firebaseAdmin.revokeRefreshTokens(uid),
  createCustomToken: (uid, claims) => firebaseAdmin.createCustomToken(uid, claims),
  listUsers: (maxResults, pageToken) => firebaseAdmin.listUsers(maxResults, pageToken),
  healthCheck: () => firebaseAdmin.healthCheck(),
  shutdown: () => firebaseAdmin.shutdown(),
};