/**
 * Payment Validator
 * Validates payment data and business rules
 * Tifossi Expo E-commerce Platform
 */

class PaymentValidator {
  constructor() {
    this.supportedCurrencies = ['UYU']; // Uruguay Peso
    this.maxOrderAmount = 1000000; // Maximum order amount in UYU
    this.minOrderAmount = 1; // Minimum order amount in UYU
    this.maxItems = 50; // Maximum items per order
    this.maxInstallments = 12; // Maximum installments allowed
  }

  /**
   * Validate complete order data for payment processing
   * @param {Object} orderData - Order data to validate
   * @returns {Object} Validation result
   */
  validateOrderForPayment(orderData) {
    const errors = [];
    const warnings = [];

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
      
      // Business rules validation
      this.validateBusinessRules(orderData, errors, warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        orderNumber: orderData.orderNumber,
        totalAmount: this.calculateTotalAmount(orderData),
        validatedAt: new Date().toISOString()
      };

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      return {
        isValid: false,
        errors,
        warnings,
        validatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Validate basic order data structure
   * @param {Object} orderData - Order data
   * @param {Array} errors - Errors array
   */
  validateBasicOrderData(orderData, errors) {
    // Required fields
    if (!orderData) {
      errors.push('Order data is required');
      return;
    }

    if (!orderData.orderNumber) {
      errors.push('Order number is required');
    } else if (typeof orderData.orderNumber !== 'string' || orderData.orderNumber.trim().length === 0) {
      errors.push('Order number must be a non-empty string');
    }

    if (!orderData.id) {
      errors.push('Order ID is required');
    }

    if (!orderData.items || !Array.isArray(orderData.items)) {
      errors.push('Order items must be an array');
    } else if (orderData.items.length === 0) {
      errors.push('Order must have at least one item');
    } else if (orderData.items.length > this.maxItems) {
      errors.push(`Order cannot have more than ${this.maxItems} items`);
    }

    if (!orderData.user) {
      errors.push('User information is required');
    }

    if (!orderData.shippingMethod || !['delivery', 'pickup'].includes(orderData.shippingMethod)) {
      errors.push('Valid shipping method (delivery or pickup) is required');
    }
  }

  /**
   * Validate user data
   * @param {Object} userData - User data
   * @param {Array} errors - Errors array
   */
  validateUserData(userData, errors) {
    if (!userData) {
      errors.push('User data is required');
      return;
    }

    // Required user fields
    if (!userData.id) {
      errors.push('User ID is required');
    }

    if (!userData.email) {
      errors.push('User email is required');
    } else if (!this.isValidEmail(userData.email)) {
      errors.push('Invalid user email format');
    }

    if (!userData.firstName || userData.firstName.trim().length === 0) {
      errors.push('User first name is required');
    } else if (userData.firstName.length > 30) {
      errors.push('User first name is too long (max 30 characters)');
    }

    if (!userData.lastName || userData.lastName.trim().length === 0) {
      errors.push('User last name is required');
    } else if (userData.lastName.length > 30) {
      errors.push('User last name is too long (max 30 characters)');
    }

    // Optional field validation
    if (userData.phone) {
      this.validatePhoneNumber(userData.phone, errors);
    }

    if (userData.identification) {
      this.validateIdentification(userData.identification, errors);
    }
  }

  /**
   * Validate phone number format
   * @param {Object} phone - Phone object
   * @param {Array} errors - Errors array
   */
  validatePhoneNumber(phone, errors) {
    if (typeof phone !== 'object') {
      errors.push('Phone must be an object with areaCode and number');
      return;
    }

    if (!phone.number || typeof phone.number !== 'string') {
      errors.push('Phone number is required and must be a string');
    } else {
      const cleanNumber = phone.number.replace(/\D/g, '');
      if (cleanNumber.length < 7 || cleanNumber.length > 15) {
        errors.push('Phone number must be between 7 and 15 digits');
      }
    }

    if (phone.areaCode && typeof phone.areaCode !== 'string') {
      errors.push('Phone area code must be a string');
    }
  }

  /**
   * Validate identification document
   * @param {Object} identification - Identification object
   * @param {Array} errors - Errors array
   */
  validateIdentification(identification, errors) {
    if (typeof identification !== 'object') {
      errors.push('Identification must be an object with type and number');
      return;
    }

    const validTypes = ['CI', 'CE', 'RUT', 'DNI', 'PASSPORT'];
    if (!identification.type || !validTypes.includes(identification.type)) {
      errors.push(`Identification type must be one of: ${validTypes.join(', ')}`);
    }

    if (!identification.number || typeof identification.number !== 'string') {
      errors.push('Identification number is required and must be a string');
    } else {
      const cleanNumber = identification.number.replace(/\D/g, '');
      if (cleanNumber.length < 6 || cleanNumber.length > 20) {
        errors.push('Identification number must be between 6 and 20 digits');
      }
    }
  }

  /**
   * Validate order items
   * @param {Array} items - Order items
   * @param {Array} errors - Errors array
   * @param {Array} warnings - Warnings array
   */
  validateOrderItems(items, errors, warnings) {
    if (!Array.isArray(items)) {
      errors.push('Items must be an array');
      return;
    }

    items.forEach((item, index) => {
      this.validateSingleItem(item, index, errors, warnings);
    });

    // Check for duplicate products
    const productIds = items.map(item => item.productId);
    const duplicates = productIds.filter((id, index) => productIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      warnings.push(`Duplicate products found: ${duplicates.join(', ')}`);
    }
  }

  /**
   * Validate single order item
   * @param {Object} item - Order item
   * @param {number} index - Item index
   * @param {Array} errors - Errors array
   * @param {Array} warnings - Warnings array
   */
  validateSingleItem(item, index, errors, warnings) {
    const itemPrefix = `Item ${index + 1}`;

    // Required fields
    if (!item.productId) {
      errors.push(`${itemPrefix}: Product ID is required`);
    }

    if (!item.productName || typeof item.productName !== 'string') {
      errors.push(`${itemPrefix}: Product name is required and must be a string`);
    } else if (item.productName.length > 256) {
      errors.push(`${itemPrefix}: Product name is too long (max 256 characters)`);
    }

    if (!item.quantity || typeof item.quantity !== 'number') {
      errors.push(`${itemPrefix}: Quantity is required and must be a number`);
    } else if (item.quantity <= 0) {
      errors.push(`${itemPrefix}: Quantity must be positive`);
    } else if (item.quantity > 99) {
      errors.push(`${itemPrefix}: Quantity cannot exceed 99`);
    } else if (!Number.isInteger(item.quantity)) {
      errors.push(`${itemPrefix}: Quantity must be a whole number`);
    }

    if (!item.price || typeof item.price !== 'number') {
      errors.push(`${itemPrefix}: Price is required and must be a number`);
    } else if (item.price <= 0) {
      errors.push(`${itemPrefix}: Price must be positive`);
    } else if (item.price > 100000) {
      warnings.push(`${itemPrefix}: Price is very high (${item.price})`);
    }

    // Optional fields validation
    if (item.description && item.description.length > 600) {
      errors.push(`${itemPrefix}: Description is too long (max 600 characters)`);
    }

    if (item.categoryId && typeof item.categoryId !== 'string') {
      errors.push(`${itemPrefix}: Category ID must be a string`);
    }

    if (item.imageUrl && !this.isValidUrl(item.imageUrl)) {
      warnings.push(`${itemPrefix}: Invalid image URL format`);
    }

    // Validate item total
    const itemTotal = item.quantity * item.price;
    if (itemTotal > 50000) {
      warnings.push(`${itemPrefix}: Item total is very high (${itemTotal})`);
    }
  }

  /**
   * Validate financial data
   * @param {Object} orderData - Order data
   * @param {Array} errors - Errors array
   * @param {Array} warnings - Warnings array
   */
  validateFinancialData(orderData, errors, warnings) {
    // Calculate and validate totals
    const itemsTotal = this.calculateItemsTotal(orderData.items);
    const shippingCost = orderData.shippingCost || 0;
    const discount = orderData.discount || 0;
    const calculatedTotal = itemsTotal + shippingCost - discount;

    // Validate shipping cost
    if (shippingCost < 0) {
      errors.push('Shipping cost cannot be negative');
    } else if (shippingCost > 5000) {
      warnings.push(`Shipping cost is very high (${shippingCost})`);
    }

    // Validate discount
    if (discount < 0) {
      errors.push('Discount cannot be negative');
    } else if (discount > itemsTotal) {
      errors.push('Discount cannot exceed items total');
    } else if (discount > itemsTotal * 0.5) {
      warnings.push(`Discount is very high (${discount})`);
    }

    // Validate total amount
    if (calculatedTotal < this.minOrderAmount) {
      errors.push(`Order total (${calculatedTotal}) is below minimum (${this.minOrderAmount})`);
    } else if (calculatedTotal > this.maxOrderAmount) {
      errors.push(`Order total (${calculatedTotal}) exceeds maximum (${this.maxOrderAmount})`);
    }

    // Check if provided total matches calculated total
    if (orderData.total && Math.abs(orderData.total - calculatedTotal) > 0.01) {
      errors.push(`Provided total (${orderData.total}) does not match calculated total (${calculatedTotal})`);
    }

    // Validate currency
    if (orderData.currency && !this.supportedCurrencies.includes(orderData.currency)) {
      errors.push(`Unsupported currency: ${orderData.currency}. Supported: ${this.supportedCurrencies.join(', ')}`);
    }
  }

  /**
   * Validate shipping data
   * @param {Object} orderData - Order data
   * @param {Array} errors - Errors array
   */
  validateShippingData(orderData, errors) {
    if (orderData.shippingMethod === 'delivery') {
      this.validateDeliveryAddress(orderData.shippingAddress, errors);
    } else if (orderData.shippingMethod === 'pickup') {
      this.validatePickupLocation(orderData.pickupLocation, errors);
    }
  }

  /**
   * Validate delivery address
   * @param {Object} address - Shipping address
   * @param {Array} errors - Errors array
   */
  validateDeliveryAddress(address, errors) {
    if (!address) {
      errors.push('Shipping address is required for delivery orders');
      return;
    }

    if (!address.street || typeof address.street !== 'string' || address.street.trim().length === 0) {
      errors.push('Street address is required');
    } else if (address.street.length > 100) {
      errors.push('Street address is too long (max 100 characters)');
    }

    if (!address.city || typeof address.city !== 'string' || address.city.trim().length === 0) {
      errors.push('City is required');
    }

    if (!address.department || typeof address.department !== 'string') {
      errors.push('Department/State is required');
    }

    if (address.number && typeof address.number !== 'string') {
      errors.push('Street number must be a string');
    }

    if (address.zipCode) {
      if (typeof address.zipCode !== 'string') {
        errors.push('ZIP code must be a string');
      } else if (!/^\d{5}$/.test(address.zipCode)) {
        errors.push('ZIP code must be 5 digits');
      }
    }
  }

  /**
   * Validate pickup location
   * @param {Object} pickup - Pickup location
   * @param {Array} errors - Errors array
   */
  validatePickupLocation(pickup, errors) {
    if (!pickup) {
      errors.push('Pickup location is required for pickup orders');
      return;
    }

    if (!pickup.id) {
      errors.push('Pickup location ID is required');
    }

    if (!pickup.name || typeof pickup.name !== 'string') {
      errors.push('Pickup location name is required');
    }

    if (!pickup.address || typeof pickup.address !== 'string') {
      errors.push('Pickup location address is required');
    }
  }

  /**
   * Validate business rules
   * @param {Object} orderData - Order data
   * @param {Array} errors - Errors array
   * @param {Array} warnings - Warnings array
   */
  validateBusinessRules(orderData, errors, warnings) {
    // Check for business hours (if applicable)
    this.validateBusinessHours(warnings);
    
    // Validate user account status
    this.validateUserAccountStatus(orderData.user, errors, warnings);
    
    // Check for suspicious patterns
    this.validateSuspiciousPatterns(orderData, warnings);
  }

  /**
   * Validate business hours
   * @param {Array} warnings - Warnings array
   */
  validateBusinessHours(warnings) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Example business rules
    if (day === 0 || day === 6) {
      warnings.push('Order placed on weekend - processing may be delayed');
    }
    
    if (hour < 8 || hour > 20) {
      warnings.push('Order placed outside business hours - processing may be delayed');
    }
  }

  /**
   * Validate user account status
   * @param {Object} user - User data
   * @param {Array} errors - Errors array
   * @param {Array} warnings - Warnings array
   */
  validateUserAccountStatus(user, errors, warnings) {
    if (user.isBlocked) {
      errors.push('User account is blocked');
    }
    
    if (user.isNew) {
      warnings.push('New user account - additional verification may be required');
    }
    
    if (user.hasPaymentIssues) {
      warnings.push('User has previous payment issues');
    }
  }

  /**
   * Validate for suspicious patterns
   * @param {Object} orderData - Order data
   * @param {Array} warnings - Warnings array
   */
  validateSuspiciousPatterns(orderData, warnings) {
    const total = this.calculateTotalAmount(orderData);
    
    // High value order
    if (total > 50000) {
      warnings.push('High value order - manual review recommended');
    }
    
    // Large quantity of same item
    orderData.items.forEach(item => {
      if (item.quantity > 10) {
        warnings.push(`Large quantity of ${item.productName} (${item.quantity})`);
      }
    });
    
    // Unusual shipping patterns
    if (orderData.shippingMethod === 'pickup' && total > 20000) {
      warnings.push('High value pickup order - verification recommended');
    }
  }

  /**
   * Calculate total amount from order data
   * @param {Object} orderData - Order data
   * @returns {number} Total amount
   */
  calculateTotalAmount(orderData) {
    const itemsTotal = this.calculateItemsTotal(orderData.items);
    const shippingCost = orderData.shippingCost || 0;
    const discount = orderData.discount || 0;
    
    return Math.round((itemsTotal + shippingCost - discount) * 100) / 100;
  }

  /**
   * Calculate items total
   * @param {Array} items - Order items
   * @returns {number} Items total
   */
  calculateItemsTotal(items) {
    return items.reduce((total, item) => {
      return total + (item.quantity * item.price);
    }, 0);
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid URL
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate payment preference data
   * @param {Object} preference - MercadoPago preference data
   * @returns {Object} Validation result
   */
  validatePaymentPreference(preference) {
    const errors = [];
    
    if (!preference) {
      errors.push('Preference data is required');
      return { isValid: false, errors };
    }

    // Validate required fields
    if (!preference.items || !Array.isArray(preference.items) || preference.items.length === 0) {
      errors.push('Preference must have at least one item');
    }

    if (!preference.external_reference) {
      errors.push('External reference is required');
    }

    if (!preference.payer || !preference.payer.email) {
      errors.push('Payer email is required');
    }

    // Validate items
    if (preference.items) {
      preference.items.forEach((item, index) => {
        if (!item.title || !item.quantity || !item.unit_price) {
          errors.push(`Item ${index + 1} is missing required fields`);
        }
        
        if (item.quantity <= 0) {
          errors.push(`Item ${index + 1} quantity must be positive`);
        }
        
        if (item.unit_price <= 0) {
          errors.push(`Item ${index + 1} unit_price must be positive`);
        }
      });
    }

    // Validate URLs
    if (preference.back_urls) {
      ['success', 'failure', 'pending'].forEach(type => {
        if (preference.back_urls[type] && !this.isValidUrl(preference.back_urls[type])) {
          errors.push(`Invalid ${type} back URL`);
        }
      });
    }

    if (preference.notification_url && !this.isValidUrl(preference.notification_url)) {
      errors.push('Invalid notification URL');
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedAt: new Date().toISOString()
    };
  }

  /**
   * Validate webhook data
   * @param {Object} webhookData - Webhook payload
   * @returns {Object} Validation result
   */
  validateWebhookData(webhookData) {
    const errors = [];
    
    if (!webhookData) {
      errors.push('Webhook data is required');
      return { isValid: false, errors };
    }

    // Required fields
    if (!webhookData.type) {
      errors.push('Webhook type is required');
    } else if (!['payment', 'merchant_order'].includes(webhookData.type)) {
      errors.push(`Unsupported webhook type: ${webhookData.type}`);
    }

    if (!webhookData.data || !webhookData.data.id) {
      errors.push('Webhook data ID is required');
    }

    // Validate dates
    if (webhookData.date_created && !this.isValidISODate(webhookData.date_created)) {
      errors.push('Invalid date_created format');
    }

    // Validate action
    if (webhookData.action && typeof webhookData.action !== 'string') {
      errors.push('Webhook action must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedAt: new Date().toISOString()
    };
  }

  /**
   * Validate ISO date string
   * @param {string} dateString - Date string to validate
   * @returns {boolean} True if valid ISO date
   */
  isValidISODate(dateString) {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString === date.toISOString();
  }

  /**
   * Get validation summary
   * @param {Object} validationResult - Validation result
   * @returns {string} Human-readable summary
   */
  getValidationSummary(validationResult) {
    if (validationResult.isValid) {
      const warningText = validationResult.warnings?.length > 0 
        ? ` (${validationResult.warnings.length} warnings)` 
        : '';
      return `Validation passed${warningText}`;
    } else {
      return `Validation failed with ${validationResult.errors.length} errors`;
    }
  }
}

module.exports = PaymentValidator;