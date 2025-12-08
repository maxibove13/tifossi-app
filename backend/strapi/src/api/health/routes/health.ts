/**
 * Health check routes
 */

export default {
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
    {
      method: 'GET',
      path: '/health/firebase',
      handler: 'health.firebaseHealthCheck',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
