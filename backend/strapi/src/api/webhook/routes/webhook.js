/**
 * Webhook routes for MercadoPago integration
 * Registers public webhook endpoints that don't require authentication
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/webhooks/mercadopago',
      handler: 'webhook.mercadopago',
      config: {
        auth: false, // Webhooks don't use JWT authentication
        policies: [],
        middlewares: [],
      },
    },
  ],
};
