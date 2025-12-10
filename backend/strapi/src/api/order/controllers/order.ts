import { factories } from '@strapi/strapi';
import {
  sanitizeOrderPayload,
  sanitizeGuestOrderPayload,
  buildClientOrder,
} from '../../../utils/order-sanitizer';

interface OrderEntity {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  user?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async create(ctx: any) {
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
          shippingMethod: sanitizedOrder.shippingMethod as 'delivery' | 'pickup',
          storeLocation: sanitizedOrder.storeLocationId || null,
          shippingCost: sanitizedOrder.shippingCost,
          subtotal: sanitizedOrder.subtotal,
          discount: sanitizedOrder.discount,
          total: sanitizedOrder.total,
          paymentMethod: payload.paymentMethod || 'mercadopago',
          paymentStatus: 'pending',
          status: 'pending',
          notes: payload.notes || undefined,
          metadata: sanitizedOrder.metadata,
        } as any,
        populate: {
          items: { populate: { product: true } },
          user: true,
          storeLocation: true,
        },
      });

      const clientOrder = buildClientOrder(
        orderEntity as unknown as OrderEntity,
        sanitizedOrder.clientSummary
      );

      ctx.status = 201;
      ctx.body = {
        success: true,
        order: clientOrder,
      };
    } catch (error: any) {
      strapi.log.error('Order creation failed:', error);
      ctx.badRequest(error.message || 'Unable to create order');
    }
  },

  async createGuestOrder(ctx: any) {
    try {
      const payload = ctx.request.body?.data || ctx.request.body || {};

      // Validate required guest fields
      if (!payload.guestEmail) {
        return ctx.badRequest('Guest email is required');
      }

      const sanitizedOrder = await sanitizeGuestOrderPayload({
        strapi,
        rawOrder: payload,
        guestInfo: {
          email: payload.guestEmail,
          name: payload.guestName,
          phone: payload.guestPhone,
        },
        requestMeta: {
          userAgent: ctx.request.headers['user-agent'],
          ip: ctx.request.ip,
        },
      });

      const orderEntity = await strapi.documents('api::order.order').create({
        data: {
          orderNumber: sanitizedOrder.orderNumber,
          orderDate: new Date(),
          guestEmail: payload.guestEmail,
          guestName: payload.guestName || null,
          guestPhone: payload.guestPhone || null,
          items: sanitizedOrder.itemsForPersistence,
          shippingAddress: sanitizedOrder.shippingAddressComponent,
          shippingMethod: sanitizedOrder.shippingMethod as 'delivery' | 'pickup',
          storeLocation: sanitizedOrder.storeLocationId || null,
          shippingCost: sanitizedOrder.shippingCost,
          subtotal: sanitizedOrder.subtotal,
          discount: sanitizedOrder.discount,
          total: sanitizedOrder.total,
          paymentMethod: payload.paymentMethod || 'mercadopago',
          paymentStatus: 'pending',
          status: 'pending',
          notes: payload.notes || undefined,
          metadata: sanitizedOrder.metadata,
        } as any,
        populate: {
          items: { populate: { product: true } },
          storeLocation: true,
        },
      });

      const clientOrder = buildClientOrder(
        orderEntity as unknown as OrderEntity,
        sanitizedOrder.clientSummary
      );

      ctx.status = 201;
      ctx.body = {
        success: true,
        order: clientOrder,
      };
    } catch (error: any) {
      strapi.log.error('Guest order creation failed:', error);
      ctx.badRequest(error.message || 'Unable to create guest order');
    }
  },

  async update(ctx: any) {
    return ctx.forbidden('Order updates are not allowed through this endpoint.');
  },

  async delete(ctx: any) {
    return ctx.forbidden('Order deletion is not allowed through this endpoint.');
  },
}));
