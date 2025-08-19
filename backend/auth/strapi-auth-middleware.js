/**
 * Strapi Authentication Middleware
 * 
 * This middleware integrates Firebase authentication with Strapi CMS,
 * providing dual-token validation and user synchronization capabilities.
 * 
 * Features:
 * - Firebase ID token validation
 * - Strapi JWT validation
 * - User synchronization between Firebase and Strapi
 * - Rate limiting and security controls
 * - Session management
 */

const jwt = require('jsonwebtoken');
const { firebaseAdmin } = require('./firebase-admin-setup');

class StrapiAuthMiddleware {
  constructor(strapi) {
    this.strapi = strapi;
    this.rateLimiter = new Map();
    this.sessionStore = new Map();
    this.securityConfig = {
      maxFailedAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      tokenExchangeWindow: 5 * 60 * 1000, // 5 minutes
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    };
  }

  /**
   * Initialize middleware with Strapi instance
   * @param {Object} strapi - Strapi instance
   */
  static init(strapi) {
    return new StrapiAuthMiddleware(strapi);
  }

  /**
   * Main authentication middleware
   * @param {Object} ctx - Koa context
   * @param {Function} next - Next middleware function
   */
  async authenticate(ctx, next) {
    try {
      // Skip authentication for public routes
      if (this.isPublicRoute(ctx.request.path)) {
        return await next();
      }

      // Extract tokens from request
      const { firebaseToken, strapiToken } = this.extractTokens(ctx);

      if (!firebaseToken && !strapiToken) {
        return this.unauthorizedResponse(ctx, 'Missing authentication tokens');
      }

      // Validate tokens and get user
      const authResult = await this.validateTokens(firebaseToken, strapiToken);

      if (!authResult.valid) {
        return this.unauthorizedResponse(ctx, authResult.error);
      }

      // Attach user to context
      ctx.state.user = authResult.user;
      ctx.state.firebaseUser = authResult.firebaseUser;

      // Update session
      await this.updateSession(authResult.user.id, {
        lastActivity: Date.now(),
        ipAddress: this.getClientIP(ctx),
        userAgent: ctx.request.headers['user-agent'],
      });

      await next();
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return this.unauthorizedResponse(ctx, 'Authentication failed');
    }
  }

  /**
   * Extract Firebase and Strapi tokens from request
   * @param {Object} ctx - Koa context
   * @returns {Object} Extracted tokens
   */
  extractTokens(ctx) {
    const authHeader = ctx.request.headers.authorization;
    const firebaseHeader = ctx.request.headers['x-firebase-token'];

    let strapiToken = null;
    let firebaseToken = null;

    // Extract Strapi token from Authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      strapiToken = authHeader.substring(7);
    }

    // Extract Firebase token from custom header
    if (firebaseHeader) {
      firebaseToken = firebaseHeader;
    }

