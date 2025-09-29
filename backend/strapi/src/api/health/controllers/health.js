'use strict';

/**
 * Health check controller
 */

module.exports = {
  /**
   * Basic health check endpoint
   */
  async healthCheck(ctx) {
    try {
      // Basic health check - just return OK if the server is running
      const healthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      };

      ctx.status = 200;
      ctx.body = healthStatus;
      
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
  async detailedHealthCheck(ctx) {
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
      const unhealthyServices = Object.entries(healthChecks.services)
        .filter(([, service]) => service.status !== 'ok');

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
        error: error.message,
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
      error: error.message,
    };
  }
}

/**
 * Check upload service health
 */
async function checkUploadHealth() {
  try {
    const uploadConfig = strapi.config.get("plugin::upload");
    
    return {
      status: 'ok',
      provider: uploadConfig?.provider || 'local',
      message: 'Upload service is configured',
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Upload service configuration error',
      error: error.message,
    };
  }
}

/**
 * Check email service health
 */
async function checkEmailHealth() {
  try {
    const emailConfig = strapi.config.get("plugin::email");
    
    if (!emailConfig || !emailConfig.provider) {
      return {
        status: 'warning',
        message: 'Email service not configured',
      };
    }
    
    return {
      status: 'ok',
      provider: emailConfig.provider,
      message: 'Email service is configured',
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Email service configuration error',
      error: error.message,
    };
  }
}