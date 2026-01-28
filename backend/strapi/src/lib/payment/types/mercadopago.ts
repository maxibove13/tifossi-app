/**
 * MercadoPago Type Definitions
 * Based on official MercadoPago API documentation
 */

// Payment status as defined by MercadoPago
export enum MPPaymentStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  IN_PROCESS = 'in_process',
  IN_MEDIATION = 'in_mediation',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  CHARGED_BACK = 'charged_back',
}

// Webhook event types
export enum MPWebhookType {
  PAYMENT = 'payment',
  MERCHANT_ORDER = 'merchant_order',
  CHARGEBACKS = 'chargebacks',
}

// Webhook actions
export enum MPWebhookAction {
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_UPDATED = 'payment.updated',
}

// Identification types for Uruguay
export enum UruguayIdType {
  CI = 'CI', // Cédula de Identidad
  RUT = 'RUT', // Registro Único Tributario
  OTRO = 'OTRO', // Other
}

// Payment method IDs
export enum PaymentMethodId {
  // Credit cards
  VISA = 'visa',
  MASTER = 'master',
  OCA = 'oca',
  DINERS = 'diners',
  LIDER = 'lider',

  // Cash payment points
  ABITAB = 'abitab',
  REDPAGOS = 'redpagos',

  // Bank transfer
  BANK_TRANSFER = 'bank_transfer',
}

// MercadoPago Webhook Payload
export interface MPWebhookPayload {
  id: number;
  live_mode: boolean;
  type: MPWebhookType;
  action: MPWebhookAction;
  date_created: string;
  data: {
    id: string;
  };
  user_id?: string;
  api_version?: string;
  application_id?: string;
}

// MercadoPago Preference Item
export interface MPPreferenceItem {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  quantity: number;
  unit_price: number;
  currency_id: 'UYU';
  picture_url?: string;
}

// MercadoPago Payer
export interface MPPayer {
  name: string;
  surname: string;
  email: string;
  phone?: {
    area_code: string;
    number: string;
  };
  identification?: {
    type: UruguayIdType;
    number: string;
  };
  address?: {
    street_name: string;
    street_number: number;
    city: string;
    federal_unit: string;
    zip_code: string;
  };
}

// MercadoPago Preference Request
export interface MPPreferenceRequest {
  items: MPPreferenceItem[];
  payer: MPPayer;
  external_reference: string;
  payment_methods?: {
    excluded_payment_methods?: { id: string }[];
    excluded_payment_types?: { id: string }[];
    installments?: number;
    default_installments?: number;
  };
  shipments?: {
    cost?: number;
    mode: string;
    receiver_address: {
      street_name: string;
      street_number: number;
      city_name: string;
      state_name: string;
      zip_code: string;
      country_name: string;
    };
  };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: 'approved' | 'all';
  statement_descriptor?: string;
  notification_url?: string;
  binary_mode?: boolean;
  three_d_secure_mode?: 'optional' | 'not_supported';
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
  additional_info?: string;
}

// MercadoPago Preference Response
export interface MPPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
  external_reference: string;
  date_created: string;
  date_of_expiration?: string;
  collector_id: number;
  client_id: string;
  marketplace?: string;
  marketplace_fee?: number;
  shipments?: any;
  notification_url?: string;
  additional_info?: string;
  items: MPPreferenceItem[];
  payer: MPPayer;
  payment_methods?: any;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
}

// MercadoPago Payment Response
export interface MPPaymentResponse {
  id: number;
  status: MPPaymentStatus;
  status_detail: string;
  payment_type_id: string;
  payment_method_id: string;
  transaction_amount: number;
  transaction_amount_refunded: number;
  currency_id: string;
  date_created: string;
  date_approved?: string;
  date_last_updated: string;
  date_of_expiration?: string;
  money_release_date?: string;
  collector_id: number;
  payer: {
    id?: string;
    email: string;
    identification?: {
      type: string;
      number: string;
    };
    type?: string;
  };
  metadata?: Record<string, any>;
  external_reference?: string;
  transaction_details?: {
    net_received_amount: number;
    total_paid_amount: number;
    overpaid_amount: number;
    installment_amount?: number;
    financial_institution?: string;
    payment_method_reference_id?: string;
  };
  fee_details?: {
    type: string;
    fee_payer: string;
    amount: number;
  }[];
  captured?: boolean;
  binary_mode?: boolean;
  live_mode?: boolean;
  order?: {
    id: string;
    type: string;
  };
  card?: {
    first_six_digits?: string;
    last_four_digits?: string;
    expiration_month?: number;
    expiration_year?: number;
    cardholder?: {
      name?: string;
      identification?: {
        type: string;
        number: string;
      };
    };
  };
  statement_descriptor?: string;
  notification_url?: string;
  refunds?: {
    id: number;
    payment_id: number;
    amount: number;
    metadata?: Record<string, any>;
    source: {
      id: string;
      name: string;
      type: string;
    };
    date_created: string;
  }[];
  processing_mode?: string;
  merchant_account_id?: string;
  acquirer?: string;
  merchant_number?: string;
  point_of_interaction?: {
    type: string;
    business_info?: {
      unit: string;
      sub_unit: string;
    };
  };
}

// MercadoPago Refund Request
export interface MPRefundRequest {
  amount?: number; // If not specified, full refund
  metadata?: Record<string, any>;
  reason?: string;
}

// MercadoPago Refund Response
export interface MPRefundResponse {
  id: number;
  payment_id: number;
  amount: number;
  metadata?: Record<string, any>;
  source: {
    id: string;
    name: string;
    type: string;
  };
  date_created: string;
  unique_sequence_number?: string;
  refund_mode?: string;
  adjustment_amount?: number;
  status?: string;
  reason?: string;
}

// MercadoPago API Error Response
export interface MPErrorResponse {
  message: string;
  error: string;
  status: number;
  cause?: {
    code: string;
    description: string;
    data?: any;
  }[];
}

// Status detail mappings for better error messages
export const MPStatusDetailMessages: Record<string, string> = {
  accredited: 'Pago acreditado',
  pending_contingency: 'Pendiente de contingencia',
  pending_review_manual: 'Pendiente de revisión manual',
  pending_challenge: 'Pendiente de autenticación 3DS',
  cc_rejected_insufficient_amount: 'Fondos insuficientes',
  cc_rejected_bad_filled_security_code: 'Código de seguridad incorrecto',
  cc_rejected_bad_filled_date: 'Fecha de vencimiento incorrecta',
  cc_rejected_bad_filled_card_number: 'Número de tarjeta incorrecto',
  cc_rejected_high_risk: 'Rechazado por alto riesgo',
  cc_rejected_invalid_installments: 'Cuotas inválidas',
  cc_rejected_max_attempts: 'Máximo de intentos alcanzado',
  cc_rejected_card_disabled: 'Tarjeta deshabilitada',
  cc_rejected_3ds_challenge: 'Rechazado por fallo en autenticación 3DS',
  cc_rejected_other_reason: 'Rechazado por otro motivo',
  pending_waiting_transfer: 'Esperando transferencia',
  pending_waiting_payment: 'Esperando pago',
};
