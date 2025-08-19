/**
 * Payment controller for Tifossi Expo
 * Handles MercadoPago integration and order processing
 */

const MercadoPagoService = require('../../../../../payment/mercadopago-service');
const OrderStateManager = require('../../../../../payment/order-state-manager');

module.exports = {
  /**
   * Create payment preference for an order
   * POST /api/payment/create-preference
   */
  async createPreference(ctx) {
    try {
      const { orderData } = ctx.request.body;
      
      // Validate user authentication
      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      // Validate order data
      if (!orderData || !orderData.items || !orderData.user) {
        return ctx.badRequest('Invalid order data');
      }

      // Ensure user can only create preferences for their own orders
      if (orderData.user.id !== ctx.state.user.id) {
        return ctx.forbidden('Cannot create preference for another user');
      }

      // Initialize services
      const mpService = new MercadoPagoService();
      const orderManager = new OrderStateManager();

      // Create order in database
      const order = await strapi.entityService.create('api::order.order', {
        data: {
          orderNumber: orderData.orderNumber,
          user: orderData.user.id,
          items: orderData.items,
          shippingAddress: orderData.shippingAddress,
          shippingMethod: orderData.shippingMethod,
          shippingCost: orderData.shippingCost,
          paymentMethod: 'mercadopago',
          subtotal: orderData.subtotal,
          discount: orderData.discount || 0,
          total: orderData.total,
          currency: 'UYU',
          status: 'CREATED',
          metadata: {
            createdVia: 'mobile_app',
            userAgent: ctx.request.headers['user-agent'],
            ipAddress: ctx.request.ip
          }
        }
      });

      // Create MercadoPago preference
      const preference = await mpService.createPreference({
        ...orderData,
        id: order.id
      });

      // Update order with preference ID
      await strapi.entityService.update('api::order.order', order.id, {
        data: {
          mpPreferenceId: preference.id,
          status: 'PAYMENT_PENDING'
        }
      });

      // Log order state change
      await orderManager.transitionStatus(order.id, 'CREATED', 'PAYMENT_PENDING', {
        triggeredBy: 'system',
        reason: 'MercadoPago preference created'
      });

      ctx.body = {
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          preference: {
            id: preference.id,
            initPoint: preference.initPoint,
            externalReference: preference.externalReference
          }
        }
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
  async verifyPayment(ctx) {
    try {
      const { paymentId } = ctx.params;
      
      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      // Initialize MercadoPago service
      const mpService = new MercadoPagoService();
      
      // Get payment information from MercadoPago
      const paymentInfo = await mpService.getPayment(paymentId);
      
      // Find associated order
      const orders = await strapi.entityService.findMany('api::order.order', {
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
      
      // Update order with payment information
      const orderStatus = mpService.mapPaymentStatus(paymentInfo.status, paymentInfo.statusDetail);
      
      const updatedOrder = await strapi.entityService.update('api::order.order', order.id, {
        data: {
          mpPaymentId: paymentInfo.id,
          mpPaymentStatus: paymentInfo.status,
          status: orderStatus,
          paidAt: paymentInfo.status === 'approved' ? paymentInfo.dateApproved : null,
          metadata: {
            ...order.metadata,
            lastPaymentCheck: new Date().toISOString(),
            paymentStatusDetail: paymentInfo.statusDetail
          }
        }
      });

      // Log status transition if changed
      if (order.status !== orderStatus) {
        const orderManager = new OrderStateManager();
        await orderManager.transitionStatus(order.id, order.status, orderStatus, {
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
            statusDetail: paymentInfo.statusDetail,
            amount: paymentInfo.transactionAmount,
            currency: paymentInfo.currency,
            paymentMethod: paymentInfo.paymentMethodId,
            dateCreated: paymentInfo.dateCreated,
            dateApproved: paymentInfo.dateApproved
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
  async getOrders(ctx) {
    try {
      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      const { page = 1, pageSize = 10, status } = ctx.query;

      const filters = {
        user: ctx.state.user.id
      };

      if (status) {
        filters.status = status;
      }

      const orders = await strapi.entityService.findMany('api::order.order', {
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
  async getOrder(ctx) {
    try {
      const { orderId } = ctx.params;
      
      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      const order = await strapi.entityService.findOne('api::order.order', orderId, {
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
  async requestRefund(ctx) {
    try {
      const { orderId, reason = 'Customer request' } = ctx.request.body;
      
      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      // Get order
      const order = await strapi.entityService.findOne('api::order.order', orderId, {
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

      // Initialize services
      const mpService = new MercadoPagoService();
      const orderManager = new OrderStateManager();

      // Process refund with MercadoPago
      const refundInfo = await mpService.processRefund(order.mpPaymentId, null, reason);

      // Update order status
      await strapi.entityService.update('api::order.order', order.id, {
        data: {
          status: 'REFUNDED',
          metadata: {
            ...order.metadata,
            refundId: refundInfo.id,
            refundReason: reason,
            refundDate: new Date().toISOString()
          }
        }
      });

      // Log status transition
      await orderManager.transitionStatus(order.id, 'PAID', 'REFUNDED', {
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