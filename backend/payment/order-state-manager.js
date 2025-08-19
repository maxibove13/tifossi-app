/**
 * Order State Manager
 * Manages order status transitions and business logic
 * Tifossi Expo E-commerce Platform
 */

class OrderStateManager {
  constructor() {
    // Define valid order states
    this.states = {
      CREATED: 'created',
      PAYMENT_PENDING: 'payment_pending',
      PAID: 'paid',
      PROCESSING: 'processing',
      READY_FOR_PICKUP: 'ready_for_pickup',
      SHIPPED: 'shipped',
      OUT_FOR_DELIVERY: 'out_for_delivery',
      DELIVERED: 'delivered',
      PICKED_UP: 'picked_up',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
      REFUNDED: 'refunded',
      PAYMENT_FAILED: 'payment_failed',
      FAILED: 'failed',
      EXPIRED: 'expired'
    };

    // Define valid state transitions
    this.transitions = this.defineStateTransitions();
    
    // Define automatic transition rules
    this.automaticTransitions = this.defineAutomaticTransitions();
    
    // Define state-specific actions
    this.stateActions = this.defineStateActions();
  }

  /**
   * Update order status with validation and side effects
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status to transition to
   * @param {Object} context - Additional context for transition
   * @returns {Promise<Object>} Transition result
   */
  async updateOrderStatus(orderId, newStatus, context = {}) {
    try {
      // Get current order
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      const currentStatus = order.status;
      
      // Validate transition
      const validationResult = this.validateTransition(currentStatus, newStatus, context);
      if (!validationResult.valid) {
        throw new Error(validationResult.reason);
      }

      // Check business rules
      await this.checkBusinessRules(order, newStatus, context);

      // Execute pre-transition actions
      await this.executePreTransitionActions(order, newStatus, context);

      // Perform the status update
      const updateResult = await this.performStatusUpdate(orderId, currentStatus, newStatus, context);

      // Execute post-transition actions
      await this.executePostTransitionActions(order, newStatus, context);

      // Log the transition
      await this.logStatusTransition(orderId, currentStatus, newStatus, context);

      return {
        success: true,
        orderId,
        previousStatus: currentStatus,
        newStatus,
        transitionedAt: new Date().toISOString(),
        context
      };

    } catch (error) {
      console.error(`Failed to update order ${orderId} status to ${newStatus}:`, error);
      
      // Log failed transition attempt
      await this.logFailedTransition(orderId, newStatus, error, context);
      
      throw error;
    }
  }

  /**
   * Define valid state transitions
   * @returns {Object} State transition matrix
   */
  defineStateTransitions() {
    return {
      [this.states.CREATED]: {
        validNext: [this.states.PAYMENT_PENDING, this.states.CANCELLED, this.states.EXPIRED],
        description: 'Order created, awaiting payment initiation'
      },
      
      [this.states.PAYMENT_PENDING]: {
        validNext: [this.states.PAID, this.states.PAYMENT_FAILED, this.states.CANCELLED, this.states.EXPIRED],
        description: 'Payment initiated, awaiting confirmation'
      },
      
      [this.states.PAID]: {
        validNext: [this.states.PROCESSING, this.states.CANCELLED, this.states.REFUNDED],
        description: 'Payment confirmed, ready for processing'
      },
      
      [this.states.PROCESSING]: {
        validNext: [this.states.READY_FOR_PICKUP, this.states.SHIPPED, this.states.CANCELLED, this.states.REFUNDED, this.states.FAILED],
        description: 'Order being prepared for fulfillment'
      },
      
      [this.states.READY_FOR_PICKUP]: {
        validNext: [this.states.PICKED_UP, this.states.EXPIRED, this.states.REFUNDED],
        description: 'Order ready for customer pickup'
      },
      
      [this.states.SHIPPED]: {
        validNext: [this.states.OUT_FOR_DELIVERY, this.states.DELIVERED, this.states.FAILED, this.states.REFUNDED],
        description: 'Order dispatched for delivery'
      },
      
      [this.states.OUT_FOR_DELIVERY]: {
        validNext: [this.states.DELIVERED, this.states.FAILED, this.states.REFUNDED],
        description: 'Order in transit to customer'
      },
      
      [this.states.DELIVERED]: {
        validNext: [this.states.COMPLETED, this.states.REFUNDED],
        description: 'Order delivered to customer'
      },
      
      [this.states.PICKED_UP]: {
        validNext: [this.states.COMPLETED, this.states.REFUNDED],
        description: 'Order picked up by customer'
      },
      
      // Terminal states - no further transitions allowed
      [this.states.COMPLETED]: {
        validNext: [],
        description: 'Order fulfillment completed'
      },
      
      [this.states.CANCELLED]: {
        validNext: [],
        description: 'Order cancelled'
      },
      
      [this.states.REFUNDED]: {
        validNext: [],
        description: 'Order refunded'
      },
      
      [this.states.PAYMENT_FAILED]: {
        validNext: [],
        description: 'Payment processing failed'
      },
      
      [this.states.FAILED]: {
        validNext: [],
        description: 'Order processing failed'
      },
      
      [this.states.EXPIRED]: {
        validNext: [],
        description: 'Order expired'
      }
    };
  }

