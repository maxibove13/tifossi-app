/**
 * Payment Preference Builder
 * Builds MercadoPago payment preferences from order data
 * Tifossi Expo E-commerce Platform
 */

class PreferenceBuilder {
  constructor(config = {}) {
    this.config = {
      currency: 'UYU',
      maxInstallments: 12,
      expirationMinutes: 30,
      autoReturn: 'approved',
      binaryMode: false,
      ...config
    };
    
    this.baseUrl = process.env.API_BASE_URL;
    this.appScheme = process.env.APP_SCHEME || 'tifossi';
  }

  /**
   * Build complete preference from order data
   * @param {Object} orderData - Order information
   * @returns {Object} MercadoPago preference object
   */
  build(orderData) {
    this.validateOrderData(orderData);

    return {
      items: this.buildItems(orderData),
      external_reference: orderData.orderNumber,
      description: this.buildDescription(orderData),
      payer: this.buildPayer(orderData),
      back_urls: this.buildBackUrls(orderData),
      notification_url: this.buildNotificationUrl(),
      payment_methods: this.buildPaymentMethods(orderData),
      auto_return: this.config.autoReturn,
      binary_mode: this.config.binaryMode,
      expires: true,
      expiration_date_from: this.buildExpirationFrom(),
      expiration_date_to: this.buildExpirationTo(),
      metadata: this.buildMetadata(orderData),
      additional_info: this.buildAdditionalInfo(orderData)
    };
  }

  /**
   * Build items array from order data
   * @param {Object} orderData - Order information
   * @returns {Array} Items array for preference
   */
  buildItems(orderData) {
    const items = [];

    // Add product items
    orderData.items.forEach(item => {
      items.push({
        id: item.productId,
        title: this.sanitizeString(item.productName, 256),
        description: this.sanitizeString(item.description || item.productName, 600),
        picture_url: item.imageUrl || null,
        category_id: item.categoryId || 'clothing',
        quantity: parseInt(item.quantity),
        unit_price: this.formatPrice(item.price),
        currency_id: this.config.currency
      });
    });

    // Add shipping cost as separate item if applicable
    if (orderData.shippingCost && orderData.shippingCost > 0) {
      items.push({
        id: 'shipping',
        title: 'Envío',
        description: this.buildShippingDescription(orderData),
        category_id: 'shipping',
        quantity: 1,
        unit_price: this.formatPrice(orderData.shippingCost),
        currency_id: this.config.currency
      });
    }

    // Add discount as negative item if applicable
    if (orderData.discount && orderData.discount > 0) {
      items.push({
        id: 'discount',
        title: 'Descuento',
        description: this.buildDiscountDescription(orderData),
        category_id: 'discount',
        quantity: 1,
        unit_price: -this.formatPrice(orderData.discount),
        currency_id: this.config.currency
      });
    }

    return items;
  }

  /**
   * Build shipping description
   * @param {Object} orderData - Order information
   * @returns {string} Shipping description
   */
  buildShippingDescription(orderData) {
    if (orderData.shippingMethod === 'pickup') {
      return `Retiro en tienda - ${orderData.pickupLocation?.name || 'Local seleccionado'}`;
    } else {
      const address = orderData.shippingAddress;
      return `Envío a ${address.city}, ${address.department}`;
    }
  }

  /**
   * Build discount description
   * @param {Object} orderData - Order information
   * @returns {string} Discount description
   */
  buildDiscountDescription(orderData) {
    if (orderData.discountCode) {
      return `Descuento aplicado: ${orderData.discountCode}`;
    }
    return 'Descuento aplicado';
  }

  /**
   * Build order description
   * @param {Object} orderData - Order information
   * @returns {string} Order description
   */
  buildDescription(orderData) {
    const itemCount = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    const itemText = itemCount === 1 ? 'artículo' : 'artículos';
    return `Pedido Tifossi #${orderData.orderNumber} - ${itemCount} ${itemText}`;
  }

  /**
   * Build payer information
   * @param {Object} orderData - Order information
   * @returns {Object} Payer object
   */
  buildPayer(orderData) {
    const user = orderData.user;
    const payer = {
      name: this.sanitizeString(user.firstName, 30),
      surname: this.sanitizeString(user.lastName, 30),
      email: user.email,
      date_created: user.createdAt || null,
      last_purchase: user.lastPurchase || null
    };

    // Add phone if available
    if (user.phone) {
      payer.phone = {
        area_code: user.phone.areaCode || '598', // Uruguay default
        number: this.sanitizePhoneNumber(user.phone.number)
      };
    }

    // Add identification if available
    if (user.identification) {
      payer.identification = {
        type: user.identification.type, // CI, CE, RUT, etc.
        number: this.sanitizeString(user.identification.number, 20)
      };
    }

    // Add address information
    if (orderData.shippingAddress) {
      payer.address = this.buildPayerAddress(orderData.shippingAddress);
    }

    return payer;
  }

