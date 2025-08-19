/**
 * MercadoPago Webhook Handler for Tifossi Expo
 * Processes payment notifications from MercadoPago
 */

const MercadoPagoService = require('../../../payment/mercadopago-service');
const OrderStateManager = require('../../../payment/order-state-manager');

module.exports = {
  /**
   * Handle MercadoPago webhook notifications
   * POST /webhooks/mercadopago
   */
  async handleWebhook(ctx) {
    try {
      // Get raw body for signature verification
      const rawBody = JSON.stringify(ctx.request.body);
      const signature = ctx.request.headers['x-signature'];
      const requestId = ctx.request.headers['x-request-id'];

      // Log webhook reception
      strapi.log.info(`MercadoPago webhook received: ${ctx.request.body?.type || 'unknown'}`);
      strapi.log.debug('Webhook headers:', {
        signature: signature ? 'present' : 'missing',
        requestId,
        userAgent: ctx.request.headers['user-agent']
      });

      // Verify webhook signature for security
      const mpService = new MercadoPagoService();
      if (!signature || !mpService.verifyWebhookSignature(signature, rawBody)) {
        strapi.log.warn('Invalid webhook signature');
        return ctx.unauthorized('Invalid signature');
      }

      const webhookData = ctx.request.body;

      // Validate webhook data structure
      if (!webhookData || !webhookData.type || !webhookData.data) {
        strapi.log.warn('Invalid webhook data structure');
        return ctx.badRequest('Invalid webhook data');
      }

      // Process different types of notifications
      switch (webhookData.type) {
        case 'payment':
          await this.handlePaymentNotification(webhookData.data, requestId);
          break;
        
        case 'plan':
          // Handle subscription plan changes (if applicable in future)
          strapi.log.info('Plan notification received (not implemented)');
          break;
        
        case 'subscription':
          // Handle subscription changes (if applicable in future)
          strapi.log.info('Subscription notification received (not implemented)');
          break;
        
        case 'invoice':
          // Handle invoice notifications (if applicable in future)
          strapi.log.info('Invoice notification received (not implemented)');
          break;
        
        default:
          strapi.log.warn(`Unknown webhook type: ${webhookData.type}`);
          break;
      }

      // Always return 200 OK to acknowledge webhook receipt
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: 'Webhook processed successfully',
        requestId
      };

    } catch (error) {
      strapi.log.error('Error processing MercadoPago webhook:', error);
      
      // Return 200 OK even on error to prevent MercadoPago retries for unrecoverable errors
      ctx.status = 200;
      ctx.body = {
        success: false,
        error: 'Webhook processing failed',
        message: error.message
      };
    }
  },

  /**
   * Handle payment notification from MercadoPago
   * @param {Object} paymentData - Payment notification data
   * @param {string} requestId - Webhook request ID for tracking
   */
  async handlePaymentNotification(paymentData, requestId) {
    try {
      const paymentId = paymentData.id;
      
      if (!paymentId) {
        strapi.log.warn('Payment notification missing payment ID');
        return;
      }

      strapi.log.info(`Processing payment notification for payment ID: ${paymentId}`);

      // Initialize services
      const mpService = new MercadoPagoService();
      const orderManager = new OrderStateManager();

      // Get payment information from MercadoPago
      const paymentInfo = await mpService.getPayment(paymentId);
      
      if (!paymentInfo) {
        strapi.log.warn(`Could not retrieve payment information for ID: ${paymentId}`);
        return;
      }

      // Find associated order by external reference
      let order = null;
      if (paymentInfo.externalReference) {
        const orders = await strapi.entityService.findMany('api::order.order', {
          filters: {
            orderNumber: paymentInfo.externalReference
          }
        });
        
        if (orders && orders.length > 0) {
          order = orders[0];
        }
      }

      // If not found by external reference, try by preference ID or payment ID
      if (!order && (paymentInfo.externalReference || paymentId)) {
        const orders = await strapi.entityService.findMany('api::order.order', {
          filters: {
            $or: [
              { mpPaymentId: paymentId },
              { mpPreferenceId: paymentInfo.externalReference }
            ]
          }
        });
        
        if (orders && orders.length > 0) {
          order = orders[0];
        }
      }

      if (!order) {
        strapi.log.warn(`No order found for payment ID: ${paymentId}, external reference: ${paymentInfo.externalReference}`);
        return;
      }

      strapi.log.info(`Found order ${order.orderNumber} for payment ${paymentId}`);

      // Map MercadoPago status to internal order status
      const newOrderStatus = mpService.mapPaymentStatus(paymentInfo.status, paymentInfo.statusDetail);
      const previousStatus = order.status;

      // Prepare update data
      const updateData = {
        mpPaymentId: paymentInfo.id,
        mpCollectionId: paymentData.collection_id || paymentInfo.id,
        mpPaymentStatus: paymentInfo.status,
        metadata: {
          ...order.metadata,
          lastWebhookUpdate: new Date().toISOString(),
          webhookRequestId: requestId,
          paymentStatusDetail: paymentInfo.statusDetail,
          paymentMethod: paymentInfo.paymentMethodId,
          paymentType: paymentInfo.paymentTypeId
        }
      };

      // Set payment timestamp based on status
      if (paymentInfo.status === 'approved' && paymentInfo.dateApproved) {
        updateData.paidAt = paymentInfo.dateApproved;
      }

      // Update order status if it has changed
      if (previousStatus !== newOrderStatus) {
        updateData.status = newOrderStatus;
        
        // Log status transition
        await orderManager.transitionStatus(order.id, previousStatus, newOrderStatus, {
          triggeredBy: 'webhook',
          reason: `MercadoPago payment ${paymentInfo.status}: ${paymentInfo.statusDetail}`,
          metadata: {
            paymentId: paymentInfo.id,
            webhookRequestId: requestId
          }
        });

        strapi.log.info(`Order ${order.orderNumber} status changed from ${previousStatus} to ${newOrderStatus}`);
      }

      // Update order in database
      await strapi.entityService.update('api::order.order', order.id, {
        data: updateData
      });

      // Process post-payment actions based on new status
      await this.processPostPaymentActions(order, newOrderStatus, paymentInfo);

      strapi.log.info(`Successfully processed payment notification for order ${order.orderNumber}`);

    } catch (error) {
      strapi.log.error('Error handling payment notification:', error);
      throw error; // Re-throw to be caught by main webhook handler
    }
  },

  /**
   * Process actions after payment status update
   * @param {Object} order - Order data
   * @param {string} status - New order status
   * @param {Object} paymentInfo - Payment information
   */
  async processPostPaymentActions(order, status, paymentInfo) {
    try {
      switch (status) {
        case 'PAID':
          await this.handlePaymentApproved(order, paymentInfo);
          break;
        
        case 'PAYMENT_FAILED':
          await this.handlePaymentRejected(order, paymentInfo);
          break;
        
        case 'REFUNDED':
          await this.handlePaymentRefunded(order, paymentInfo);
          break;
        
        case 'CANCELLED':
          await this.handlePaymentCancelled(order, paymentInfo);
          break;
        
        default:
          strapi.log.info(`No post-payment actions for status: ${status}`);
          break;
      }
    } catch (error) {
      strapi.log.error('Error processing post-payment actions:', error);
      // Don't throw error to prevent webhook failure
    }
  },

  /**
   * Handle approved payment
   * @param {Object} order - Order data
   * @param {Object} paymentInfo - Payment information
   */
  async handlePaymentApproved(order, paymentInfo) {
    try {
      strapi.log.info(`Processing approved payment for order ${order.orderNumber}`);

      // Send payment confirmation email
      // This would integrate with your email service
      await this.sendPaymentConfirmationEmail(order, paymentInfo);

      // Send push notification
      // This would integrate with your push notification service
      await this.sendPaymentNotification(order, 'approved');

      // Trigger order fulfillment process
      await this.initiateOrderFulfillment(order);

      // Update analytics/metrics
      await this.updatePaymentMetrics('approved', order.total, paymentInfo.paymentMethodId);

    } catch (error) {
      strapi.log.error('Error handling approved payment:', error);
    }
  },

  /**
   * Handle rejected payment
   * @param {Object} order - Order data
   * @param {Object} paymentInfo - Payment information
   */
  async handlePaymentRejected(order, paymentInfo) {
    try {
      strapi.log.info(`Processing rejected payment for order ${order.orderNumber}`);

      // Send payment failure notification
      await this.sendPaymentNotification(order, 'rejected', paymentInfo.statusDetail);

      // Release inventory reservation
      await this.releaseInventoryReservation(order);

      // Update analytics/metrics
      await this.updatePaymentMetrics('rejected', order.total, paymentInfo.paymentMethodId);

    } catch (error) {
      strapi.log.error('Error handling rejected payment:', error);
    }
  },

  /**
   * Handle refunded payment
   * @param {Object} order - Order data
   * @param {Object} paymentInfo - Payment information
   */
  async handlePaymentRefunded(order, paymentInfo) {
    try {
      strapi.log.info(`Processing refunded payment for order ${order.orderNumber}`);

      // Send refund confirmation email
      await this.sendRefundConfirmationEmail(order, paymentInfo);

      // Update inventory (return items to stock)
      await this.returnInventoryToStock(order);

      // Update analytics/metrics
      await this.updatePaymentMetrics('refunded', order.total, paymentInfo.paymentMethodId);

    } catch (error) {
      strapi.log.error('Error handling refunded payment:', error);
    }
  },

  /**
   * Handle cancelled payment
   * @param {Object} order - Order data
   * @param {Object} paymentInfo - Payment information
   */
  async handlePaymentCancelled(order, paymentInfo) {
    try {
      strapi.log.info(`Processing cancelled payment for order ${order.orderNumber}`);

      // Send cancellation notification
      await this.sendPaymentNotification(order, 'cancelled');

      // Release inventory reservation
      await this.releaseInventoryReservation(order);

      // Update analytics/metrics
      await this.updatePaymentMetrics('cancelled', order.total, paymentInfo.paymentMethodId);

    } catch (error) {
      strapi.log.error('Error handling cancelled payment:', error);
    }
  },

  /**
   * Send payment confirmation email
   * @param {Object} order - Order data
   * @param {Object} paymentInfo - Payment information
   */
  async sendPaymentConfirmationEmail(order, paymentInfo) {
    try {
      // This would integrate with your email service
      strapi.log.info(`Sending payment confirmation email for order ${order.orderNumber}`);
      
      // Example email service integration
      // await emailService.sendTemplate({
      //   to: order.user.email,
      //   template: 'payment-confirmation',
      //   data: { order, paymentInfo }
      // });
      
    } catch (error) {
      strapi.log.error('Error sending payment confirmation email:', error);
    }
  },

  /**
   * Send refund confirmation email
   * @param {Object} order - Order data
   * @param {Object} paymentInfo - Payment information
   */
  async sendRefundConfirmationEmail(order, paymentInfo) {
    try {
      strapi.log.info(`Sending refund confirmation email for order ${order.orderNumber}`);
      
      // Example email service integration
      // await emailService.sendTemplate({
      //   to: order.user.email,
      //   template: 'refund-confirmation',
      //   data: { order, paymentInfo }
      // });
      
    } catch (error) {
      strapi.log.error('Error sending refund confirmation email:', error);
    }
  },

  /**
   * Send payment status notification
   * @param {Object} order - Order data
   * @param {string} status - Payment status
   * @param {string} statusDetail - Detailed status information
   */
  async sendPaymentNotification(order, status, statusDetail = null) {
    try {
      strapi.log.info(`Sending ${status} notification for order ${order.orderNumber}`);
      
      // This would integrate with your push notification service
      // await pushNotificationService.send({
      //   userId: order.user.id,
      //   type: 'payment_update',
      //   title: `Pedido ${order.orderNumber}`,
      //   message: this.getNotificationMessage(status, statusDetail),
      //   data: { orderId: order.id, status }
      // });
      
    } catch (error) {
      strapi.log.error('Error sending payment notification:', error);
    }
  },

  /**
   * Initiate order fulfillment process
   * @param {Object} order - Order data
   */
  async initiateOrderFulfillment(order) {
    try {
      strapi.log.info(`Initiating fulfillment for order ${order.orderNumber}`);
      
      // This would integrate with your order fulfillment system
      // await fulfillmentService.createFulfillmentOrder(order);
      
    } catch (error) {
      strapi.log.error('Error initiating order fulfillment:', error);
    }
  },

  /**
   * Release inventory reservation
   * @param {Object} order - Order data
   */
  async releaseInventoryReservation(order) {
    try {
      strapi.log.info(`Releasing inventory reservation for order ${order.orderNumber}`);
      
      // This would integrate with your inventory management system
      // await inventoryService.releaseReservation(order.items);
      
    } catch (error) {
      strapi.log.error('Error releasing inventory reservation:', error);
    }
  },

  /**
   * Return inventory to stock
   * @param {Object} order - Order data
   */
  async returnInventoryToStock(order) {
    try {
      strapi.log.info(`Returning inventory to stock for order ${order.orderNumber}`);
      
      // This would integrate with your inventory management system
      // await inventoryService.returnToStock(order.items);
      
    } catch (error) {
      strapi.log.error('Error returning inventory to stock:', error);
    }
  },

  /**
   * Update payment metrics
   * @param {string} status - Payment status
   * @param {number} amount - Payment amount
   * @param {string} paymentMethod - Payment method
   */
  async updatePaymentMetrics(status, amount, paymentMethod) {
    try {
      strapi.log.info(`Updating payment metrics: ${status}, ${amount}, ${paymentMethod}`);
      
      // This would integrate with your analytics service
      // await analyticsService.trackPayment({
      //   status,
      //   amount,
      //   paymentMethod,
      //   timestamp: new Date()
      // });
      
    } catch (error) {
      strapi.log.error('Error updating payment metrics:', error);
    }
  },

  /**
   * Get notification message for payment status
   * @param {string} status - Payment status
   * @param {string} statusDetail - Detailed status
   * @returns {string} Notification message
   */
  getNotificationMessage(status, statusDetail) {
    const messages = {
      'approved': 'Tu pago ha sido confirmado',
      'rejected': statusDetail ? `Pago rechazado: ${statusDetail}` : 'Tu pago fue rechazado',
      'cancelled': 'Tu pago fue cancelado',
      'refunded': 'Tu pago ha sido reembolsado'
    };

    return messages[status] || `Estado del pago: ${status}`;
  }
};