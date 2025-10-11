/**
 * Payment controller for Tifossi Expo
 * Handles MercadoPago integration and order processing
 */

import MercadoPagoService from '../../../lib/payment/mercadopago-service';
import OrderStateManager from '../../../lib/payment/order-state-manager';
import { OrderStatus } from '../../../lib/payment/types/orders';
import { sanitizeOrderPayload, buildClientOrder } from '../../../utils/order-sanitizer';

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

      const rawOrder = ctx.request.body?.orderData || ctx.request.body?.data || ctx.request.body || {};

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
      const orderManager = new OrderStateManager();

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
          paymentMethod: 'mercadopago',
          paymentStatus: 'PENDING',
          status: 'PENDING',
          notes: rawOrder.notes || null,
          metadata: {
            ...sanitizedOrder.metadata,
            paymentProvider: 'mercadopago',
          },
        },
        populate: {
          items: { populate: { product: true } },
          user: true,
        },
      });

      const preference = await mpService.createPreference({
        orderNumber: orderEntity.orderNumber,
        items: sanitizedOrder.mercadoPagoPayload.items.map(item => ({
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
      });

      const updatedOrder = await strapi.documents('api::order.order').update({
        documentId: orderEntity.documentId,
        data: {
          mpPreferenceId: preference.id,
          status: 'PAYMENT_PENDING',
        } as any,

        populate: {
          items: { populate: { product: true } },
          user: true,
        }
      });

      await orderManager.transitionStatus(String(orderEntity.id), OrderStatus.PENDING, OrderStatus.PAYMENT_PENDING, {
        triggeredBy: 'system',
        reason: 'MercadoPago preference created',
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
      ctx.internalServerError('Failed to create payment preference');
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
          user: ctx.state.user.id
        },
        populate: ['user']
      });

      if (!orders || orders.length === 0) {
        return ctx.notFound('Order not found');
      }

      const order = orders[0];

      const orderStatus = mpService.mapPaymentStatus(paymentInfo.status, paymentInfo.status_detail);

      const updatedOrder = await strapi.documents('api::order.order').update({
        documentId: order.documentId,
        data: {
          mpPaymentId: paymentInfo.id,
          mpPaymentStatus: paymentInfo.status,
          status: orderStatus,
          paidAt: paymentInfo.status === 'approved' ? paymentInfo.date_approved : null,
          metadata: {
            ...order.metadata,
            lastPaymentCheck: new Date().toISOString(),
            paymentStatusDetail: paymentInfo.status_detail
          }
        } as any
      });

      if (order.status !== orderStatus) {
        const orderManager = new OrderStateManager();
        await orderManager.transitionStatus(String(order.id), order.status, orderStatus, {
          triggeredBy: 'user',
          reason: 'Payment status verification'
        });
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
            dateApproved: paymentInfo.date_approved
          }
        }
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
        user: ctx.state.user.id
      };

      if (status) {
        filters.status = status;
      }

      const orders = await strapi.documents('api::order.order').findMany({
        filters,
        populate: ['user'],
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        },
        sort: { createdAt: 'desc' }
      });

      ctx.body = {
        success: true,
        data: orders
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
          user: ctx.state.user.id
        }
      });

      if (!order) {
        return ctx.notFound('Order not found');
      }

      ctx.body = {
        success: true,
        data: order
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
          user: ctx.state.user.id
        }
      });

      if (!order) {
        return ctx.notFound('Order not found');
      }

      if (order.status !== 'PAID') {
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
          status: 'REFUNDED',
          metadata: {
            ...order.metadata,
            refundId: refundInfo.id,
            refundReason: reason,
            refundDate: new Date().toISOString()
          }
        } as any
      });

      await orderManager.transitionStatus(String(order.id), OrderStatus.PAID, OrderStatus.REFUNDED, {
        triggeredBy: 'user',
        reason: `Refund requested: ${reason}`
      });

      ctx.body = {
        success: true,
        data: {
          orderId: order.id,
          refundId: refundInfo.id,
          status: 'REFUNDED',
          message: 'Refund processed successfully'
        }
      };

    } catch (error) {
      strapi.log.error('Error processing refund:', error);
      ctx.internalServerError('Failed to process refund');
    }
  }
};