  /**
   * Define automatic transition rules
   * @returns {Object} Automatic transition configuration
   */
  defineAutomaticTransitions() {
    return {
      [this.states.CREATED]: {
        to: this.states.EXPIRED,
        condition: 'age > 24 hours',
        checkInterval: 'daily',
        action: 'release_inventory_reservations'
      },
      
      [this.states.PAYMENT_PENDING]: {
        to: this.states.EXPIRED,
        condition: 'age > 30 minutes',
        checkInterval: '5 minutes',
        action: 'cancel_payment_and_release_inventory'
      },
      
      [this.states.READY_FOR_PICKUP]: {
        to: this.states.EXPIRED,
        condition: 'age > 7 days',
        checkInterval: 'daily',
        action: 'initiate_automatic_refund'
      },
      
      [this.states.DELIVERED]: {
        to: this.states.COMPLETED,
        condition: 'age > 14 days',
        checkInterval: 'daily',
        action: 'finalize_order'
      },
      
      [this.states.PICKED_UP]: {
        to: this.states.COMPLETED,
        condition: 'age > 14 days',
        checkInterval: 'daily',
        action: 'finalize_order'
      }
    };
  }

  /**
   * Define state-specific actions
   * @returns {Object} State actions configuration
   */
  defineStateActions() {
    return {
      onEnter: {
        [this.states.PAYMENT_PENDING]: [
          'reserve_inventory',
          'create_payment_preference',
          'start_payment_timeout',
          'send_payment_link'
        ],
        
        [this.states.PAID]: [
          'allocate_inventory',
          'send_payment_confirmation',
          'notify_fulfillment_center',
          'calculate_delivery_estimate'
        ],
        
        [this.states.PROCESSING]: [
          'generate_picking_list',
          'create_shipping_label',
          'send_processing_notification',
          'update_inventory_status'
        ],
        
        [this.states.SHIPPED]: [
          'send_tracking_information',
          'schedule_delivery_notifications',
          'update_delivery_estimates',
          'release_processing_queue'
        ],
        
        [this.states.DELIVERED]: [
          'send_delivery_confirmation',
          'start_return_window_timer',
          'request_customer_feedback',
          'update_loyalty_points'
        ],
        
        [this.states.CANCELLED]: [
          'release_inventory_reservations',
          'cancel_payment_if_pending',
          'send_cancellation_notification',
          'update_analytics_metrics'
        ],
        
        [this.states.REFUNDED]: [
          'process_refund_payment',
          'return_inventory_to_stock',
          'send_refund_confirmation',
          'create_return_authorization'
        ]
      },
      
      onExit: {
        [this.states.CREATED]: [
          'clear_cart_session',
          'log_order_initiation'
        ],
        
        [this.states.PAYMENT_PENDING]: [
          'clear_payment_timeout',
          'update_payment_metrics'
        ],
        
        [this.states.PROCESSING]: [
          'finalize_inventory_allocation',
          'archive_processing_documents'
        ]
      }
    };
  }

  /**
   * Validate if transition is allowed
   * @param {string} currentStatus - Current order status
   * @param {string} newStatus - Desired new status
   * @param {Object} context - Transition context
   * @returns {Object} Validation result
   */
  validateTransition(currentStatus, newStatus, context) {
    // Check if current status exists
    if (!this.transitions[currentStatus]) {
      return {
        valid: false,
        reason: `Invalid current status: ${currentStatus}`
      };
    }

    // Check if new status is valid
    if (!Object.values(this.states).includes(newStatus)) {
      return {
        valid: false,
        reason: `Invalid new status: ${newStatus}`
      };
    }

    // Check if transition is allowed
    const allowedTransitions = this.transitions[currentStatus].validNext;
    if (!allowedTransitions.includes(newStatus)) {
      return {
        valid: false,
        reason: `Transition from ${currentStatus} to ${newStatus} is not allowed. Valid transitions: ${allowedTransitions.join(', ')}`
      };
    }

    // Check transition-specific rules
    const specificValidation = this.validateSpecificTransition(currentStatus, newStatus, context);
    if (!specificValidation.valid) {
      return specificValidation;
    }

    return { valid: true };
  }

