/**
 * MercadoPago Webhook Handler
 * Processes MercadoPago webhook notifications
 * Tifossi Expo E-commerce Platform
 */

import { Request, Response } from 'express';
import MercadoPagoService from './mercadopago-service';
import OrderStateManager from './order-state-manager';
import { MPWebhookPayload, MPPaymentResponse } from './types/mercadopago';
import { OrderStatus, Order } from './types/orders';

interface WebhookMetrics {
  received: number;
  processed: number;
  failed: number;
  duplicates: number;
}

interface WebhookValidationResult {
  valid: boolean;
  status?: number;
  reason?: string;
}

interface ProcessedWebhook {
  timestamp: number;
  requestId: string;
  dataId: string;
}

interface DeadLetterEntry {
  requestId: string;
  webhookData: MPWebhookPayload;
  error: {
    message: string;
    stack?: string;
  };
  attemptCount: number;
  firstAttempt: string;
  lastAttempt: string;
}

export class WebhookHandler {
  private mercadoPagoService: MercadoPagoService;
  private orderStateManager: OrderStateManager;
  private _webhookSecret: string; // Placeholder for future webhook verification
  private processedWebhooks: Map<string, ProcessedWebhook>;
  private webhookQueue: DeadLetterEntry[];
  private metrics: WebhookMetrics;

  constructor() {
    this.mercadoPagoService = new MercadoPagoService();
    this.orderStateManager = new OrderStateManager();
    this._webhookSecret = process.env.MP_WEBHOOK_SECRET || '';

    // Rate limiting and duplicate detection
    this.processedWebhooks = new Map(); // In production, use Redis
    this.webhookQueue = []; // In production, use proper queue system

    // Metrics tracking
    this.metrics = {
      received: 0,
      processed: 0,
      failed: 0,
      duplicates: 0,
    };
  }

  /**
   * Main webhook processing entry point
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Extract webhook data
      const signature = req.headers['x-signature'] as string;
      const requestId = req.headers['x-request-id'] as string;
      const dataId = req.body?.data?.id?.toString() || '';
      const webhookData = req.body as MPWebhookPayload;

      this.metrics.received++;

      // Validate webhook
      const validationResult = this.validateWebhook(signature, requestId, dataId);
      if (!validationResult.valid) {
        console.warn('Webhook validation failed:', validationResult.reason);
        res.status(validationResult.status || 400).json({
          error: validationResult.reason,
        });
        return;
      }

      // Check for duplicates
      if (this.isDuplicateWebhook(requestId, webhookData)) {
        console.log('Duplicate webhook detected, returning success');
        this.metrics.duplicates++;
        res.status(200).json({ status: 'processed' });
        return;
      }

      // Process webhook asynchronously
      this.processWebhookAsync(webhookData, requestId, startTime);

      // Return immediate success response
      res.status(200).json({
        status: 'received',
        request_id: requestId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Webhook handler error:', error);
      this.metrics.failed++;

      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Validate incoming webhook
   */
  private validateWebhook(
    signature: string,
    requestId: string,
    dataId: string
  ): WebhookValidationResult {
    // Check required headers
    if (!signature) {
      return { valid: false, status: 401, reason: 'Missing signature' };
    }

    if (!requestId) {
      return { valid: false, status: 400, reason: 'Missing request ID' };
    }

    if (!dataId) {
      return { valid: false, status: 400, reason: 'Missing data ID in payload' };
    }

    // Verify signature with correct parameters
    if (!this.mercadoPagoService.verifyWebhookSignature(signature, requestId, dataId)) {
      return { valid: false, status: 401, reason: 'Invalid signature' };
    }

    return { valid: true };
  }

