/**
 * MercadoPago Webhook Handler
 * Processes MercadoPago webhook notifications
 * Tifossi Expo E-commerce Platform
 */

const crypto = require('crypto');
const MercadoPagoService = require('./mercadopago-service');
const OrderStateManager = require('./order-state-manager');

class WebhookHandler {
  constructor() {
    this.mercadoPagoService = new MercadoPagoService();
    this.orderStateManager = new OrderStateManager();
    this.webhookSecret = process.env.MP_WEBHOOK_SECRET;
    
    // Rate limiting and duplicate detection
    this.processedWebhooks = new Map(); // In production, use Redis
    this.webhookQueue = []; // In production, use proper queue system
    
    // Metrics tracking
    this.metrics = {
      received: 0,
      processed: 0,
      failed: 0,
      duplicates: 0
    };
  }

  /**
   * Main webhook processing entry point
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handleWebhook(req, res) {
    const startTime = Date.now();
    
    try {
      // Extract webhook data
      const signature = req.headers['x-signature'];
      const requestId = req.headers['x-request-id'];
      const rawBody = JSON.stringify(req.body);
      
      this.metrics.received++;
      
      // Validate webhook
      const validationResult = this.validateWebhook(signature, rawBody, requestId);
      if (!validationResult.valid) {
        console.warn('Webhook validation failed:', validationResult.reason);
        return res.status(validationResult.status).json({
          error: validationResult.reason
        });
      }

      // Check for duplicates
      if (this.isDuplicateWebhook(requestId, req.body)) {
        console.log('Duplicate webhook detected, returning success');
        this.metrics.duplicates++;
        return res.status(200).json({ status: 'processed' });
      }

      // Process webhook asynchronously
      this.processWebhookAsync(req.body, requestId, startTime);
      
      // Return immediate success response
      res.status(200).json({ 
        status: 'received',
        request_id: requestId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Webhook handler error:', error);
      this.metrics.failed++;
      
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Validate incoming webhook
   * @param {string} signature - Webhook signature
   * @param {string} rawBody - Raw request body
   * @param {string} requestId - Request ID header
   * @returns {Object} Validation result
   */
  validateWebhook(signature, rawBody, requestId) {
    // Check required headers
    if (!signature) {
      return { valid: false, status: 401, reason: 'Missing signature' };
    }

    if (!requestId) {
      return { valid: false, status: 400, reason: 'Missing request ID' };
    }

    // Verify signature
    if (!this.mercadoPagoService.verifyWebhookSignature(signature, rawBody)) {
      return { valid: false, status: 401, reason: 'Invalid signature' };
    }

    // Check payload size
    if (rawBody.length > 1024 * 1024) { // 1MB limit
      return { valid: false, status: 413, reason: 'Payload too large' };
    }

    return { valid: true };
  }

  /**
   * Check if webhook is a duplicate
   * @param {string} requestId - Request ID
   * @param {Object} webhookData - Webhook payload
   * @returns {boolean} True if duplicate
   */
  isDuplicateWebhook(requestId, webhookData) {
    const webhookKey = `${requestId}_${webhookData.type}_${webhookData.data?.id}`;
    
    if (this.processedWebhooks.has(webhookKey)) {
      return true;
    }

    // Store webhook key with TTL (24 hours)
    this.processedWebhooks.set(webhookKey, Date.now());
    
    // Clean up old entries (in production, use Redis with TTL)
    this.cleanupProcessedWebhooks();
    
    return false;
  }

  /**
   * Process webhook asynchronously
   * @param {Object} webhookData - Webhook payload
   * @param {string} requestId - Request ID
   * @param {number} startTime - Processing start time
   */
  async processWebhookAsync(webhookData, requestId, startTime) {
    try {
      console.log(`Processing webhook ${requestId}:`, webhookData.type);
      
      // Route to appropriate handler based on webhook type
      let result;
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
      this.addToDeadLetterQueue(requestId, webhookData, error);
    }
  }

  /**
   * Handle payment webhook notifications
   * @param {Object} webhookData - Payment webhook data
   * @returns {Promise<Object>} Processing result
   */
  async handlePaymentWebhook(webhookData) {
    const paymentId = webhookData.data.id;
    
    if (!paymentId) {
      throw new Error('Payment ID missing from webhook data');
    }

    // Fetch full payment details from MercadoPago
    const paymentInfo = await this.mercadoPagoService.getPayment(paymentId);
    
    // Find order by external reference
    const orderNumber = paymentInfo.externalReference;
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
      paymentInfo.statusDetail
    );

    // Update order status
    const updateResult = await this.orderStateManager.updateOrderStatus(
      order.id,
      newStatus,
      {
        paymentId: paymentInfo.id,
        paymentStatus: paymentInfo.status,
        paymentStatusDetail: paymentInfo.statusDetail,
        transactionAmount: paymentInfo.transactionAmount,
        paymentMethodId: paymentInfo.paymentMethodId,
        dateApproved: paymentInfo.dateApproved,
        triggeredBy: 'webhook',
        webhookType: 'payment'
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
      paymentStatus: paymentInfo.status
    };
  }

