/**
 * Payment routes for Tifossi Expo
 */

interface RouteConfig {
  auth?: boolean;
  middlewares?: string[];
}

interface RouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: string;
  config?: RouteConfig;
}

interface RoutesModule {
  routes: RouteDefinition[];
}

const paymentRoutes: RoutesModule = {
  routes: [
    {
      method: 'GET',
      path: '/payment/redirect',
      handler: 'payment.redirect',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/payment/create-preference',
      handler: 'payment.createPreference',
      config: {
        auth: false,
        middlewares: ['global::jwt-auth'],
      },
    },
    {
      method: 'POST',
      path: '/payment/guest/create-preference',
      handler: 'payment.createGuestPreference',
      config: {
        auth: false,
        middlewares: ['global::guest-rate-limit'],
      },
    },
    {
      method: 'GET',
      path: '/payment/verify/:paymentId',
      handler: 'payment.verifyPayment',
      config: {
        auth: false,
        middlewares: ['global::jwt-auth'],
      },
    },
    {
      method: 'GET',
      path: '/payment/orders',
      handler: 'payment.getOrders',
      config: {
        auth: false,
        middlewares: ['global::jwt-auth'],
      },
    },
    {
      method: 'GET',
      path: '/payment/orders/:orderId',
      handler: 'payment.getOrder',
      config: {
        auth: false,
        middlewares: ['global::jwt-auth'],
      },
    },
    {
      method: 'POST',
      path: '/payment/refund',
      handler: 'payment.requestRefund',
      config: {
        auth: false,
        middlewares: ['global::jwt-auth'],
      },
    },
  ],
};

export default paymentRoutes;
