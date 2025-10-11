/**
 * Webhook controller
 * Routes webhook requests to appropriate handlers
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mercadopagoWebhook = require('../../../webhooks/mercadopago');

export default {
  /**
   * Handle MercadoPago webhook notifications
   * POST /api/webhooks/mercadopago
   */
  async mercadopago(ctx: any) {
    return await mercadopagoWebhook.handleWebhook(ctx);
  },
};
