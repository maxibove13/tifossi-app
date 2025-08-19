/**
 * Strapi Users-Permissions Extension for Firebase Integration
 * 
 * Extends the default users-permissions plugin to support Firebase authentication
 * with token exchange and user synchronization capabilities.
 */

const { firebaseAdmin } = require('../../../../auth/firebase-admin-setup');

module.exports = (plugin) => {
  // Initialize Firebase Admin when the plugin loads
  const initializeFirebase = async () => {
    try {
      await firebaseAdmin.initialize({
        projectId: process.env.FIREBASE_PROJECT_ID,
        serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      });
      console.log('[Strapi Firebase] Firebase Admin initialized successfully');
    } catch (error) {
      console.error('[Strapi Firebase] Failed to initialize Firebase Admin:', error);
    }
  };

  // Initialize on plugin load
  initializeFirebase();

  // Extend the auth controller
  plugin.controllers.auth = {
    ...plugin.controllers.auth,

    /**
     * Firebase Token Exchange Endpoint
     * 
     * Exchanges a Firebase ID token for a Strapi JWT token
     * Creates or updates user record based on Firebase user data
     */
    async firebaseExchange(ctx) {
      try {
        const { firebaseToken, tokenVersion } = ctx.request.body;

        if (!firebaseToken) {
          return ctx.badRequest('Firebase token is required');
        }

        // Verify Firebase ID token
        let decodedToken;
        try {
          decodedToken = await firebaseAdmin.verifyIdToken(firebaseToken);
        } catch (error) {
          console.error('[Strapi Firebase] Token verification failed:', error);
          return ctx.unauthorized('Invalid Firebase token');
        }

        // Extract user data from Firebase token
        const {
          uid: firebaseUid,
          email,
          name,
          picture: photoURL,
          email_verified: emailVerified
        } = decodedToken;

        if (!email) {
          return ctx.badRequest('Email is required in Firebase token');
        }

        // Check if user exists in Strapi
        let user = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: {
            $or: [
              { email },
              { firebaseUid }
            ]
          }
        });

        const userService = strapi.plugin('users-permissions').service('user');
        const jwtService = strapi.plugin('users-permissions').service('jwt');

        if (user) {
          // Update existing user with Firebase data
          user = await strapi.db.query('plugin::users-permissions.user').update({
            where: { id: user.id },
            data: {
              firebaseUid,
              username: user.username || email.split('@')[0],
              email,
              confirmed: emailVerified || user.confirmed,
              blocked: false,
              lastLoginAt: new Date(),
              // Update profile data if available
              ...(name && { firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' ') }),
              ...(photoURL && { avatar: photoURL }),
              // Track token version for security
              tokenVersion: tokenVersion || 1
            }
          });

          console.log('[Strapi Firebase] Updated existing user:', email);
        } else {
          // Create new user from Firebase data
          const defaultRole = await strapi.db.query('plugin::users-permissions.role').findOne({
            where: { type: 'authenticated' }
          });

          if (!defaultRole) {
            return ctx.internalServerError('Default role not found');
          }

          user = await strapi.db.query('plugin::users-permissions.user').create({
            data: {
              firebaseUid,
              username: email.split('@')[0],
              email,
              confirmed: emailVerified || false,
              blocked: false,
              role: defaultRole.id,
              provider: 'firebase',
              createdAt: new Date(),
              lastLoginAt: new Date(),
              // Profile data from Firebase
              ...(name && { firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' ') }),
              ...(photoURL && { avatar: photoURL }),
              // Track token version for security
              tokenVersion: tokenVersion || 1
            }
          });

          console.log('[Strapi Firebase] Created new user:', email);
        }

        // Generate Strapi JWT token
        const strapiJwt = jwtService.issue({
          id: user.id,
          firebaseUid: user.firebaseUid,
          tokenVersion: user.tokenVersion
        });

        // Sanitize user data for response
        const sanitizedUser = await userService.sanitizeUser(user);

        // Send success response
        ctx.send({
          jwt: strapiJwt,
          user: sanitizedUser,
          message: 'Authentication successful'
        });

      } catch (error) {
        console.error('[Strapi Firebase] Token exchange error:', error);
        ctx.internalServerError('Authentication failed');
      }
    },

    /**
     * Firebase User Sync Endpoint
     * 
     * Synchronizes user data between Firebase and Strapi
     */
    async firebaseSync(ctx) {
      try {
        const user = ctx.state.user;

        if (!user || !user.firebaseUid) {
          return ctx.unauthorized('Valid Firebase user required');
        }

        // Get latest user data from Firebase
        let firebaseUser;
        try {
          firebaseUser = await firebaseAdmin.getUser(user.firebaseUid);
        } catch (error) {
          console.error('[Strapi Firebase] Failed to get Firebase user:', error);
          return ctx.notFound('Firebase user not found');
        }

        // Update Strapi user with latest Firebase data
        const updatedUser = await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: {
            email: firebaseUser.email,
            confirmed: firebaseUser.emailVerified,
            lastSyncAt: new Date(),
            ...(firebaseUser.displayName && {
              firstName: firebaseUser.displayName.split(' ')[0],
              lastName: firebaseUser.displayName.split(' ').slice(1).join(' ')
            }),
            ...(firebaseUser.photoURL && { avatar: firebaseUser.photoURL })
          }
        });

        const userService = strapi.plugin('users-permissions').service('user');
        const sanitizedUser = await userService.sanitizeUser(updatedUser);

        ctx.send({
          user: sanitizedUser,
          message: 'User data synchronized successfully'
        });

      } catch (error) {
        console.error('[Strapi Firebase] User sync error:', error);
        ctx.internalServerError('User synchronization failed');
      }
    },

    /**
     * Token Validation Endpoint
     * 
     * Validates Strapi JWT token and returns user data
     */
    async validate(ctx) {
      try {
        const user = ctx.state.user;

        if (!user) {
          return ctx.unauthorized('Invalid token');
        }

        // Check if user is blocked
        if (user.blocked) {
          return ctx.unauthorized('User account is blocked');
        }

        // Update last activity
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: {
            lastActivityAt: new Date()
          }
        });

        const userService = strapi.plugin('users-permissions').service('user');
        const sanitizedUser = await userService.sanitizeUser(user);

        ctx.send({
          user: sanitizedUser,
          valid: true,
          message: 'Token is valid'
        });

      } catch (error) {
        console.error('[Strapi Firebase] Token validation error:', error);
        ctx.unauthorized('Token validation failed');
      }
    },

    /**
     * Firebase User Deletion
     * 
     * Handles user deletion in both Firebase and Strapi
     */
    async firebaseDelete(ctx) {
      try {
        const user = ctx.state.user;

        if (!user || !user.firebaseUid) {
          return ctx.unauthorized('Valid Firebase user required');
        }

        // Delete user from Firebase
        try {
          await firebaseAdmin.deleteUser(user.firebaseUid);
          console.log('[Strapi Firebase] User deleted from Firebase:', user.firebaseUid);
        } catch (error) {
          console.error('[Strapi Firebase] Failed to delete Firebase user:', error);
          // Continue with Strapi deletion even if Firebase deletion fails
        }

        // Delete user from Strapi
        await strapi.db.query('plugin::users-permissions.user').delete({
          where: { id: user.id }
        });

        console.log('[Strapi Firebase] User deleted from Strapi:', user.id);

        ctx.send({
          message: 'User deleted successfully'
        });

      } catch (error) {
        console.error('[Strapi Firebase] User deletion error:', error);
        ctx.internalServerError('User deletion failed');
      }
    }
  };

  // Add new routes for Firebase authentication
  plugin.routes['content-api'].routes.push(
    {
      method: 'POST',
      path: '/auth/firebase-exchange',
      handler: 'auth.firebaseExchange',
      config: {
        prefix: '',
        policies: []
      }
    },
    {
      method: 'POST',
      path: '/auth/firebase-sync',
      handler: 'auth.firebaseSync',
      config: {
        prefix: '',
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/auth/validate',
      handler: 'auth.validate',
      config: {
        prefix: '',
        policies: []
      }
    },
    {
      method: 'DELETE',
      path: '/auth/firebase-delete',
      handler: 'auth.firebaseDelete',
      config: {
        prefix: '',
        policies: []
      }
    }
  );

  // Extend the user service
  plugin.services.user = {
    ...plugin.services.user,

    /**
     * Find user by Firebase UID
     */
    async findByFirebaseUid(firebaseUid) {
      return await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { firebaseUid }
      });
    },

    /**
     * Update user's Firebase data
     */
    async updateFirebaseData(userId, firebaseData) {
      return await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: {
          ...firebaseData,
          lastSyncAt: new Date()
        }
      });
    },

    /**
     * Enhanced user sanitization with Firebase fields
     */
    async sanitizeUser(user, ctx) {
      const sanitizedUser = await this.sanitizeUser.call(this, user, ctx);
      
      // Add Firebase-specific fields to response
      return {
        ...sanitizedUser,
        firebaseUid: user.firebaseUid,
        lastLoginAt: user.lastLoginAt,
        lastSyncAt: user.lastSyncAt,
        lastActivityAt: user.lastActivityAt,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      };
    }
  };

  // Add middleware to validate Firebase tokens in requests
  plugin.middlewares = {
    ...plugin.middlewares,

    async firebaseAuth(ctx, next) {
      try {
        const authorization = ctx.request.header.authorization;

        if (authorization && authorization.startsWith('Bearer ')) {
          const token = authorization.slice(7);

          // Check if it's a Firebase token
          if (token.length > 1000) { // Firebase tokens are typically much longer
            try {
              const decodedToken = await firebaseAdmin.verifyIdToken(token);
              
              // Find corresponding Strapi user
              const user = await strapi.db.query('plugin::users-permissions.user').findOne({
                where: { firebaseUid: decodedToken.uid }
              });

              if (user && !user.blocked) {
                ctx.state.user = user;
              }
            } catch (error) {
              console.warn('[Strapi Firebase] Firebase token validation failed:', error);
            }
          }
        }

        await next();
      } catch (error) {
        console.error('[Strapi Firebase] Firebase auth middleware error:', error);
        await next();
      }
    }
  };

  return plugin;
};