  /**
   * Build payer address
   * @param {Object} shippingAddress - Shipping address
   * @returns {Object} Payer address object
   */
  buildPayerAddress(shippingAddress) {
    return {
      street_name: this.sanitizeString(shippingAddress.street, 100),
      street_number: this.extractStreetNumber(shippingAddress.number),
      zip_code: this.sanitizeString(shippingAddress.zipCode || '11000', 10)
    };
  }

  /**
   * Build back URLs for payment callbacks
   * @param {Object} orderData - Order information
   * @returns {Object} Back URLs object
   */
  buildBackUrls(orderData) {
    const baseParams = `?order_id=${orderData.id}&external_reference=${orderData.orderNumber}`;
    
    return {
      success: `${this.appScheme}://payment/success${baseParams}`,
      failure: `${this.appScheme}://payment/failure${baseParams}`,
      pending: `${this.appScheme}://payment/pending${baseParams}`
    };
  }

  /**
   * Build notification URL for webhooks
   * @returns {string} Webhook notification URL
   */
  buildNotificationUrl() {
    return `${this.baseUrl}/webhooks/mercadopago`;
  }

  /**
   * Build payment methods configuration
   * @param {Object} orderData - Order information
   * @returns {Object} Payment methods configuration
   */
  buildPaymentMethods(orderData) {
    const config = {
      excluded_payment_methods: [],
      excluded_payment_types: [],
      installments: this.config.maxInstallments
    };

    // Exclude cash payments for delivery orders if configured
    if (orderData.shippingMethod === 'delivery' && process.env.EXCLUDE_CASH_FOR_DELIVERY === 'true') {
      config.excluded_payment_types.push({ id: 'cash' });
    }

    // Exclude specific payment methods if configured
    const excludedMethods = process.env.EXCLUDED_PAYMENT_METHODS;
    if (excludedMethods) {
      excludedMethods.split(',').forEach(method => {
        config.excluded_payment_methods.push({ id: method.trim() });
      });
    }

    return config;
  }

  /**
   * Build expiration date from (now)
   * @returns {string} ISO date string
   */
  buildExpirationFrom() {
    return new Date().toISOString();
  }

