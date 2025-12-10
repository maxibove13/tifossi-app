/**
 * Guest order routes - Public endpoints for unauthenticated order creation
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/guest',
      handler: 'order.createGuestOrder',
      config: {
        auth: false,
      },
    },
  ],
};
