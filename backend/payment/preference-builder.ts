/**
 * Payment Preference Builder
 * Builds MercadoPago payment preferences from order data
 * Tifossi Expo E-commerce Platform
 */

import { MPPreferenceRequest, MPPreferenceItem, MPPayer, UruguayIdType } from './types/mercadopago';

import { OrderData, OrderItem, OrderUser, ShippingAddress, ShippingMethod } from './types/orders';

interface PreferenceBuilderConfig {
  currency?: string;
  maxInstallments?: number;
  expirationMinutes?: number;
  autoReturn?: 'approved' | 'all';
  binaryMode?: boolean;
}

interface PickupLocation {
  id: string;
  name?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  department?: string;
}

interface ExtendedOrderData extends Omit<OrderData, 'items' | 'user'> {
  id: string;
  pickupLocation?: PickupLocation;
  discountCode?: string;
  items: ExtendedOrderItem[];
  user: ExtendedOrderUser;
}

interface ExtendedOrderItem extends OrderItem {
  imageUrl?: string;
  categoryId?: string;
  warranty?: string;
}

interface ExtendedOrderUser extends OrderUser {
  createdAt?: Date | string;
  lastPurchase?: Date | string;
}

export class PreferenceBuilder {
  private config: Required<PreferenceBuilderConfig>;
  private baseUrl: string;
  private appScheme: string;

  constructor(config: PreferenceBuilderConfig = {}) {
    this.config = {
      currency: config.currency || 'UYU',
      maxInstallments: config.maxInstallments || 12,
      expirationMinutes: config.expirationMinutes || 30,
      autoReturn: config.autoReturn || 'approved',
      binaryMode: config.binaryMode || false,
    };

    this.baseUrl = process.env.API_BASE_URL || '';
    this.appScheme = process.env.APP_SCHEME || 'tifossi';
  }

  /**
   * Build complete preference from order data
   */
  build(orderData: ExtendedOrderData): MPPreferenceRequest {
    this.validateOrderData(orderData);

    const preference: MPPreferenceRequest = {
      items: this.buildItems(orderData),
      external_reference: orderData.orderNumber,
      payer: this.buildPayer(orderData),
      back_urls: this.buildBackUrls(orderData),
      notification_url: this.buildNotificationUrl(),
      payment_methods: this.buildPaymentMethods(orderData),
      auto_return: this.config.autoReturn,
      binary_mode: this.config.binaryMode,
      expires: true,
      expiration_date_from: this.buildExpirationFrom(),
      expiration_date_to: this.buildExpirationTo(),
    };

    // Add optional fields
    const description = this.buildDescription(orderData);
    if (description) {
      preference.statement_descriptor = description;
    }

    const additionalInfo = this.buildAdditionalInfo(orderData);
    if (additionalInfo) {
      preference.additional_info = JSON.stringify(additionalInfo);
    }

    return preference;
  }

  /**
   * Build items array from order data
   */
  private buildItems(orderData: ExtendedOrderData): MPPreferenceItem[] {
    const items: MPPreferenceItem[] = [];

    // Add product items
    orderData.items.forEach((item) => {
      const extendedItem = item as ExtendedOrderItem;
      const preferenceItem: MPPreferenceItem = {
        id: extendedItem.productId,
        title: this.sanitizeString(extendedItem.productName, 256),
        quantity: parseInt(String(extendedItem.quantity)),
        unit_price: this.formatPrice(extendedItem.price),
        currency_id: 'UYU',
      };

      if (extendedItem.description) {
        preferenceItem.description = this.sanitizeString(
          extendedItem.description || extendedItem.productName,
          600
        );
      }

      if (extendedItem.imageUrl) {
        preferenceItem.picture_url = extendedItem.imageUrl;
      }

      if (extendedItem.categoryId) {
        preferenceItem.category_id = extendedItem.categoryId;
      }

      items.push(preferenceItem);
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
        currency_id: 'UYU',
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
        currency_id: 'UYU',
      });
    }

