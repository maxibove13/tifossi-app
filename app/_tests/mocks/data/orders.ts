/**
 * Realistic Order Mock Data for Testing
 * Various order states, payment methods, and order flows
 */

import { getRandomUser } from './users';
import { getRandomProduct } from './products';

export interface MockOrderItem {
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  price: number;
  discountedPrice?: number;
  size?: string;
  color?: string;
  imageUrl?: string;
}

export interface MockOrder {
  id: string;
  orderNumber: string;
  status:
    | 'CREATED'
    | 'PAYMENT_PENDING'
    | 'PAID'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'REFUNDED';
  items: MockOrderItem[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  shippingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    street: string;
    number: string;
    apartment?: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
    phone?: string;
  };
  shippingMethod: 'delivery' | 'pickup';
  shippingCost: number;
  subtotal: number;
  discount: number;
  total: number;
  paymentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED';
  paymentMethod?: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  notes?: string;
  statusHistory?: {
    status: string;
    timestamp: string;
    description: string;
    location?: string;
  }[];
}

// Shipping methods with costs
const shippingCosts = {
  pickup: 0,
  montevideo: 150, // UYU
  interior: 280, // UYU
  express: 450, // UYU
};

// Payment methods available in Uruguay
const paymentMethods = [
  'MercadoPago - Tarjeta de Crédito',
  'MercadoPago - Tarjeta de Débito',
  'MercadoPago - PagoFacil',
  'MercadoPago - RedPagos',
  'MercadoPago - Transferencia',
  'MercadoPago - Efectivo',
  'Visa',
  'Mastercard',
  'OCA',
  'Creditel',
];

// Generate realistic order number
const generateOrderNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  return `TIF-${year}${month}${day}-${timestamp}`;
};

// Generate realistic tracking number
const generateTrackingNumber = (): string => {
  const prefixes = ['DAC', 'CA', 'UES', 'RR', 'TF'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, '0');
  return `${prefix}${number}UY`;
};

// Calculate estimated delivery date
const calculateDeliveryDate = (shippingMethod: string, createdAt: string): string => {
  const created = new Date(createdAt);
  let deliveryDays: number;

  switch (shippingMethod) {
    case 'pickup':
      deliveryDays = 0; // Same day pickup
      break;
    case 'express':
      deliveryDays = 1; // Next day
      break;
    case 'montevideo':
      deliveryDays = Math.floor(Math.random() * 3) + 2; // 2-4 days
      break;
    default:
      deliveryDays = Math.floor(Math.random() * 5) + 3; // 3-7 days interior
  }

  const deliveryDate = new Date(created.getTime() + deliveryDays * 24 * 60 * 60 * 1000);
  return deliveryDate.toISOString();
};

