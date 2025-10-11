/**
 * MercadoPago Type Definitions
 * Shared types for backend payment processing
 */

export interface MercadoPagoWebhookPayload {
  id: number;
  live_mode: boolean;
  type: 'payment' | 'merchant_order' | 'chargebacks';
  action: string;
  date_created: string;
  data: {
    id: string;
  };
  user_id?: string;
  api_version?: string;
}

export interface MercadoPagoPayment {
  id: string;
  status:
    | 'approved'
    | 'pending'
    | 'authorized'
    | 'in_process'
    | 'in_mediation'
    | 'rejected'
    | 'cancelled'
    | 'refunded'
    | 'charged_back';
  status_detail: string;
  transaction_amount: number;
  currency_id: 'UYU';
  external_reference: string;
  payment_method_id: string;
  payment_type_id: string;
  date_created: string;
  date_approved?: string;
  date_last_updated: string;
  payer: {
    email: string;
    identification?: {
      type: 'CI' | 'RUT' | 'OTRO';
      number: string;
    };
  };
}

export interface MercadoPagoPreference {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
  external_reference: string;
  items: {
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: 'UYU';
  }[];
  payer: {
    name: string;
    surname: string;
    email: string;
    phone?: {
      area_code: string;
      number: string;
    };
    identification?: {
      type: string;
      number: string;
    };
  };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
}

export interface WebhookHeaders {
  'x-signature': string;
  'x-request-id': string;
}

export interface OrderStatus {
  PENDING: 'PENDING';
  PAYMENT_PENDING: 'PAYMENT_PENDING';
  PAID: 'PAID';
  PAYMENT_FAILED: 'PAYMENT_FAILED';
  PROCESSING: 'PROCESSING';
  SHIPPED: 'SHIPPED';
  DELIVERED: 'DELIVERED';
  CANCELLED: 'CANCELLED';
  REFUNDED: 'REFUNDED';
}

// Legacy module augmentations removed (implementation converted to TypeScript)
