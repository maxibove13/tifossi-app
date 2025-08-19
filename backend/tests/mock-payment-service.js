/**
 * Mock Payment Service for MercadoPago Integration Testing
 * 
 * This service provides a comprehensive mock implementation of MercadoPago's
 * payment processing API, supporting all major payment flows, error scenarios,
 * and webhook handling for testing the Tifossi backend migration.
 */

const EventEmitter = require('events');
const crypto = require('crypto');

/**
 * Mock MercadoPago Payment Service
 * Simulates the complete MercadoPago payment processing flow
 */
class MockMercadoPagoService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      accessToken: 'TEST-mock-access-token-123456',
      publicKey: 'TEST-mock-public-key-654321',
      environment: 'sandbox',
      baseUrl: 'https://api.mercadopago.com',
      webhookSecret: config.webhookSecret || 'mock-webhook-secret',
      enableWebhooks: config.enableWebhooks !== false,
      responseDelay: config.responseDelay || 500,
      errorRate: config.errorRate || 0.02,
      ...config
    };

    // Service state
    this.payments = new Map();
    this.merchants = new Map();
    this.cards = new Map();
    this.subscriptions = new Map();
    this.webhooks = [];
    this.requestCount = 0;
    this.serviceHealth = 'healthy'; // healthy, degraded, down

    // Initialize test data
    this.initializeTestData();
    
    // Start webhook processing if enabled
    if (this.config.enableWebhooks) {
      this.startWebhookProcessor();
    }
  }

  /**
   * Initialize test data and configurations
   */
  initializeTestData() {
    // Test card numbers with predictable behaviors
    this.testCards = {
      // Approved cards
      '4111111111111111': { type: 'visa', result: 'approved', processingTime: 1000 },
      '5555555555554444': { type: 'mastercard', result: 'approved', processingTime: 1200 },
      '378282246310005': { type: 'amex', result: 'approved', processingTime: 1500 },
      
      // Declined cards
      '4000000000000002': { type: 'visa', result: 'declined', error: 'insufficient_funds' },
      '4000000000000036': { type: 'visa', result: 'declined', error: 'expired_card' },
      '4000000000000069': { type: 'visa', result: 'declined', error: 'card_declined' },
      
      // Processing errors
      '4000000000000119': { type: 'visa', result: 'processing_error', error: 'processing_error' },
      '4000000000000127': { type: 'visa', result: 'invalid_security_code', error: 'invalid_security_code' },
      
      // Slow processing (for timeout testing)
      '4000000000000259': { type: 'visa', result: 'approved', processingTime: 10000 },
      
      // Fraud detection
      '4100000000000019': { type: 'visa', result: 'requires_action', error: 'fraud_detected' }
    };

    // Mock merchant data
    this.merchants.set('merchant-test-001', {
      id: 'merchant-test-001',
      name: 'Tifossi Test Store',
      email: 'payments@tifossi.com',
      country: 'UY',
      currency: 'UYU',
      status: 'active',
      fees: {
        credit_card: 0.04, // 4%
        debit_card: 0.025, // 2.5%
        bank_transfer: 0.015 // 1.5%
      }
    });

    // Payment method configurations
    this.paymentMethods = {
      'visa': {
        id: 'visa',
        name: 'Visa',
        type: 'credit_card',
        status: 'active',
        min_amount: 100,
        max_amount: 1000000,
        processing_time: '2-5 minutes'
      },
      'mastercard': {
        id: 'mastercard', 
        name: 'Mastercard',
        type: 'credit_card',
        status: 'active',
        min_amount: 100,
        max_amount: 1000000,
        processing_time: '2-5 minutes'
      },
      'banco_transfer': {
        id: 'banco_transfer',
        name: 'Bank Transfer',
        type: 'bank_transfer',
        status: 'active',
        min_amount: 500,
        max_amount: 500000,
        processing_time: '1-3 business days'
      }
    };
  }

  /**
   * Create a new payment
   */
  async createPayment(paymentData) {
    await this.simulateDelay();
    this.requestCount++;

    // Validate service health
    if (this.serviceHealth === 'down') {
      throw new MercadoPagoError('service_unavailable', 'Payment service is currently unavailable', 503);
    }

    // Simulate random errors based on error rate
    if (this.shouldSimulateError()) {
      throw new MercadoPagoError('payment_creation_failed', 'Temporary payment processing error', 500);
    }

    // Validate required fields
    this.validatePaymentRequest(paymentData);

    const payment = {
      id: this.generatePaymentId(),
      status: 'pending',
      status_detail: 'pending_waiting_payment',
      operation_type: 'regular_payment',
      date_created: new Date().toISOString(),
      date_last_updated: new Date().toISOString(),
      money_release_date: this.calculateReleaseDate(),
      
      // Financial details
      currency_id: paymentData.currency_id || 'UYU',
      transaction_amount: paymentData.transaction_amount,
      transaction_amount_refunded: 0,
      coupon_amount: paymentData.coupon_amount || 0,
      
      // Transaction details
      transaction_details: {
        payment_method_reference_id: null,
        net_received_amount: this.calculateNetAmount(paymentData.transaction_amount, paymentData.payment_method_id),
        total_paid_amount: paymentData.transaction_amount,
        overpaid_amount: 0,
        installment_amount: paymentData.transaction_amount / (paymentData.installments || 1),
        financial_institution: this.getFinancialInstitution(paymentData.payment_method_id)
      },

      // Fee calculation
      fee_details: this.calculateFees(paymentData.transaction_amount, paymentData.payment_method_id),

      // Payment configuration
      captured: true,
      binary_mode: false,
      live_mode: false,
      
      // Order reference
      order: {
        type: 'mercadopago',
        id: paymentData.order?.id || null
      },
      external_reference: paymentData.external_reference || null,
      description: paymentData.description || 'Tifossi Purchase',
      metadata: paymentData.metadata || {},

      // Payer information
      payer: this.formatPayerInfo(paymentData.payer),

      // Payment method details
      payment_method_id: paymentData.payment_method_id,
      payment_type_id: this.getPaymentType(paymentData.payment_method_id),
      payment_method: {
        id: paymentData.payment_method_id,
        type: this.getPaymentType(paymentData.payment_method_id),
        issuer_id: paymentData.issuer_id || null
      },

      // Card information (if applicable)
      card: paymentData.token ? this.getCardInfo(paymentData.token) : null,
      
      installments: paymentData.installments || 1,
      statement_descriptor: 'TIFOSSI',
      
      // Notification configuration
      notification_url: paymentData.notification_url || this.config.webhookUrl,
      
      // Processing info
      processor_response: null,
      authorization_code: null,
      
      refunds: []
    };

    // Store payment
    this.payments.set(payment.id, payment);

    // Emit creation event
    this.emit('payment.created', payment);

    // Schedule payment processing
    this.schedulePaymentProcessing(payment.id, paymentData);

    return payment;
  }

  /**
   * Process payment asynchronously
   */
  async schedulePaymentProcessing(paymentId, originalData) {
    const cardNumber = originalData.token ? this.extractCardNumber(originalData.token) : null;
    const cardBehavior = this.testCards[cardNumber] || { result: 'approved', processingTime: 1000 };
    
    setTimeout(() => {
      this.processPayment(paymentId, cardBehavior);
    }, cardBehavior.processingTime || 1000);
  }

  /**
   * Process payment and update status
   */
  async processPayment(paymentId, cardBehavior) {
    const payment = this.payments.get(paymentId);
    if (!payment) return;

    const originalStatus = payment.status;
    let newStatus, statusDetail, processorResponse;

    switch (cardBehavior.result) {
      case 'approved':
        newStatus = 'approved';
        statusDetail = 'accredited';
        processorResponse = {
          code: '00',
          message: 'Transaction approved'
        };
        payment.authorization_code = this.generateAuthorizationCode();
        break;

      case 'declined':
        newStatus = 'rejected';
        statusDetail = this.getDeclineReason(cardBehavior.error);
        processorResponse = {
          code: '05',
          message: cardBehavior.error || 'Card declined'
        };
        break;

      case 'processing_error':
        newStatus = 'rejected';
        statusDetail = 'cc_rejected_other_reason';
        processorResponse = {
          code: '96',
          message: 'Processing error'
        };
        break;

      case 'invalid_security_code':
        newStatus = 'rejected';
        statusDetail = 'cc_rejected_bad_filled_security_code';
        processorResponse = {
          code: '14',
          message: 'Invalid security code'
        };
        break;

      case 'requires_action':
        newStatus = 'in_process';
        statusDetail = 'pending_review_manual';
        processorResponse = {
          code: '07',
          message: 'Transaction requires manual review'
        };
        // Schedule final approval after review period
        setTimeout(() => {
          this.processPayment(paymentId, { result: 'approved' });
        }, 30000);
        break;

      default:
        newStatus = 'approved';
        statusDetail = 'accredited';
        processorResponse = {
          code: '00',
          message: 'Transaction approved'
        };
    }

    // Update payment
    payment.status = newStatus;
    payment.status_detail = statusDetail;
    payment.date_last_updated = new Date().toISOString();
    payment.processor_response = processorResponse;

    // Emit status change event
    this.emit('payment.updated', payment, { from: originalStatus, to: newStatus });

    // Send webhook if enabled
    if (this.config.enableWebhooks && payment.notification_url) {
      this.sendWebhook({
        id: payment.id,
        live_mode: false,
        type: 'payment',
        date_created: new Date().toISOString(),
        application_id: 'mock-application-id',
        user_id: 'mock-user-id',
        version: 1,
        api_version: 'v1',
        action: 'payment.updated',
        data: {
          id: payment.id
        }
      });
    }

    console.log(`[Mock MercadoPago] Payment ${paymentId} processed: ${originalStatus} -> ${newStatus}`);
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId) {
    await this.simulateDelay();
    this.requestCount++;

    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new MercadoPagoError('payment_not_found', `Payment ${paymentId} not found`, 404);
    }

    return payment;
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(paymentId) {
    await this.simulateDelay();
    this.requestCount++;

    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new MercadoPagoError('payment_not_found', `Payment ${paymentId} not found`, 404);
    }

    if (!['pending', 'in_process'].includes(payment.status)) {
      throw new MercadoPagoError(
        'payment_cannot_be_cancelled',
        `Payment with status ${payment.status} cannot be cancelled`,
        400
      );
    }

    payment.status = 'cancelled';
    payment.status_detail = 'by_collector';
    payment.date_last_updated = new Date().toISOString();

    this.emit('payment.cancelled', payment);
    return payment;
  }

  /**
   * Refund a payment (full or partial)
   */
  async refundPayment(paymentId, refundData = {}) {
    await this.simulateDelay();
    this.requestCount++;

    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new MercadoPagoError('payment_not_found', `Payment ${paymentId} not found`, 404);
    }

    if (payment.status !== 'approved') {
      throw new MercadoPagoError(
        'payment_cannot_be_refunded',
        `Payment with status ${payment.status} cannot be refunded`,
        400
      );
    }

    const refundAmount = refundData.amount || (payment.transaction_amount - payment.transaction_amount_refunded);
    const availableAmount = payment.transaction_amount - payment.transaction_amount_refunded;

    if (refundAmount > availableAmount) {
      throw new MercadoPagoError(
        'refund_amount_exceeds_available',
        `Refund amount ${refundAmount} exceeds available amount ${availableAmount}`,
        400
      );
    }

    const refund = {
      id: this.generateRefundId(),
      payment_id: paymentId,
      amount: refundAmount,
      metadata: refundData.metadata || {},
      source: {
        id: 'collector',
        name: 'Collector',
        type: 'collector'
      },
      date_created: new Date().toISOString(),
      unique_sequence_number: null,
      refund_mode: 'standard',
      adjustment_amount: 0,
      status: 'approved',
      reason: refundData.reason || 'seller_decision'
    };

    // Update payment
    payment.refunds.push(refund);
    payment.transaction_amount_refunded += refundAmount;
    payment.date_last_updated = new Date().toISOString();

    // Update payment status if fully refunded
    if (payment.transaction_amount_refunded >= payment.transaction_amount) {
      payment.status = 'refunded';
      payment.status_detail = 'refunded';
    }

    this.emit('payment.refunded', payment, refund);
    return refund;
  }

  /**
   * Create card token (client-side operation simulation)
   */
  async createCardToken(cardData) {
    await this.simulateDelay(100); // Faster for tokenization
    this.requestCount++;

    if (this.shouldSimulateError()) {
      throw new MercadoPagoError('invalid_card_data', 'Invalid card data provided');
    }

    // Validate card data
    if (!this.validateCardData(cardData)) {
      throw new MercadoPagoError('invalid_card_data', 'Card data validation failed');
    }

    const token = {
      id: this.generateTokenId(),
      public_key: this.config.publicKey,
      card_id: null,
      luhn_validation: this.validateLuhn(cardData.card_number),
      status: 'active',
      date_used: null,
      date_created: new Date().toISOString(),
      date_last_updated: new Date().toISOString(),
      due_date: null,
      live_mode: false,
      require_esc: false,
      
      // Card info (masked)
      card_number_length: cardData.card_number.length,
      first_six_digits: cardData.card_number.substring(0, 6),
      last_four_digits: cardData.card_number.substring(cardData.card_number.length - 4),
      security_code_length: cardData.security_code ? cardData.security_code.length : 0,
      expiration_month: parseInt(cardData.expiration_month),
      expiration_year: parseInt(cardData.expiration_year),
      
      cardholder: {
        name: cardData.cardholder?.name || 'CARDHOLDER NAME',
        identification: {
          number: cardData.cardholder?.identification?.number || '12345678',
          type: cardData.cardholder?.identification?.type || 'CI'
        }
      }
    };

    // Store card data securely (for testing purposes)
    this.cards.set(token.id, {
      ...cardData,
      token,
      created_at: new Date().toISOString()
    });

    return token;
  }

  /**
   * Get available payment methods
   */
  async getPaymentMethods() {
    await this.simulateDelay(200);
    this.requestCount++;

    return Object.values(this.paymentMethods);
  }

  /**
   * Get payment method installments
   */
  async getInstallments(paymentMethodId, amount) {
    await this.simulateDelay(150);
    this.requestCount++;

    const paymentMethod = this.paymentMethods[paymentMethodId];
    if (!paymentMethod) {
      throw new MercadoPagoError('payment_method_not_found', 'Payment method not found');
    }

    // Generate installment options
    const installments = [];
    const maxInstallments = paymentMethod.type === 'credit_card' ? 12 : 1;

    for (let i = 1; i <= maxInstallments; i++) {
      const installmentAmount = amount / i;
      const interestRate = i > 1 ? 0.02 * (i - 1) : 0; // 2% per additional installment
      const totalAmount = amount * (1 + interestRate);

      installments.push({
        installments: i,
        installment_amount: Math.round(installmentAmount * 100) / 100,
        total_amount: Math.round(totalAmount * 100) / 100,
        interest_rate: interestRate,
        recommended_message: i === 1 ? 'Sin interés' : `${i} cuotas de $${Math.round(totalAmount / i)}`
      });
    }

    return installments;
  }

  /**
   * Webhook handling
   */
  async sendWebhook(webhookData) {
    if (!this.config.enableWebhooks) return;

    const webhook = {
      ...webhookData,
      signature: this.generateWebhookSignature(webhookData),
      attempts: 0,
      max_attempts: 3,
      sent_at: new Date().toISOString()
    };

    this.webhooks.push(webhook);
    this.emit('webhook.sent', webhook);

    console.log(`[Mock MercadoPago] Webhook sent: ${webhook.action} for ${webhook.data.id}`);
    return webhook;
  }

  /**
   * Start webhook processor (simulates webhook delivery)
   */
  startWebhookProcessor() {
    setInterval(() => {
      const pendingWebhooks = this.webhooks.filter(w => w.attempts < w.max_attempts);
      
      pendingWebhooks.forEach(webhook => {
        webhook.attempts++;
        webhook.last_attempt = new Date().toISOString();
        
        // Simulate webhook delivery success/failure
        const success = Math.random() > 0.05; // 95% success rate
        
        if (success) {
          webhook.delivered = true;
          webhook.delivered_at = new Date().toISOString();
          this.emit('webhook.delivered', webhook);
        } else if (webhook.attempts >= webhook.max_attempts) {
          webhook.failed = true;
          webhook.failed_at = new Date().toISOString();
          this.emit('webhook.failed', webhook);
        }
      });
    }, 5000); // Check every 5 seconds
  }

  // Utility Methods

  validatePaymentRequest(paymentData) {
    const required = ['transaction_amount', 'payment_method_id'];
    const missing = required.filter(field => !paymentData[field]);
    
    if (missing.length > 0) {
      throw new MercadoPagoError('missing_required_fields', `Missing required fields: ${missing.join(', ')}`);
    }

    if (paymentData.transaction_amount <= 0) {
      throw new MercadoPagoError('invalid_amount', 'Transaction amount must be greater than 0');
    }

    const paymentMethod = this.paymentMethods[paymentData.payment_method_id];
    if (!paymentMethod) {
      throw new MercadoPagoError('invalid_payment_method', 'Invalid payment method');
    }

    if (paymentData.transaction_amount < paymentMethod.min_amount ||
        paymentData.transaction_amount > paymentMethod.max_amount) {
      throw new MercadoPagoError(
        'invalid_amount', 
        `Amount must be between ${paymentMethod.min_amount} and ${paymentMethod.max_amount}`
      );
    }
  }

  validateCardData(cardData) {
    if (!cardData.card_number || !this.validateLuhn(cardData.card_number)) {
      return false;
    }
    
    if (!cardData.expiration_month || !cardData.expiration_year) {
      return false;
    }
    
    const month = parseInt(cardData.expiration_month);
    const year = parseInt(cardData.expiration_year);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (month < 1 || month > 12) return false;
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return false;
    }
    
    return true;
  }

  validateLuhn(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '').split('').map(Number);
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i];
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  formatPayerInfo(payerData) {
    return {
      id: payerData?.id || this.generatePayerId(),
      email: payerData?.email || 'customer@example.com',
      identification: {
        type: payerData?.identification?.type || 'CI',
        number: payerData?.identification?.number || '12345678'
      },
      type: 'customer',
      first_name: payerData?.first_name || 'Customer',
      last_name: payerData?.last_name || 'Test',
      phone: {
        area_code: '598',
        number: payerData?.phone || '99123456'
      },
      address: payerData?.address || {}
    };
  }

  calculateNetAmount(amount, paymentMethodId) {
    const merchant = this.merchants.get('merchant-test-001');
    const paymentMethod = this.paymentMethods[paymentMethodId];
    
    if (!paymentMethod || !merchant) return amount;
    
    const feeRate = merchant.fees[paymentMethod.type] || 0.04;
    return Math.round(amount * (1 - feeRate));
  }

  calculateFees(amount, paymentMethodId) {
    const merchant = this.merchants.get('merchant-test-001');
    const paymentMethod = this.paymentMethods[paymentMethodId];
    
    if (!paymentMethod || !merchant) return [];
    
    const feeRate = merchant.fees[paymentMethod.type] || 0.04;
    const feeAmount = Math.round(amount * feeRate);
    
    return [{
      type: 'mercadopago_fee',
      amount: feeAmount,
      fee_payer: 'collector'
    }];
  }

  calculateReleaseDate() {
    // Money released after 21 days for test environment
    return new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
  }

  getPaymentType(paymentMethodId) {
    const paymentMethod = this.paymentMethods[paymentMethodId];
    return paymentMethod ? paymentMethod.type : 'credit_card';
  }

  getFinancialInstitution(paymentMethodId) {
    const institutions = {
      'visa': 'Visa International',
      'mastercard': 'Mastercard Worldwide',
      'banco_transfer': 'Banco República'
    };
    return institutions[paymentMethodId] || null;
  }

  getDeclineReason(error) {
    const reasons = {
      'insufficient_funds': 'cc_rejected_insufficient_amount',
      'expired_card': 'cc_rejected_card_disabled',
      'card_declined': 'cc_rejected_other_reason'
    };
    return reasons[error] || 'cc_rejected_other_reason';
  }

  getCardInfo(tokenId) {
    const cardData = this.cards.get(tokenId);
    if (!cardData) return null;

    return {
      id: null,
      first_six_digits: cardData.card_number.substring(0, 6),
      last_four_digits: cardData.card_number.substring(cardData.card_number.length - 4),
      expiration_month: parseInt(cardData.expiration_month),
      expiration_year: parseInt(cardData.expiration_year),
      date_created: cardData.created_at,
      date_last_updated: cardData.created_at,
      cardholder: cardData.cardholder,
      customer_id: null
    };
  }

  extractCardNumber(tokenId) {
    const cardData = this.cards.get(tokenId);
    return cardData ? cardData.card_number : null;
  }

  generatePaymentId() {
    return Math.floor(Math.random() * 9000000000) + 1000000000;
  }

  generateRefundId() {
    return Math.floor(Math.random() * 9000000000) + 1000000000;
  }

  generateTokenId() {
    return `mock-token-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  generatePayerId() {
    return Math.floor(Math.random() * 900000000) + 100000000;
  }

  generateAuthorizationCode() {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  generateWebhookSignature(data) {
    const payload = JSON.stringify(data);
    return crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');
  }

  async simulateDelay(customDelay = null) {
    const delay = customDelay || this.config.responseDelay;
    
    // Simulate service degradation
    if (this.serviceHealth === 'degraded') {
      await new Promise(resolve => setTimeout(resolve, delay * 2));
    } else {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  shouldSimulateError() {
    return Math.random() < this.config.errorRate;
  }

  // Service Control Methods (for testing)

  setServiceHealth(health) {
    this.serviceHealth = health; // healthy, degraded, down
    this.emit('service.health_changed', health);
  }

  setErrorRate(rate) {
    this.config.errorRate = Math.max(0, Math.min(1, rate));
  }

  setResponseDelay(delay) {
    this.config.responseDelay = Math.max(0, delay);
  }

  getMetrics() {
    return {
      requestCount: this.requestCount,
      paymentCount: this.payments.size,
      cardTokenCount: this.cards.size,
      webhookCount: this.webhooks.length,
      successfulWebhooks: this.webhooks.filter(w => w.delivered).length,
      failedWebhooks: this.webhooks.filter(w => w.failed).length,
      serviceHealth: this.serviceHealth,
      errorRate: this.config.errorRate,
      responseDelay: this.config.responseDelay
    };
  }

  getPaymentStats() {
    const payments = Array.from(this.payments.values());
    const statusCounts = {};
    
    payments.forEach(payment => {
      statusCounts[payment.status] = (statusCounts[payment.status] || 0) + 1;
    });

    return {
      total: payments.length,
      statusBreakdown: statusCounts,
      totalAmount: payments.reduce((sum, p) => sum + p.transaction_amount, 0),
      averageAmount: payments.length > 0 ? 
        payments.reduce((sum, p) => sum + p.transaction_amount, 0) / payments.length : 0
    };
  }

  reset() {
    this.payments.clear();
    this.cards.clear();
    this.webhooks = [];
    this.requestCount = 0;
    this.serviceHealth = 'healthy';
    this.emit('service.reset');
    console.log('[Mock MercadoPago] Service reset');
  }
}

/**
 * MercadoPago Error Class
 */
class MercadoPagoError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'MercadoPagoError';
    this.code = code;
    this.status = status;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      status: this.status,
      timestamp: this.timestamp
    };
  }
}

/**
 * Mock Payment Service Factory
 * Creates configured instances for different test scenarios
 */
class MockPaymentServiceFactory {
  static createForTesting(scenario = 'normal') {
    const scenarios = {
      normal: {
        errorRate: 0.02,
        responseDelay: 500,
        enableWebhooks: true
      },
      
      high_error: {
        errorRate: 0.15,
        responseDelay: 1000,
        enableWebhooks: true
      },
      
      slow_network: {
        errorRate: 0.02,
        responseDelay: 3000,
        enableWebhooks: true
      },
      
      degraded_service: {
        errorRate: 0.08,
        responseDelay: 2000,
        enableWebhooks: true,
        initialHealth: 'degraded'
      },
      
      fast_testing: {
        errorRate: 0,
        responseDelay: 50,
        enableWebhooks: false
      }
    };

    const config = scenarios[scenario] || scenarios.normal;
    const service = new MockMercadoPagoService(config);
    
    if (config.initialHealth) {
      service.setServiceHealth(config.initialHealth);
    }
    
    return service;
  }
}

module.exports = {
  MockMercadoPagoService,
  MercadoPagoError,
  MockPaymentServiceFactory
};

// Export default instance
module.exports.default = MockMercadoPagoService;