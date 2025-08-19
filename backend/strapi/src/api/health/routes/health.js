'use strict';

/**
 * Health check routes
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/health',
      handler: 'health.healthCheck',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/health/detailed',
      handler: 'health.detailedHealthCheck',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};