// Generate status history for an order
const generateStatusHistory = (order: Partial<MockOrder>): MockOrder['statusHistory'] => {
  const history: MockOrder['statusHistory'] = [];
  const createdAt = new Date(order.createdAt!);

  // Always starts with CREATED
  history.push({
    status: 'CREATED',
    timestamp: order.createdAt!,
    description: 'Pedido creado exitosamente',
    location: 'Tifossi Uruguay',
  });

  if (['PAYMENT_PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status!)) {
    history.push({
      status: 'PAYMENT_PENDING',
      timestamp: new Date(createdAt.getTime() + 5 * 60 * 1000).toISOString(), // 5 minutes later
      description: 'Esperando confirmación de pago',
      location: 'Sistema de Pagos',
    });
  }

  if (['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status!)) {
    history.push({
      status: 'PAID',
      timestamp: new Date(createdAt.getTime() + 30 * 60 * 1000).toISOString(), // 30 minutes later
      description: 'Pago confirmado - Procesando pedido',
      location: 'Centro de Operaciones',
    });
  }

  if (['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status!)) {
    history.push({
      status: 'PROCESSING',
      timestamp: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
      description: 'Pedido en preparación',
      location: 'Centro de Distribución - Montevideo',
    });
  }

  if (['SHIPPED', 'DELIVERED'].includes(order.status!)) {
    history.push({
      status: 'SHIPPED',
      timestamp: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 1 day later
      description: 'Pedido despachado para entrega',
      location: 'En tránsito',
    });
  }

  if (order.status === 'DELIVERED') {
    const deliveryDate =
      order.estimatedDelivery ||
      new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    history.push({
      status: 'DELIVERED',
      timestamp: deliveryDate,
      description: 'Pedido entregado exitosamente',
      location: order.shippingAddress!.city || 'Destino',
    });
  }

  if (order.status === 'CANCELLED') {
    const cancelDate = new Date(
      createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000
    ).toISOString();
    history.push({
      status: 'CANCELLED',
      timestamp: cancelDate,
      description: 'Pedido cancelado por solicitud del cliente',
      location: 'Tifossi Uruguay',
    });
  }

  if (order.status === 'REFUNDED') {
    const refundDate = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    history.push({
      status: 'REFUNDED',
      timestamp: refundDate,
      description: 'Reembolso procesado exitosamente',
      location: 'Departamento de Finanzas',
    });
  }

  return history;
};

// Generate order items from products
const generateOrderItems = (
  itemCount: number = Math.floor(Math.random() * 4) + 1
): MockOrderItem[] => {
  const items: MockOrderItem[] = [];

  for (let i = 0; i < itemCount; i++) {
    const product = getRandomProduct();
    const quantity = Math.floor(Math.random() * 3) + 1;
    const size =
      product.attributes.sizes.length > 0
        ? product.attributes.sizes[Math.floor(Math.random() * product.attributes.sizes.length)]
        : undefined;
    const color =
      product.attributes.colors.length > 0
        ? product.attributes.colors[Math.floor(Math.random() * product.attributes.colors.length)]
        : undefined;

    items.push({
      productId: product.id,
      productName: product.attributes.name,
      description: `${product.attributes.shortDescription.line1} - ${product.attributes.shortDescription.line2}`,
      quantity,
      price: product.attributes.price,
      discountedPrice: product.attributes.discountPrice,
      size,
      color,
      imageUrl: product.attributes.images.data[0]?.attributes.url,
    });
  }

  return items;
};

// Calculate order totals
const calculateOrderTotals = (
  items: MockOrderItem[],
  shippingMethod: 'delivery' | 'pickup',
  city?: string
) => {
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = item.discountedPrice || item.price;
    return sum + itemPrice * item.quantity;
  }, 0);

  const discount = Math.random() > 0.8 ? Math.floor(subtotal * 0.1) : 0; // 10% discount sometimes

  let shippingCost = 0;
  if (shippingMethod === 'delivery') {
    if (city?.toLowerCase().includes('montevideo')) {
      shippingCost = shippingCosts.montevideo;
    } else {
      shippingCost = shippingCosts.interior;
    }

    // Free shipping for orders over $3000 UYU
    if (subtotal > 3000) {
      shippingCost = 0;
    }
  }

  const total = subtotal - discount + shippingCost;

  return { subtotal, discount, shippingCost, total };
};

// Generate mock orders
export const orderMockData: MockOrder[] = [];

// Order statuses with their probabilities
const orderStatuses: { status: MockOrder['status']; probability: number }[] = [
  { status: 'CREATED', probability: 0.05 },
  { status: 'PAYMENT_PENDING', probability: 0.1 },
  { status: 'PAID', probability: 0.15 },
  { status: 'PROCESSING', probability: 0.2 },
  { status: 'SHIPPED', probability: 0.25 },
  { status: 'DELIVERED', probability: 0.2 },
  { status: 'CANCELLED', probability: 0.03 },
  { status: 'REFUNDED', probability: 0.02 },
];

// Generate orders for the last 6 months
for (let i = 1; i <= 150; i++) {
  const user = getRandomUser();
  const address = user.addresses[Math.floor(Math.random() * user.addresses.length)];
  const shippingMethod: 'delivery' | 'pickup' = Math.random() > 0.85 ? 'pickup' : 'delivery';

  // Select status based on probabilities
  let cumulativeProbability = 0;
  const randomValue = Math.random();
  let selectedStatus: MockOrder['status'] = 'CREATED';

  for (const { status, probability } of orderStatuses) {
    cumulativeProbability += probability;
    if (randomValue <= cumulativeProbability) {
      selectedStatus = status;
      break;
    }
  }

  const items = generateOrderItems();
  const { subtotal, discount, shippingCost, total } = calculateOrderTotals(
    items,
    shippingMethod,
    address.city
  );

  // Generate creation date within last 6 months
  const createdDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);

  const order: MockOrder = {
    id: `order_${i}`,
    orderNumber: generateOrderNumber(),
    status: selectedStatus,
    items,
    user: {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
    },
    shippingAddress: {
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
      street: address.street,
      number: address.number,
      apartment: address.apartment,
      city: address.city,
      state: address.state,
      country: address.country,
      zipCode: address.zipCode,
      phone: address.phone,
    },
    shippingMethod,
    shippingCost,
    subtotal,
    discount,
    total,
    paymentStatus:
      selectedStatus === 'CANCELLED' || selectedStatus === 'REFUNDED'
        ? 'CANCELLED'
        : selectedStatus === 'CREATED' || selectedStatus === 'PAYMENT_PENDING'
          ? 'PENDING'
          : 'APPROVED',
    paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
    paymentId: `mp_${Math.random().toString(36).substr(2, 15)}`,
    createdAt: createdDate.toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedDelivery: calculateDeliveryDate(shippingMethod, createdDate.toISOString()),
    trackingNumber: ['SHIPPED', 'DELIVERED'].includes(selectedStatus)
      ? generateTrackingNumber()
      : undefined,
    notes: Math.random() > 0.8 ? 'Entregar en horario de oficina' : undefined,
  };

  // Generate status history
  order.statusHistory = generateStatusHistory(order);

  orderMockData.push(order);
}