  /**
   * Validate specific transition rules
   * @param {string} currentStatus - Current status
   * @param {string} newStatus - New status
   * @param {Object} context - Transition context
   * @returns {Object} Validation result
   */
  validateSpecificTransition(currentStatus, newStatus, context) {
    // Payment-related transition validation
    if (newStatus === this.states.PAID) {
      if (!context.paymentId) {
        return {
          valid: false,
          reason: 'Payment ID is required for PAID status'
        };
      }
      
      if (!context.paymentStatus || context.paymentStatus !== 'approved') {
        return {
          valid: false,
          reason: 'Payment must be approved for PAID status'
        };
      }
    }

    // Shipping-related validation
    if (newStatus === this.states.SHIPPED) {
      if (!context.trackingNumber && !context.carrierInfo) {
        return {
          valid: false,
          reason: 'Tracking information is required for SHIPPED status'
        };
      }
    }

    // Pickup-related validation
    if (newStatus === this.states.PICKED_UP) {
      if (!context.pickupConfirmation) {
        return {
          valid: false,
          reason: 'Pickup confirmation is required for PICKED_UP status'
        };
      }
    }

    return { valid: true };
  }

  /**
   * Check business rules before transition
   * @param {Object} order - Order object
   * @param {string} newStatus - New status
   * @param {Object} context - Transition context
   */
  async checkBusinessRules(order, newStatus, context) {
    // Inventory availability check for PROCESSING
    if (newStatus === this.states.PROCESSING) {
      const inventoryAvailable = await this.checkInventoryAvailability(order);
      if (!inventoryAvailable) {
        throw new Error('Insufficient inventory to process order');
      }
    }

    // Payment amount validation for PAID
    if (newStatus === this.states.PAID) {
      if (context.transactionAmount && Math.abs(context.transactionAmount - order.total) > 0.01) {
        throw new Error(`Payment amount mismatch: expected ${order.total}, received ${context.transactionAmount}`);
      }
    }

    // Shipping method validation
    if (newStatus === this.states.SHIPPED && order.shippingMethod !== 'delivery') {
      throw new Error('Cannot ship order with pickup shipping method');
    }

    if (newStatus === this.states.READY_FOR_PICKUP && order.shippingMethod !== 'pickup') {
      throw new Error('Cannot mark order ready for pickup with delivery shipping method');
    }
  }

  /**
   * Execute actions before status transition
   * @param {Object} order - Order object
   * @param {string} newStatus - New status
   * @param {Object} context - Transition context
   */
  async executePreTransitionActions(order, newStatus, context) {
    console.log(`Executing pre-transition actions for order ${order.id}: ${order.status} -> ${newStatus}`);
    
    // Add any pre-transition validation or preparation here
    // For example, checking external system availability
    
    if (newStatus === this.states.REFUNDED) {
      // Verify refund eligibility
      const refundEligible = await this.checkRefundEligibility(order);
      if (!refundEligible) {
        throw new Error('Order is not eligible for refund');
      }
    }
  }

  /**
   * Perform the actual status update in database
   * @param {string} orderId - Order ID
   * @param {string} currentStatus - Current status
   * @param {string} newStatus - New status
   * @param {Object} context - Transition context
   * @returns {Promise<Object>} Update result
   */
  async performStatusUpdate(orderId, currentStatus, newStatus, context) {
    // This would be implemented with actual database calls
    console.log(`Updating order ${orderId} status: ${currentStatus} -> ${newStatus}`);
    
    // Simulate database update with optimistic locking
    const updateData = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      statusHistory: {
        from: currentStatus,
        to: newStatus,
        timestamp: new Date().toISOString(),
        triggeredBy: context.triggeredBy || 'system',
        reason: context.reason,
        metadata: context.metadata
      }
    };

    // Add status-specific fields
    if (newStatus === this.states.PAID && context.paymentId) {
      updateData.mpPaymentId = context.paymentId;
      updateData.paidAt = new Date().toISOString();
    }

    if (newStatus === this.states.SHIPPED && context.trackingNumber) {
      updateData.trackingNumber = context.trackingNumber;
      updateData.shippedAt = new Date().toISOString();
    }

    if (newStatus === this.states.DELIVERED) {
      updateData.deliveredAt = new Date().toISOString();
    }

