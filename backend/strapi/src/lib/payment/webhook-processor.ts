/**
 * Webhook Queue Processor for Tifossi
 * Handles background processing of MercadoPago webhooks
 */

import { MPPaymentResponse, MPWebhookPayload, MPWebhookType } from './types/mercadopago';
import { OrderStatus } from './types/orders';

declare const strapi: any;

const { MercadoPagoService } = require('./mercadopago-service');
const { OrderStateManager } = require('./order-state-manager');

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

interface WebhookQueueItem {
  id: number;
  documentId: string;
  requestId: string;
  webhookType: string;
  dataId: string;
  payload: MPWebhookPayload;
  status: string;
  retryCount: number;
  maxRetries: number;
  scheduledAt: string;
  processedAt?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export class WebhookProcessor {
  private mpService: any;
  private orderManager: any;

  constructor() {
    this.mpService = new MercadoPagoService();
    this.orderManager = new OrderStateManager();
  }

  /**
   * Process queued webhooks (called by cron job)
   */
  async processQueue(): Promise<void> {
    try {
      // Fetch queued webhooks that are ready to process
      const queuedWebhooks = await strapi.documents('api::webhook-queue.webhook-queue').findMany({
        filters: {
          status: 'queued',
          retryCount: { $lt: 5 }, // Don't process items that exceeded max retries
          scheduledAt: { $lte: new Date().toISOString() }, // Only process items scheduled for now or earlier
        },
        sort: 'scheduledAt:asc',
        limit: 10, // Process 10 webhooks per cron run to avoid overload
      });

      if (!queuedWebhooks || queuedWebhooks.length === 0) {
        strapi.log.debug('No queued webhooks to process');
        return;
      }

      strapi.log.info(`Processing ${queuedWebhooks.length} queued webhooks`);

      // Process each webhook
      for (const webhook of queuedWebhooks) {
        await this.processWebhook(webhook);
      }

      strapi.log.info(`Finished processing ${queuedWebhooks.length} webhooks`);
    } catch (error: any) {
      strapi.log.error('Error processing webhook queue:', error);
    }
  }

  /**
   * Process a single webhook from the queue
   */
  private async processWebhook(webhook: WebhookQueueItem): Promise<void> {
    try {
      // Mark as processing
      await this.updateWebhookStatus(webhook.documentId, 'processing');

      strapi.log.info(
        `Processing webhook ${webhook.requestId} (attempt ${webhook.retryCount + 1})`
      );

      // Process based on webhook type
      switch (webhook.webhookType) {
        case MPWebhookType.PAYMENT:
          await this.processPaymentWebhook(webhook.payload, webhook.requestId);
          break;

        case MPWebhookType.MERCHANT_ORDER:
          strapi.log.info('Merchant order webhook (not implemented yet)');
          break;

        case MPWebhookType.CHARGEBACKS:
          strapi.log.info('Chargeback webhook (not implemented yet)');
          break;

        default:
          strapi.log.warn(`Unknown webhook type: ${webhook.webhookType}`);
          break;
      }

      // Mark as completed
      await this.updateWebhookStatus(webhook.documentId, 'completed');

      strapi.log.info(`Successfully processed webhook ${webhook.requestId}`);
    } catch (error: any) {
      strapi.log.error(`Error processing webhook ${webhook.requestId}:`, error);

      // Update retry count and status
      await this.updateWebhookRetry(webhook.documentId, error.message, webhook.retryCount);
    }
  }

  /**
   * Process payment webhook (extracted from original handlePaymentNotification)
   */
  private async processPaymentWebhook(
    webhookData: MPWebhookPayload,
    requestId: string
  ): Promise<void> {
    try {
      const paymentData = webhookData.data as any; // Cast to any since MP payload can vary
      const paymentId = paymentData?.id;

      if (!paymentId) {
        strapi.log.warn('Payment notification missing payment ID');
        return;
      }

      strapi.log.info(`Processing payment notification for payment ID: ${paymentId}`);

      // Get payment information from MercadoPago
      const paymentInfo: MPPaymentResponse = await this.mpService.getPayment(paymentId);

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

      // Map MercadoPago status to internal order status
      const newOrderStatus: OrderStatus = this.mpService.mapPaymentStatus(
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
        await this.orderManager.transitionStatus(order.id, previousStatus, newOrderStatus, {
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
      strapi.log.error('Error processing payment webhook:', error);
      throw error; // Re-throw to trigger retry
    }
  }

  /**
   * Process actions after payment status update
   */
  private async processPostPaymentActions(
    order: StrapiOrder,
    status: OrderStatus,
    _paymentInfo: MPPaymentResponse
  ): Promise<void> {
    try {
      switch (status) {
        case OrderStatus.PAID:
          strapi.log.info(`Payment approved for order ${order.orderNumber}`);
          // Post-payment actions would go here (email, notifications, etc.)
          break;

        case OrderStatus.CANCELLED:
          strapi.log.info(`Payment cancelled for order ${order.orderNumber}`);
          // Cancellation actions would go here
          break;

        case OrderStatus.REFUNDED:
          strapi.log.info(`Payment refunded for order ${order.orderNumber}`);
          // Refund actions would go here
          break;

        default:
          strapi.log.debug(`No post-payment actions for status: ${status}`);
          break;
      }
    } catch (error: any) {
      strapi.log.error('Error processing post-payment actions:', error);
      // Don't throw - post-payment actions are not critical
    }
  }

  /**
   * Update webhook status
   */
  private async updateWebhookStatus(documentId: string, status: string): Promise<void> {
    const updateData: any = { status };

    if (status === 'completed' || status === 'failed') {
      updateData.processedAt = new Date().toISOString();
    }

    await strapi.documents('api::webhook-queue.webhook-queue').update({
      documentId,
      data: updateData,
    });
  }

  /**
   * Update webhook retry information
   */
  private async updateWebhookRetry(
    documentId: string,
    errorMessage: string,
    currentRetryCount: number
  ): Promise<void> {
    const newRetryCount = currentRetryCount + 1;
    const maxRetries = 5;

    // Calculate exponential backoff: 1s, 2s, 4s, 8s, 16s
    const backoffDelay = Math.pow(2, newRetryCount) * 1000;
    const nextScheduledAt = new Date(Date.now() + backoffDelay);

    const updateData: any = {
      retryCount: newRetryCount,
      error: errorMessage,
      metadata: {
        lastError: errorMessage,
        lastRetryAt: new Date().toISOString(),
      },
    };

    // If max retries reached, mark as failed
    if (newRetryCount >= maxRetries) {
      updateData.status = 'failed';
      updateData.processedAt = new Date().toISOString();
      strapi.log.error(`Webhook processing failed after ${maxRetries} retries`);
    } else {
      // Schedule for retry
      updateData.status = 'queued';
      updateData.scheduledAt = nextScheduledAt.toISOString();
      strapi.log.info(
        `Webhook retry scheduled for ${nextScheduledAt.toISOString()} (attempt ${newRetryCount + 1})`
      );
    }

    await strapi.documents('api::webhook-queue.webhook-queue').update({
      documentId,
      data: updateData,
    });
  }
}