  /**
   * Build expiration date to (now + configured minutes)
   * @returns {string} ISO date string
   */
  buildExpirationTo() {
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + this.config.expirationMinutes);
    return expirationDate.toISOString();
  }

  /**
   * Build metadata for tracking and analytics
   * @param {Object} orderData - Order information
   * @returns {Object} Metadata object
   */
  buildMetadata(orderData) {
    return {
      order_id: orderData.id,
      order_number: orderData.orderNumber,
      user_id: orderData.user.id,
      shipping_method: orderData.shippingMethod,
      item_count: orderData.items.length,
      total_quantity: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
      created_at: new Date().toISOString(),
      platform: 'mobile_app',
      version: process.env.APP_VERSION || '1.0.0'
    };
  }

  /**
   * Build additional information for analytics and processing
   * @param {Object} orderData - Order information
   * @returns {Object} Additional info object
   */
  buildAdditionalInfo(orderData) {
    return {
      payer: {
        first_name: orderData.user.firstName,
        last_name: orderData.user.lastName,
        registration_date: orderData.user.createdAt
      },
      shipments: {
        receiver_address: this.buildShipmentAddress(orderData)
      },
      items: this.buildAdditionalItemInfo(orderData.items)
    };
  }

  /**
   * Build shipment address information
   * @param {Object} orderData - Order information
   * @returns {Object} Shipment address object
   */
  buildShipmentAddress(orderData) {
    if (orderData.shippingMethod === 'pickup') {
      const pickup = orderData.pickupLocation;
      return {
        street_name: pickup?.address || 'Tienda Tifossi',
        street_number: 1,
        zip_code: pickup?.zipCode || '11000',
        city_name: pickup?.city || 'Montevideo',
        state_name: pickup?.department || 'Montevideo',
        country_name: 'Uruguay'
      };
    } else {
      const address = orderData.shippingAddress;
      return {
        street_name: address.street,
        street_number: this.extractStreetNumber(address.number),
        zip_code: address.zipCode || '11000',
        city_name: address.city,
        state_name: address.department,
        country_name: 'Uruguay'
      };
    }
  }

  /**
   * Build additional item information
   * @param {Array} items - Order items
   * @returns {Array} Additional item info
   */
  buildAdditionalItemInfo(items) {
    return items.map(item => ({
      id: item.productId,
      title: item.productName,
      description: item.description,
      picture_url: item.imageUrl,
      category_id: item.categoryId,
      warranty: item.warranty || 'Garantía estándar Tifossi'
    }));
  }

  /**
   * Validate order data before building preference
   * @param {Object} orderData - Order information
   */
  validateOrderData(orderData) {
    // Required fields
    if (!orderData.orderNumber) {
      throw new Error('Order number is required');
    }

    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    if (!orderData.user || !orderData.user.email) {
      throw new Error('User email is required');
    }

    // Validate user email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderData.user.email)) {
      throw new Error('Invalid user email format');
    }

    // Validate items
    orderData.items.forEach((item, index) => {
      if (!item.productId || !item.productName || !item.quantity || !item.price) {
        throw new Error(`Item ${index} is missing required fields`);
      }

      if (item.quantity <= 0) {
        throw new Error(`Item ${index} quantity must be positive`);
      }

      if (item.price <= 0) {
        throw new Error(`Item ${index} price must be positive`);
      }
    });

    // Validate shipping method
    if (!['delivery', 'pickup'].includes(orderData.shippingMethod)) {
      throw new Error('Invalid shipping method');
    }

    // Validate shipping address for delivery orders
    if (orderData.shippingMethod === 'delivery') {
      if (!orderData.shippingAddress || !orderData.shippingAddress.street || !orderData.shippingAddress.city) {
        throw new Error('Shipping address is required for delivery orders');
      }
    }

    // Validate pickup location for pickup orders
    if (orderData.shippingMethod === 'pickup') {
      if (!orderData.pickupLocation || !orderData.pickupLocation.id) {
        throw new Error('Pickup location is required for pickup orders');
      }
    }
  }

  /**
   * Sanitize string for MercadoPago requirements
   * @param {string} str - String to sanitize
   * @param {number} maxLength - Maximum length
   * @returns {string} Sanitized string
   */
  sanitizeString(str, maxLength) {
    if (!str) return '';
    
    // Remove special characters that might cause issues
    const sanitized = str.replace(/[<>'"&]/g, '').trim();
    
    // Truncate if too long
    return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
  }

  /**
   * Sanitize phone number
   * @param {string} phone - Phone number to sanitize
   * @returns {string} Sanitized phone number
   */
  sanitizePhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  }

  /**
   * Extract street number from address
   * @param {string|number} numberStr - Street number string
   * @returns {number} Street number or 1 if not found
   */
  extractStreetNumber(numberStr) {
    if (!numberStr) return 1;
    
    const num = parseInt(String(numberStr).replace(/\D/g, ''));
    return isNaN(num) || num <= 0 ? 1 : num;
  }

  /**
   * Format price to ensure correct decimal places
   * @param {number|string} price - Price to format
   * @returns {number} Formatted price
   */
  formatPrice(price) {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
      throw new Error('Invalid price format');
    }
    
    // Round to 2 decimal places
    return Math.round(numPrice * 100) / 100;
  }

  /**
   * Calculate total amount from order data
   * @param {Object} orderData - Order information
   * @returns {number} Total amount
   */
  calculateTotal(orderData) {
    let total = 0;

    // Add item costs
    orderData.items.forEach(item => {
      total += item.quantity * item.price;
    });

    // Add shipping cost
    if (orderData.shippingCost) {
      total += orderData.shippingCost;
    }

    // Subtract discount
    if (orderData.discount) {
      total -= orderData.discount;
    }

    return this.formatPrice(total);
  }

  /**
   * Build minimal preference for testing
   * @param {string} externalReference - External reference for test
   * @returns {Object} Minimal test preference
   */
  buildTestPreference(externalReference) {
    return {
      items: [{
        id: 'test_item',
        title: 'Test Item',
        quantity: 1,
        unit_price: 100,
        currency_id: this.config.currency
      }],
      external_reference: externalReference,
      description: 'Test Preference',
      back_urls: {
        success: `${this.appScheme}://test/success`,
        failure: `${this.appScheme}://test/failure`,
        pending: `${this.appScheme}://test/pending`
      },
      notification_url: this.buildNotificationUrl(),
      auto_return: this.config.autoReturn,
      binary_mode: false,
      expires: true,
      expiration_date_from: this.buildExpirationFrom(),
      expiration_date_to: this.buildExpirationTo()
    };
  }
}

module.exports = PreferenceBuilder;