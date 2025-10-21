/**
 * MercadoPago Webhook Handler for Tifossi Expo
 * Processes payment notifications from MercadoPago
 */

import { Context } from 'koa';
import { MPPaymentResponse, MPWebhookPayload } from '../lib/payment/types/mercadopago';
import { OrderStatus } from '../lib/payment/types/orders';

// Declare global strapi for TypeScript
declare const strapi: any;

const { OrderStateManager } = require('../lib/payment/order-state-manager');

interface StrapiOrder {
  id: number;
  documentId: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  mpPaymentId?: string;
  mpPreferenceId?: string;
  mpCollectionId?: string;
  mpPaymentStatus?: string;
  paidAt?: string;
  metadata?: Record<string, any>;
  user: {
    id: number;
    email: string;
  };
  items: {
    id: number;
    productId: string;
    quantity: number;
    price: number;
  }[];
}

interface WebhookUpdateData {
  mpPaymentId?: string;
  mpCollectionId?: string;
  mpPaymentStatus?: string;
  status?: OrderStatus;
  paidAt?: string;
  metadata?: Record<string, any>;
}

module.exports = {
  /**
   * Handle MercadoPago webhook notifications
   * POST /webhooks/mercadopago
   *
   * This handler implements a fast-response queue pattern:
   * 1. Validate signature (SYNC - fast)
   * 2. Check for duplicates (SYNC - fast)
   * 3. Queue for async processing (SYNC - fast)
   * 4. Return 200 OK immediately (<50ms target)
   */
  async handleWebhook(ctx: Context): Promise<void> {
    const startTime = Date.now();

    try {
      // Get webhook data and headers for signature verification
      const webhookData: MPWebhookPayload = (ctx.request as any).body;
      const signature = ctx.request.headers['x-signature'] as string;
      const requestId = ctx.request.headers['x-request-id'] as string;
      const dataId = webhookData?.data?.id?.toString() || '';

      // Log webhook reception
      strapi.log.info(`MercadoPago webhook received: ${webhookData?.type || 'unknown'}`);
      strapi.log.debug('Webhook headers:', {
        signature: signature ? 'present' : 'missing',
        requestId,
        dataId: dataId ? 'present' : 'missing',
        userAgent: ctx.request.headers['user-agent'],
      });

      // Verify webhook signature for security with correct parameters
      // Use singleton instance from strapi startup (prevents production crash)
      const mpService = strapi.mercadoPago;
      if (!signature || !requestId || !dataId) {
        strapi.log.warn('Missing required webhook headers or data');
        ctx.badRequest('Missing required webhook data');
        return;
      }

      if (!mpService.verifyWebhookSignature(signature, requestId, dataId)) {
        strapi.log.warn('Invalid webhook signature');
        ctx.unauthorized('Invalid signature');
        return;
      }

      // Validate webhook data structure
      if (!webhookData || !webhookData.type || !webhookData.data) {
        strapi.log.warn('Invalid webhook data structure');
        ctx.badRequest('Invalid webhook data');
        return;
      }

      // Check for duplicates using webhook-log
      const webhookKey = `${requestId}_${webhookData.type}_${dataId}`;
      const existingLog = await strapi.documents('api::webhook-log.webhook-log').findMany({
        filters: {
          webhookKey: webhookKey,
        },
        limit: 1,
      });

      if (existingLog && existingLog.length > 0) {
        strapi.log.warn('Duplicate webhook detected', {
          requestId,
          webhookKey,
          originalProcessedAt: existingLog[0].processedAt,
        });

        const responseTime = Date.now() - startTime;
        ctx.status = 200;
        ctx.body = {
          success: true,
          status: 'duplicate',
          requestId,
          responseTime: `${responseTime}ms`,
        };
        return;
      }

      // Log webhook as received to prevent duplicates
      await strapi.documents('api::webhook-log.webhook-log').create({
        data: {
          requestId,
          webhookType: webhookData.type,
          dataId: dataId,
          webhookKey,
          processedAt: new Date().toISOString(),
          status: 'success',
          metadata: {
            action: webhookData.action,
            apiVersion: webhookData.api_version,
            receivedAt: new Date().toISOString(),
          } as any,
        },
      });

      // Queue for async processing
      await strapi.documents('api::webhook-queue.webhook-queue').create({
        data: {
          requestId,
          webhookType: webhookData.type,
          dataId: dataId,
          payload: webhookData,
          status: 'queued',
          retryCount: 0,
          maxRetries: 5,
          scheduledAt: new Date().toISOString(),
          metadata: {
            queuedAt: new Date().toISOString(),
            userAgent: ctx.request.headers['user-agent'],
          },
        },
      });

      const responseTime = Date.now() - startTime;
      strapi.log.info(`Webhook queued successfully in ${responseTime}ms`);

      // Always return 200 OK immediately to acknowledge webhook receipt
      ctx.status = 200;
      ctx.body = {
        success: true,
        status: 'queued',
        requestId,
        responseTime: `${responseTime}ms`,
      };
    } catch (error: any) {
      strapi.log.error('Error processing MercadoPago webhook:', error);

      const responseTime = Date.now() - startTime;

      // Return 200 OK even on error to prevent MercadoPago retries for unrecoverable errors
      ctx.status = 200;
      ctx.body = {
        success: false,
        error: 'Webhook queueing failed',
        message: error.message,
        responseTime: `${responseTime}ms`,
      };
    }
  },

  /**
   * Handle payment notification from MercadoPago
   */
  async handlePaymentNotification(
    paymentData: { id: string; collection_id?: string },
    requestId: string
  ): Promise<void> {
    try {
      const paymentId = paymentData.id;

      if (!paymentId) {
        strapi.log.warn('Payment notification missing payment ID');
        return;
      }

      strapi.log.info(`Processing payment notification for payment ID: ${paymentId}`);

      // Initialize services - use singleton instance from strapi startup
      const mpService = strapi.mercadoPago;
      const orderManager = new OrderStateManager();

      // Get payment information from MercadoPago
      const paymentInfo: MPPaymentResponse = await mpService.getPayment(paymentId);

      if (!paymentInfo) {
        strapi.log.warn(`Could not retrieve payment information for ID: ${paymentId}`);
        return;
      }

      // Find associated order by external reference
      let order: StrapiOrder | null = null;
      if (paymentInfo.external_reference) {
        const orders = await strapi.documents('api::order.order').findMany({
          filters: {
            orderNumber: paymentInfo.external_reference,
          },
        });

        if (orders && orders.length > 0) {
          order = orders[0];
        }
      }

      // If not found by external reference, try by preference ID or payment ID
      if (!order && (paymentInfo.external_reference || paymentId)) {
        const orders = await strapi.documents('api::order.order').findMany({
          filters: {
            $or: [{ mpPaymentId: paymentId }, { mpPreferenceId: paymentInfo.external_reference }],
          },
        });

        if (orders && orders.length > 0) {
          order = orders[0];
        }
      }

      if (!order) {
        strapi.log.warn(
          `No order found for payment ID: ${paymentId}, external reference: ${paymentInfo.external_reference}`
        );
        return;
      }

      strapi.log.info(`Found order ${order.orderNumber} for payment ${paymentId}`);

      // Validate payment amount matches order total
      const amountDifference = Math.abs(paymentInfo.transaction_amount - order.total);
      if (amountDifference > 0.01) {
        strapi.log.error('Payment fraud attempt detected - amount mismatch', {
          orderId: order.orderNumber,
          expectedAmount: order.total,
          receivedAmount: paymentInfo.transaction_amount,
          paymentId: paymentInfo.id,
          webhookRequestId: requestId,
        });

        // Mark order as cancelled due to fraud
        await strapi.documents('api::order.order').update({
          documentId: order.documentId,
          data: {
            status: OrderStatus.CANCELLED,
            metadata: {
              ...order.metadata,
              fraudDetected: true,
              fraudReason: 'amount_mismatch',
              fraudDetails: {
                expectedAmount: order.total,
                receivedAmount: paymentInfo.transaction_amount,
                difference: amountDifference,
              },
            },
          },
        });

        return;
      }

      // Validate currency is UYU (Uruguayan Peso)
      if (paymentInfo.currency_id !== 'UYU') {
        strapi.log.error('Payment fraud attempt detected - invalid currency', {
          orderId: order.orderNumber,
          expectedCurrency: 'UYU',
          receivedCurrency: paymentInfo.currency_id,
          paymentId: paymentInfo.id,
          webhookRequestId: requestId,
        });

        await strapi.documents('api::order.order').update({
          documentId: order.documentId,
          data: {
            status: OrderStatus.CANCELLED,
            metadata: {
              ...order.metadata,
              fraudDetected: true,
              fraudReason: 'invalid_currency',
              fraudDetails: {
                expectedCurrency: 'UYU',
                receivedCurrency: paymentInfo.currency_id,
              },
            },
          },
        });

        return;
      }

      // Log payment method for analytics
      strapi.log.info('Payment processed with method', {
        orderId: order.orderNumber,
        paymentMethod: paymentInfo.payment_method_id,
        paymentType: paymentInfo.payment_type_id,
        amount: paymentInfo.transaction_amount,
        currency: paymentInfo.currency_id,
      });

      // Map MercadoPago status to internal order status
      const newOrderStatus: OrderStatus = mpService.mapPaymentStatus(
        paymentInfo.status,
        paymentInfo.status_detail
      );
      const previousStatus = order.status;

      // Prepare update data
      const updateData: WebhookUpdateData = {
        mpPaymentId: paymentInfo.id.toString(),
        mpCollectionId: paymentData.collection_id || paymentInfo.id.toString(),
        mpPaymentStatus: paymentInfo.status,
        metadata: {
          ...order.metadata,
          lastWebhookUpdate: new Date().toISOString(),
          webhookRequestId: requestId,
          paymentStatusDetail: paymentInfo.status_detail,
          paymentMethod: paymentInfo.payment_method_id,
          paymentType: paymentInfo.payment_type_id,
        },
      };

      // Set payment timestamp based on status
      if (paymentInfo.status === 'approved' && paymentInfo.date_approved) {
        updateData.paidAt = paymentInfo.date_approved;
      }

      // Update order status if it has changed
      if (previousStatus !== newOrderStatus) {
        updateData.status = newOrderStatus;

        // Log status transition
        await orderManager.transitionStatus(order.id, previousStatus, newOrderStatus, {
          triggeredBy: 'webhook',
          reason: `MercadoPago payment ${paymentInfo.status}: ${paymentInfo.status_detail}`,
          metadata: {
            paymentId: paymentInfo.id,
            webhookRequestId: requestId,
          },
        });

        strapi.log.info(
          `Order ${order.orderNumber} status changed from ${previousStatus} to ${newOrderStatus}`
        );
      }

      // Update order in database
      await strapi.documents('api::order.order').update({
        documentId: order.documentId,
        data: updateData,
      });

      // Process post-payment actions based on new status
      await this.processPostPaymentActions(order, newOrderStatus, paymentInfo);

      strapi.log.info(`Successfully processed payment notification for order ${order.orderNumber}`);
    } catch (error: any) {
      strapi.log.error('Error handling payment notification:', error);
      throw error; // Re-throw to be caught by main webhook handler
    }
  },

  /**
   * Process actions after payment status update
   */
  async processPostPaymentActions(
    order: StrapiOrder,
    status: OrderStatus,
    paymentInfo: MPPaymentResponse
  ): Promise<void> {
    try {
      switch (status) {
        case OrderStatus.PAID:
          await this.handlePaymentApproved(order, paymentInfo);
          break;

        case OrderStatus.CANCELLED:
          // CANCELLED handles both explicit cancellations and payment rejections
          await this.handlePaymentCancelled(order, paymentInfo);
          break;

        case OrderStatus.REFUNDED:
          await this.handlePaymentRefunded(order, paymentInfo);
          break;

        default:
          strapi.log.info(`No post-payment actions for status: ${status}`);
          break;
      }
    } catch (error: any) {
      strapi.log.error('Error processing post-payment actions:', error);
      // Don't throw error to prevent webhook failure
    }
  },

  /**
   * Handle approved payment
   */
  async handlePaymentApproved(order: StrapiOrder, paymentInfo: MPPaymentResponse): Promise<void> {
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
      await this.updatePaymentMetrics('approved', order.total, paymentInfo.payment_method_id);
    } catch (error: any) {
      strapi.log.error('Error handling approved payment:', error);
    }
  },

  /**
   * Handle rejected payment
   */
  async handlePaymentRejected(order: StrapiOrder, paymentInfo: MPPaymentResponse): Promise<void> {
    try {
      strapi.log.info(`Processing rejected payment for order ${order.orderNumber}`);

      // Send payment failure notification
      await this.sendPaymentNotification(order, 'rejected', paymentInfo.status_detail);

      // Release inventory reservation
      await this.releaseInventoryReservation(order);

      // Update analytics/metrics
      await this.updatePaymentMetrics('rejected', order.total, paymentInfo.payment_method_id);
    } catch (error: any) {
      strapi.log.error('Error handling rejected payment:', error);
    }
  },

  /**
   * Handle refunded payment
   */
  async handlePaymentRefunded(order: StrapiOrder, paymentInfo: MPPaymentResponse): Promise<void> {
    try {
      strapi.log.info(`Processing refunded payment for order ${order.orderNumber}`);

      // Send refund confirmation email
      await this.sendRefundConfirmationEmail(order, paymentInfo);

      // Update inventory (return items to stock)
      await this.returnInventoryToStock(order);

      // Update analytics/metrics
      await this.updatePaymentMetrics('refunded', order.total, paymentInfo.payment_method_id);
    } catch (error: any) {
      strapi.log.error('Error handling refunded payment:', error);
    }
  },

  /**
   * Handle cancelled payment
   */
  async handlePaymentCancelled(order: StrapiOrder, _paymentInfo: MPPaymentResponse): Promise<void> {
    try {
      strapi.log.info(`Processing cancelled payment for order ${order.orderNumber}`);

      // Send cancellation notification
      await this.sendPaymentNotification(order, 'cancelled');

      // Release inventory reservation
      await this.releaseInventoryReservation(order);

      // Update analytics/metrics
      await this.updatePaymentMetrics('cancelled', order.total, _paymentInfo.payment_method_id);
    } catch (error: any) {
      strapi.log.error('Error handling cancelled payment:', error);
    }
  },

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(
    order: StrapiOrder,
    _paymentInfo: MPPaymentResponse
  ): Promise<void> {
    try {
      // This would integrate with your email service
      strapi.log.info(`Sending payment confirmation email for order ${order.orderNumber}`);

      // Example email service integration
      // await emailService.sendTemplate({
      //   to: order.user.email,
      //   template: 'payment-confirmation',
      //   data: { order, paymentInfo }
      // });
    } catch (error: any) {
      strapi.log.error('Error sending payment confirmation email:', error);
    }
  },

  /**
   * Send refund confirmation email
   */
  async sendRefundConfirmationEmail(
    order: StrapiOrder,
    _paymentInfo: MPPaymentResponse
  ): Promise<void> {
    try {
      strapi.log.info(`Sending refund confirmation email for order ${order.orderNumber}`);

      // Example email service integration
      // await emailService.sendTemplate({
      //   to: order.user.email,
      //   template: 'refund-confirmation',
      //   data: { order, paymentInfo }
      // });
    } catch (error: any) {
      strapi.log.error('Error sending refund confirmation email:', error);
    }
  },

  /**
   * Send payment status notification
   */
  async sendPaymentNotification(
    order: StrapiOrder,
    status: string,
    _statusDetail: string | null = null
  ): Promise<void> {
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
    } catch (error: any) {
      strapi.log.error('Error sending payment notification:', error);
    }
  },

  /**
   * Initiate order fulfillment process
   */
  async initiateOrderFulfillment(order: StrapiOrder): Promise<void> {
    try {
      strapi.log.info(`Initiating fulfillment for order ${order.orderNumber}`);

      // This would integrate with your order fulfillment system
      // await fulfillmentService.createFulfillmentOrder(order);
    } catch (error: any) {
      strapi.log.error('Error initiating order fulfillment:', error);
    }
  },

  /**
   * Release inventory reservation
   */
  async releaseInventoryReservation(order: StrapiOrder): Promise<void> {
    try {
      strapi.log.info(`Releasing inventory reservation for order ${order.orderNumber}`);

      // This would integrate with your inventory management system
      // await inventoryService.releaseReservation(order.items);
    } catch (error: any) {
      strapi.log.error('Error releasing inventory reservation:', error);
    }
  },

  /**
   * Return inventory to stock
   */
  async returnInventoryToStock(order: StrapiOrder): Promise<void> {
    try {
      strapi.log.info(`Returning inventory to stock for order ${order.orderNumber}`);

      // This would integrate with your inventory management system
      // await inventoryService.returnToStock(order.items);
    } catch (error: any) {
      strapi.log.error('Error returning inventory to stock:', error);
    }
  },

  /**
   * Update payment metrics
   */
  async updatePaymentMetrics(status: string, amount: number, paymentMethod: string): Promise<void> {
    try {
      strapi.log.info(`Updating payment metrics: ${status}, ${amount}, ${paymentMethod}`);
    } catch (error: any) {
      strapi.log.error('Error updating payment metrics:', error);
    }
  },

  /**
   * Get notification message for payment status
   */
  getNotificationMessage(status: string, statusDetail: string | null): string {
    const messages: Record<string, string> = {
      approved: 'Tu pago ha sido confirmado',
      rejected: statusDetail ? `Pago rechazado: ${statusDetail}` : 'Tu pago fue rechazado',
      cancelled: 'Tu pago fue cancelado',
      refunded: 'Tu pago ha sido reembolsado',
    };

    return messages[status] || `Estado del pago: ${status}`;
  },
};
