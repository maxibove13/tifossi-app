/**
 * MercadoPago Mobile Payment Service
 * Handles payment flow integration for Tifossi Expo
 */

import * as WebBrowser from 'expo-web-browser';
import { endpoints } from '../../_config/endpoints';
import { deviceFingerprintService } from '../device/fingerprint';

export interface OrderData {
  id?: string;
  orderNumber: string;
  items: OrderItem[];
  user: UserData;
  shippingAddress: ShippingAddress;
  shippingMethod: 'delivery' | 'pickup';
  shippingCost: number;
  subtotal: number;
  discount?: number;
  total: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: {
    areaCode?: string;
    number: string;
  };
  identification?: {
    type: 'CI' | 'CE' | 'RUT';
    number: string;
  };
}

export interface ShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
}

export interface PaymentPreference {
  id: string;
  initPoint: string;
  externalReference: string;
}

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  collectionId?: string;
  status?: 'approved' | 'rejected' | 'pending';
  error?: string;
}

export interface PaymentStatus {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentInfo?: {
    id: string;
    status: string;
    statusDetail: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    dateCreated: string;
    dateApproved?: string;
  };
}

class MercadoPagoService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    // Get base URL from centralized configuration
    this.baseUrl = endpoints.baseUrl;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Create payment preference for an order
   */
  async createPaymentPreference(orderData: OrderData): Promise<PaymentPreference> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication required');
      }

      // Get device fingerprint for fraud prevention
      const deviceFingerprint = await deviceFingerprintService.getDeviceFingerprint();

      const response = await fetch(`${this.baseUrl}/api/payment/create-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          orderData,
          deviceFingerprint,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: Failed to create payment preference`
        );
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('Invalid response format');
      }

      return {
        id: result.data.preference.id,
        initPoint: result.data.preference.initPoint,
        externalReference: result.data.preference.externalReference,
      };
    } catch (error) {
      throw new Error(
        `Failed to create payment preference: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Open payment flow using WebBrowser
   */
  async initiatePayment(preference: PaymentPreference): Promise<PaymentResult> {
    try {
      // Configure WebBrowser for better UX
      await WebBrowser.warmUpAsync();

      // Open MercadoPago payment page
      const result = await WebBrowser.openBrowserAsync(preference.initPoint, {
        // iOS options
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: '#0C0C0C',

        // Android options
        showTitle: true,
        enableBarCollapsing: false,

        // Common options
        toolbarColor: '#FFFFFF',
        showInRecents: false,
      });

      // Cool down WebBrowser
      await WebBrowser.coolDownAsync();

      if (result.type === 'cancel') {
        return {
          success: false,
          error: 'Pago cancelado por el usuario',
        };
      }

      // The actual payment result will be handled via deep link
      // This method returns immediately after opening the browser
      return {
        success: true,
        orderId: preference.externalReference,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'No se pudo abrir la página de pago',
      };
    }
  }

  /**
   * Process deep link callback from MercadoPago
   */
  parsePaymentCallback(url: string): PaymentResult | null {
    try {
      // Parse URL using URL constructor instead of Linking.parse
      const urlObj = new URL(url);

      // Security: Validate URL scheme to prevent deep link hijacking
      if (urlObj.protocol !== 'tifossi:') {
        console.warn('[MercadoPago] Invalid deep link scheme:', urlObj.protocol);
        return null;
      }

      // Security: Validate URL host
      const host = urlObj.hostname || urlObj.host;
      if (host !== 'payment') {
        console.warn('[MercadoPago] Invalid deep link host:', host);
        return null;
      }

      const path = urlObj.pathname;
      if (!path) {
        return null;
      }

      // Extract payment result from URL
      // Format: tifossi://payment/{status}?params...
      const pathParts = path.split('/');
      const status = pathParts[pathParts.length - 1]; // 'success', 'failure', or 'pending'

      // Validate status is one of expected values
      if (!['success', 'failure', 'pending'].includes(status)) {
        console.warn('[MercadoPago] Invalid payment status in URL:', status);
        return null;
      }

      // Convert URLSearchParams to Record<string, any>
      const params: Record<string, any> = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      // Validate payment_id format (must be numeric)
      const paymentId = params.payment_id as string;
      if (paymentId) {
        if (!/^\d+$/.test(paymentId)) {
          console.warn('[MercadoPago] Invalid payment_id format:', paymentId);
          return {
            success: false,
            error: 'Invalid payment ID format',
          };
        }
      }

      // Validate external_reference format (should be order number format)
      const externalReference = params.external_reference as string;
      if (externalReference) {
        // Order numbers should be alphanumeric with hyphens
        if (!/^[A-Z0-9-]+$/.test(externalReference)) {
          console.warn('[MercadoPago] Invalid external_reference format:', externalReference);
          return {
            success: false,
            error: 'Invalid order reference format',
          };
        }
      }

      // Validate merchant_order_id format (must be numeric if present)
      const merchantOrderId = params.merchant_order_id as string;
      if (merchantOrderId && !/^\d+$/.test(merchantOrderId)) {
        console.warn('[MercadoPago] Invalid merchant_order_id format:', merchantOrderId);
        return {
          success: false,
          error: 'Invalid merchant order ID format',
        };
      }

      // Prevent parameter injection - check for suspicious characters
      const allParams = Object.entries(params);
      for (const [key, value] of allParams) {
        // Check for code injection attempts
        if (typeof value === 'string' && /[<>'"{}()\[\]\\]/.test(value)) {
          console.warn('[MercadoPago] Suspicious parameter detected:', { key, value });
          return {
            success: false,
            error: 'Invalid parameter format',
          };
        }

        // Check for excessively long values (potential DoS)
        if (typeof value === 'string' && value.length > 255) {
          console.warn('[MercadoPago] Parameter too long:', { key, length: value.length });
          return {
            success: false,
            error: 'Parameter exceeds maximum length',
          };
        }
      }

      const paymentStatus = this.mapUrlStatusToPaymentStatus(status);

      return {
        success: status === 'success',
        orderId: params.external_reference as string,
        paymentId: params.payment_id as string,
        collectionId: params.collection_id as string,
        status: paymentStatus,
        error: status === 'failure' ? 'El pago fue rechazado' : undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Verify payment status with backend
   */
  async verifyPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/api/payment/verify/${paymentId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to verify payment`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('Invalid response format');
      }

      return result.data;
    } catch (error) {
      throw new Error(
        `Failed to verify payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get user orders
   */
  async getUserOrders(page: number = 1, pageSize: number = 10, status?: string): Promise<any> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(status && { status }),
      });

      const response = await fetch(`${this.baseUrl}/api/payment/orders?${params}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch orders`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error('Failed to fetch orders');
      }

      return result.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch orders: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get specific order details
   */
  async getOrder(orderId: string): Promise<any> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/api/payment/orders/${orderId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch order`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('Invalid response format');
      }

      return result.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch order: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Request refund for an order
   */
  async requestRefund(orderId: string, reason?: string): Promise<any> {
    try {
      if (!this.authToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/api/payment/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({ orderId, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to process refund`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('Invalid response format');
      }

      return result.data;
    } catch (error) {
      throw new Error(
        `Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate order number
   */
  generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6);

    return `TIF-${year}${month}${day}-${timestamp}`;
  }

  /**
   * Validate order data before processing
   */
  validateOrderData(orderData: OrderData): string[] {
    const errors: string[] = [];

    // Required fields validation
    if (!orderData.items || orderData.items.length === 0) {
      errors.push('El pedido debe contener al menos un artículo');
    }

    if (!orderData.user?.email) {
      errors.push('El email del usuario es requerido');
    }

    if (!orderData.shippingAddress?.addressLine1) {
      errors.push('La dirección de envío es requerida');
    }

    if (!orderData.total || orderData.total <= 0) {
      errors.push('Total del pedido inválido');
    }

    // Email validation
    if (orderData.user?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(orderData.user.email)) {
        errors.push('Formato de email inválido');
      }
    }

    // Items validation
    orderData.items?.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Artículo ${index + 1}: ID del producto es requerido`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Artículo ${index + 1}: Cantidad válida es requerida`);
      }
      if (!item.price || item.price <= 0) {
        errors.push(`Artículo ${index + 1}: Precio válido es requerido`);
      }
    });

    return errors;
  }

  /**
   * Map URL status to payment status
   */
  private mapUrlStatusToPaymentStatus(urlStatus: string): 'approved' | 'rejected' | 'pending' {
    const statusMap: Record<string, 'approved' | 'rejected' | 'pending'> = {
      success: 'approved',
      failure: 'rejected',
      pending: 'pending',
    };

    return statusMap[urlStatus] || 'pending';
  }

  /**
   * Get user-friendly status message
   */
  getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      CREATED: 'Pedido creado',
      PAYMENT_PENDING: 'Esperando pago',
      PAID: 'Pago confirmado',
      PROCESSING: 'Procesando pedido',
      SHIPPED: 'Pedido enviado',
      DELIVERED: 'Pedido entregado',
      CANCELLED: 'Pedido cancelado',
      REFUNDED: 'Pedido reembolsado',
    };

    return messages[status] || 'Estado desconocido';
  }
}

// Export singleton instance
export const mercadoPagoService = new MercadoPagoService();
export default mercadoPagoService;