  /**
   * Check if webhook is a duplicate
   */
  private isDuplicateWebhook(requestId: string, webhookData: MPWebhookPayload): boolean {
    const webhookKey = `${requestId}_${webhookData.type}_${webhookData.data?.id}`;

    if (this.processedWebhooks.has(webhookKey)) {
      return true;
    }

    // Store webhook key with TTL (24 hours)
    this.processedWebhooks.set(webhookKey, {
      timestamp: Date.now(),
      requestId,
      dataId: webhookData.data?.id || '',
    });

    // Clean up old entries (in production, use Redis with TTL)
    this.cleanupProcessedWebhooks();

    return false;
  }

  /**
   * Process webhook asynchronously
   */
  private async processWebhookAsync(
    webhookData: MPWebhookPayload,
    requestId: string,
    startTime: number
  ): Promise<void> {
    try {
      console.log(`Processing webhook ${requestId}:`, webhookData.type);

      // Route to appropriate handler based on webhook type
      let result: any;
      switch (webhookData.type) {
        case 'payment':
          result = await this.handlePaymentWebhook(webhookData);
          break;

        case 'merchant_order':
          result = await this.handleMerchantOrderWebhook(webhookData);
          break;

        default:
          console.log(`Unknown webhook type: ${webhookData.type}`);
          result = { status: 'ignored', reason: 'Unknown webhook type' };
      }

      const processingTime = Date.now() - startTime;
      console.log(`Webhook ${requestId} processed in ${processingTime}ms:`, result);

      this.metrics.processed++;

      // Store processing result for audit
      this.storeWebhookResult(requestId, webhookData, result, processingTime);
    } catch (error) {
      console.error(`Error processing webhook ${requestId}:`, error);

      this.metrics.failed++;

      // Store in dead letter queue for manual processing
      this.addToDeadLetterQueue(requestId, webhookData, error as Error);
    }
  }

  /**
   * Handle payment webhook notifications
   */
  private async handlePaymentWebhook(webhookData: MPWebhookPayload): Promise<any> {
    const paymentId = webhookData.data.id;

    if (!paymentId) {
      throw new Error('Payment ID missing from webhook data');
    }

    // Fetch full payment details from MercadoPago
    const paymentInfo = await this.mercadoPagoService.getPayment(paymentId);

    // Find order by external reference
    const orderNumber = paymentInfo.external_reference;
    if (!orderNumber) {
      throw new Error('External reference missing from payment');
    }

    // Get order from database (this would be implemented in your order service)
    const order = await this.getOrderByNumber(orderNumber);
    if (!order) {
      throw new Error(`Order not found: ${orderNumber}`);
    }

    // Map payment status to internal status
    const newStatus = this.mercadoPagoService.mapPaymentStatus(
      paymentInfo.status,
      paymentInfo.status_detail
    );

    // Update order status
    // @ts-ignore - Future implementation placeholder
    const _updateResult = await this.orderStateManager.updateOrderStatus(
      order.id.toString(),
      newStatus,
      {
        paymentId: paymentInfo.id.toString(),
        paymentStatus: paymentInfo.status,
        paymentStatusDetail: paymentInfo.status_detail,
        transactionAmount: paymentInfo.transaction_amount,
        paymentMethodId: paymentInfo.payment_method_id,
        dateApproved: paymentInfo.date_approved,
        triggeredBy: 'webhook',
        webhookType: 'payment',
      }
    );

    // Handle status-specific actions
    await this.handleStatusSpecificActions(order, newStatus, paymentInfo);

    return {
      status: 'processed',
      orderId: order.id,
      orderNumber: orderNumber,
      previousStatus: order.status,
      newStatus: newStatus,
      paymentId: paymentInfo.id,
      paymentStatus: paymentInfo.status,
    };
  }

  /**
   * Handle merchant order webhook notifications
   */
  private async handleMerchantOrderWebhook(webhookData: MPWebhookPayload): Promise<any> {
    const merchantOrderId = webhookData.data.id;

    if (!merchantOrderId) {
      throw new Error('Merchant order ID missing from webhook data');
    }

    // Note: This would require MercadoPago Merchant Order API
    // For now, we'll log and return success
    console.log(`Merchant order webhook received: ${merchantOrderId}`);

    return {
      status: 'processed',
      merchantOrderId: merchantOrderId,
      action: 'logged',
    };
  }

