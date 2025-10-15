/**
 * Firebase Authentication Controller
 *
 * Handles Firebase-specific authentication operations
 */

import { firebaseAdmin } from '../../../lib/auth/firebase-admin-setup';

export default ({ strapi }: { strapi: any }) => ({
  /**
   * Firebase Token Exchange Endpoint
   *
   * Exchanges a Firebase ID token for a Strapi JWT token
   * Creates or updates user record based on Firebase user data
   */
  async exchange(ctx: any) {
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
        email_verified: emailVerified,
      } = decodedToken;

      if (!email) {
        return ctx.badRequest('Email is required in Firebase token');
      }

      // Check if user exists in Strapi
      let user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: {
          $or: [{ email }, { firebaseUid }],
        },
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
            ...(name && {
              firstName: name.split(' ')[0],
              lastName: name.split(' ').slice(1).join(' '),
            }),
            ...(photoURL && { avatar: photoURL }),
            // Track token version for security
            tokenVersion: tokenVersion || 1,
          },
        });

        console.log('[Strapi Firebase] Updated existing user:', email);
      } else {
        // Create new user from Firebase data
        const defaultRole = await strapi.db.query('plugin::users-permissions.role').findOne({
          where: { type: 'authenticated' },
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
            ...(name && {
              firstName: name.split(' ')[0],
              lastName: name.split(' ').slice(1).join(' '),
            }),
            ...(photoURL && { avatar: photoURL }),
            // Track token version for security
            tokenVersion: tokenVersion || 1,
          },
        });

        console.log('[Strapi Firebase] Created new user:', email);
      }

      // Generate Strapi JWT token
      const strapiJwt = jwtService.issue({
        id: user.id,
        firebaseUid: user.firebaseUid,
        tokenVersion: user.tokenVersion,
      });

      // Sanitize user data for response
      const sanitizedUser = await userService.sanitizeUser(user);

      // Send success response
      ctx.send({
        jwt: strapiJwt,
        user: sanitizedUser,
        message: 'Authentication successful',
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
  async sync(ctx: any) {
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
            lastName: firebaseUser.displayName.split(' ').slice(1).join(' '),
          }),
          ...(firebaseUser.photoURL && { avatar: firebaseUser.photoURL }),
        },
      });

      const userService = strapi.plugin('users-permissions').service('user');
      const sanitizedUser = await userService.sanitizeUser(updatedUser);

      ctx.send({
        user: sanitizedUser,
        message: 'User data synchronized successfully',
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
  async validate(ctx: any) {
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
          lastActivityAt: new Date(),
        },
      });

      const userService = strapi.plugin('users-permissions').service('user');
      const sanitizedUser = await userService.sanitizeUser(user);

      ctx.send({
        user: sanitizedUser,
        valid: true,
        message: 'Token is valid',
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
  async delete(ctx: any) {
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
        where: { id: user.id },
      });

      console.log('[Strapi Firebase] User deleted from Strapi:', user.id);

      ctx.send({
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('[Strapi Firebase] User deletion error:', error);
      ctx.internalServerError('User deletion failed');
    }
  },
});
