/**
 * Token Exchange Controller
 * 
 * Handles token exchange operations between Firebase and Strapi authentication systems.
 * Provides endpoints for user registration, login, token refresh, and user synchronization.
 * 
 * Features:
 * - Firebase to Strapi token exchange
 * - User registration and login flows
 * - Token refresh and validation
 * - Session management
 * - Error handling and security measures
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { firebaseAdmin } = require('./firebase-admin-setup');
const { StrapiAuthMiddleware } = require('./strapi-auth-middleware');

class TokenExchangeController {
  constructor(strapi) {
    this.strapi = strapi;
    this.authMiddleware = new StrapiAuthMiddleware(strapi);
    this.exchangeAttempts = new Map();
    this.securityConfig = {
      maxExchangeAttempts: 5,
      exchangeWindowMs: 15 * 60 * 1000, // 15 minutes
      tokenTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
  }

  /**
   * Initialize controller with Strapi instance
   * @param {Object} strapi - Strapi instance
   */
  static init(strapi) {
    return new TokenExchangeController(strapi);
  }

  /**
   * Register new user with Firebase and create Strapi profile
   * POST /api/auth/register
   * @param {Object} ctx - Koa context
   */
  async register(ctx) {
    try {
      const { firebaseToken } = ctx.request.body;

      if (!firebaseToken) {
        return this.errorResponse(ctx, 400, 'Firebase token is required');
      }

      // Check rate limiting for this IP
      const rateLimitCheck = this.checkExchangeRateLimit(this.getClientIP(ctx));
      if (!rateLimitCheck.allowed) {
        return this.errorResponse(ctx, 429, 'Too many registration attempts', {
          retryAfter: rateLimitCheck.retryAfter,
        });
      }

      // Verify Firebase token
      let firebaseUser;
      try {
        firebaseUser = await firebaseAdmin.verifyIdToken(firebaseToken);
      } catch (error) {
        console.error('Firebase token verification failed:', error);
        return this.errorResponse(ctx, 401, 'Invalid Firebase token');
      }

      // Check if user already exists in Strapi
      const existingUser = await this.findStrapiUserByFirebaseId(firebaseUser.uid);
      if (existingUser) {
        return this.errorResponse(ctx, 409, 'User already exists');
      }

      // Create new Strapi user
      const strapiUser = await this.createStrapiUserFromFirebase(firebaseUser);

      // Generate Strapi JWT
      const strapiJWT = this.generateStrapiJWT(strapiUser);

      // Create session
      await this.createUserSession(strapiUser.id, {
        firebaseId: firebaseUser.uid,
        ipAddress: this.getClientIP(ctx),
        userAgent: ctx.request.headers['user-agent'],
        registrationTime: Date.now(),
      });

      // Log successful registration
      await this.logAuthEvent('user_registered', {
        userId: strapiUser.id,
        firebaseId: firebaseUser.uid,
        email: firebaseUser.email,
        ipAddress: this.getClientIP(ctx),
      });

      ctx.body = {
        success: true,
        message: 'User registered successfully',
        data: {
          user: this.sanitizeUserData(strapiUser),
          token: strapiJWT,
          expiresIn: this.securityConfig.tokenTTL,
          tokenType: 'Bearer',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Registration error:', error);
      return this.errorResponse(ctx, 500, 'Registration failed');
    }
  }

  /**
   * Login existing user and exchange tokens
   * POST /api/auth/login
   * @param {Object} ctx - Koa context
   */
  async login(ctx) {
    try {
      const { firebaseToken } = ctx.request.body;

      if (!firebaseToken) {
        return this.errorResponse(ctx, 400, 'Firebase token is required');
      }

      // Check rate limiting
      const rateLimitCheck = this.checkExchangeRateLimit(this.getClientIP(ctx));
      if (!rateLimitCheck.allowed) {
        return this.errorResponse(ctx, 429, 'Too many login attempts', {
          retryAfter: rateLimitCheck.retryAfter,
        });
      }

      // Verify Firebase token
      let firebaseUser;
      try {
        firebaseUser = await firebaseAdmin.verifyIdToken(firebaseToken);
      } catch (error) {
        console.error('Firebase token verification failed:', error);
        return this.errorResponse(ctx, 401, 'Invalid Firebase token');
      }

      // Find existing Strapi user
      let strapiUser = await this.findStrapiUserByFirebaseId(firebaseUser.uid);
      
      if (!strapiUser) {
        // Auto-create user if doesn't exist (optional behavior)
        if (this.strapi.config.get('auth.autoCreateUser', false)) {
          strapiUser = await this.createStrapiUserFromFirebase(firebaseUser);
        } else {
          return this.errorResponse(ctx, 404, 'User not found. Please register first.');
        }
      }

      // Check if user is blocked
      if (strapiUser.blocked) {
        return this.errorResponse(ctx, 403, 'User account is blocked');
      }

      // Sync user data with Firebase
      strapiUser = await this.syncStrapiUserWithFirebase(strapiUser, firebaseUser);

      // Generate new Strapi JWT
      const strapiJWT = this.generateStrapiJWT(strapiUser);

      // Update user session
      await this.updateUserSession(strapiUser.id, {
        lastLogin: Date.now(),
        ipAddress: this.getClientIP(ctx),
        userAgent: ctx.request.headers['user-agent'],
      });

      // Log successful login
      await this.logAuthEvent('user_login', {
        userId: strapiUser.id,
        firebaseId: firebaseUser.uid,
        email: firebaseUser.email,
        ipAddress: this.getClientIP(ctx),
      });

      ctx.body = {
        success: true,
        message: 'Login successful',
        data: {
          user: this.sanitizeUserData(strapiUser),
          token: strapiJWT,
          expiresIn: this.securityConfig.tokenTTL,
          tokenType: 'Bearer',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Login error:', error);
      return this.errorResponse(ctx, 500, 'Login failed');
    }
  }

  /**
   * Refresh Strapi token using Firebase token
   * POST /api/auth/refresh
   * @param {Object} ctx - Koa context
   */
  async refreshToken(ctx) {
    try {
      const { firebaseToken } = ctx.request.body;

      if (!firebaseToken) {
        return this.errorResponse(ctx, 400, 'Firebase token is required');
      }

      // Verify Firebase token
      let firebaseUser;
      try {
        firebaseUser = await firebaseAdmin.verifyIdToken(firebaseToken);
      } catch (error) {
        console.error('Firebase token verification failed:', error);
        return this.errorResponse(ctx, 401, 'Invalid Firebase token');
      }

      // Find Strapi user
      const strapiUser = await this.findStrapiUserByFirebaseId(firebaseUser.uid);
      if (!strapiUser) {
        return this.errorResponse(ctx, 404, 'User not found');
      }

      if (strapiUser.blocked) {
        return this.errorResponse(ctx, 403, 'User account is blocked');
      }

      // Generate new Strapi JWT
      const strapiJWT = this.generateStrapiJWT(strapiUser);

      // Update session
      await this.updateUserSession(strapiUser.id, {
        lastTokenRefresh: Date.now(),
        ipAddress: this.getClientIP(ctx),
      });

      // Log token refresh
      await this.logAuthEvent('token_refresh', {
        userId: strapiUser.id,
        firebaseId: firebaseUser.uid,
        ipAddress: this.getClientIP(ctx),
      });

      ctx.body = {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: strapiJWT,
          expiresIn: this.securityConfig.tokenTTL,
          tokenType: 'Bearer',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return this.errorResponse(ctx, 500, 'Token refresh failed');
    }
  }

  /**
   * Validate both Firebase and Strapi tokens
   * POST /api/auth/validate
   * @param {Object} ctx - Koa context
   */
  async validateTokens(ctx) {
    try {
      const { firebaseToken, strapiToken } = ctx.request.body;

      const validation = {
        firebase: { valid: false, error: null, user: null },
        strapi: { valid: false, error: null, user: null },
        synchronized: false,
      };

      // Validate Firebase token
      if (firebaseToken) {
        try {
          const firebaseUser = await firebaseAdmin.verifyIdToken(firebaseToken);
          validation.firebase = { valid: true, error: null, user: firebaseUser };
        } catch (error) {
          validation.firebase.error = error.message;
        }
      }

      // Validate Strapi token
      if (strapiToken) {
        try {
          const decoded = jwt.verify(strapiToken, this.getJWTSecret());
          const strapiUser = await this.strapi.query('plugin::users-permissions.user').findOne({
            where: { id: decoded.id },
            populate: ['role'],
          });

          if (strapiUser && !strapiUser.blocked) {
            validation.strapi = { valid: true, error: null, user: strapiUser };
          } else {
            validation.strapi.error = 'User not found or blocked';
          }
        } catch (error) {
          validation.strapi.error = error.message;
        }
      }

      // Check synchronization
      if (validation.firebase.valid && validation.strapi.valid) {
        validation.synchronized = 
          validation.strapi.user.firebaseId === validation.firebase.user.uid;
      }

      ctx.body = {
        success: true,
        message: 'Token validation completed',
        data: {
          validation,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return this.errorResponse(ctx, 500, 'Token validation failed');
    }
  }

  /**
   * Logout user and invalidate tokens
   * POST /api/auth/logout
   * @param {Object} ctx - Koa context
   */
  async logout(ctx) {
    try {
      const user = ctx.state.user;

      if (user) {
        // Revoke Firebase refresh tokens
        if (user.firebaseId) {
          try {
            await firebaseAdmin.revokeRefreshTokens(user.firebaseId);
          } catch (error) {
            console.error('Failed to revoke Firebase tokens:', error);
          }
        }

        // Clear user session
        await this.clearUserSession(user.id);

        // Log logout event
        await this.logAuthEvent('user_logout', {
          userId: user.id,
          firebaseId: user.firebaseId,
          ipAddress: this.getClientIP(ctx),
        });
      }

      ctx.body = {
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Logout error:', error);
      return this.errorResponse(ctx, 500, 'Logout failed');
    }
  }

  /**
   * Sync user data between Firebase and Strapi
   * POST /api/auth/sync
   * @param {Object} ctx - Koa context
   */
  async syncUser(ctx) {
    try {
      const { firebaseToken } = ctx.request.body;
      const strapiUser = ctx.state.user;

      if (!firebaseToken) {
        return this.errorResponse(ctx, 400, 'Firebase token is required');
      }

      // Verify Firebase token
      let firebaseUser;
      try {
        firebaseUser = await firebaseAdmin.verifyIdToken(firebaseToken);
      } catch (error) {
        return this.errorResponse(ctx, 401, 'Invalid Firebase token');
      }

      // Verify token belongs to the same user
      if (strapiUser.firebaseId !== firebaseUser.uid) {
        return this.errorResponse(ctx, 403, 'Token mismatch');
      }

      // Sync user data
      const syncedUser = await this.syncStrapiUserWithFirebase(strapiUser, firebaseUser);

      // Log sync event
      await this.logAuthEvent('user_sync', {
        userId: strapiUser.id,
        firebaseId: firebaseUser.uid,
        ipAddress: this.getClientIP(ctx),
      });

      ctx.body = {
        success: true,
        message: 'User data synchronized successfully',
        data: {
          user: this.sanitizeUserData(syncedUser),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('User sync error:', error);
      return this.errorResponse(ctx, 500, 'User synchronization failed');
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   * @param {Object} ctx - Koa context
   */
  async getCurrentUser(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return this.errorResponse(ctx, 401, 'User not authenticated');
      }

      ctx.body = {
        success: true,
        data: {
          user: this.sanitizeUserData(user),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return this.errorResponse(ctx, 500, 'Failed to get user data');
    }
  }

  /**
   * Find Strapi user by Firebase ID
   * @param {string} firebaseId - Firebase user ID
   * @returns {Promise<Object|null>} Strapi user or null
   */
  async findStrapiUserByFirebaseId(firebaseId) {
    try {
      return await this.strapi.query('plugin::users-permissions.user').findOne({
        where: { firebaseId },
        populate: ['role'],
      });
    } catch (error) {
      console.error('Error finding Strapi user by Firebase ID:', error);
      return null;
    }
  }

  /**
   * Create Strapi user from Firebase user data
   * @param {Object} firebaseUser - Firebase user object
   * @returns {Promise<Object>} Created Strapi user
   */
  async createStrapiUserFromFirebase(firebaseUser) {
    try {
      const userData = {
        username: firebaseUser.email || firebaseUser.uid,
        email: firebaseUser.email,
        confirmed: firebaseUser.email_verified || false,
        blocked: false,
        provider: 'firebase',
        firebaseId: firebaseUser.uid,
        firebaseMetadata: {
          lastSignIn: firebaseUser.auth_time ? new Date(firebaseUser.auth_time * 1000) : new Date(),
          emailVerified: firebaseUser.email_verified || false,
          disabled: false,
        },
        profile: {
          displayName: firebaseUser.name || null,
          firstName: this.extractFirstName(firebaseUser.name),
          lastName: this.extractLastName(firebaseUser.name),
        },
        preferences: this.getDefaultUserPreferences(),
        addresses: [],
        cart: [],
        favorites: [],
      };

      // Get default authenticated role
      const defaultRole = await this.strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });

      if (defaultRole) {
        userData.role = defaultRole.id;
      }

      const strapiUser = await this.strapi.query('plugin::users-permissions.user').create({
        data: userData,
        populate: ['role'],
      });

      console.log('Created new Strapi user from Firebase:', strapiUser.id);
      return strapiUser;
    } catch (error) {
      console.error('Failed to create Strapi user from Firebase:', error);
      throw error;
    }
  }

  /**
   * Sync existing Strapi user with Firebase data
   * @param {Object} strapiUser - Existing Strapi user
   * @param {Object} firebaseUser - Firebase user data
   * @returns {Promise<Object>} Updated Strapi user
   */
  async syncStrapiUserWithFirebase(strapiUser, firebaseUser) {
    try {
      const updates = {};

      // Update email verification status
      if (firebaseUser.email_verified !== strapiUser.firebaseMetadata?.emailVerified) {
        updates.confirmed = firebaseUser.email_verified;
        updates.firebaseMetadata = {
          ...strapiUser.firebaseMetadata,
          emailVerified: firebaseUser.email_verified,
          lastSignIn: new Date(),
        };
      }

      // Update display name if changed
      if (firebaseUser.name && firebaseUser.name !== strapiUser.profile?.displayName) {
        updates.profile = {
          ...strapiUser.profile,
          displayName: firebaseUser.name,
          firstName: this.extractFirstName(firebaseUser.name),
          lastName: this.extractLastName(firebaseUser.name),
        };
      }

      // Always update last sign in time
      if (!updates.firebaseMetadata) {
        updates.firebaseMetadata = {
          ...strapiUser.firebaseMetadata,
          lastSignIn: new Date(),
        };
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        const updatedUser = await this.strapi.query('plugin::users-permissions.user').update({
          where: { id: strapiUser.id },
          data: updates,
          populate: ['role'],
        });

        console.log('Synced Strapi user with Firebase data:', strapiUser.id);
        return updatedUser;
      }

      return strapiUser;
    } catch (error) {
      console.error('Failed to sync Strapi user with Firebase:', error);
      throw error;
    }
  }

  /**
   * Generate Strapi JWT token
   * @param {Object} strapiUser - Strapi user object
   * @returns {string} JWT token
   */
  generateStrapiJWT(strapiUser) {
    const payload = {
      id: strapiUser.id,
      email: strapiUser.email,
      firebaseId: strapiUser.firebaseId,
      roles: strapiUser.role ? [strapiUser.role.name] : [],
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, this.getJWTSecret(), { 
      expiresIn: '7d',
      issuer: 'tifossi-backend',
      audience: 'tifossi-app',
    });
  }

  /**
   * Check rate limiting for token exchange
   * @param {string} identifier - Client identifier (IP address)
   * @returns {Object} Rate limit result
   */
  checkExchangeRateLimit(identifier) {
    const now = Date.now();
    const windowStart = now - this.securityConfig.exchangeWindowMs;

    let attempts = this.exchangeAttempts.get(identifier);
    if (!attempts || attempts.windowStart < windowStart) {
      attempts = { count: 0, windowStart: now };
    }

    attempts.count++;
    this.exchangeAttempts.set(identifier, attempts);

    const allowed = attempts.count <= this.securityConfig.maxExchangeAttempts;
    const retryAfter = allowed ? 0 : Math.ceil((attempts.windowStart + this.securityConfig.exchangeWindowMs - now) / 1000);

    return { allowed, retryAfter };
  }

  /**
   * Create user session
   * @param {number} userId - Strapi user ID
   * @param {Object} sessionData - Session data
   */
  async createUserSession(userId, sessionData) {
    try {
      // In a production environment, this would be stored in Redis or database
      // For now, we'll use in-memory storage
      console.log('Creating session for user:', userId, sessionData);
    } catch (error) {
      console.error('Failed to create user session:', error);
    }
  }

  /**
   * Update user session
   * @param {number} userId - Strapi user ID
   * @param {Object} sessionData - Session data to update
   */
  async updateUserSession(userId, sessionData) {
    try {
      console.log('Updating session for user:', userId, sessionData);
    } catch (error) {
      console.error('Failed to update user session:', error);
    }
  }

  /**
   * Clear user session
   * @param {number} userId - Strapi user ID
   */
  async clearUserSession(userId) {
    try {
      console.log('Clearing session for user:', userId);
    } catch (error) {
      console.error('Failed to clear user session:', error);
    }
  }

  /**
   * Log authentication events
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  async logAuthEvent(event, data) {
    try {
      // In production, this would log to a proper logging service
      console.log(`[AUTH EVENT] ${event}:`, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }

  /**
   * Sanitize user data for client response
   * @param {Object} user - Strapi user object
   * @returns {Object} Sanitized user data
   */
  sanitizeUserData(user) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      confirmed: user.confirmed,
      blocked: user.blocked,
      profile: user.profile || {},
      preferences: user.preferences || {},
      role: user.role ? {
        id: user.role.id,
        name: user.role.name,
        type: user.role.type,
      } : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Send error response
   * @param {Object} ctx - Koa context
   * @param {number} status - HTTP status code
   * @param {string} message - Error message
   * @param {Object} extra - Additional data
   */
  errorResponse(ctx, status, message, extra = {}) {
    ctx.status = status;
    ctx.body = {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      ...extra,
    };
  }

  /**
   * Get client IP address
   * @param {Object} ctx - Koa context
   * @returns {string} Client IP address
   */
  getClientIP(ctx) {
    return (
      ctx.request.headers['x-forwarded-for'] ||
      ctx.request.headers['x-real-ip'] ||
      ctx.request.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Get JWT secret from Strapi config
   * @returns {string} JWT secret
   */
  getJWTSecret() {
    return this.strapi.config.get('plugin::users-permissions.jwtSecret');
  }

  /**
   * Extract first name from display name
   * @param {string} displayName - Full display name
   * @returns {string|null} First name
   */
  extractFirstName(displayName) {
    if (!displayName) return null;
    return displayName.split(' ')[0] || null;
  }

  /**
   * Extract last name from display name
   * @param {string} displayName - Full display name
   * @returns {string|null} Last name
   */
  extractLastName(displayName) {
    if (!displayName) return null;
    const parts = displayName.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : null;
  }

  /**
   * Get default user preferences
   * @returns {Object} Default preferences
   */
  getDefaultUserPreferences() {
    return {
      language: 'es',
      currency: 'UYU',
      notifications: {
        email: true,
        push: true,
        marketing: false,
      },
      privacy: {
        profileVisibility: 'private',
        analyticsConsent: false,
      },
    };
  }
}

module.exports = {
  TokenExchangeController,
  
  // Factory function for creating controller
  createTokenExchangeController: (strapi) => {
    const controller = new TokenExchangeController(strapi);
    
    return {
      register: controller.register.bind(controller),
      login: controller.login.bind(controller),
      refreshToken: controller.refreshToken.bind(controller),
      validateTokens: controller.validateTokens.bind(controller),
      logout: controller.logout.bind(controller),
      syncUser: controller.syncUser.bind(controller),
      getCurrentUser: controller.getCurrentUser.bind(controller),
    };
  },
};