  /**
   * Handle status-specific actions after order update
   */
  private async handleStatusSpecificActions(
    order: Order,
    newStatus: OrderStatus,
    paymentInfo: MPPaymentResponse
  ): Promise<void> {
    switch (newStatus) {
      case OrderStatus.PAID:
        await this.handlePaidOrder(order, paymentInfo);
        break;

      case OrderStatus.PAYMENT_FAILED:
        await this.handleFailedPayment(order, paymentInfo);
        break;

      case OrderStatus.CANCELLED:
        await this.handleCancelledOrder(order, paymentInfo);
        break;

      case OrderStatus.REFUNDED:
        await this.handleRefundedOrder(order, paymentInfo);
        break;

      default:
        console.log(`No specific actions for status: ${newStatus}`);
    }
  }

  /**
   * Handle successful payment actions
   */
  private async handlePaidOrder(order: Order, paymentInfo: MPPaymentResponse): Promise<void> {
    console.log(`Order ${order.orderNumber} payment confirmed`);

    try {
      // Allocate inventory (placeholder)
      await this.allocateInventory(order);

      // Send confirmation email (placeholder)
      await this.sendConfirmationEmail(order, paymentInfo);

      // Notify fulfillment (placeholder)
      await this.notifyFulfillmentCenter(order);

      console.log(`Paid order actions completed for ${order.orderNumber}`);
    } catch (error) {
      console.error(`Error in paid order actions for ${order.orderNumber}:`, error);
      // Don't throw - webhook processing should still succeed
    }
  }

  /**
   * Handle failed payment actions
   */
  private async handleFailedPayment(order: Order, paymentInfo: MPPaymentResponse): Promise<void> {
    console.log(`Order ${order.orderNumber} payment failed`);

    try {
      // Release inventory reservations
      await this.releaseInventoryReservations(order);

      // Send payment failure notification
      await this.sendPaymentFailureEmail(order, paymentInfo);

      console.log(`Failed payment actions completed for ${order.orderNumber}`);
    } catch (error) {
      console.error(`Error in failed payment actions for ${order.orderNumber}:`, error);
    }
  }

  /**
   * Handle cancelled order actions
   */
  private async handleCancelledOrder(order: Order, _paymentInfo: MPPaymentResponse): Promise<void> {
    console.log(`Order ${order.orderNumber} cancelled`);

    try {
      // Release all reservations
      await this.releaseInventoryReservations(order);

      // Send cancellation notification
      await this.sendCancellationEmail(order);

      console.log(`Cancelled order actions completed for ${order.orderNumber}`);
    } catch (error) {
      console.error(`Error in cancelled order actions for ${order.orderNumber}:`, error);
    }
  }

  /**
   * Handle refunded order actions
   */
  private async handleRefundedOrder(order: Order, paymentInfo: MPPaymentResponse): Promise<void> {
    console.log(`Order ${order.orderNumber} refunded`);

    try {
      // Return inventory to stock
      await this.returnInventoryToStock(order);

      // Send refund confirmation
      await this.sendRefundConfirmationEmail(order, paymentInfo);

      console.log(`Refunded order actions completed for ${order.orderNumber}`);
    } catch (error) {
      console.error(`Error in refunded order actions for ${order.orderNumber}:`, error);
    }
  }

  /**
   * Store webhook processing result for audit
   */
  private async storeWebhookResult(
    requestId: string,
    webhookData: MPWebhookPayload,
    result: any,
    processingTime: number
  ): Promise<void> {
    const auditRecord = {
      requestId,
      webhookType: webhookData.type,
      webhookAction: webhookData.action,
      dataId: webhookData.data?.id,
      result: result,
      processingTime,
      timestamp: new Date().toISOString(),
    };

    // In production, store in database
    console.log('Webhook audit record:', auditRecord);
  }

