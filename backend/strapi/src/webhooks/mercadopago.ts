/**
 * MercadoPago Webhook Handler for Tifossi Expo
 * Processes payment notifications from MercadoPago
 */

import { Context } from 'koa';
import {
  MPPaymentResponse,
  MPWebhookPayload,
  MPWebhookType,
} from '../lib/payment/types/mercadopago';
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
   * MercadoPago sends TWO different webhook formats:
   * - v1.0 WebHook: ?data.id=X&type=payment with x-signature header (signed)
   * - v2.0 Feed: ?id=X&topic=payment without signature (legacy, unsigned)
   *
   * This handler supports both formats for maximum compatibility.
   */
  async handleWebhook(ctx: Context): Promise<void> {
    const startTime = Date.now();

    try {
      const query = ctx.request.query as Record<string, string>;
      const body: MPWebhookPayload = (ctx.request as any).body || {};
      const signature = ctx.request.headers['x-signature'] as string;
      const requestId = ctx.request.headers['x-request-id'] as string;
      const userAgent = (ctx.request.headers['user-agent'] as string) || '';

      // Entry logging - capture everything for debugging
      strapi.log.info('[MP-WEBHOOK] Incoming request', {
        method: ctx.request.method,
        url: ctx.request.url,
        query: JSON.stringify(query),
        bodyType: body?.type,
        bodyDataId: body?.data?.id,
        bodyAction: body?.action,
        hasSignature: !!signature,
        hasRequestId: !!requestId,
        ip: ctx.request.ip,
        userAgent: userAgent.substring(0, 100),
      });

      // Detect webhook format and extract data accordingly
      // v1.0: body has {type, data: {id}}, query has data.id and type
      // v2.0: query has id and topic, body may be empty
      const isV1Format = !!(body?.type && body?.data?.id);
      const isV2Format = !!(query.id && query.topic);

      let webhookType: MPWebhookType;
      let dataId: string;

      if (isV1Format) {
        webhookType = body.type;
        dataId = body.data.id.toString();
        strapi.log.info('[MP-WEBHOOK] Format detected: v1.0 (signed)', { webhookType, dataId });
      } else if (isV2Format) {
        webhookType =
          query.topic === 'merchant_order' ? MPWebhookType.MERCHANT_ORDER : MPWebhookType.PAYMENT;
        dataId = query.id;
        strapi.log.info('[MP-WEBHOOK] Format detected: v2.0 (unsigned)', {
          webhookType,
          dataId,
          topic: query.topic,
        });
      } else {
        strapi.log.error('[MP-WEBHOOK] Unknown format - rejecting', {
          query: JSON.stringify(query),
          bodyKeys: Object.keys(body),
          bodyType: typeof body,
        });
        ctx.badRequest('Unknown webhook format');
        return;
      }

      // Signature verification only for v1.0 webhooks (v2.0 Feed doesn't have signatures)
      const mpService = strapi.mercadoPago;
      if (isV1Format) {
        if (!signature || !requestId) {
          strapi.log.error('[MP-WEBHOOK] v1.0 missing signature headers', {
            hasSignature: !!signature,
            hasRequestId: !!requestId,
            dataId,
          });
          ctx.badRequest('Missing signature headers');
          return;
        }

        strapi.log.debug('[MP-WEBHOOK] Verifying v1.0 signature', {
          dataId,
          requestId,
          signatureLength: signature.length,
        });
        if (!mpService.verifyWebhookSignature(signature, requestId, dataId)) {
          strapi.log.error('[MP-WEBHOOK] Signature verification FAILED', {
            dataId,
            requestId,
            signaturePreview: signature.substring(0, 50) + '...',
          });
          ctx.unauthorized('Invalid signature');
          return;
        }
        strapi.log.info('[MP-WEBHOOK] Signature verification PASSED', { dataId, requestId });
      } else {
        // v2.0 webhooks are unsigned - log for security awareness
        strapi.log.info('[MP-WEBHOOK] v2.0 webhook accepted (unsigned)', {
          dataId,
          topic: query.topic,
          ip: ctx.request.ip,
        });
      }

      // Use provided requestId or generate one for v2.0
      const effectiveRequestId = requestId || `v2_${dataId}_${Date.now()}`;

      // Deduplication strategy:
      // - v1.0: Dedupe by requestId (MercadoPago uses same requestId for retries)
      // - v2.0: No reliable dedup possible (no requestId), use 60-second time window
      // - Payment processor has idempotency (only updates if status changed) as backup
      const timeWindow = Math.floor(Date.now() / 60000); // 1-minute buckets
      const webhookKey = isV1Format
        ? `v1_${webhookType}_${dataId}_${requestId}`
        : `v2_${webhookType}_${dataId}_${timeWindow}`;

      strapi.log.info('[MP-WEBHOOK] Dedup check', { webhookKey, effectiveRequestId });

      // Try to create log entry - unique constraint handles race conditions atomically
      try {
        await strapi.documents('api::webhook-log.webhook-log').create({
          data: {
            requestId: effectiveRequestId,
            webhookType: webhookType,
            dataId: dataId,
            webhookKey,
            processedAt: new Date().toISOString(),
            status: 'received',
            metadata: {
              action: body.action,
              apiVersion: body.api_version,
              format: isV1Format ? 'v1.0' : 'v2.0',
              receivedAt: new Date().toISOString(),
            } as any,
          },
        });
        strapi.log.info('[MP-WEBHOOK] Log entry created (not duplicate)', { webhookKey });
      } catch (dbError: any) {
        // Unique constraint violation = duplicate webhook
        if (dbError.message?.includes('unique') || dbError.code === '23505') {
          strapi.log.info('[MP-WEBHOOK] Duplicate webhook - skipping', { webhookKey, dataId });
          const responseTime = Date.now() - startTime;
          ctx.status = 200;
          ctx.body = { success: true, status: 'duplicate', responseTime: `${responseTime}ms` };
          return;
        }
        strapi.log.error('[MP-WEBHOOK] DB error creating log entry', {
          error: dbError.message,
          code: dbError.code,
          webhookKey,
        });
        throw dbError; // Re-throw other errors
      }

      // Build normalized payload for queue processing
      // Use partial type since v2.0 webhooks don't have all fields
      const normalizedPayload = {
        type: webhookType,
        data: { id: dataId },
        action: body.action || 'payment.updated',
        api_version: body.api_version || 'v2',
      };

      // Queue for async processing
      strapi.log.info('[MP-WEBHOOK] Queueing for async processing', { dataId, webhookType });
      await strapi.documents('api::webhook-queue.webhook-queue').create({
        data: {
          requestId: effectiveRequestId,
          webhookType: webhookType,
          dataId: dataId,
          payload: normalizedPayload,
          status: 'queued',
          retryCount: 0,
          maxRetries: 5,
          scheduledAt: new Date().toISOString(),
          metadata: {
            queuedAt: new Date().toISOString(),
            userAgent,
            format: isV1Format ? 'v1.0' : 'v2.0',
          },
        },
      });

      const responseTime = Date.now() - startTime;
      strapi.log.info('[MP-WEBHOOK] SUCCESS - queued', {
        dataId,
        webhookType,
        format: isV1Format ? 'v1.0' : 'v2.0',
        responseTime: `${responseTime}ms`,
      });

      // Always return 200 OK immediately to acknowledge webhook receipt
      ctx.status = 200;
      ctx.body = {
        success: true,
        status: 'queued',
        requestId: effectiveRequestId,
        responseTime: `${responseTime}ms`,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      strapi.log.error('[MP-WEBHOOK] FAILED - unhandled error', {
        error: error.message,
        stack: error.stack?.substring(0, 500),
        responseTime: `${responseTime}ms`,
      });

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
        strapi.log.warn('[MP-PAYMENT] Notification missing payment ID');
        return;
      }

      strapi.log.info('[MP-PAYMENT] Processing notification', { paymentId, requestId });

      // Initialize services - use singleton instance from strapi startup
      const mpService = strapi.mercadoPago;
      const orderManager = new OrderStateManager();

      // Get payment information from MercadoPago
      strapi.log.info('[MP-PAYMENT] Fetching payment from MercadoPago API', { paymentId });
      const paymentInfo: MPPaymentResponse = await mpService.getPayment(paymentId);

      if (!paymentInfo) {
        strapi.log.error('[MP-PAYMENT] Failed to retrieve payment from MP API', { paymentId });
        return;
      }

      strapi.log.info('[MP-PAYMENT] Payment info received', {
        paymentId: paymentInfo.id,
        status: paymentInfo.status,
        statusDetail: paymentInfo.status_detail,
        externalRef: paymentInfo.external_reference,
        amount: paymentInfo.transaction_amount,
        currency: paymentInfo.currency_id,
      });

      // Find associated order by external reference
      let order: StrapiOrder | null = null;
      if (paymentInfo.external_reference) {
        strapi.log.info('[MP-PAYMENT] Searching order by orderNumber', {
          orderNumber: paymentInfo.external_reference,
        });
        const orders = await strapi.documents('api::order.order').findMany({
          filters: {
            orderNumber: paymentInfo.external_reference,
          },
        });

        if (orders && orders.length > 0) {
          const foundOrder = orders[0];
          order = foundOrder;
          strapi.log.info('[MP-PAYMENT] Order found by orderNumber', {
            orderId: foundOrder.id,
            orderNumber: foundOrder.orderNumber,
          });
        } else {
          strapi.log.warn('[MP-PAYMENT] No order found by orderNumber', {
            orderNumber: paymentInfo.external_reference,
          });
        }
      }

      // If not found by external reference, try by preference ID or payment ID
      if (!order && (paymentInfo.external_reference || paymentId)) {
        strapi.log.info('[MP-PAYMENT] Searching order by mpPaymentId or mpPreferenceId', {
          paymentId,
          externalRef: paymentInfo.external_reference,
        });
        const orders = await strapi.documents('api::order.order').findMany({
          filters: {
            $or: [{ mpPaymentId: paymentId }, { mpPreferenceId: paymentInfo.external_reference }],
          },
        });

        if (orders && orders.length > 0) {
          const foundOrder = orders[0];
          order = foundOrder;
          strapi.log.info('[MP-PAYMENT] Order found by mpPaymentId/mpPreferenceId', {
            orderId: foundOrder.id,
            orderNumber: foundOrder.orderNumber,
          });
        } else {
          strapi.log.warn('[MP-PAYMENT] No order found by mpPaymentId/mpPreferenceId');
        }
      }

      if (!order) {
        strapi.log.error('[MP-PAYMENT] ORDER NOT FOUND - payment orphaned', {
          paymentId,
          externalReference: paymentInfo.external_reference,
          status: paymentInfo.status,
          amount: paymentInfo.transaction_amount,
        });
        return;
      }

      strapi.log.info('[MP-PAYMENT] Processing order update', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        currentStatus: order.status,
        paymentStatus: paymentInfo.status,
      });

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

      strapi.log.info('[MP-PAYMENT] Status mapping', {
        mpStatus: paymentInfo.status,
        mpStatusDetail: paymentInfo.status_detail,
        mappedStatus: newOrderStatus,
        previousStatus,
        willUpdate: previousStatus !== newOrderStatus,
      });

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

        strapi.log.info('[MP-PAYMENT] Transitioning order status', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          from: previousStatus,
          to: newOrderStatus,
        });

        // Log status transition
        await orderManager.transitionStatus(order.id, previousStatus, newOrderStatus, {
          triggeredBy: 'webhook',
          reason: `MercadoPago payment ${paymentInfo.status}: ${paymentInfo.status_detail}`,
          metadata: {
            paymentId: paymentInfo.id,
            webhookRequestId: requestId,
          },
        });
      } else {
        strapi.log.info('[MP-PAYMENT] Status unchanged - skipping transition', {
          orderNumber: order.orderNumber,
          status: previousStatus,
        });
      }

      // Update order in database
      strapi.log.info('[MP-PAYMENT] Updating order in database', { documentId: order.documentId });
      await strapi.documents('api::order.order').update({
        documentId: order.documentId,
        data: updateData,
      });

      // Process post-payment actions based on new status
      await this.processPostPaymentActions(order, newOrderStatus, paymentInfo);

      strapi.log.info('[MP-PAYMENT] SUCCESS - notification processed', {
        orderNumber: order.orderNumber,
        finalStatus: newOrderStatus,
        paymentId: paymentInfo.id,
      });
    } catch (error: any) {
      strapi.log.error('[MP-PAYMENT] FAILED - error processing notification', {
        error: error.message,
        stack: error.stack?.substring(0, 500),
      });
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