// Add some specific test orders with known data
const testOrders: MockOrder[] = [
  {
    id: 'test_order_1',
    orderNumber: 'TIF-20241201-123456',
    status: 'DELIVERED',
    items: [
      {
        productId: '1',
        productName: 'Camiseta Oficial Nacional',
        description: 'Camiseta oficial Nacional - Temporada 2024',
        quantity: 1,
        price: 89.99,
        size: 'M',
        color: 'Azul',
        imageUrl: '/uploads/products/nacional/jerseys/1_1.jpg',
      },
      {
        productId: '5',
        productName: 'Gorra Oficial Nacional',
        description: 'Gorra oficial Nacional - Ajuste perfecto',
        quantity: 1,
        price: 29.99,
        color: 'Azul',
        imageUrl: '/uploads/products/nacional/caps/5_1.jpg',
      },
    ],
    user: {
      id: '100',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@tifossi.com',
      phone: '+598 099 123 456',
    },
    shippingAddress: {
      firstName: 'Test',
      lastName: 'User',
      street: 'Avenida 18 de Julio',
      number: '1234',
      apartment: '5A',
      city: 'Centro',
      state: 'Montevideo',
      country: 'Uruguay',
      zipCode: '11100',
      phone: '+598 099 123 456',
    },
    shippingMethod: 'delivery',
    shippingCost: 0, // Free shipping
    subtotal: 119.98,
    discount: 0,
    total: 119.98,
    paymentStatus: 'APPROVED',
    paymentMethod: 'MercadoPago - Tarjeta de Crédito',
    paymentId: 'mp_test_payment_123',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    trackingNumber: 'DAC123456789UY',
    notes: 'Cliente VIP - Envío prioritario',
    statusHistory: [
      {
        status: 'CREATED',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Pedido creado exitosamente',
        location: 'Tifossi Uruguay',
      },
      {
        status: 'PAID',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        description: 'Pago confirmado',
        location: 'MercadoPago',
      },
      {
        status: 'PROCESSING',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Pedido en preparación',
        location: 'Centro de Distribución',
      },
      {
        status: 'SHIPPED',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Pedido despachado',
        location: 'En tránsito',
      },
      {
        status: 'DELIVERED',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Pedido entregado exitosamente',
        location: 'Centro, Montevideo',
      },
    ],
  },
  {
    id: 'test_order_2',
    orderNumber: 'TIF-20241202-789012',
    status: 'PROCESSING',
    items: [
      {
        productId: '10',
        productName: 'Camiseta Oficial Peñarol',
        description: 'Camiseta oficial Peñarol - Temporada 2024',
        quantity: 2,
        price: 94.99,
        discountedPrice: 84.99,
        size: 'L',
        color: 'Amarillo',
        imageUrl: '/uploads/products/penarol/jerseys/10_1.jpg',
      },
    ],
    user: {
      id: '102',
      firstName: 'Regular',
      lastName: 'Usuario',
      email: 'user@tifossi.com',
      phone: '+598 2 555 1234',
    },
    shippingAddress: {
      firstName: 'Regular',
      lastName: 'Usuario',
      street: 'Canelones',
      number: '999',
      city: 'Cordón',
      state: 'Montevideo',
      country: 'Uruguay',
      zipCode: '11200',
    },
    shippingMethod: 'delivery',
    shippingCost: 150,
    subtotal: 169.98,
    discount: 20, // 10% discount
    total: 299.98,
    paymentStatus: 'APPROVED',
    paymentMethod: 'MercadoPago - PagoFacil',
    paymentId: 'mp_test_payment_456',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    statusHistory: [
      {
        status: 'CREATED',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Pedido creado exitosamente',
        location: 'Tifossi Uruguay',
      },
      {
        status: 'PAID',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
        description: 'Pago confirmado',
        location: 'PagoFacil',
      },
      {
        status: 'PROCESSING',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Pedido en preparación',
        location: 'Centro de Distribución',
      },
    ],
  },
];