  /**
   * Add failed webhook to dead letter queue
   */
  private addToDeadLetterQueue(
    requestId: string,
    webhookData: MPWebhookPayload,
    error: Error
  ): void {
    const deadLetterEntry: DeadLetterEntry = {
      requestId,
      webhookData,
      error: {
        message: error.message,
        stack: error.stack,
      },
      attemptCount: 1,
      firstAttempt: new Date().toISOString(),
      lastAttempt: new Date().toISOString(),
    };

    this.webhookQueue.push(deadLetterEntry);

    // In production, store in persistent queue
    console.error('Added webhook to dead letter queue:', deadLetterEntry);
  }

  /**
   * Process dead letter queue (retry failed webhooks)
   */
  async processDeadLetterQueue(): Promise<void> {
    if (this.webhookQueue.length === 0) {
      return;
    }

    console.log(`Processing ${this.webhookQueue.length} failed webhooks`);

    const toRetry = this.webhookQueue.splice(0, 10); // Process 10 at a time

    for (const entry of toRetry) {
      try {
        await this.processWebhookAsync(entry.webhookData, entry.requestId, Date.now());
        console.log(`Successfully reprocessed webhook ${entry.requestId}`);
      } catch (error) {
        entry.attemptCount++;
        entry.lastAttempt = new Date().toISOString();

        if (entry.attemptCount < 5) {
          // Put back in queue for next retry
          this.webhookQueue.push(entry);
        } else {
          // Max retries reached, need manual intervention
          console.error(
            `Webhook ${entry.requestId} failed after ${entry.attemptCount} attempts:`,
            error
          );
        }
      }
    }
  }

  /**
   * Clean up old processed webhook entries
   */
  private cleanupProcessedWebhooks(): void {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    for (const [key, webhook] of this.processedWebhooks.entries()) {
      if (webhook.timestamp < twentyFourHoursAgo) {
        this.processedWebhooks.delete(key);
      }
    }
  }

  /**
   * Get webhook processing metrics
   */
  getMetrics(): WebhookMetrics & {
    queueDepth: number;
    processedWebhooksCount: number;
    timestamp: string;
  } {
    return {
      ...this.metrics,
      queueDepth: this.webhookQueue.length,
      processedWebhooksCount: this.processedWebhooks.size,
      timestamp: new Date().toISOString(),
    };
  }

  // Placeholder methods for order and inventory operations
  // These would be implemented with actual database and service calls

  private async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    // Placeholder - implement with actual database query
    console.log(`Getting order by number: ${orderNumber}`);
    return null; // Replace with actual implementation
  }

  private async allocateInventory(order: Order): Promise<void> {
    console.log(`Allocating inventory for order ${order.orderNumber}`);
  }

  private async releaseInventoryReservations(order: Order): Promise<void> {
    console.log(`Releasing inventory reservations for order ${order.orderNumber}`);
  }

  private async returnInventoryToStock(order: Order): Promise<void> {
    console.log(`Returning inventory to stock for order ${order.orderNumber}`);
  }

  private async sendConfirmationEmail(
    order: Order,
    _paymentInfo: MPPaymentResponse
  ): Promise<void> {
    console.log(`Sending confirmation email for order ${order.orderNumber}`);
  }

  private async sendPaymentFailureEmail(
    order: Order,
    _paymentInfo: MPPaymentResponse
  ): Promise<void> {
    console.log(`Sending payment failure email for order ${order.orderNumber}`);
  }

  private async sendCancellationEmail(order: Order): Promise<void> {
    console.log(`Sending cancellation email for order ${order.orderNumber}`);
  }

  private async sendRefundConfirmationEmail(
    order: Order,
    _paymentInfo: MPPaymentResponse
  ): Promise<void> {
    console.log(`Sending refund confirmation email for order ${order.orderNumber}`);
  }

  private async notifyFulfillmentCenter(order: Order): Promise<void> {
    console.log(`Notifying fulfillment center for order ${order.orderNumber}`);
  }
}

export default WebhookHandler;
