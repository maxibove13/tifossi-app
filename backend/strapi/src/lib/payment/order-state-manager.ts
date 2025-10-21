/**
 * Order State Manager
 * Handles order status transitions and business rules
 * Tifossi E-commerce Platform
 */

import { OrderStatus, Order, OrderStatusHistoryEntry } from './types/orders';

interface StatusTransitionMetadata {
  paymentId?: string;
  paymentStatus?: string;
  paymentStatusDetail?: string;
  transactionAmount?: number;
  paymentMethodId?: string;
  dateApproved?: string;
  triggeredBy?: string;
  webhookType?: string;
  reason?: string;
  [key: string]: any;
}

interface StatusTransition {
  from: OrderStatus | OrderStatus[];
  to: OrderStatus;
  allowed: boolean;
  requiresPayment?: boolean;
  requiresShipping?: boolean;
  notifyCustomer?: boolean;
}

export class OrderStateManager {
  private validTransitions: Map<string, StatusTransition>;

  /**
   * Valid order state transitions
   * Defines which status changes are allowed
   */
  private static VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.REFUNDED, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.REFUNDED],
    [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: [],
  };

  constructor() {
    this.validTransitions = this.initializeTransitions();
  }

  /**
   * Validate if a state transition is allowed
   */
  static isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
    const allowedTransitions = this.VALID_TRANSITIONS[from] || [];
    return allowedTransitions.includes(to);
  }

  /**
   * Validate and log state transition
   * Throws error if transition is invalid
   */
  async validateTransition(
    orderId: number,
    fromStatus: OrderStatus,
    toStatus: OrderStatus
  ): Promise<void> {
    if (!OrderStateManager.isValidTransition(fromStatus, toStatus)) {
      const error = new Error(`Invalid order state transition: ${fromStatus} → ${toStatus}`);

      strapi.log.error('Invalid state transition attempted', {
        orderId,
        fromStatus,
        toStatus,
        allowedTransitions: OrderStateManager.VALID_TRANSITIONS[fromStatus],
      });

      throw error;
    }
  }

  /**
   * Initialize valid status transitions
   */
  private initializeTransitions(): Map<string, StatusTransition> {
    const transitions = new Map<string, StatusTransition>();

    // From PENDING
    transitions.set('PENDING->PAID', {
      from: OrderStatus.PENDING,
      to: OrderStatus.PAID,
      allowed: true,
      requiresPayment: true,
      notifyCustomer: true,
    });

    transitions.set('PENDING->PROCESSING', {
      from: OrderStatus.PENDING,
      to: OrderStatus.PROCESSING,
      allowed: true,
      notifyCustomer: true,
    });

    transitions.set('PENDING->CANCELLED', {
      from: OrderStatus.PENDING,
      to: OrderStatus.CANCELLED,
      allowed: true,
      notifyCustomer: true,
    });

    // From PAID
    transitions.set('PAID->PROCESSING', {
      from: OrderStatus.PAID,
      to: OrderStatus.PROCESSING,
      allowed: true,
      notifyCustomer: true,
    });

    transitions.set('PAID->REFUNDED', {
      from: OrderStatus.PAID,
      to: OrderStatus.REFUNDED,
      allowed: true,
      notifyCustomer: true,
    });

    transitions.set('PAID->CANCELLED', {
      from: OrderStatus.PAID,
      to: OrderStatus.CANCELLED,
      allowed: true,
      notifyCustomer: true,
    });

    // From PROCESSING
    transitions.set('PROCESSING->SHIPPED', {
      from: OrderStatus.PROCESSING,
      to: OrderStatus.SHIPPED,
      allowed: true,
      requiresShipping: true,
      notifyCustomer: true,
    });

    transitions.set('PROCESSING->CANCELLED', {
      from: OrderStatus.PROCESSING,
      to: OrderStatus.CANCELLED,
      allowed: true,
      notifyCustomer: true,
    });

    // From SHIPPED
    transitions.set('SHIPPED->DELIVERED', {
      from: OrderStatus.SHIPPED,
      to: OrderStatus.DELIVERED,
      allowed: true,
      notifyCustomer: true,
    });

    // From DELIVERED
    transitions.set('DELIVERED->REFUNDED', {
      from: OrderStatus.DELIVERED,
      to: OrderStatus.REFUNDED,
      allowed: true,
      notifyCustomer: true,
    });

    return transitions;
  }

  /**
   * Check if a status transition is valid
   */
  isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
    const key = `${from}->${to}`;
    const transition = this.validTransitions.get(key);
    return transition?.allowed || false;
  }

  /**
   * Get allowed transitions from current status
   */
  getAllowedTransitions(currentStatus: OrderStatus): OrderStatus[] {
    const allowed: OrderStatus[] = [];

    for (const [key, transition] of this.validTransitions.entries()) {
      if (key.startsWith(`${currentStatus}->`) && transition.allowed) {
        allowed.push(transition.to);
      }
    }

    return allowed;
  }

  /**
   * Update order status with validation
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    metadata?: StatusTransitionMetadata
  ): Promise<{ success: boolean; previousStatus?: OrderStatus; error?: string }> {
    try {
      // Get current order (this would be from database)
      const order = await this.getOrder(orderId);
      if (!order) {
        return {
          success: false,
          error: 'Order not found',
        };
      }

      const currentStatus = order.status;

      // Check if transition is valid
      if (!this.isValidTransition(currentStatus, newStatus)) {
        strapi.log.warn(`Invalid status transition: ${currentStatus} -> ${newStatus}`);
        return {
          success: false,
          previousStatus: currentStatus,
          error: `Cannot transition from ${currentStatus} to ${newStatus}`,
        };
      }

      // Get transition rules
      const transitionKey = `${currentStatus}->${newStatus}`;
      const transition = this.validTransitions.get(transitionKey);

      // Validate transition requirements
      if (transition?.requiresPayment && !metadata?.paymentId) {
        return {
          success: false,
          previousStatus: currentStatus,
          error: 'Payment confirmation required for this transition',
        };
      }

      if (transition?.requiresShipping && !metadata?.triggeredBy?.includes('shipping')) {
        return {
          success: false,
          previousStatus: currentStatus,
          error: 'Shipping confirmation required for this transition',
        };
      }

      // Update order status
      await this.performStatusUpdate(order, newStatus, metadata);

      // Log status transition
      await this.logStatusTransition(orderId, currentStatus, newStatus, metadata);

      // Handle notifications if needed
      if (transition?.notifyCustomer) {
        await this.triggerCustomerNotification(order, newStatus, metadata);
      }

      strapi.log.info(`Order ${orderId} status updated: ${currentStatus} -> ${newStatus}`);

      return {
        success: true,
        previousStatus: currentStatus,
      };
    } catch (error) {
      strapi.log.error('Error updating order status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Log status transition for audit trail
   */
  async transitionStatus(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    metadata?: StatusTransitionMetadata
  ): Promise<void> {
    // Validate transition is allowed
    await this.validateTransition(Number(orderId), fromStatus, toStatus);

    await this.logStatusTransition(orderId, fromStatus, toStatus, metadata);
  }

  /**
   * Log status transition
   */
  private async logStatusTransition(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    metadata?: StatusTransitionMetadata
  ): Promise<void> {
    const logEntry: OrderStatusHistoryEntry = {
      status: toStatus,
      changedAt: new Date().toISOString(),
      changedBy: metadata?.triggeredBy || 'system',
      reason: metadata?.reason || `Status changed from ${fromStatus} to ${toStatus}`,
      metadata: metadata || {},
    };

    // In production, save to database
    strapi.log.debug('Status transition logged:', {
      orderId,
      fromStatus,
      toStatus,
      ...logEntry,
    });
  }

  /**
   * Perform the actual status update
   */
  private async performStatusUpdate(
    order: Order,
    newStatus: OrderStatus,
    metadata?: StatusTransitionMetadata
  ): Promise<void> {
    // In production, update database
    strapi.log.debug(`Updating order ${order.id} status to ${newStatus}`);

    // Set specific timestamps based on status
    const timestamps: Partial<Order> = {};

    switch (newStatus) {
      case OrderStatus.PAID:
        timestamps.paidAt = metadata?.dateApproved || new Date().toISOString();
        break;
      case OrderStatus.SHIPPED:
        timestamps.shippedAt = new Date().toISOString();
        break;
      case OrderStatus.DELIVERED:
        timestamps.deliveredAt = new Date().toISOString();
        break;
      case OrderStatus.CANCELLED:
        timestamps.cancelledAt = new Date().toISOString();
        break;
      case OrderStatus.REFUNDED:
        timestamps.refundedAt = new Date().toISOString();
        break;
    }

    // Update order with new status and timestamps
    // await database.updateOrder(order.id, { status: newStatus, ...timestamps });
  }

  /**
   * Trigger customer notification
   */
  private async triggerCustomerNotification(
    order: Order,
    newStatus: OrderStatus,
    metadata?: StatusTransitionMetadata
  ): Promise<void> {
    strapi.log.debug(
      `Triggering customer notification for order ${order.orderNumber}: ${newStatus}`
    );

    // In production, send actual notification
    // @ts-ignore - Future implementation placeholder
    const _notificationData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerEmail: order.user.email,
      status: newStatus,
      metadata,
    };

    // await notificationService.send(notificationData);
  }

  /**
   * Get order by ID (placeholder)
   */
  private async getOrder(orderId: string): Promise<Order | null> {
    // In production, fetch from database
    strapi.log.debug(`Fetching order ${orderId}`);

    // Placeholder return
    return null;
  }

  /**
   * Bulk update order statuses
   */
  async bulkUpdateStatuses(
    updates: { orderId: string; newStatus: OrderStatus; metadata?: StatusTransitionMetadata }[]
  ): Promise<{ orderId: string; success: boolean; error?: string }[]> {
    const results = [];

    for (const update of updates) {
      const result = await this.updateOrderStatus(
        update.orderId,
        update.newStatus,
        update.metadata
      );

      results.push({
        orderId: update.orderId,
        success: result.success,
        error: result.error,
      });
    }

    return results;
  }

  /**
   * Get order status statistics
   */
  async getStatusStatistics(): Promise<Record<OrderStatus, number>> {
    // In production, query database
    const stats: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.PROCESSING]: 0,
      [OrderStatus.PAID]: 0,
      [OrderStatus.SHIPPED]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0,
      [OrderStatus.REFUNDED]: 0,
    };

    // Placeholder - would query database
    strapi.log.debug('Fetching order status statistics');

    return stats;
  }

  /**
   * Cancel expired orders
   */
  async cancelExpiredOrders(expirationMinutes: number = 30): Promise<number> {
    strapi.log.info(`Cancelling orders older than ${expirationMinutes} minutes in PENDING status`);

    // In production, query and update database
    // const expiredOrders = await database.query({
    //   status: OrderStatus.PAYMENT_PENDING,
    //   createdAt: { $lt: new Date(Date.now() - expirationMinutes * 60 * 1000) }
    // });

    let cancelledCount = 0;

    // for (const order of expiredOrders) {
    //   const result = await this.updateOrderStatus(
    //     order.id,
    //     OrderStatus.CANCELLED,
    //     { reason: 'Payment timeout', triggeredBy: 'system' }
    //   );
    //   if (result.success) cancelledCount++;
    // }

    return cancelledCount;
  }

  /**
   * Get transition history for an order
   */
  async getOrderTransitionHistory(orderId: string): Promise<OrderStatusHistoryEntry[]> {
    // In production, fetch from database
    strapi.log.debug(`Fetching transition history for order ${orderId}`);

    return [];
  }
}

export default OrderStateManager;