orderMockData.push(...testOrders);

// Utility functions for order data
export const getOrdersByStatus = (status: MockOrder['status']): MockOrder[] => {
  return orderMockData.filter((order) => order.status === status);
};

export const getOrdersByUser = (userId: string): MockOrder[] => {
  return orderMockData.filter((order) => order.user.id === userId);
};

export const getOrderById = (id: string): MockOrder | undefined => {
  return orderMockData.find((order) => order.id === id);
};

export const getOrdersByDateRange = (startDate: Date, endDate: Date): MockOrder[] => {
  return orderMockData.filter((order) => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startDate && orderDate <= endDate;
  });
};

export const getRecentOrders = (days: number = 30): MockOrder[] => {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return orderMockData.filter((order) => new Date(order.createdAt) >= cutoffDate);
};

export const getPendingOrders = (): MockOrder[] => {
  return orderMockData.filter((order) =>
    ['CREATED', 'PAYMENT_PENDING', 'PAID', 'PROCESSING', 'SHIPPED'].includes(order.status)
  );
};

export const getCompletedOrders = (): MockOrder[] => {
  return orderMockData.filter((order) => order.status === 'DELIVERED');
};

export const getCancelledOrders = (): MockOrder[] => {
  return orderMockData.filter((order) => ['CANCELLED', 'REFUNDED'].includes(order.status));
};

export const getOrdersByPaymentMethod = (method: string): MockOrder[] => {
  return orderMockData.filter((order) =>
    order.paymentMethod?.toLowerCase().includes(method.toLowerCase())
  );
};

export const getOrdersWithTracking = (): MockOrder[] => {
  return orderMockData.filter((order) => order.trackingNumber);
};

// Generate a new order from request data
export const generateOrder = (orderData: any): MockOrder => {
  const user = getRandomUser();
  const orderNumber = generateOrderNumber();
  const createdAt = new Date().toISOString();

  const { subtotal, discount, shippingCost, total } = calculateOrderTotals(
    orderData.items || [],
    orderData.shippingMethod || 'delivery',
    orderData.shippingAddress?.city
  );

  const order: MockOrder = {
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orderNumber,
    status: 'CREATED',
    items: orderData.items || [],
    user: orderData.user || {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
    },
    shippingAddress: orderData.shippingAddress || user.addresses[0],
    shippingMethod: orderData.shippingMethod || 'delivery',
    shippingCost,
    subtotal,
    discount,
    total,
    paymentStatus: 'PENDING',
    createdAt,
    updatedAt: createdAt,
    estimatedDelivery: calculateDeliveryDate(orderData.shippingMethod || 'delivery', createdAt),
    notes: orderData.notes,
  };

  order.statusHistory = generateStatusHistory(order);

  return order;
};

export default orderMockData;
