/**
 * Health check routes
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/',
      handler: 'health.healthCheck',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/detailed',
      handler: 'health.detailedHealthCheck',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