    return items;
  }

  /**
   * Build shipping description
   */
  private buildShippingDescription(orderData: ExtendedOrderData): string {
    if (orderData.shippingMethod === ShippingMethod.PICKUP) {
      return `Retiro en tienda - ${orderData.pickupLocation?.name || 'Local seleccionado'}`;
    } else {
      const address = orderData.shippingAddress;
      return `Envío a ${address.city}, ${address.state || 'Montevideo'}`;
    }
  }

  /**
   * Build discount description
   */
  private buildDiscountDescription(orderData: ExtendedOrderData): string {
    if (orderData.discountCode) {
      return `Descuento aplicado: ${orderData.discountCode}`;
    }
    return 'Descuento aplicado';
  }

  /**
   * Build order description
   */
  private buildDescription(orderData: ExtendedOrderData): string {
    const itemCount = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    const itemText = itemCount === 1 ? 'artículo' : 'artículos';
    return `Pedido Tifossi #${orderData.orderNumber} - ${itemCount} ${itemText}`;
  }

  /**
   * Build payer information
   */
  private buildPayer(orderData: ExtendedOrderData): MPPayer {
    const user = orderData.user as ExtendedOrderUser;
    const payer: MPPayer = {
      name: this.sanitizeString(user.firstName, 30),
      surname: this.sanitizeString(user.lastName, 30),
      email: user.email,
    };

    // Add phone if available
    if (user.phone) {
      payer.phone = {
        area_code: user.phone.areaCode || '598',
        number: this.sanitizePhoneNumber(user.phone.number),
      };
    }

    // Add identification if available
    if (user.identification) {
      payer.identification = {
        type: user.identification.type as UruguayIdType,
        number: this.sanitizeString(user.identification.number, 20),
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
   */
  private buildPayerAddress(shippingAddress: ShippingAddress) {
    return {
      street_name: this.sanitizeString(shippingAddress.street, 100),
      street_number: this.extractStreetNumber(shippingAddress.number),
      city: shippingAddress.city,
      federal_unit: shippingAddress.state || 'Montevideo',
      zip_code: this.sanitizeString(shippingAddress.zipCode || '11000', 10),
    };
  }

  /**
   * Build back URLs for payment callbacks
   */
  private buildBackUrls(orderData: ExtendedOrderData) {
    const baseParams = `?order_id=${orderData.id}&external_reference=${orderData.orderNumber}`;

    return {
      success: `${this.appScheme}://payment/success${baseParams}`,
      failure: `${this.appScheme}://payment/failure${baseParams}`,
      pending: `${this.appScheme}://payment/pending${baseParams}`,
    };
  }

  /**
   * Build notification URL for webhooks
   */
  private buildNotificationUrl(): string {
    return `${this.baseUrl}/webhooks/mercadopago`;
  }

  /**
   * Build payment methods configuration
   */
  private buildPaymentMethods(orderData: ExtendedOrderData) {
    const config: {
      excluded_payment_methods: { id: string }[];
      excluded_payment_types: { id: string }[];
      installments: number;
    } = {
      excluded_payment_methods: [] as { id: string }[],
      excluded_payment_types: [] as { id: string }[],
      installments: this.config.maxInstallments,
    };

    // Exclude cash payments for delivery orders if configured
    if (
      orderData.shippingMethod === ShippingMethod.DELIVERY &&
      process.env.EXCLUDE_CASH_FOR_DELIVERY === 'true'
    ) {
      config.excluded_payment_types.push({ id: 'cash' });
    }

    // Exclude specific payment methods if configured
    const excludedMethods = process.env.EXCLUDED_PAYMENT_METHODS;
    if (excludedMethods) {
      excludedMethods.split(',').forEach((method: string) => {
        config.excluded_payment_methods.push({ id: method.trim() });
      });
    }

    return config;
  }

  /**
   * Build expiration date from (now)
   */
  private buildExpirationFrom(): string {
    return new Date().toISOString();
  }

  /**
   * Build expiration date to (now + configured minutes)
   */
  private buildExpirationTo(): string {
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + this.config.expirationMinutes);
    return expirationDate.toISOString();
  }

  /**
   * Build metadata for tracking and analytics
   */
  // @ts-ignore - Future implementation placeholder
  private _buildMetadata(orderData: ExtendedOrderData): Record<string, any> {
    return {
      order_id: orderData.id,
      order_number: orderData.orderNumber,
      user_id: orderData.user.id,
      shipping_method: orderData.shippingMethod,
      item_count: orderData.items.length,
      total_quantity: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
      created_at: new Date().toISOString(),
      platform: 'mobile_app',
      version: process.env.APP_VERSION || '1.0.0',
    };
  }

  /**
   * Build additional information for analytics and processing
   */
  private buildAdditionalInfo(orderData: ExtendedOrderData): Record<string, any> | null {
    const user = orderData.user as ExtendedOrderUser;

    const additionalInfo: Record<string, any> = {
      payer: {
        first_name: user.firstName,
        last_name: user.lastName,
      },
      items: this.buildAdditionalItemInfo(orderData.items),
    };

    if (user.createdAt) {
      additionalInfo.payer.registration_date = user.createdAt;
    }

    if (orderData.shippingAddress || orderData.pickupLocation) {
      additionalInfo.shipments = {
        receiver_address: this.buildShipmentAddress(orderData),
      };
    }

    return additionalInfo;
  }

  /**
   * Build shipment address information
   */
  private buildShipmentAddress(orderData: ExtendedOrderData): Record<string, any> {
    if (orderData.shippingMethod === ShippingMethod.PICKUP) {
      const pickup = orderData.pickupLocation;
      return {
        street_name: pickup?.address || 'Tienda Tifossi',
        street_number: 1,
        zip_code: pickup?.zipCode || '11000',
        city_name: pickup?.city || 'Montevideo',
        state_name: pickup?.department || 'Montevideo',
        country_name: 'Uruguay',
      };
    } else {
      const address = orderData.shippingAddress;
      return {
        street_name: address.street,
        street_number: this.extractStreetNumber(address.number),
        zip_code: address.zipCode || '11000',
        city_name: address.city,
        state_name: address.state || 'Montevideo',
        country_name: address.country || 'Uruguay',
      };
    }
  }

  /**
   * Build additional item information
   */
  private buildAdditionalItemInfo(items: OrderItem[]): Record<string, any>[] {
    return items.map((item) => {
      const extendedItem = item as ExtendedOrderItem;
      return {
        id: extendedItem.productId,
        title: extendedItem.productName,
        description: extendedItem.description,
        picture_url: extendedItem.imageUrl,
        category_id: extendedItem.categoryId,
        warranty: extendedItem.warranty || 'Garantía estándar Tifossi',
      };
    });
  }

  /**
   * Validate order data before building preference
   */
  private validateOrderData(orderData: ExtendedOrderData): void {
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
    if (!Object.values(ShippingMethod).includes(orderData.shippingMethod)) {
      throw new Error('Invalid shipping method');
    }

    // Validate shipping address for delivery orders
    if (orderData.shippingMethod === ShippingMethod.DELIVERY) {
      if (
        !orderData.shippingAddress ||
        !orderData.shippingAddress.street ||
        !orderData.shippingAddress.city
      ) {
        throw new Error('Shipping address is required for delivery orders');
      }
    }

    // Validate pickup location for pickup orders
    if (orderData.shippingMethod === ShippingMethod.PICKUP) {
      if (!orderData.pickupLocation || !orderData.pickupLocation.id) {
        throw new Error('Pickup location is required for pickup orders');
      }
    }
  }

  /**
   * Sanitize string for MercadoPago requirements
   */
  private sanitizeString(str: string | undefined, maxLength: number): string {
    if (!str) return '';

    // Remove special characters that might cause issues
    const sanitized = str.replace(/[<>'"&]/g, '').trim();

    // Truncate if too long
    return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
  }

  /**
   * Sanitize phone number
   */
  private sanitizePhoneNumber(phone: string | undefined): string {
    if (!phone) return '';

    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  }

  /**
   * Extract street number from address
   */
  private extractStreetNumber(numberStr: string | number | undefined): number {
    if (!numberStr) return 1;

    const num = parseInt(String(numberStr).replace(/\D/g, ''));
    return isNaN(num) || num <= 0 ? 1 : num;
  }

  /**
   * Format price to ensure correct decimal places
   */
  private formatPrice(price: number | string): number {
    const numPrice = parseFloat(String(price));
    if (isNaN(numPrice)) {
      throw new Error('Invalid price format');
    }

    // Round to 2 decimal places
    return Math.round(numPrice * 100) / 100;
  }

  /**
   * Calculate total amount from order data
   */
  calculateTotal(orderData: ExtendedOrderData): number {
    let total = 0;

    // Add item costs
    orderData.items.forEach((item) => {
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
   */
  buildTestPreference(externalReference: string): MPPreferenceRequest {
    return {
      items: [
        {
          id: 'test_item',
          title: 'Test Item',
          quantity: 1,
          unit_price: 100,
          currency_id: 'UYU',
        },
      ],
      external_reference: externalReference,
      payer: {
        name: 'Test',
        surname: 'User',
        email: 'test@example.com',
      },
      back_urls: {
        success: `${this.appScheme}://test/success`,
        failure: `${this.appScheme}://test/failure`,
        pending: `${this.appScheme}://test/pending`,
      },
      notification_url: this.buildNotificationUrl(),
      auto_return: this.config.autoReturn,
      binary_mode: false,
      expires: true,
      expiration_date_from: this.buildExpirationFrom(),
      expiration_date_to: this.buildExpirationTo(),
    };
  }
}

export default PreferenceBuilder;
