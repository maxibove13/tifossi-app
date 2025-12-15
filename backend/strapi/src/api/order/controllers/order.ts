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
  async find(ctx: any) {
    // User populated by jwt-auth middleware
    const authUser = ctx.state.user;
    if (!authUser) {
      return ctx.unauthorized('Authentication required');
    }

    const { page = 1, pageSize = 10 } = ctx.query;

    const orders = await strapi.documents('api::order.order').findMany({
      filters: { user: authUser.id },
      sort: { createdAt: 'desc' },
      populate: {
        items: { populate: { product: true } },
        storeLocation: true,
      },
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize),
    });

    const total = await strapi.documents('api::order.order').count({
      filters: { user: authUser.id },
    });

    ctx.body = {
      orders: orders.map((order: any) => ({
        id: order.documentId || order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items || [],
        total: order.total,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        shippingMethod: order.shippingMethod,
      })),
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    };
  },

  async findOne(ctx: any) {
    // User populated by jwt-auth middleware
    const authUser = ctx.state.user;
    if (!authUser) {
      return ctx.unauthorized('Authentication required');
    }

    const { id } = ctx.params;

    const order = await strapi.documents('api::order.order').findOne({
      documentId: id,
      populate: {
        items: { populate: { product: true } },
        user: true,
        storeLocation: true,
      },
    });

    if (!order) {
      return ctx.notFound('Order not found');
    }

    // Verify the order belongs to this user
    if ((order as any).user?.id !== authUser.id) {
      return ctx.forbidden('You can only access your own orders');
    }

    const orderData = order as any;
    ctx.body = {
      order: {
        id: orderData.documentId || orderData.id,
        orderNumber: orderData.orderNumber,
        status: orderData.status,
        paymentStatus: orderData.paymentStatus,
        createdAt: orderData.createdAt,
        updatedAt: orderData.updatedAt,
        items: orderData.items || [],
        total: orderData.total,
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        shippingCost: orderData.shippingCost,
        shippingMethod: orderData.shippingMethod,
        shippingAddress: orderData.shippingAddress,
        storeLocation: orderData.storeLocation,
        notes: orderData.notes,
      },
    };
  },

  async create(ctx: any) {
    // User populated by jwt-auth middleware
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
}));