    // In actual implementation, this would update the database
    return updateData;
  }

  /**
   * Execute actions after successful status transition
   * @param {Object} order - Order object
   * @param {string} newStatus - New status
   * @param {Object} context - Transition context
   */
  async executePostTransitionActions(order, newStatus, context) {
    const actions = this.stateActions.onEnter[newStatus] || [];
    
    console.log(`Executing post-transition actions for ${newStatus}:`, actions);
    
    for (const action of actions) {
      try {
        await this.executeAction(action, order, context);
      } catch (error) {
        console.error(`Failed to execute action ${action} for order ${order.id}:`, error);
        // Continue with other actions even if one fails
      }
    }
  }

  /**
   * Execute specific action
   * @param {string} action - Action to execute
   * @param {Object} order - Order object
   * @param {Object} context - Action context
   */
  async executeAction(action, order, context) {
    switch (action) {
      case 'reserve_inventory':
        await this.reserveInventory(order);
        break;
        
      case 'allocate_inventory':
        await this.allocateInventory(order);
        break;
        
      case 'release_inventory_reservations':
        await this.releaseInventoryReservations(order);
        break;
        
      case 'send_payment_confirmation':
        await this.sendPaymentConfirmation(order, context);
        break;
        
      case 'send_tracking_information':
        await this.sendTrackingInformation(order, context);
        break;
        
      case 'process_refund_payment':
        await this.processRefundPayment(order, context);
        break;
        
      default:
        console.log(`Action ${action} not implemented yet`);
    }
  }

  /**
   * Log successful status transition
   * @param {string} orderId - Order ID
   * @param {string} fromStatus - Previous status
   * @param {string} toStatus - New status
   * @param {Object} context - Transition context
   */
  async logStatusTransition(orderId, fromStatus, toStatus, context) {
    const logEntry = {
      orderId,
      fromStatus,
      toStatus,
      timestamp: new Date().toISOString(),
      triggeredBy: context.triggeredBy || 'system',
      reason: context.reason,
      paymentId: context.paymentId,
      success: true
    };
    
    console.log('Status transition logged:', logEntry);
    // In production, store in audit log database
  }

  /**
   * Log failed transition attempt
   * @param {string} orderId - Order ID
   * @param {string} toStatus - Attempted new status
   * @param {Error} error - Error that occurred
   * @param {Object} context - Transition context
   */
  async logFailedTransition(orderId, toStatus, error, context) {
    const logEntry = {
      orderId,
      attemptedStatus: toStatus,
      timestamp: new Date().toISOString(),
      triggeredBy: context.triggeredBy || 'system',
      error: error.message,
      success: false
    };
    
    console.error('Failed status transition logged:', logEntry);
    // In production, store in audit log database
  }

  /**
   * Get available actions for current order status
   * @param {Object} order - Order object
   * @returns {Array} Available actions
   */
  getAvailableActions(order) {
    const currentStatus = order.status;
    const validTransitions = this.transitions[currentStatus]?.validNext || [];
    
    return validTransitions.map(status => ({
      status,
      description: this.transitions[status]?.description || status,
      requiresPermission: this.getRequiredPermission(currentStatus, status)
    }));
  }

  /**
   * Get required permission for transition
   * @param {string} fromStatus - Current status
   * @param {string} toStatus - Target status
   * @returns {string} Required permission level
   */
  getRequiredPermission(fromStatus, toStatus) {
    // Define permission requirements for transitions
    const adminRequired = [
      `${this.states.PAID}->${this.states.CANCELLED}`,
      `${this.states.PROCESSING}->${this.states.FAILED}`,
      `${this.states.DELIVERED}->${this.states.REFUNDED}`
    ];
    
    const transition = `${fromStatus}->${toStatus}`;
    
    if (adminRequired.includes(transition)) {
      return 'admin';
    } else if (toStatus === this.states.CANCELLED) {
      return 'user_or_admin';
    } else {
      return 'system';
    }
  }

  // Placeholder methods for actual implementations
  // These would be replaced with real database and service calls

  async getOrder(orderId) {
    // Placeholder - implement with actual database query
    return {
      id: orderId,
      orderNumber: 'TIF-2024-001',
      status: this.states.PAYMENT_PENDING,
      total: 1500,
      shippingMethod: 'delivery'
    };
  }

  async checkInventoryAvailability(order) {
    console.log(`Checking inventory availability for order ${order.id}`);
    return true; // Placeholder
  }

  async checkRefundEligibility(order) {
    console.log(`Checking refund eligibility for order ${order.id}`);
    return true; // Placeholder
  }

  async reserveInventory(order) {
    console.log(`Reserving inventory for order ${order.id}`);
  }

  async allocateInventory(order) {
    console.log(`Allocating inventory for order ${order.id}`);
  }

  async releaseInventoryReservations(order) {
    console.log(`Releasing inventory reservations for order ${order.id}`);
  }

  async sendPaymentConfirmation(order, context) {
    console.log(`Sending payment confirmation for order ${order.id}`);
  }

  async sendTrackingInformation(order, context) {
    console.log(`Sending tracking information for order ${order.id}`);
  }

  async processRefundPayment(order, context) {
    console.log(`Processing refund payment for order ${order.id}`);
  }
}

module.exports = OrderStateManager;