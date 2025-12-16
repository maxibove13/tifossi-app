/**
 * Order and Payment Type Definitions
 * Tifossi E-commerce Platform
 */

// Common interfaces
export interface TimestampedEntity {
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IdentifiableEntity {
  id: string | number;
}

export interface AuditableEntity extends TimestampedEntity {
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date | string | null;
}

// Order status enum - aligned with Strapi schema
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// Shipping method enum
export enum ShippingMethod {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
}

// Order item interface
export interface OrderItem {
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  size?: string;
  color?: string;
  sku?: string;
  image?: string;
}

// User information interface
export interface OrderUser {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: {
    areaCode: string;
    number: string;
  };
  identification?: {
    type: 'CI' | 'RUT' | 'OTRO';
    number: string;
  };
}

// Shipping address interface
export interface ShippingAddress {
  name?: string;
  addressLine1: string; // street + number combined
  addressLine2?: string; // apartment, additional info
  city: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Order data interface (for creating orders)
export interface OrderData {
  orderNumber: string;
  items: OrderItem[];
  user: OrderUser;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  shippingMethod: ShippingMethod;
  shippingCost: number;
  subtotal: number;
  discount: number;
  tax?: number;
  total: number;
  notes?: string;
  metadata?: Record<string, any>;
}

// Complete order interface (stored in database)
export interface Order extends OrderData, IdentifiableEntity, AuditableEntity {
  status: OrderStatus;
  paymentProvider?: string;
  mpPreferenceId?: string;
  mpPaymentId?: string;
  mpCollectionId?: string;
  mpCollectionStatus?: string;
  paidAt?: Date | string;
  shippedAt?: Date | string;
  deliveredAt?: Date | string;
  cancelledAt?: Date | string;
  refundedAt?: Date | string;
  trackingNumber?: string;
  trackingUrl?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  statusHistory: OrderStatusHistoryEntry[];
}

// Order status history entry
export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  changedAt: Date | string;
  changedBy?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

// Payment preference interface
export interface PaymentPreference {
  id: string;
  initPoint: string;
  sandboxInitPoint?: string;
  externalReference: string;
  createdAt: Date | string;
  expiresAt?: Date | string;
}

// Payment result interface
export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  status?: string;
  statusDetail?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// Payment verification response
export interface PaymentVerification {
  verified: boolean;
  payment?: {
    id: string;
    status: string;
    statusDetail: string;
    amount: number;
    currency: string;
    externalReference: string;
    paidAt?: Date | string;
  };
  order?: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
  };
  error?: string;
}

// Order summary for listings
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  customerName: string;
  customerEmail: string;
  createdAt: Date | string;
  paidAt?: Date | string;
}

// Order filters for queries
export interface OrderFilters {
  status?: OrderStatus | OrderStatus[];
  userId?: string;
  email?: string;
  orderNumber?: string;
  mpPaymentId?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  minAmount?: number;
  maxAmount?: number;
}

// Order statistics
export interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  statusBreakdown: Record<OrderStatus, number>;
  topProducts: {
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }[];
  periodComparison?: {
    current: {
      orders: number;
      revenue: number;
    };
    previous: {
      orders: number;
      revenue: number;
    };
    growth: {
      orders: number;
      revenue: number;
    };
  };
}

// Refund request interface
export interface RefundRequest {
  orderId: string;
  paymentId: string;
  amount?: number; // Partial refund if specified
  reason: string;
  items?: {
    productId: string;
    quantity: number;
  }[];
  requestedBy: string;
}

// Refund response interface
export interface RefundResponse {
  success: boolean;
  refundId?: string;
  amount?: number;
  status?: string;
  processedAt?: Date | string;
  error?: string;
}
