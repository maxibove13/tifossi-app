/**
 * Users-Permissions plugin extension
 *
 * Registers Firebase authentication routes and augments the user service so
 * the existing Firebase controller in ./controllers/firebase.ts can handle all
 * Firebase-specific auth flows without disturbing the core auth controller.
 */

import { firebaseAdmin } from '../../lib/auth/firebase-admin-setup';
import firebaseController from './controllers/firebase';

type Plugin = {
  register?: (params: any) => Promise<void> | void;
  bootstrap?: (params: any) => Promise<void> | void;
  controllers?: Record<string, any>;
  services?: Record<string, any>;
  middlewares?: Record<string, any>;
};

const firebaseRoutes = [
  {
    method: 'POST' as const,
    path: '/auth/firebase-exchange',
    handler: 'firebase.exchange',
    config: { prefix: '', policies: [] },
  },
  {
    method: 'POST' as const,
    path: '/auth/firebase-sync',
    handler: 'firebase.sync',
    config: { prefix: '', policies: [] },
  },
  {
    method: 'GET' as const,
    path: '/auth/validate',
    handler: 'firebase.validate',
    config: { prefix: '', policies: [] },
  },
  {
    method: 'DELETE' as const,
    path: '/auth/firebase-delete',
    handler: 'firebase.delete',
    config: { prefix: '', policies: [] },
  },
];

let firebaseRoutesRegistered = false;

const registerFirebaseRoutes = () => {
  if (firebaseRoutesRegistered) {
    return true;
  }

  if (!strapi.server?.api) {
    strapi.log.warn(
      '[Strapi Firebase] Strapi server API not ready; skipping Firebase route registration for now'
    );
    return false;
  }

  try {
    strapi.server.api('content-api').routes(
      firebaseRoutes.map((route) => ({
        ...route,
        handler: route.handler.startsWith('plugin::')
          ? route.handler
          : `plugin::users-permissions.${route.handler}`,
      }))
    );

    firebaseRoutesRegistered = true;
    return true;
  } catch (error) {
    strapi.log.error('[Strapi Firebase] Failed to register Firebase routes dynamically:', error);
    return false;
  }
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
  } else {
    strapi.log.warn(
      '[Strapi Firebase] users-permissions user service missing sanitizeUser implementation'
    );
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

    registerFirebaseRoutes();
    extendUserService(plugin);
  };

  // Add the Firebase controller to the plugin
  plugin.controllers = {
    ...plugin.controllers,
    firebase: firebaseController({ strapi }),
  };

  // Preserve existing middleware extensions (if any) and add Firebase token guard
  plugin.middlewares = {
    ...plugin.middlewares,
    async firebaseAuth(ctx: any, next: () => Promise<void>) {
      try {
        const authorization = ctx.request.header.authorization;

        if (authorization?.startsWith('Bearer ')) {
          const token = authorization.slice(7);

          // Firebase ID tokens are JWTs but typically longer than Strapi JWTs
          if (token.length > 1000) {
            try {
              const decodedToken = await firebaseAdmin.verifyIdToken(token);
              const user = await strapi.db.query('plugin::users-permissions.user').findOne({
                where: { firebaseUid: decodedToken.uid },
              });

              if (user && !user.blocked) {
                ctx.state.user = user;
              }
            } catch (error) {
              strapi.log.warn('[Strapi Firebase] Firebase token validation failed:', error);
            }
          }
        }
      } catch (error) {
        strapi.log.error('[Strapi Firebase] Firebase auth middleware error:', error);
      }

      await next();
    },
  };

  return plugin;
};
