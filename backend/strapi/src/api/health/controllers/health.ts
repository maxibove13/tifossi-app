/**
 * Health check controller
 */

import { buildBasicHealthPayload } from '../../../utils/health-response';
import { firebaseAdmin } from '../../../lib/auth/firebase-admin-setup';

export default {
  /**
   * Basic health check endpoint
   */
  async healthCheck(ctx: any) {
    try {
      // Basic health check - just return OK if the server is running
      ctx.status = 200;
      ctx.body = buildBasicHealthPayload();
    } catch (error) {
      strapi.log.error('Health check failed:', error);

      ctx.status = 503;
      ctx.body = {
        status: 'error',
        message: 'Service Unavailable',
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Detailed health check endpoint
   */
  async detailedHealthCheck(ctx: any) {
    try {
      const healthChecks = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: await checkDatabaseHealth(),
          upload: await checkUploadHealth(),
          email: await checkEmailHealth(),
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
        system: {
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
        },
      };

      // Check if any service is unhealthy
      const unhealthyServices = Object.entries(healthChecks.services).filter(
        ([, service]) => service.status !== 'ok'
      );

      if (unhealthyServices.length > 0) {
        healthChecks.status = 'degraded';
        ctx.status = 207; // Multi-status
      } else {
        ctx.status = 200;
      }

      ctx.body = healthChecks;
    } catch (error) {
      strapi.log.error('Detailed health check failed:', error);

      ctx.status = 503;
      ctx.body = {
        status: 'error',
        message: 'Service Unavailable',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      };
    }
  },

  /**
   * Firebase health check endpoint - for debugging auth issues
   */
  async firebaseHealthCheck(ctx: any) {
    try {
      const envCheck = {
        FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        FIREBASE_SERVICE_ACCOUNT_KEY: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
        FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY_LENGTH: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
        FIREBASE_PRIVATE_KEY_HAS_NEWLINES:
          process.env.FIREBASE_PRIVATE_KEY?.includes('\n') || false,
        FIREBASE_PRIVATE_KEY_HAS_ESCAPED:
          process.env.FIREBASE_PRIVATE_KEY?.includes('\\n') || false,
        FIREBASE_PRIVATE_KEY_STARTS_WITH:
          process.env.FIREBASE_PRIVATE_KEY?.substring(0, 30) || 'NOT SET',
      };

      const health = await firebaseAdmin.healthCheck();

      ctx.status = health.status === 'healthy' ? 200 : 503;
      ctx.body = {
        firebase: health,
        envVars: envCheck,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      ctx.status = 503;
      ctx.body = {
        status: 'error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      };
    }
  },
};

/**
 * Check database health
 */
async function checkDatabaseHealth() {
  try {
    // Try a simple query to test database connectivity
    await strapi.db.connection.raw('SELECT 1');

    return {
      status: 'ok',
      message: 'Database connection is healthy',
      responseTime: Date.now(),
    };
  } catch (error) {
    strapi.log.error('Database health check failed:', error);

    return {
      status: 'error',
      message: 'Database connection failed',
      error: (error as Error).message,
    };
  }
}

/**
 * Check upload service health
 */
async function checkUploadHealth() {
  try {
    const uploadConfig = strapi.config.get('plugin::upload');

    return {
      status: 'ok',
      provider: (uploadConfig as any)?.provider || 'local',
      message: 'Upload service is configured',
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Upload service configuration error',
      error: (error as Error).message,
    };
  }
}

/**
 * Check email service health
 */
async function checkEmailHealth() {
  try {
    const emailConfig = strapi.config.get('plugin::email');

    if (!emailConfig || !(emailConfig as any).provider) {
      return {
        status: 'warning',
        message: 'Email service not configured',
      };
    }

    return {
      status: 'ok',
      provider: (emailConfig as any).provider,
      message: 'Email service is configured',
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Email service configuration error',
      error: (error as Error).message,
    };
  }
}
