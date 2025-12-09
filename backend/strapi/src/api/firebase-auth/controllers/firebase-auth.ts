/**
 * Firebase Authentication Controller
 * Standalone API endpoint for Firebase token exchange
 */

import { firebaseAdmin } from '../../../lib/auth/firebase-admin-setup';

export default {
  async exchange(ctx: any) {
    console.log('[Firebase Auth API] Exchange endpoint hit');

    try {
      const { firebaseToken, tokenVersion } = ctx.request.body;

      console.log('[Firebase Auth API] Request body:', {
        hasToken: !!firebaseToken,
        tokenLength: firebaseToken?.length || 0,
        tokenVersion,
      });

      if (!firebaseToken) {
        console.log('[Firebase Auth API] No token provided');
        return ctx.badRequest('Firebase token is required');
      }

      // Verify Firebase ID token
      console.log('[Firebase Auth API] Verifying token...');
      let decodedToken;
      try {
        decodedToken = await firebaseAdmin.verifyIdToken(firebaseToken);
        console.log('[Firebase Auth API] Token verified:', {
          uid: decodedToken.uid,
          email: decodedToken.email,
        });
      } catch (error: any) {
        const errorCode = error?.code || 'unknown';
        const errorMessage = error?.message || 'Unknown error';
        console.log('[Firebase Auth API] VERIFICATION FAILED:', {
          code: errorCode,
          message: errorMessage,
        });
        return ctx.unauthorized({
          error: 'Invalid Firebase token',
          code: errorCode,
          details: errorMessage,
        });
      }

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

      // Check if user exists
      let user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: {
          $or: [{ email }, { firebaseUid }],
        },
      });

      const userService = strapi.plugin('users-permissions').service('user');
      const jwtService = strapi.plugin('users-permissions').service('jwt');

      if (user) {
        user = await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: {
            firebaseUid,
            username: user.username || email.split('@')[0],
            email,
            confirmed: emailVerified || user.confirmed,
            blocked: false,
            lastLoginAt: new Date(),
            ...(name && {
              firstName: name.split(' ')[0],
              lastName: name.split(' ').slice(1).join(' '),
            }),
            ...(photoURL && { avatar: photoURL }),
            tokenVersion: tokenVersion || 1,
          },
        });
        console.log('[Firebase Auth API] Updated user:', email);
      } else {
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
            ...(name && {
              firstName: name.split(' ')[0],
              lastName: name.split(' ').slice(1).join(' '),
            }),
            ...(photoURL && { avatar: photoURL }),
            tokenVersion: tokenVersion || 1,
          },
        });
        console.log('[Firebase Auth API] Created user:', email);
      }

      const strapiJwt = jwtService.issue({
        id: user.id,
        firebaseUid: user.firebaseUid,
        tokenVersion: user.tokenVersion,
      });

      const sanitizedUser = await userService.sanitizeUser(user);

      console.log('[Firebase Auth API] SUCCESS');
      ctx.send({
        jwt: strapiJwt,
        user: sanitizedUser,
        message: 'Authentication successful',
      });
    } catch (error: any) {
      console.log('[Firebase Auth API] ERROR:', error?.message);
      strapi.log.error('[Firebase Auth API] Error:', error);
      ctx.internalServerError('Authentication failed');
    }
  },

  /**
   * Validate Strapi JWT token
   * GET /api/auth/validate
   */
  async validate(ctx: any) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Invalid token');
      }

      if (user.blocked) {
        return ctx.unauthorized('User account is blocked');
      }

      // Update last activity
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { lastActivityAt: new Date() },
      });

      const userService = strapi.plugin('users-permissions').service('user');
      const sanitizedUser = await userService.sanitizeUser(user);

      ctx.send({
        user: sanitizedUser,
        valid: true,
      });
    } catch (error: any) {
      strapi.log.error('[Firebase Auth API] Validate error:', error);
      ctx.unauthorized('Token validation failed');
    }
  },
};
