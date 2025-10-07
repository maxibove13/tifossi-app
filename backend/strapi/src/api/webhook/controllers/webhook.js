/**
 * Webhook controller
 * Routes webhook requests to appropriate handlers
 */

'use strict';

const mercadopagoWebhook = require('../../../webhooks/mercadopago');

module.exports = {
  /**
   * Handle MercadoPago webhook notifications
   * POST /api/webhooks/mercadopago
   */
  async mercadopago(ctx) {
    return await mercadopagoWebhook.handleWebhook(ctx);
  },
};
