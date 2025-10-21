/**
 * Payment service for Tifossi Expo
 * Business logic for payment processing
 */

import { OrderStatus } from '../../../lib/payment/types/orders';

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  street: string;
  city: string;
  country: string;
  postalCode?: string;
  state?: string;
}

interface CartUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface CartData {
  items: CartItem[];
  user: CartUser;
  shippingAddress: ShippingAddress;
  total: number;
  discount?: number;
  shippingCost?: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface CalculatedTotals {
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
}

interface Order {
  orderNumber: string;
  user: CartUser;
  items: CartItem[];
  total: number;
  shippingAddress: ShippingAddress;
  status: string;
  estimatedDelivery?: Date;
}

interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  ordersByStatus: Record<OrderStatus, number>;
}

/**
 * Payment utilities service
 * Provides helper functions for payment and order processing
 */
export class PaymentService {
  private strapi: any;

  constructor(strapi: any) {
    this.strapi = strapi;
  }

  /**
   * Generate unique order number
   * @returns {string} Formatted order number
   */
  generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6); // Last 6 digits of timestamp

    return `TIF-${year}${month}${day}-${timestamp}`;
  }

  /**
   * Validate cart data before order creation
   * @param {Object} cartData - Cart data to validate
   * @returns {Object} Validation result
   */
  async validateCartData(cartData: CartData): Promise<ValidationResult> {
    const errors: string[] = [];

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
            const product = await this.strapi.documents('api::product.product').findOne({
              documentId: item.productId,
            });
            if (!product) {
              errors.push(`Item ${i + 1}: Product not found`);
            } else if (!product.available) {
              errors.push(`Item ${i + 1}: Product is not available`);
            }
          } catch (_error) {
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
      errors,
    };
  }

  /**
   * Calculate order totals
   * @param {Object} cartData - Cart data
   * @returns {Object} Calculated totals
   */
  calculateTotals(cartData: CartData): CalculatedTotals {
    let subtotal = 0;

    // Calculate subtotal from items
    if (cartData.items) {
      subtotal = cartData.items.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0);
    }

    const discount = cartData.discount || 0;
    const shippingCost = cartData.shippingCost || 0;
    const total = subtotal - discount + shippingCost;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      shippingCost: Number(shippingCost.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  /**
   * Reserve inventory for order items
   * @param {Array} items - Order items
   * @returns {Promise<boolean>} Success status
   */
  async reserveInventory(items: CartItem[]): Promise<boolean> {
    try {
      for (const item of items) {
        // This would typically update product inventory
        // For now, we'll just log the reservation
        this.strapi.log.info(`Reserving ${item.quantity} units of product ${item.productId}`);

        // In a real implementation, you would:
        // 1. Check current inventory
        // 2. Update available quantity
        // 3. Create inventory reservation record
        // 4. Set expiration time for reservation
      }

      return true;
    } catch (error) {
      this.strapi.log.error('Error reserving inventory:', error);
      return false;
    }
  }

  /**
   * Release inventory reservation
   * @param {Array} items - Order items
   * @returns {Promise<boolean>} Success status
   */
  async releaseInventory(items: CartItem[]): Promise<boolean> {
    try {
      for (const item of items) {
        this.strapi.log.info(`Releasing ${item.quantity} units of product ${item.productId}`);

        // In a real implementation, you would:
        // 1. Find inventory reservation
        // 2. Return quantity to available inventory
        // 3. Delete reservation record
      }

      return true;
    } catch (error) {
      this.strapi.log.error('Error releasing inventory:', error);
      return false;
    }
  }

  /**
   * Send order confirmation email
   * @param {Object} order - Order data
   * @returns {Promise<boolean>} Success status
   */
  async sendOrderConfirmation(order: Order): Promise<boolean> {
    try {
      // This would integrate with your email service
      this.strapi.log.info(
        `Sending order confirmation for order ${order.orderNumber} to ${order.user.email}`
      );

      // Example email content structure:
      const _emailData = {
        to: order.user.email,
        subject: `Confirmación de pedido #${order.orderNumber}`,
        template: 'order-confirmation',
        data: {
          orderNumber: order.orderNumber,
          customerName: `${order.user.firstName} ${order.user.lastName}`,
          items: order.items,
          total: order.total,
          shippingAddress: order.shippingAddress,
          estimatedDelivery: order.estimatedDelivery,
        },
      };

      // Send email using your preferred service (SendGrid, AWS SES, etc.)
      // await emailService.send(_emailData);

      return true;
    } catch (error) {
      this.strapi.log.error('Error sending order confirmation:', error);
      return false;
    }
  }

  /**
   * Send payment notification
   * @param {Object} order - Order data
   * @param {string} status - Payment status
   * @returns {Promise<boolean>} Success status
   */
  async sendPaymentNotification(order: Order, status: string): Promise<boolean> {
    try {
      const statusMessages: Record<string, string> = {
        paid: 'confirmado',
        refunded: 'reembolsado',
        cancelled: 'cancelado',
      };

      const statusMessage = statusMessages[status] || 'actualizado';

      this.strapi.log.info(
        `Sending payment notification for order ${order.orderNumber}: ${statusMessage}`
      );

      // Send notification email/SMS/push notification
      // Implementation would depend on your notification service

      return true;
    } catch (error) {
      this.strapi.log.error('Error sending payment notification:', error);
      return false;
    }
  }

  /**
   * Get order statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Order statistics
   */
  async getOrderStats(userId: string): Promise<OrderStats> {
    try {
      const orders = await this.strapi.documents('api::order.order').findMany({
        filters: { user: userId },
        populate: false,
      });

      const stats: OrderStats = {
        totalOrders: orders.length,
        totalSpent: 0,
        ordersByStatus: {
          [OrderStatus.PENDING]: 0,
          [OrderStatus.PROCESSING]: 0,
          [OrderStatus.PAID]: 0,
          [OrderStatus.SHIPPED]: 0,
          [OrderStatus.DELIVERED]: 0,
          [OrderStatus.CANCELLED]: 0,
          [OrderStatus.REFUNDED]: 0,
        },
      };

      orders.forEach((order: any) => {
        if (
          order.status === 'paid' ||
          order.status === 'processing' ||
          order.status === 'shipped' ||
          order.status === 'delivered'
        ) {
          stats.totalSpent += order.total;
        }

        const status = order.status as keyof typeof stats.ordersByStatus;
        if (status in stats.ordersByStatus) {
          stats.ordersByStatus[status] = (stats.ordersByStatus[status] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      this.strapi.log.error('Error calculating order stats:', error);
      throw error;
    }
  }
}

// Export default for Strapi to load
export default {};
