/**
 * Payment routes for Tifossi Expo
 */

interface RouteConfig {
  policies?: string[];
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
      method: 'POST',
      path: '/payment/create-preference',
      handler: 'payment.createPreference',
      config: {
        policies: ['global::is-authenticated'],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/payment/verify/:paymentId',
      handler: 'payment.verifyPayment',
      config: {
        policies: ['global::is-authenticated'],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/payment/orders',
      handler: 'payment.getOrders',
      config: {
        policies: ['global::is-authenticated'],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/payment/orders/:orderId',
      handler: 'payment.getOrder',
      config: {
        policies: ['global::is-authenticated'],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/payment/refund',
      handler: 'payment.requestRefund',
      config: {
        policies: ['global::is-authenticated'],
        middlewares: [],
      },
    },
  ],
};

export default paymentRoutes;