    return { firebaseToken, strapiToken };
  }

  /**
   * Validate both Firebase and Strapi tokens
   * @param {string} firebaseToken - Firebase ID token
   * @param {string} strapiToken - Strapi JWT token
   * @returns {Promise<Object>} Validation result
   */
  async validateTokens(firebaseToken, strapiToken) {
    try {
      let firebaseUser = null;
      let strapiUser = null;

      // Validate Firebase token if provided
      if (firebaseToken) {
        try {
          firebaseUser = await firebaseAdmin.verifyIdToken(firebaseToken);
        } catch (error) {
          console.error('Firebase token validation failed:', error);
          return { valid: false, error: 'Invalid Firebase token' };
        }
      }

      // Validate Strapi token if provided
      if (strapiToken) {
        try {
          const decoded = jwt.verify(strapiToken, this.strapi.config.get('plugin::users-permissions.jwtSecret'));
          
          // Get user from Strapi
          strapiUser = await this.strapi.query('plugin::users-permissions.user').findOne({
            where: { id: decoded.id },
            populate: ['role'],
          });

          if (!strapiUser || strapiUser.blocked) {
            return { valid: false, error: 'User not found or blocked' };
          }
        } catch (error) {
          console.error('Strapi token validation failed:', error);
          return { valid: false, error: 'Invalid Strapi token' };
        }
      }

      // Ensure tokens belong to the same user
      if (firebaseUser && strapiUser) {
        if (strapiUser.firebaseId !== firebaseUser.uid) {
          return { valid: false, error: 'Token mismatch' };
        }
      }

      // If only one token is provided, try to find the other user
      if (firebaseUser && !strapiUser) {
        strapiUser = await this.findStrapiUserByFirebaseId(firebaseUser.uid);
        if (!strapiUser) {
          return { valid: false, error: 'Strapi user not found' };
        }
      }

      if (strapiUser && !firebaseUser) {
        if (!strapiUser.firebaseId) {
          return { valid: false, error: 'Firebase ID not linked' };
        }
        // For Strapi-only validation, we trust the token is valid
        // but recommend having both tokens for security
      }

      return {
        valid: true,
        user: strapiUser,
        firebaseUser: firebaseUser,
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false, error: 'Token validation failed' };
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
   * Firebase-to-Strapi authentication flow
   * @param {Object} ctx - Koa context
   */
  async authenticateWithFirebase(ctx, next) {
    try {
      const { firebaseToken } = this.extractTokens(ctx);

      if (!firebaseToken) {
        return this.unauthorizedResponse(ctx, 'Firebase token required');
      }

      // Verify Firebase token
      const firebaseUser = await firebaseAdmin.verifyIdToken(firebaseToken);

      // Find or create Strapi user
      let strapiUser = await this.findStrapiUserByFirebaseId(firebaseUser.uid);

      if (!strapiUser) {
        // Create new Strapi user
        strapiUser = await this.createStrapiUserFromFirebase(firebaseUser);
      } else {
        // Update existing user with Firebase data
        strapiUser = await this.syncStrapiUserWithFirebase(strapiUser, firebaseUser);
      }

      // Generate new Strapi JWT
      const strapiJWT = this.generateStrapiJWT(strapiUser);

      // Attach user to context
      ctx.state.user = strapiUser;
      ctx.state.firebaseUser = firebaseUser;
      ctx.state.strapiJWT = strapiJWT;

      await next();
    } catch (error) {
      console.error('Firebase authentication error:', error);
      return this.unauthorizedResponse(ctx, 'Firebase authentication failed');
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
      };

      // Get default role
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

      // Update last sign in time
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
      roles: strapiUser.role ? [strapiUser.role.name] : [],
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(
      payload,
      this.strapi.config.get('plugin::users-permissions.jwtSecret'),
      { expiresIn: '7d' }
    );
  }

  /**
   * Rate limiting middleware
   * @param {Object} options - Rate limiting options
   */
  rateLimit(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 100, // 100 requests per window
      keyGenerator = (ctx) => this.getClientIP(ctx),
    } = options;

    return async (ctx, next) => {
      const key = keyGenerator(ctx);
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get or create rate limit entry
      let rateLimit = this.rateLimiter.get(key);
      if (!rateLimit || rateLimit.windowStart < windowStart) {
        rateLimit = {
          count: 0,
          windowStart: now,
        };
      }

      rateLimit.count++;
      this.rateLimiter.set(key, rateLimit);

      // Check if limit exceeded
      if (rateLimit.count > max) {
        ctx.status = 429;
        ctx.body = {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimit.windowStart + windowMs - now) / 1000),
        };
        return;
      }

      // Add rate limit headers
      ctx.set('X-RateLimit-Limit', max.toString());
      ctx.set('X-RateLimit-Remaining', Math.max(0, max - rateLimit.count).toString());
      ctx.set('X-RateLimit-Reset', new Date(rateLimit.windowStart + windowMs).toISOString());

      await next();
    };
  }

  /**
   * Update user session
   * @param {number} userId - Strapi user ID
   * @param {Object} sessionData - Session data to update
   */
  async updateSession(userId, sessionData) {
    try {
      const session = {
        userId,
        ...sessionData,
        lastUpdated: Date.now(),
      };

      this.sessionStore.set(userId, session);

      // Clean up expired sessions
      this.cleanupExpiredSessions();
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const expiredSessions = [];

    for (const [userId, session] of this.sessionStore.entries()) {
      if (now - session.lastUpdated > this.securityConfig.sessionTimeout) {
        expiredSessions.push(userId);
      }
    }

    expiredSessions.forEach(userId => {
      this.sessionStore.delete(userId);
    });
  }

  /**
   * Check if route is public (doesn't require authentication)
   * @param {string} path - Request path
   * @returns {boolean} True if public route
   */
  isPublicRoute(path) {
    const publicRoutes = [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/health',
      '/api/auth/token-exchange',
    ];

    return publicRoutes.some(route => path.startsWith(route));
  }

  /**
   * Send unauthorized response
   * @param {Object} ctx - Koa context
   * @param {string} message - Error message
   */
  unauthorizedResponse(ctx, message = 'Unauthorized') {
    ctx.status = 401;
    ctx.body = {
      error: 'Unauthorized',
      message,
      timestamp: new Date().toISOString(),
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

  /**
   * Health check endpoint
   * @param {Object} ctx - Koa context
   */
  async healthCheck(ctx) {
    try {
      const firebaseHealth = await firebaseAdmin.healthCheck();
      
      ctx.body = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          firebase: firebaseHealth,
          strapi: {
            status: 'healthy',
            database: 'connected',
          },
        },
        activeSessions: this.sessionStore.size,
        rateLimitEntries: this.rateLimiter.size,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = {
  StrapiAuthMiddleware,
  
  // Factory function for Strapi plugin
  createAuthMiddleware: (strapi) => {
    const middleware = new StrapiAuthMiddleware(strapi);
    
    return {
      authenticate: middleware.authenticate.bind(middleware),
      authenticateWithFirebase: middleware.authenticateWithFirebase.bind(middleware),
      rateLimit: middleware.rateLimit.bind(middleware),
      healthCheck: middleware.healthCheck.bind(middleware),
    };
  },
};