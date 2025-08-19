/**
 * Payment routes for Tifossi Expo
 */

module.exports = {
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