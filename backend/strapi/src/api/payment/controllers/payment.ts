/**
 * Payment controller for Tifossi Expo
 * Handles MercadoPago integration and order processing
 */

import MercadoPagoService from '../../../lib/payment/mercadopago-service';
import OrderStateManager from '../../../lib/payment/order-state-manager';
import { OrderStatus } from '../../../lib/payment/types/orders';
import {
  sanitizeOrderPayload,
  sanitizeGuestOrderPayload,
  buildClientOrder,
} from '../../../utils/order-sanitizer';

export default {
  /**
   * Create payment preference for an order
   * POST /api/payment/create-preference
   */
  async createPreference(ctx: any) {
    try {
      const authUser = ctx.state.user;

      if (!authUser) {
        return ctx.unauthorized('Authentication required');
      }

      const rawOrder =
        ctx.request.body?.orderData || ctx.request.body?.data || ctx.request.body || {};
      const deviceFingerprint = ctx.request.body?.deviceFingerprint;

      const sanitizedOrder = await sanitizeOrderPayload({
        strapi,
        rawOrder,
        authUser,
        requestMeta: {
          userAgent: ctx.request.headers['user-agent'],
          ip: ctx.request.ip,
        },
      });

      const mpService = new MercadoPagoService();

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
          paymentMethod: 'mercadopago',
          paymentStatus: 'pending',
          status: 'pending',
          notes: rawOrder.notes || undefined,
          metadata: {
            ...sanitizedOrder.metadata,
            paymentProvider: 'mercadopago',
          },
        } as any,
        populate: {
          items: { populate: { product: true } },
          user: true,
          storeLocation: true,
        },
      });

      const preference = await mpService.createPreference(
        {
          orderNumber: orderEntity.orderNumber as string,
          items: sanitizedOrder.mercadoPagoPayload.items.map((item) => ({
            productId: String(item.productId),
            productName: item.productName,
            description: item.description || undefined,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            color: item.color,
          })),
          user: sanitizedOrder.mercadoPagoPayload.user,
          shippingAddress: sanitizedOrder.mercadoPagoPayload.address,
          shippingMethod: sanitizedOrder.shippingMethod as 'pickup' | 'delivery',
          shippingCost: sanitizedOrder.shippingCost,
          subtotal: sanitizedOrder.subtotal,
          discount: sanitizedOrder.discount,
          total: sanitizedOrder.total,
        },
        deviceFingerprint
      );

      const updatedOrder = await strapi.documents('api::order.order').update({
        documentId: orderEntity.documentId,
        data: {
          mpPreferenceId: preference.id,
        } as any,

        populate: {
          items: { populate: { product: true } },
          user: true,
        },
      });

      const clientOrder = buildClientOrder(updatedOrder as any, sanitizedOrder.clientSummary);

      ctx.body = {
        success: true,
        data: {
          order: clientOrder,
          preference: {
            id: preference.id,
            initPoint: preference.init_point,
            externalReference: preference.external_reference,
          },
        },
      };
    } catch (error) {
      strapi.log.error('Error creating payment preference:', error);

      const message = error instanceof Error ? error.message : 'Unknown error';

      // Validation errors from sanitizeOrderPayload (order-sanitizer.ts)
      const validationPatterns = [
        'Invalid order payload',
        'Invalid shipping method',
        'Invalid pickup store location',
        'Order must contain at least one item',
        'Each item must include a valid productId',
        'Invalid productId',
        'Quantity must be a positive integer',
        'Product not found',
        'Product price is not available',
        'Calculated order total must be greater than zero',
        'Shipping address is required',
        'Missing required address fields',
      ];

      if (validationPatterns.some((pattern) => message.includes(pattern))) {
        return ctx.badRequest(message);
      }

      // MercadoPago configuration errors
      if (message.includes('MercadoPago') && message.includes('required')) {
        strapi.log.error('MercadoPago configuration error - check environment variables');
        return ctx.internalServerError('Payment service configuration error');
      }

      // MercadoPago API errors
      if (message.includes('MercadoPago API error')) {
        return ctx.badGateway(message);
      }

      ctx.internalServerError('Failed to create payment preference');
    }
  },

  /**
   * Create payment preference for a guest order (no authentication required)
   * POST /api/payment/guest/create-preference
   */
  async createGuestPreference(ctx: any) {
    try {
      const rawOrder =
        ctx.request.body?.orderData || ctx.request.body?.data || ctx.request.body || {};
      const deviceFingerprint = ctx.request.body?.deviceFingerprint;

      // Validate required guest fields
      if (!rawOrder.guestEmail) {
        return ctx.badRequest('Guest email is required');
      }

      const guestInfo = {
        email: rawOrder.guestEmail,
        name: rawOrder.guestName,
        phone: rawOrder.guestPhone,
      };

      const sanitizedOrder = await sanitizeGuestOrderPayload({
        strapi,
        rawOrder,
        guestInfo,
        requestMeta: {
          userAgent: ctx.request.headers['user-agent'],
          ip: ctx.request.ip,
        },
      });

      const mpService = new MercadoPagoService();

      const orderEntity = await strapi.documents('api::order.order').create({
        data: {
          orderNumber: sanitizedOrder.orderNumber,
          orderDate: new Date(),
          guestEmail: guestInfo.email,
          guestName: guestInfo.name || null,
          guestPhone: guestInfo.phone || null,
          items: sanitizedOrder.itemsForPersistence,
          shippingAddress: sanitizedOrder.shippingAddressComponent,
          shippingMethod: sanitizedOrder.shippingMethod as 'delivery' | 'pickup',
          storeLocation: sanitizedOrder.storeLocationId || null,
          shippingCost: sanitizedOrder.shippingCost,
          subtotal: sanitizedOrder.subtotal,
          discount: sanitizedOrder.discount,
          total: sanitizedOrder.total,
          paymentMethod: 'mercadopago',
          paymentStatus: 'pending',
          status: 'pending',
          notes: rawOrder.notes || undefined,
          metadata: {
            ...sanitizedOrder.metadata,
            paymentProvider: 'mercadopago',
            isGuestOrder: true,
          },
        } as any,
        populate: {
          items: { populate: { product: true } },
          storeLocation: true,
        },
      });

      const preference = await mpService.createPreference(
        {
          orderNumber: orderEntity.orderNumber as string,
          items: sanitizedOrder.mercadoPagoPayload.items.map((item) => ({
            productId: String(item.productId),
            productName: item.productName,
            description: item.description || undefined,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            color: item.color,
          })),
          user: sanitizedOrder.mercadoPagoPayload.user,
          shippingAddress: sanitizedOrder.mercadoPagoPayload.address,
          shippingMethod: sanitizedOrder.shippingMethod as 'pickup' | 'delivery',
          shippingCost: sanitizedOrder.shippingCost,
          subtotal: sanitizedOrder.subtotal,
          discount: sanitizedOrder.discount,
          total: sanitizedOrder.total,
        },
        deviceFingerprint
      );

      const updatedOrder = await strapi.documents('api::order.order').update({
        documentId: orderEntity.documentId,
        data: {
          mpPreferenceId: preference.id,
        } as any,
        populate: {
          items: { populate: { product: true } },
        },
      });

      const clientOrder = buildClientOrder(updatedOrder as any, sanitizedOrder.clientSummary);

      ctx.body = {
        success: true,
        data: {
          order: clientOrder,
          preference: {
            id: preference.id,
            initPoint: preference.init_point,
            externalReference: preference.external_reference,
          },
        },
      };
    } catch (error) {
      strapi.log.error('Error creating guest payment preference:', error);

      const message = error instanceof Error ? error.message : 'Unknown error';

      // Validation errors from sanitizeGuestOrderPayload (order-sanitizer.ts)
      // These are user-fixable errors - return 400
      const validationPatterns = [
        'Invalid order payload',
        'Invalid shipping method',
        'Invalid pickup store location',
        'Order must contain at least one item',
        'Each item must include a valid productId',
        'Invalid productId',
        'Quantity must be a positive integer',
        'Product not found',
        'Product price is not available',
        'Calculated order total must be greater than zero',
        'Shipping address is required',
        'Missing required address fields',
      ];

      if (validationPatterns.some((pattern) => message.includes(pattern))) {
        return ctx.badRequest(message);
      }

      // MercadoPago configuration errors (missing credentials)
      if (message.includes('MercadoPago') && message.includes('required')) {
        strapi.log.error('MercadoPago configuration error - check environment variables');
        return ctx.internalServerError('Payment service configuration error');
      }

      // MercadoPago API errors (upstream failure)
      if (message.includes('MercadoPago API error')) {
        return ctx.badGateway(message);
      }

      // Generic fallback for unexpected errors
      ctx.internalServerError('Failed to create guest payment preference');
    }
  },

  /**
   * Verify payment status
   * GET /api/payment/verify/:paymentId
   */
  async verifyPayment(ctx: any) {
    try {
      const { paymentId } = ctx.params;

      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      const mpService = new MercadoPagoService();

      const paymentInfo = await mpService.getPayment(paymentId);

      const orders = await strapi.documents('api::order.order').findMany({
        filters: {
          mpPaymentId: paymentId,
          user: ctx.state.user.id,
        },
        populate: ['user'],
      });

      if (!orders || orders.length === 0) {
        return ctx.notFound('Order not found');
      }

      const order = orders[0];

      const orderStatus = mpService.mapPaymentStatus(paymentInfo.status, paymentInfo.status_detail);

      const _updatedOrder = await strapi.documents('api::order.order').update({
        documentId: order.documentId,
        data: {
          mpPaymentId: paymentInfo.id,
          mpPaymentStatus: paymentInfo.status,
          status: orderStatus,
          paidAt: paymentInfo.status === 'approved' ? paymentInfo.date_approved : null,
          metadata: {
            ...((order as any).metadata || {}),
            lastPaymentCheck: new Date().toISOString(),
            paymentStatusDetail: paymentInfo.status_detail,
          },
        } as any,
      });

      if (order.status !== orderStatus) {
        const orderManager = new OrderStateManager();
        await orderManager.transitionStatus(
          String(order.id),
          order.status as OrderStatus,
          orderStatus,
          {
            triggeredBy: 'user',
            reason: 'Payment status verification',
          }
        );
      }

      ctx.body = {
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: orderStatus,
          paymentInfo: {
            id: paymentInfo.id,
            status: paymentInfo.status,
            statusDetail: paymentInfo.status_detail,
            amount: paymentInfo.transaction_amount,
            currency: paymentInfo.currency_id,
            paymentMethod: paymentInfo.payment_method_id,
            dateCreated: paymentInfo.date_created,
            dateApproved: paymentInfo.date_approved,
          },
        },
      };
    } catch (error) {
      strapi.log.error('Error verifying payment:', error);
      ctx.internalServerError('Failed to verify payment');
    }
  },

  /**
   * Get user orders
   * GET /api/payment/orders
   */
  async getOrders(ctx: any) {
    try {
      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      const { page = 1, pageSize = 10, status } = ctx.query;

      const filters: any = {
        user: ctx.state.user.id,
      };

      if (status) {
        filters.status = status;
      }

      const orders = await strapi.documents('api::order.order').findMany({
        filters,
        populate: ['user'],
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
        },
        sort: { createdAt: 'desc' },
      });

      ctx.body = {
        success: true,
        data: orders,
      };
    } catch (error) {
      strapi.log.error('Error fetching orders:', error);
      ctx.internalServerError('Failed to fetch orders');
    }
  },

  /**
   * Get specific order details
   * GET /api/payment/orders/:orderId
   */
  async getOrder(ctx: any) {
    try {
      const { orderId } = ctx.params;

      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      const order = await strapi.documents('api::order.order').findOne({
        documentId: orderId,
        populate: ['user'],
        filters: {
          user: ctx.state.user.id,
        },
      });

      if (!order) {
        return ctx.notFound('Order not found');
      }

      ctx.body = {
        success: true,
        data: order,
      };
    } catch (error) {
      strapi.log.error('Error fetching order:', error);
      ctx.internalServerError('Failed to fetch order');
    }
  },

  /**
   * Request payment refund
   * POST /api/payment/refund
   */
  async requestRefund(ctx: any) {
    try {
      const { orderId, reason = 'Customer request' } = ctx.request.body;

      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      const order = await strapi.documents('api::order.order').findOne({
        documentId: orderId,
        populate: ['user'],
        filters: {
          user: ctx.state.user.id,
        },
      });

      if (!order) {
        return ctx.notFound('Order not found');
      }

      if (order.status !== 'paid') {
        return ctx.badRequest('Only paid orders can be refunded');
      }

      if (!order.mpPaymentId) {
        return ctx.badRequest('No payment ID found for this order');
      }

      const mpService = new MercadoPagoService();
      const orderManager = new OrderStateManager();

      const refundInfo = await mpService.createRefund(String(order.mpPaymentId));

      await strapi.documents('api::order.order').update({
        documentId: order.documentId,
        data: {
          status: 'refunded',
          metadata: {
            ...((order as any).metadata || {}),
            refundId: refundInfo.id,
            refundReason: reason,
            refundDate: new Date().toISOString(),
          },
        } as any,
      });

      await orderManager.transitionStatus(
        String(order.id),
        OrderStatus.PAID,
        OrderStatus.REFUNDED,
        {
          triggeredBy: 'user',
          reason: `Refund requested: ${reason}`,
        }
      );

      ctx.body = {
        success: true,
        data: {
          orderId: order.id,
          refundId: refundInfo.id,
          status: 'REFUNDED',
          message: 'Refund processed successfully',
        },
      };
    } catch (error) {
      strapi.log.error('Error processing refund:', error);
      ctx.internalServerError('Failed to process refund');
    }
  },
};
