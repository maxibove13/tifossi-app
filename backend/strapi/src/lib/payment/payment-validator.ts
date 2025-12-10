/**
 * Payment Validator
 * Validates payment data and business rules
 * Tifossi Expo E-commerce Platform
 */

interface OrderUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant?: string;
}

interface ShippingData {
  method: 'delivery' | 'pickup';
  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  pickupLocation?: string;
  estimatedDate?: string;
}

interface OrderData {
  user: OrderUser;
  items: OrderItem[];
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  taxes?: number;
  discount?: number;
  currency: string;
  shipping: ShippingData;
  installments?: number;
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export class PaymentValidator {
  private readonly supportedCurrencies: string[] = ['UYU']; // Uruguay Peso
  private readonly maxOrderAmount: number = 1000000; // Maximum order amount in UYU
  private readonly minOrderAmount: number = 1; // Minimum order amount in UYU
  private readonly maxItems: number = 50; // Maximum items per order
  private readonly maxInstallments: number = 12; // Maximum installments allowed

  /**
   * Validate complete order data for payment processing
   */
  validateOrderForPayment(orderData: OrderData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    try {
      // Basic order validation
      this.validateBasicOrderData(orderData, errors);

      // User validation
      this.validateUserData(orderData.user, errors);

      // Items validation
      this.validateOrderItems(orderData.items, errors, warnings);

      // Financial validation
      this.validateFinancialData(orderData, errors, warnings);

      // Shipping validation
      this.validateShippingData(orderData, errors);

      // Installments validation
      if (orderData.installments) {
        this.validateInstallments(orderData.installments, orderData.totalAmount, errors);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push({
        field: 'general',
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'VALIDATION_ERROR',
      });

      return {
        valid: false,
        errors,
        warnings,
      };
    }
  }

  /**
   * Validate basic order structure
   */
  private validateBasicOrderData(orderData: OrderData, errors: ValidationError[]): void {
    if (!orderData) {
      errors.push({
        field: 'orderData',
        message: 'Order data is required',
        code: 'MISSING_ORDER_DATA',
      });
      return;
    }

    if (!orderData.currency) {
      errors.push({
        field: 'currency',
        message: 'Currency is required',
        code: 'MISSING_CURRENCY',
      });
    } else if (!this.supportedCurrencies.includes(orderData.currency)) {
      errors.push({
        field: 'currency',
        message: `Currency ${orderData.currency} is not supported. Supported currencies: ${this.supportedCurrencies.join(', ')}`,
        code: 'INVALID_CURRENCY',
      });
    }
  }

  /**
   * Validate user data
   */
  private validateUserData(user: OrderUser, errors: ValidationError[]): void {
    if (!user) {
      errors.push({
        field: 'user',
        message: 'User data is required',
        code: 'MISSING_USER',
      });
      return;
    }

    if (!user.id) {
      errors.push({
        field: 'user.id',
        message: 'User ID is required',
        code: 'MISSING_USER_ID',
      });
    }

    if (!user.email) {
      errors.push({
        field: 'user.email',
        message: 'User email is required',
        code: 'MISSING_USER_EMAIL',
      });
    } else if (!this.isValidEmail(user.email)) {
      errors.push({
        field: 'user.email',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }
  }

  /**
   * Validate order items
   */
  private validateOrderItems(
    items: OrderItem[],
    errors: ValidationError[],
    warnings: string[]
  ): void {
    if (!items || !Array.isArray(items)) {
      errors.push({
        field: 'items',
        message: 'Order items are required',
        code: 'MISSING_ITEMS',
      });
      return;
    }

    if (items.length === 0) {
      errors.push({
        field: 'items',
        message: 'At least one item is required',
        code: 'EMPTY_ITEMS',
      });
      return;
    }

    if (items.length > this.maxItems) {
      errors.push({
        field: 'items',
        message: `Maximum ${this.maxItems} items allowed per order`,
        code: 'TOO_MANY_ITEMS',
      });
    }

    items.forEach((item, index) => {
      this.validateSingleItem(item, index, errors, warnings);
    });
  }

  /**
   * Validate a single order item
   */
  private validateSingleItem(
    item: OrderItem,
    index: number,
    errors: ValidationError[],
    warnings: string[]
  ): void {
    const fieldPrefix = `items[${index}]`;

    if (!item.productId) {
      errors.push({
        field: `${fieldPrefix}.productId`,
        message: 'Product ID is required',
        code: 'MISSING_PRODUCT_ID',
      });
    }

    if (!item.productName) {
      errors.push({
        field: `${fieldPrefix}.productName`,
        message: 'Product name is required',
        code: 'MISSING_PRODUCT_NAME',
      });
    }

    if (!item.quantity || item.quantity < 1) {
      errors.push({
        field: `${fieldPrefix}.quantity`,
        message: 'Quantity must be at least 1',
        code: 'INVALID_QUANTITY',
      });
    } else if (item.quantity > 100) {
      warnings.push(`Item ${index + 1}: Large quantity (${item.quantity}) detected`);
    }

    if (item.unitPrice === undefined || item.unitPrice < 0) {
      errors.push({
        field: `${fieldPrefix}.unitPrice`,
        message: 'Unit price must be non-negative',
        code: 'INVALID_UNIT_PRICE',
      });
    }

    if (item.totalPrice === undefined || item.totalPrice < 0) {
      errors.push({
        field: `${fieldPrefix}.totalPrice`,
        message: 'Total price must be non-negative',
        code: 'INVALID_TOTAL_PRICE',
      });
    }

    // Verify price calculation
    if (item.quantity && item.unitPrice !== undefined && item.totalPrice !== undefined) {
      const expectedTotal = item.quantity * item.unitPrice;
      if (Math.abs(expectedTotal - item.totalPrice) > 0.01) {
        errors.push({
          field: `${fieldPrefix}.totalPrice`,
          message: `Total price mismatch. Expected ${expectedTotal}, got ${item.totalPrice}`,
          code: 'PRICE_CALCULATION_ERROR',
        });
      }
    }
  }

  /**
   * Validate financial data
   */
  private validateFinancialData(
    orderData: OrderData,
    errors: ValidationError[],
    warnings: string[]
  ): void {
    const { totalAmount, subtotal, shippingCost, taxes, discount } = orderData;

    // Validate total amount
    if (totalAmount === undefined || totalAmount < this.minOrderAmount) {
      errors.push({
        field: 'totalAmount',
        message: `Total amount must be at least ${this.minOrderAmount} ${orderData.currency}`,
        code: 'AMOUNT_TOO_LOW',
      });
    } else if (totalAmount > this.maxOrderAmount) {
      errors.push({
        field: 'totalAmount',
        message: `Total amount exceeds maximum of ${this.maxOrderAmount} ${orderData.currency}`,
        code: 'AMOUNT_TOO_HIGH',
      });
    }

    // Validate subtotal
    if (subtotal === undefined || subtotal < 0) {
      errors.push({
        field: 'subtotal',
        message: 'Subtotal must be non-negative',
        code: 'INVALID_SUBTOTAL',
      });
    }

    // Validate shipping cost
    if (shippingCost === undefined || shippingCost < 0) {
      errors.push({
        field: 'shippingCost',
        message: 'Shipping cost must be non-negative',
        code: 'INVALID_SHIPPING_COST',
      });
    }

    // Validate taxes if present
    if (taxes !== undefined && taxes < 0) {
      errors.push({
        field: 'taxes',
        message: 'Taxes must be non-negative',
        code: 'INVALID_TAXES',
      });
    }

    // Validate discount if present
    if (discount !== undefined) {
      if (discount < 0) {
        errors.push({
          field: 'discount',
          message: 'Discount must be non-negative',
          code: 'INVALID_DISCOUNT',
        });
      } else if (discount > subtotal) {
        errors.push({
          field: 'discount',
          message: 'Discount cannot exceed subtotal',
          code: 'DISCOUNT_EXCEEDS_SUBTOTAL',
        });
      }
    }

    // Verify total calculation
    const calculatedTotal = subtotal + shippingCost + (taxes || 0) - (discount || 0);
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      warnings.push(
        `Total amount mismatch. Calculated: ${calculatedTotal}, Provided: ${totalAmount}`
      );
    }
  }

  /**
   * Validate shipping data
   */
  private validateShippingData(orderData: OrderData, errors: ValidationError[]): void {
    const { shipping } = orderData;

    if (!shipping) {
      errors.push({
        field: 'shipping',
        message: 'Shipping data is required',
        code: 'MISSING_SHIPPING',
      });
      return;
    }

    if (!shipping.method) {
      errors.push({
        field: 'shipping.method',
        message: 'Shipping method is required',
        code: 'MISSING_SHIPPING_METHOD',
      });
    } else if (!['delivery', 'pickup'].includes(shipping.method)) {
      errors.push({
        field: 'shipping.method',
        message: 'Invalid shipping method. Must be "delivery" or "pickup"',
        code: 'INVALID_SHIPPING_METHOD',
      });
    }

    // Validate delivery address
    if (shipping.method === 'delivery') {
      if (!shipping.address) {
        errors.push({
          field: 'shipping.address',
          message: 'Delivery address is required for delivery method',
          code: 'MISSING_DELIVERY_ADDRESS',
        });
      } else {
        this.validateAddress(shipping.address, errors);
      }
    }

    // Validate pickup location
    if (shipping.method === 'pickup') {
      if (!shipping.pickupLocation) {
        errors.push({
          field: 'shipping.pickupLocation',
          message: 'Pickup location is required for pickup method',
          code: 'MISSING_PICKUP_LOCATION',
        });
      }
    }
  }

  /**
   * Validate address data
   */
  private validateAddress(
    address: NonNullable<ShippingData['address']>,
    errors: ValidationError[]
  ): void {
    const requiredFields = ['addressLine1', 'city', 'state', 'postalCode', 'country'];

    requiredFields.forEach((field) => {
      if (!address[field as keyof typeof address]) {
        errors.push({
          field: `shipping.address.${field}`,
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
          code: `MISSING_ADDRESS_${field.toUpperCase()}`,
        });
      }
    });

    // Validate Uruguay specific requirements
    if (address.country && address.country !== 'Uruguay' && address.country !== 'UY') {
      errors.push({
        field: 'shipping.address.country',
        message: 'Currently only shipping to Uruguay is supported',
        code: 'UNSUPPORTED_COUNTRY',
      });
    }

    // Validate postal code format for Uruguay (5 digits)
    if (address.postalCode && !/^\d{5}$/.test(address.postalCode)) {
      errors.push({
        field: 'shipping.address.postalCode',
        message: 'Uruguay postal code must be 5 digits',
        code: 'INVALID_POSTAL_CODE',
      });
    }
  }

  /**
   * Validate installments configuration
   */
  private validateInstallments(
    installments: number,
    totalAmount: number,
    errors: ValidationError[]
  ): void {
    if (!Number.isInteger(installments) || installments < 1) {
      errors.push({
        field: 'installments',
        message: 'Installments must be a positive integer',
        code: 'INVALID_INSTALLMENTS',
      });
      return;
    }

    if (installments > this.maxInstallments) {
      errors.push({
        field: 'installments',
        message: `Maximum ${this.maxInstallments} installments allowed`,
        code: 'EXCESSIVE_INSTALLMENTS',
      });
    }

    // Minimum amount per installment (business rule)
    const minAmountPerInstallment = 100; // UYU
    const amountPerInstallment = totalAmount / installments;

    if (amountPerInstallment < minAmountPerInstallment) {
      errors.push({
        field: 'installments',
        message: `Each installment must be at least ${minAmountPerInstallment} ${this.supportedCurrencies[0]}`,
        code: 'INSTALLMENT_AMOUNT_TOO_LOW',
      });
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!payload || !signature || !secret) {
      return false;
    }

    try {
      const crypto = require('crypto');
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (error) {
      strapi?.log?.error?.('Error validating webhook signature:', error);
      return false;
    }
  }

  /**
   * Validate payment notification data from MercadoPago
   */
  validatePaymentNotification(notification: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (!notification) {
      errors.push({
        field: 'notification',
        message: 'Notification data is required',
        code: 'MISSING_NOTIFICATION',
      });
    } else {
      if (!notification.id) {
        errors.push({
          field: 'notification.id',
          message: 'Notification ID is required',
          code: 'MISSING_NOTIFICATION_ID',
        });
      }

      if (!notification.type) {
        errors.push({
          field: 'notification.type',
          message: 'Notification type is required',
          code: 'MISSING_NOTIFICATION_TYPE',
        });
      }

      if (!notification.data || !notification.data.id) {
        errors.push({
          field: 'notification.data.id',
          message: 'Payment ID is required in notification data',
          code: 'MISSING_PAYMENT_ID',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Helper: Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Helper: Sanitize amount for MercadoPago
   */
  sanitizeAmount(amount: number): number {
    // MercadoPago requires amounts with maximum 2 decimal places
    return Math.round(amount * 100) / 100;
  }

  /**
   * Helper: Format validation errors for response
   */
  formatValidationErrors(errors: ValidationError[]): string {
    return errors.map((error) => `${error.field}: ${error.message}`).join('; ');
  }
}

// Export singleton instance for backward compatibility
export default new PaymentValidator();
