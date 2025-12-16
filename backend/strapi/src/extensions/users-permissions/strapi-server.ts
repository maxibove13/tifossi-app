/**
 * Users-Permissions plugin extension
 *
 * Initializes Firebase Admin and extends user service with Firebase-specific methods.
 * Route handling is done by the standalone firebase-auth API.
 */

import { firebaseAdmin } from '../../lib/auth/firebase-admin-setup';
import userSchema from './content-types/user/schema.json';

type Plugin = {
  register?: (params: any) => Promise<void> | void;
  bootstrap?: (params: any) => Promise<void> | void;
  services?: Record<string, any>;
  middlewares?: Record<string, any>;
  contentTypes?: Record<string, { schema: any }>;
};

let userServiceExtended = false;

const extendUserService = (plugin: Plugin) => {
  if (userServiceExtended) {
    return;
  }

  const userService = plugin.services?.user;

  if (!userService) {
    strapi.log.warn(
      '[Strapi Firebase] users-permissions user service missing; Firebase sanitiser not applied'
    );
    return;
  }

  const originalSanitizeUser =
    typeof userService.sanitizeUser === 'function' ? userService.sanitizeUser : undefined;

  if (originalSanitizeUser) {
    userService.sanitizeUser = async function sanitizeUserWithFirebase(user: any, ctx?: any) {
      const sanitizedUser = await originalSanitizeUser.call(this, user, ctx);

      return {
        ...sanitizedUser,
        firebaseUid: user.firebaseUid,
        lastLoginAt: user.lastLoginAt,
        lastSyncAt: user.lastSyncAt,
        lastActivityAt: user.lastActivityAt,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      };
    };
  }

  Object.assign(userService, {
    async findByFirebaseUid(firebaseUid: string) {
      return strapi.db.query('plugin::users-permissions.user').findOne({
        where: { firebaseUid },
      });
    },

    async updateFirebaseData(userId: number, firebaseData: Record<string, unknown>) {
      return strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: {
          ...firebaseData,
          lastSyncAt: new Date(),
        },
      });
    },
  });

  userServiceExtended = true;
};

export default (plugin: Plugin) => {
  // Register the extended user content-type schema
  plugin.contentTypes = {
    ...plugin.contentTypes,
    user: { schema: userSchema },
  };
  const initializeFirebase = async () => {
    const hasCredentials =
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) ||
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!hasCredentials) {
      strapi.log.warn(
        '[Strapi Firebase] Firebase credentials not configured - Firebase auth features disabled'
      );
      return;
    }

    try {
      await firebaseAdmin.initialize({
        projectId: process.env.FIREBASE_PROJECT_ID,
        serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      });

      strapi.log.info('[Strapi Firebase] Firebase Admin initialized successfully');
    } catch (error: any) {
      strapi.log.warn(
        '[Strapi Firebase] Failed to initialize Firebase Admin:',
        error?.message ?? error
      );
    }
  };

  // Start Firebase admin init asynchronously on module load
  initializeFirebase();

  const originalRegister = plugin.register?.bind(plugin);
  plugin.register = async function registerWithFirebase(params: any) {
    if (originalRegister) {
      await originalRegister(params);
    }
    extendUserService(plugin);
  };

  const originalBootstrap = plugin.bootstrap?.bind(plugin);
  plugin.bootstrap = async function bootstrapWithFirebase(params: any) {
    if (originalBootstrap) {
      await originalBootstrap(params);
    }
    extendUserService(plugin);
  };

  // Firebase token middleware for endpoints that need it
  plugin.middlewares = {
    ...plugin.middlewares,
    async firebaseAuth(ctx: any, next: () => Promise<void>) {
      try {
        const authorization = ctx.request.header.authorization;

        if (authorization?.startsWith('Bearer ')) {
          const token = authorization.slice(7);

          // Firebase ID tokens are typically longer than Strapi JWTs
          if (token.length > 1000) {
            try {
              const decodedToken = await firebaseAdmin.verifyIdToken(token);
              const user = await strapi.db.query('plugin::users-permissions.user').findOne({
                where: { firebaseUid: decodedToken.uid },
              });

              if (user && !user.blocked) {
                ctx.state.user = user;
              }
            } catch {
              // Token validation failed, continue without user
            }
          }
        }
      } catch {
        // Middleware error, continue
      }

      await next();
    },
  };

  return plugin;
};
