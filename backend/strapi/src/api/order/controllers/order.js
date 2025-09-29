'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { sanitizeOrderPayload, buildClientOrder } = require('../../../utils/order-sanitizer');

module.exports = createCoreController('api::order.order', ({ strapi }) => ({
  async create(ctx) {
    const authUser = ctx.state.user;

    if (!authUser) {
      return ctx.unauthorized('Authentication required');
    }

    try {
      const payload = ctx.request.body?.data || ctx.request.body || {};

      const sanitizedOrder = await sanitizeOrderPayload({
        strapi,
        rawOrder: payload,
        authUser,
        requestMeta: {
          userAgent: ctx.request.headers['user-agent'],
          ip: ctx.request.ip,
        },
      });

      const orderEntity = await strapi.documents('api::order.order').create({
        data: {
          orderNumber: sanitizedOrder.orderNumber,
          orderDate: new Date(),
          user: authUser.id,
          items: sanitizedOrder.itemsForPersistence,
          shippingAddress: sanitizedOrder.shippingAddressComponent,
          shippingMethod: sanitizedOrder.shippingMethod,
          shippingCost: sanitizedOrder.shippingCost,
          subtotal: sanitizedOrder.subtotal,
          discount: sanitizedOrder.discount,
          total: sanitizedOrder.total,
          paymentMethod: payload.paymentMethod || 'mercadopago',
          paymentStatus: 'PENDING',
          status: 'CREATED',
          notes: payload.notes || null,
          metadata: sanitizedOrder.metadata,
        },
        populate: {
          items: { populate: { product: true } },
          user: true,
        },
      });

      const clientOrder = buildClientOrder(orderEntity, sanitizedOrder.clientSummary);

      ctx.status = 201;
      ctx.body = {
        success: true,
        order: clientOrder,
      };
    } catch (error) {
      strapi.log.error('Order creation failed:', error);
      ctx.badRequest(error.message || 'Unable to create order');
    }
  },

  async update(ctx) {
    return ctx.forbidden('Order updates are not allowed through this endpoint.');
  },

  async delete(ctx) {
    return ctx.forbidden('Order deletion is not allowed through this endpoint.');
  },
}));
