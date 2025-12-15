/**
 * order router
 * Uses jwt-auth middleware to bypass RBAC while validating JWT
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/orders',
      handler: 'order.find',
      config: {
        auth: false,
        middlewares: ['global::jwt-auth'],
      },
    },
    {
      method: 'GET',
      path: '/orders/:id',
      handler: 'order.findOne',
      config: {
        auth: false,
        middlewares: ['global::jwt-auth'],
      },
    },
    {
      method: 'POST',
      path: '/orders',
      handler: 'order.create',
      config: {
        auth: false,
        middlewares: ['global::jwt-auth'],
      },
    },
  ],
};