  /**
   * Handle merchant order webhook notifications
   * @param {Object} webhookData - Merchant order webhook data
   * @returns {Promise<Object>} Processing result
   */
  async handleMerchantOrderWebhook(webhookData) {
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
      action: 'logged'
    };
  }

  /**
   * Handle status-specific actions after order update
   * @param {Object} order - Order object
   * @param {string} newStatus - New order status
   * @param {Object} paymentInfo - Payment information
   */
  async handleStatusSpecificActions(order, newStatus, paymentInfo) {
    switch (newStatus) {
      case 'PAID':
        await this.handlePaidOrder(order, paymentInfo);
        break;
        
      case 'PAYMENT_FAILED':
        await this.handleFailedPayment(order, paymentInfo);
        break;
        
      case 'CANCELLED':
        await this.handleCancelledOrder(order, paymentInfo);
        break;
        
      case 'REFUNDED':
        await this.handleRefundedOrder(order, paymentInfo);
        break;
        
      default:
        console.log(`No specific actions for status: ${newStatus}`);
    }
  }

  /**
   * Handle successful payment actions
   * @param {Object} order - Order object
   * @param {Object} paymentInfo - Payment information
   */
  async handlePaidOrder(order, paymentInfo) {
    console.log(`Order ${order.orderNumber} payment confirmed`);
    
    // Actions for paid order:
    // 1. Allocate inventory
    // 2. Send confirmation email
    // 3. Notify fulfillment center
    // 4. Update analytics
    
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
   * @param {Object} order - Order object
   * @param {Object} paymentInfo - Payment information
   */
  async handleFailedPayment(order, paymentInfo) {
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
   * @param {Object} order - Order object
   * @param {Object} paymentInfo - Payment information
   */
  async handleCancelledOrder(order, paymentInfo) {
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
   * @param {Object} order - Order object
   * @param {Object} paymentInfo - Payment information
   */
  async handleRefundedOrder(order, paymentInfo) {
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
   * @param {string} requestId - Request ID
   * @param {Object} webhookData - Webhook payload
   * @param {Object} result - Processing result
   * @param {number} processingTime - Processing time in ms
   */
  async storeWebhookResult(requestId, webhookData, result, processingTime) {
    const auditRecord = {
      requestId,
      webhookType: webhookData.type,
      webhookAction: webhookData.action,
      dataId: webhookData.data?.id,
      result: result,
      processingTime,
      timestamp: new Date().toISOString()
    };
    
    // In production, store in database
    console.log('Webhook audit record:', auditRecord);
  }

  /**
   * Add failed webhook to dead letter queue
   * @param {string} requestId - Request ID
   * @param {Object} webhookData - Webhook payload
   * @param {Error} error - Processing error
   */
  addToDeadLetterQueue(requestId, webhookData, error) {
    const deadLetterEntry = {
      requestId,
      webhookData,
      error: {
        message: error.message,
        stack: error.stack
      },
      attemptCount: 1,
      firstAttempt: new Date().toISOString(),
      lastAttempt: new Date().toISOString()
    };
    
    this.webhookQueue.push(deadLetterEntry);
    
    // In production, store in persistent queue
    console.error('Added webhook to dead letter queue:', deadLetterEntry);
  }

  /**
   * Process dead letter queue (retry failed webhooks)
   */
  async processDeadLetterQueue() {
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
          console.error(`Webhook ${entry.requestId} failed after ${entry.attemptCount} attempts:`, error);
        }
      }
    }
  }

  /**
   * Clean up old processed webhook entries
   */
  cleanupProcessedWebhooks() {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const [key, timestamp] of this.processedWebhooks.entries()) {
      if (timestamp < twentyFourHoursAgo) {
        this.processedWebhooks.delete(key);
      }
    }
  }

  /**
   * Get webhook processing metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueDepth: this.webhookQueue.length,
      processedWebhooksCount: this.processedWebhooks.size,
      timestamp: new Date().toISOString()
    };
  }

  // Placeholder methods for order and inventory operations
  // These would be implemented with actual database and service calls

  async getOrderByNumber(orderNumber) {
    // Placeholder - implement with actual database query
    console.log(`Getting order by number: ${orderNumber}`);
    return { id: 'order_123', orderNumber, status: 'PAYMENT_PENDING' };
  }

  async allocateInventory(order) {
    console.log(`Allocating inventory for order ${order.orderNumber}`);
  }

  async releaseInventoryReservations(order) {
    console.log(`Releasing inventory reservations for order ${order.orderNumber}`);
  }

  async returnInventoryToStock(order) {
    console.log(`Returning inventory to stock for order ${order.orderNumber}`);
  }

  async sendConfirmationEmail(order, paymentInfo) {
    console.log(`Sending confirmation email for order ${order.orderNumber}`);
  }

  async sendPaymentFailureEmail(order, paymentInfo) {
    console.log(`Sending payment failure email for order ${order.orderNumber}`);
  }

  async sendCancellationEmail(order) {
    console.log(`Sending cancellation email for order ${order.orderNumber}`);
  }

  async sendRefundConfirmationEmail(order, paymentInfo) {
    console.log(`Sending refund confirmation email for order ${order.orderNumber}`);
  }

  async notifyFulfillmentCenter(order) {
    console.log(`Notifying fulfillment center for order ${order.orderNumber}`);
  }
}

module.exports = WebhookHandler;