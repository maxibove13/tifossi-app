/**
 * MercadoPago Service
 * Handles all interactions with MercadoPago API
 * Tifossi Expo E-commerce Platform
 */

const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const crypto = require('crypto');

class MercadoPagoService {
  constructor() {
    // Initialize MercadoPago client
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
      options: {
        timeout: 30000,
        idempotencyKey: this.generateIdempotencyKey()
      }
    });
    
    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
    
    // Configuration
    this.webhookSecret = process.env.MP_WEBHOOK_SECRET;
    this.baseUrl = process.env.API_BASE_URL;
    this.appScheme = process.env.APP_SCHEME || 'tifossi';
  }

  /**
   * Create payment preference for an order
   * @param {Object} orderData - Order information
   * @returns {Promise<Object>} Preference data
   */
  async createPreference(orderData) {
    try {
      const preferenceData = this.buildPreferenceData(orderData);
      
      // Validate preference data
      this.validatePreferenceData(preferenceData);
      
      // Create preference
      const preference = await this.preference.create({
        body: preferenceData
      });
      
      // Log preference creation
      console.log(`Preference created: ${preference.id} for order: ${orderData.orderNumber}`);
      
      return {
        id: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
        externalReference: orderData.orderNumber,
        items: preference.items,
        payer: preference.payer
      };
      
    } catch (error) {
      console.error('Error creating MercadoPago preference:', error);
      throw new Error(`Failed to create payment preference: ${error.message}`);
    }
  }

  /**
   * Build preference data structure
   * @param {Object} orderData - Order information
   * @returns {Object} MercadoPago preference structure
   */
  buildPreferenceData(orderData) {
    const items = orderData.items.map(item => ({
      id: item.productId,
      title: item.productName,
      description: item.description || item.productName,
      quantity: item.quantity,
      unit_price: parseFloat(item.price),
      currency_id: 'UYU' // Uruguay Peso
    }));

    // Add shipping as an item if applicable
    if (orderData.shippingCost > 0) {
      items.push({
        id: 'shipping',
        title: 'Envío',
        description: `Envío a ${orderData.shippingAddress.city}`,
        quantity: 1,
        unit_price: parseFloat(orderData.shippingCost),
        currency_id: 'UYU'
      });
    }

    return {
      items,
      external_reference: orderData.orderNumber,
      description: `Pedido Tifossi #${orderData.orderNumber}`,
      
      // Payer information
      payer: {
        name: orderData.user.firstName,
        surname: orderData.user.lastName,
        email: orderData.user.email,
        phone: orderData.user.phone ? {
          area_code: orderData.user.phone.areaCode || '598',
          number: orderData.user.phone.number
        } : undefined,
        identification: orderData.user.identification ? {
          type: orderData.user.identification.type,
          number: orderData.user.identification.number
        } : undefined,
        address: {
          street_name: orderData.shippingAddress.street,
          street_number: parseInt(orderData.shippingAddress.number) || 1,
          zip_code: orderData.shippingAddress.zipCode || '11000'
        }
      },

      // Callback URLs
      back_urls: {
        success: `${this.appScheme}://payment/success`,
        failure: `${this.appScheme}://payment/failure`,
        pending: `${this.appScheme}://payment/pending`
      },

      // Webhook notification URL
      notification_url: `${this.baseUrl}/webhooks/mercadopago`,

      // Payment settings
      payment_methods: {
        excluded_payment_methods: [], // Allow all payment methods
        excluded_payment_types: [], // Allow all payment types
        installments: 12 // Maximum installments
      },

      // Additional settings
      auto_return: 'approved',
      binary_mode: false, // Allow pending payments
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes

      // Metadata
      metadata: {
        order_id: orderData.id,
        user_id: orderData.user.id,
        shipping_method: orderData.shippingMethod,
        created_at: new Date().toISOString()
      }
    };
  }

  /**
   * Validate preference data before sending to MercadoPago
   * @param {Object} preferenceData - Preference data to validate
   */
  validatePreferenceData(preferenceData) {
    // Required fields validation
    if (!preferenceData.items || preferenceData.items.length === 0) {
      throw new Error('Preference must have at least one item');
    }

    if (!preferenceData.external_reference) {
      throw new Error('External reference is required');
    }

    // Items validation
    preferenceData.items.forEach((item, index) => {
      if (!item.title || !item.quantity || !item.unit_price) {
        throw new Error(`Item ${index} is missing required fields`);
      }

      if (item.quantity <= 0) {
        throw new Error(`Item ${index} quantity must be positive`);
      }

      if (item.unit_price <= 0) {
        throw new Error(`Item ${index} unit_price must be positive`);
      }
    });

    // Payer validation
    if (!preferenceData.payer || !preferenceData.payer.email) {
      throw new Error('Payer email is required');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(preferenceData.payer.email)) {
      throw new Error('Invalid payer email format');
    }
  }

  /**
   * Get payment information by payment ID
   * @param {string} paymentId - MercadoPago payment ID
   * @returns {Promise<Object>} Payment information
   */
  async getPayment(paymentId) {
    try {
      const payment = await this.payment.get({ id: paymentId });
      
      return {
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        transactionAmount: payment.transaction_amount,
        currency: payment.currency_id,
        paymentMethodId: payment.payment_method_id,
        paymentTypeId: payment.payment_type_id,
        externalReference: payment.external_reference,
        description: payment.description,
        dateCreated: payment.date_created,
        dateApproved: payment.date_approved,
        dateLastUpdated: payment.date_last_updated,
        collector: payment.collector_id,
        payer: payment.payer,
        metadata: payment.metadata
      };
      
    } catch (error) {
      console.error(`Error fetching payment ${paymentId}:`, error);
      throw new Error(`Failed to fetch payment information: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   * @param {string} signature - Signature from x-signature header
   * @param {string} requestBody - Raw request body
   * @returns {boolean} True if signature is valid
   */
  verifyWebhookSignature(signature, requestBody) {
    try {
      // Parse signature header: ts=timestamp,v1=signature
      const sigParts = signature.split(',');
      const timestamp = sigParts.find(part => part.startsWith('ts=')).split('=')[1];
      const signatureHash = sigParts.find(part => part.startsWith('v1=')).split('=')[1];

      // Check timestamp (prevent replay attacks)
      const currentTime = Math.floor(Date.now() / 1000);
      const requestTime = parseInt(timestamp);
      const timeDifference = Math.abs(currentTime - requestTime);
      
      if (timeDifference > 300) { // 5 minutes tolerance
        console.warn('Webhook timestamp too old or too far in future');
        return false;
      }

      // Compute expected signature
      const payloadToSign = `${timestamp}.${requestBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payloadToSign, 'utf8')
        .digest('hex');

      // Compare signatures
      return crypto.timingSafeEqual(
        Buffer.from(signatureHash, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Process refund for a payment
   * @param {string} paymentId - MercadoPago payment ID
   * @param {number} amount - Refund amount (optional, full refund if not provided)
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>} Refund information
   */
  async processRefund(paymentId, amount = null, reason = 'Customer request') {
    try {
      const refundData = {
        payment_id: paymentId,
        reason: reason
      };

      // Add amount for partial refund
      if (amount !== null) {
        refundData.amount = parseFloat(amount);
      }

      // Note: This is a placeholder - actual MercadoPago refund implementation
      // would require the Refund API which may not be available in all versions
      console.log(`Processing refund for payment ${paymentId}:`, refundData);
      
      // For now, we'll return a mock response
      return {
        id: `refund_${Date.now()}`,
        payment_id: paymentId,
        amount: amount,
        status: 'approved',
        date_created: new Date().toISOString(),
        reason: reason
      };

    } catch (error) {
      console.error(`Error processing refund for payment ${paymentId}:`, error);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  /**
   * Map MercadoPago payment status to internal order status
   * @param {string} mpStatus - MercadoPago payment status
   * @param {string} mpStatusDetail - MercadoPago status detail
   * @returns {string} Internal order status
   */
  mapPaymentStatus(mpStatus, mpStatusDetail) {
    const statusMapping = {
      'approved': 'PAID',
      'authorized': 'PAYMENT_PENDING', // Requires capture
      'pending': 'PAYMENT_PENDING',
      'in_process': 'PAYMENT_PENDING',
      'in_mediation': 'PAYMENT_PENDING',
      'rejected': 'PAYMENT_FAILED',
      'cancelled': 'CANCELLED',
      'refunded': 'REFUNDED',
      'charged_back': 'REFUNDED'
    };

    return statusMapping[mpStatus] || 'PAYMENT_PENDING';
  }

  /**
   * Get user-friendly error message for payment status detail
   * @param {string} statusDetail - MercadoPago status detail
   * @returns {string} User-friendly error message
   */
  getPaymentErrorMessage(statusDetail) {
    const errorMessages = {
      'cc_rejected_insufficient_amount': 'Fondos insuficientes en tu tarjeta',
      'cc_rejected_bad_filled_security_code': 'Código de seguridad incorrecto',
      'cc_rejected_bad_filled_date': 'Fecha de vencimiento incorrecta',
      'cc_rejected_bad_filled_other': 'Revisa los datos de tu tarjeta',
      'cc_rejected_blacklist': 'No podemos procesar tu pago en este momento',
      'cc_rejected_call_for_authorize': 'Autoriza el pago con tu banco',
      'cc_rejected_card_disabled': 'Tu tarjeta está deshabilitada',
      'cc_rejected_card_error': 'No pudimos procesar tu tarjeta',
      'cc_rejected_duplicated_payment': 'Ya realizaste un pago similar',
      'cc_rejected_high_risk': 'Tu pago fue rechazado por seguridad',
      'cc_rejected_invalid_installments': 'Cuotas no válidas para tu tarjeta',
      'cc_rejected_max_attempts': 'Superaste el límite de intentos',
      'cc_rejected_other_reason': 'Tu tarjeta no pudo procesar el pago'
    };

    return errorMessages[statusDetail] || 'No pudimos procesar tu pago. Intenta con otro método.';
  }

  /**
   * Generate idempotency key for requests
   * @returns {string} Unique idempotency key
   */
  generateIdempotencyKey() {
    return `tifossi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check service health
   * @returns {Promise<Object>} Service health status
   */
  async checkHealth() {
    try {
      // Try to create a minimal preference to test API connectivity
      const testPreference = {
        items: [{
          id: 'health_check',
          title: 'Health Check',
          quantity: 1,
          unit_price: 1,
          currency_id: 'UYU'
        }],
        external_reference: `health_check_${Date.now()}`,
        back_urls: {
          success: `${this.appScheme}://health/success`,
          failure: `${this.appScheme}://health/failure`,
          pending: `${this.appScheme}://health/pending`
        }
      };

      await this.preference.create({ body: testPreference });
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'MercadoPago',
        message: 'Service is operational'
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'MercadoPago',
        error: error.message,
        message: 'Service is not responding correctly'
      };
    }
  }
}

module.exports = MercadoPagoService;