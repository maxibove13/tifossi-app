/**
 * Payment service for Tifossi Expo
 * Business logic for payment processing
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::payment.payment', ({ strapi }) => ({
  /**
   * Generate unique order number
   * @returns {string} Formatted order number
   */
  generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6); // Last 6 digits of timestamp
    
    return `TIF-${year}${month}${day}-${timestamp}`;
  },

  /**
   * Validate cart data before order creation
   * @param {Object} cartData - Cart data to validate
   * @returns {Object} Validation result
   */
  async validateCartData(cartData) {
    const errors = [];
    
    // Required fields validation
    if (!cartData.items || !Array.isArray(cartData.items) || cartData.items.length === 0) {
      errors.push('Cart must contain at least one item');
    }
    
    if (!cartData.user || !cartData.user.id) {
      errors.push('User information is required');
    }
    
    if (!cartData.shippingAddress) {
      errors.push('Shipping address is required');
    }
    
    if (!cartData.total || cartData.total <= 0) {
      errors.push('Invalid total amount');
    }

    // Validate each cart item
    if (cartData.items) {
      for (let i = 0; i < cartData.items.length; i++) {
        const item = cartData.items[i];
        
        if (!item.productId) {
          errors.push(`Item ${i + 1}: Product ID is required`);
        }
        
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${i + 1}: Valid quantity is required`);
        }
        
        if (!item.price || item.price <= 0) {
          errors.push(`Item ${i + 1}: Valid price is required`);
        }

        // Check if product exists and is available
        if (item.productId) {
          try {
            const product = await strapi.entityService.findOne('api::product.product', item.productId);
            if (!product) {
              errors.push(`Item ${i + 1}: Product not found`);
            } else if (!product.available) {
              errors.push(`Item ${i + 1}: Product is not available`);
            }
          } catch (error) {
            errors.push(`Item ${i + 1}: Error validating product`);
          }
        }
      }
    }

    // Validate shipping address
    if (cartData.shippingAddress) {
      const address = cartData.shippingAddress;
      if (!address.street || !address.city || !address.country) {
        errors.push('Complete shipping address is required');
      }
    }

    // Validate user email format
    if (cartData.user && cartData.user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cartData.user.email)) {
        errors.push('Invalid email format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Calculate order totals
   * @param {Object} cartData - Cart data
   * @returns {Object} Calculated totals
   */
  calculateTotals(cartData) {
    let subtotal = 0;
    
    // Calculate subtotal from items
    if (cartData.items) {
      subtotal = cartData.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
    }
    
    const discount = cartData.discount || 0;
    const shippingCost = cartData.shippingCost || 0;
    const total = subtotal - discount + shippingCost;
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      shippingCost: Number(shippingCost.toFixed(2)),
      total: Number(total.toFixed(2))
    };
  },

  /**
   * Reserve inventory for order items
   * @param {Array} items - Order items
   * @returns {Promise<boolean>} Success status
   */
  async reserveInventory(items) {
    try {
      for (const item of items) {
        // This would typically update product inventory
        // For now, we'll just log the reservation
        strapi.log.info(`Reserving ${item.quantity} units of product ${item.productId}`);
        
        // In a real implementation, you would:
        // 1. Check current inventory
        // 2. Update available quantity
        // 3. Create inventory reservation record
        // 4. Set expiration time for reservation
      }
      
      return true;
    } catch (error) {
      strapi.log.error('Error reserving inventory:', error);
      return false;
    }
  },

  /**
   * Release inventory reservation
   * @param {Array} items - Order items
   * @returns {Promise<boolean>} Success status
   */
  async releaseInventory(items) {
    try {
      for (const item of items) {
        strapi.log.info(`Releasing ${item.quantity} units of product ${item.productId}`);
        
        // In a real implementation, you would:
        // 1. Find inventory reservation
        // 2. Return quantity to available inventory
        // 3. Delete reservation record
      }
      
      return true;
    } catch (error) {
      strapi.log.error('Error releasing inventory:', error);
      return false;
    }
  },

  /**
   * Send order confirmation email
   * @param {Object} order - Order data
   * @returns {Promise<boolean>} Success status
   */
  async sendOrderConfirmation(order) {
    try {
      // This would integrate with your email service
      strapi.log.info(`Sending order confirmation for order ${order.orderNumber} to ${order.user.email}`);
      
      // Example email content structure:
      const emailData = {
        to: order.user.email,
        subject: `Confirmación de pedido #${order.orderNumber}`,
        template: 'order-confirmation',
        data: {
          orderNumber: order.orderNumber,
          customerName: `${order.user.firstName} ${order.user.lastName}`,
          items: order.items,
          total: order.total,
          shippingAddress: order.shippingAddress,
          estimatedDelivery: order.estimatedDelivery
        }
      };
      
      // Send email using your preferred service (SendGrid, AWS SES, etc.)
      // await emailService.send(emailData);
      
      return true;
    } catch (error) {
      strapi.log.error('Error sending order confirmation:', error);
      return false;
    }
  },

  /**
   * Send payment notification
   * @param {Object} order - Order data
   * @param {string} status - Payment status
   * @returns {Promise<boolean>} Success status
   */
  async sendPaymentNotification(order, status) {
    try {
      const statusMessages = {
        'PAID': 'confirmado',
        'PAYMENT_FAILED': 'rechazado',
        'REFUNDED': 'reembolsado'
      };
      
      const statusMessage = statusMessages[status] || 'actualizado';
      
      strapi.log.info(`Sending payment notification for order ${order.orderNumber}: ${statusMessage}`);
      
      // Send notification email/SMS/push notification
      // Implementation would depend on your notification service
      
      return true;
    } catch (error) {
      strapi.log.error('Error sending payment notification:', error);
      return false;
    }
  },

  /**
   * Get order statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Order statistics
   */
  async getOrderStats(userId) {
    try {
      const orders = await strapi.entityService.findMany('api::order.order', {
        filters: { user: userId },
        populate: false
      });
      
      const stats = {
        totalOrders: orders.length,
        totalSpent: 0,
        ordersByStatus: {
          CREATED: 0,
          PAYMENT_PENDING: 0,
          PAID: 0,
          PROCESSING: 0,
          SHIPPED: 0,
          DELIVERED: 0,
          CANCELLED: 0,
          REFUNDED: 0
        }
      };
      
      orders.forEach(order => {
        if (order.status === 'PAID' || order.status === 'PROCESSING' || 
            order.status === 'SHIPPED' || order.status === 'DELIVERED') {
          stats.totalSpent += order.total;
        }
        
        stats.ordersByStatus[order.status] = (stats.ordersByStatus[order.status] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      strapi.log.error('Error calculating order stats:', error);
      throw error;
    }
  }
}));