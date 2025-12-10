import { randomUUID } from 'crypto';

const DEFAULT_SHIPPING_THRESHOLD = 100;
const DEFAULT_SHIPPING_FEE = 10;

// Type definitions
interface RawAddress {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  phoneNumber?: string;
  isDefault?: boolean;
}

interface RawOrderItem {
  productId: number | string;
  quantity: number | string;
  color?: string;
  size?: string;
  customizations?: any;
  notes?: string;
}

interface RawOrder {
  shippingMethod?: string;
  items: RawOrderItem[];
  discount?: number | string;
  shippingAddress: RawAddress;
  storeLocationId?: number | string;
  storeLocationCode?: string;
}

interface AuthUser {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phone?: string;
}

interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

interface ProductEntity {
  id: number;
  title: string;
  price: number | string;
  discountedPrice?: number | string | null;
  slug: string;
  longDescription?: string;
  frontImage?: {
    url?: string;
  };
}

interface ShippingComponent {
  firstName: string;
  lastName: string;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  phoneNumber: string | null;
  isDefault: boolean;
  type: 'both' | 'shipping';
}

interface ItemForPersistence {
  product: number;
  productSnapshot: {
    id: number;
    title: string;
    slug: string;
    price: number | null;
    discountedPrice: number | null;
    description?: string;
    image: string | null;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedColor: string | null;
  selectedSize: string | null;
  customizations: any;
  notes: string | null;
}

interface ItemForClient {
  productId: number;
  productName: string;
  description: string | null;
  quantity: number;
  price: number;
  discountedPrice?: number;
  totalPrice: number;
  size: string | null;
  color: string | null;
  imageUrl: string | null;
}

interface ClientShippingAddress {
  firstName: string;
  lastName: string;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  phoneNumber: string | null;
}

interface MercadoPagoAddress {
  addressLine1: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
}

interface MercadoPagoUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: {
    areaCode: string;
    number: string;
  };
}

interface OrderMetadata {
  createdVia: string;
  userAgent: string;
  ipAddress: string;
  correlationId: string;
}

interface ClientSummary {
  items: ItemForClient[];
  shippingAddress: ClientShippingAddress | null; // null for pickup orders
  shippingMethod: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
}

interface MercadoPagoPayload {
  items: {
    productId: number;
    productName: string;
    description: string | null;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
  }[];
  address: MercadoPagoAddress | null; // null for pickup orders
  user: MercadoPagoUser;
}

interface SanitizedOrderResult {
  orderNumber: string;
  shippingMethod: string;
  storeLocationId: number | null;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  metadata: OrderMetadata;
  itemsForPersistence: ItemForPersistence[];
  shippingAddressComponent: ShippingComponent | null; // null for pickup orders
  clientSummary: ClientSummary;
  mercadoPagoPayload: MercadoPagoPayload;
}

interface OrderEntity {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  user?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ClientOrder {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  shippingMethod: string;
  items: ItemForClient[];
  shippingAddress: ClientShippingAddress;
  user: {
    id?: number;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface SanitizeOrderPayloadParams {
  strapi: any;
  rawOrder: RawOrder;
  authUser: AuthUser;
  requestMeta?: RequestMeta;
}

interface GuestInfo {
  email: string;
  name?: string;
  phone?: string;
}

interface SanitizeGuestOrderPayloadParams {
  strapi: any;
  rawOrder: RawOrder;
  guestInfo: GuestInfo;
  requestMeta?: RequestMeta;
}

// Utility functions
const ensureArray = <T>(arr: T | T[]): T[] => (Array.isArray(arr) ? arr : []);

const toNumber = (value: any): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
};

export const generateOrderNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);

  return `TIF-${year}${month}${day}-${timestamp}`;
};

export const calculateShippingCost = (shippingMethod: string, subtotal: number): number => {
  if (shippingMethod === 'pickup') {
    return 0;
  }

  if (subtotal >= DEFAULT_SHIPPING_THRESHOLD) {
    return 0;
  }

  return DEFAULT_SHIPPING_FEE;
};

export const buildShippingComponent = (
  address: RawAddress,
  shippingMethod: string
): ShippingComponent | null => {
  // For pickup orders, shipping address is optional
  if (!address) {
    if (shippingMethod === 'pickup') {
      return null;
    }
    throw new Error('Shipping address is required for delivery orders');
  }

  const requiredFields: (keyof RawAddress)[] = [
    'firstName',
    'lastName',
    'addressLine1',
    'city',
    'country',
  ];
  const missing = requiredFields.filter((field) => !address[field]);

  if (missing.length) {
    throw new Error(`Missing required address fields: ${missing.join(', ')}`);
  }

  return {
    firstName: address.firstName,
    lastName: address.lastName,
    company: address.company || null,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 || null,
    city: address.city,
    state: address.state || null,
    postalCode: address.postalCode || null,
    country: address.country,
    phoneNumber: address.phoneNumber || null,
    isDefault: Boolean(address.isDefault),
    type: shippingMethod === 'pickup' ? 'both' : 'shipping',
  };
};

export const buildClientShippingAddress = (address: RawAddress): ClientShippingAddress | null => {
  if (!address) {
    return null;
  }
  return {
    firstName: address.firstName,
    lastName: address.lastName,
    company: address.company || null,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 || null,
    city: address.city,
    state: address.state || null,
    country: address.country,
    postalCode: address.postalCode || null,
    phoneNumber: address.phoneNumber || null,
  };
};

export const buildMercadoPagoAddress = (address: RawAddress): MercadoPagoAddress | null => {
  if (!address) {
    return null;
  }
  return {
    addressLine1: address.addressLine1,
    city: address.city,
    state: address.state || undefined,
    country: address.country,
    postalCode: address.postalCode || undefined,
  };
};

export const buildMercadoPagoUser = (user: AuthUser): MercadoPagoUser => {
  const phoneNumber = user.phoneNumber || user.phone;

  return {
    id: String(user.id),
    firstName: user.firstName || user.username || 'Usuario',
    lastName: user.lastName || '',
    email: user.email,
    phone: phoneNumber
      ? {
          areaCode: '598',
          number: phoneNumber,
        }
      : undefined,
  };
};

export const buildMercadoPagoGuestUser = (guestInfo: GuestInfo): MercadoPagoUser => {
  const nameParts = guestInfo.name?.split(' ') || ['Guest'];
  const firstName = nameParts[0] || 'Guest';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    id: `guest-${Date.now()}`,
    firstName,
    lastName,
    email: guestInfo.email,
    phone: guestInfo.phone
      ? {
          areaCode: '598',
          number: guestInfo.phone,
        }
      : undefined,
  };
};

export const sanitizeOrderPayload = async ({
  strapi,
  rawOrder,
  authUser,
  requestMeta = {},
}: SanitizeOrderPayloadParams): Promise<SanitizedOrderResult> => {
  if (!rawOrder || typeof rawOrder !== 'object') {
    throw new Error('Invalid order payload');
  }

  const shippingMethod = rawOrder.shippingMethod || 'delivery';
  if (!['delivery', 'pickup'].includes(shippingMethod)) {
    throw new Error('Invalid shipping method');
  }

  // Validate storeLocation for pickup orders
  let storeLocationId: number | null = null;
  if (shippingMethod === 'pickup') {
    // Try lookup by code first (preferred), then by numeric ID
    if (rawOrder.storeLocationCode) {
      const storeLocations = await strapi.documents('api::store-location.store-location').findMany({
        filters: { code: rawOrder.storeLocationCode, isActive: true, hasPickupService: true },
        limit: 1,
      });

      if (storeLocations.length > 0) {
        storeLocationId = storeLocations[0].id;
      }
    } else if (rawOrder.storeLocationId) {
      const parsedStoreId = Number(rawOrder.storeLocationId);
      if (Number.isInteger(parsedStoreId) && parsedStoreId > 0) {
        const storeLocation = await strapi.documents('api::store-location.store-location').findOne({
          documentId: String(parsedStoreId),
          filters: { isActive: true, hasPickupService: true },
        });

        if (storeLocation) {
          storeLocationId = parsedStoreId;
        }
      }
    }

    // Fail loudly if pickup selected but no valid store found
    if (!storeLocationId) {
      const providedCode = rawOrder.storeLocationCode || rawOrder.storeLocationId || 'none';
      throw new Error(`Invalid pickup store location: ${providedCode}`);
    }
  }

  const rawItems = ensureArray(rawOrder.items);
  if (!rawItems.length) {
    throw new Error('Order must contain at least one item');
  }

  const productIds = [...new Set(rawItems.map((item) => Number(item.productId))).values()].filter(
    (id) => Number.isInteger(id) && id > 0
  );

  if (!productIds.length) {
    throw new Error('Each item must include a valid productId');
  }

  const products: ProductEntity[] = await strapi.documents('api::product.product').findMany({
    filters: { id: { $in: productIds } },
    fields: ['id', 'title', 'price', 'discountedPrice', 'slug', 'longDescription'],
    populate: { frontImage: true },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  const itemsForPersistence: ItemForPersistence[] = [];
  const itemsForClient: ItemForClient[] = [];

  for (const [index, item] of rawItems.entries()) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error(`Item ${index + 1}: Invalid productId`);
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Item ${index + 1}: Quantity must be a positive integer`);
    }

    const product = productMap.get(productId);
    if (!product) {
      throw new Error(`Item ${index + 1}: Product not found`);
    }

    const basePrice = toNumber(product.discountedPrice) || toNumber(product.price);
    if (basePrice === null) {
      throw new Error(`Item ${index + 1}: Product price is not available`);
    }

    const lineTotal = Number((basePrice * quantity).toFixed(2));

    itemsForPersistence.push({
      product: productId,
      productSnapshot: {
        id: product.id,
        title: product.title,
        slug: product.slug,
        price: toNumber(product.price),
        discountedPrice: toNumber(product.discountedPrice),
        description: product.longDescription,
        image: product.frontImage?.url || null,
      },
      quantity,
      unitPrice: basePrice,
      totalPrice: lineTotal,
      selectedColor: item.color || null,
      selectedSize: item.size || null,
      customizations: item.customizations || null,
      notes: item.notes || null,
    });

    itemsForClient.push({
      productId: product.id,
      productName: product.title,
      description: product.longDescription || null,
      quantity,
      price: basePrice,
      discountedPrice: toNumber(product.discountedPrice) || undefined,
      totalPrice: lineTotal,
      size: item.size || null,
      color: item.color || null,
      imageUrl: product.frontImage?.url || null,
    });
  }

  const subtotal = Number(
    itemsForClient.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)
  );

  const requestedDiscount = toNumber(rawOrder.discount) || 0;
  const discount = Math.max(0, Math.min(requestedDiscount, subtotal));

  const shippingCost = Number(calculateShippingCost(shippingMethod, subtotal).toFixed(2));

  const total = Number((subtotal - discount + shippingCost).toFixed(2));
  if (total <= 0) {
    throw new Error('Calculated order total must be greater than zero');
  }

  const shippingAddressComponent = buildShippingComponent(rawOrder.shippingAddress, shippingMethod);

  const metadata: OrderMetadata = {
    createdVia: 'mobile_app',
    userAgent: requestMeta.userAgent || 'unknown',
    ipAddress: requestMeta.ip || 'unknown',
    correlationId: randomUUID(),
  };

  return {
    orderNumber: generateOrderNumber(),
    shippingMethod,
    storeLocationId,
    subtotal,
    discount,
    shippingCost,
    total,
    metadata,
    itemsForPersistence,
    shippingAddressComponent,
    clientSummary: {
      items: itemsForClient,
      shippingAddress: buildClientShippingAddress(rawOrder.shippingAddress),
      shippingMethod,
      subtotal,
      discount,
      shippingCost,
      total,
    },
    mercadoPagoPayload: {
      items: itemsForClient.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        size: item.size || undefined,
        color: item.color || undefined,
      })),
      address: buildMercadoPagoAddress(rawOrder.shippingAddress),
      user: buildMercadoPagoUser(authUser),
    },
  };
};

export const sanitizeGuestOrderPayload = async ({
  strapi,
  rawOrder,
  guestInfo,
  requestMeta = {},
}: SanitizeGuestOrderPayloadParams): Promise<SanitizedOrderResult> => {
  if (!rawOrder || typeof rawOrder !== 'object') {
    throw new Error('Invalid order payload');
  }

  const shippingMethod = rawOrder.shippingMethod || 'delivery';
  if (!['delivery', 'pickup'].includes(shippingMethod)) {
    throw new Error('Invalid shipping method');
  }

  // Validate storeLocation for pickup orders
  let storeLocationId: number | null = null;
  if (shippingMethod === 'pickup') {
    // Try lookup by code first (preferred), then by numeric ID
    if (rawOrder.storeLocationCode) {
      const storeLocations = await strapi.documents('api::store-location.store-location').findMany({
        filters: { code: rawOrder.storeLocationCode, isActive: true, hasPickupService: true },
        limit: 1,
      });

      if (storeLocations.length > 0) {
        storeLocationId = storeLocations[0].id;
      }
    } else if (rawOrder.storeLocationId) {
      const parsedStoreId = Number(rawOrder.storeLocationId);
      if (Number.isInteger(parsedStoreId) && parsedStoreId > 0) {
        const storeLocation = await strapi.documents('api::store-location.store-location').findOne({
          documentId: String(parsedStoreId),
          filters: { isActive: true, hasPickupService: true },
        });

        if (storeLocation) {
          storeLocationId = parsedStoreId;
        }
      }
    }

    // Fail loudly if pickup selected but no valid store found
    if (!storeLocationId) {
      const providedCode = rawOrder.storeLocationCode || rawOrder.storeLocationId || 'none';
      throw new Error(`Invalid pickup store location: ${providedCode}`);
    }
  }

  const rawItems = ensureArray(rawOrder.items);
  if (!rawItems.length) {
    throw new Error('Order must contain at least one item');
  }

  const productIds = [...new Set(rawItems.map((item) => Number(item.productId))).values()].filter(
    (id) => Number.isInteger(id) && id > 0
  );

  if (!productIds.length) {
    throw new Error('Each item must include a valid productId');
  }

  const products: ProductEntity[] = await strapi.documents('api::product.product').findMany({
    filters: { id: { $in: productIds } },
    fields: ['id', 'title', 'price', 'discountedPrice', 'slug', 'longDescription'],
    populate: { frontImage: true },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  const itemsForPersistence: ItemForPersistence[] = [];
  const itemsForClient: ItemForClient[] = [];

  for (const [index, item] of rawItems.entries()) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error(`Item ${index + 1}: Invalid productId`);
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Item ${index + 1}: Quantity must be a positive integer`);
    }

    const product = productMap.get(productId);
    if (!product) {
      throw new Error(`Item ${index + 1}: Product not found`);
    }

    const basePrice = toNumber(product.discountedPrice) || toNumber(product.price);
    if (basePrice === null) {
      throw new Error(`Item ${index + 1}: Product price is not available`);
    }

    const lineTotal = Number((basePrice * quantity).toFixed(2));

    itemsForPersistence.push({
      product: productId,
      productSnapshot: {
        id: product.id,
        title: product.title,
        slug: product.slug,
        price: toNumber(product.price),
        discountedPrice: toNumber(product.discountedPrice),
        description: product.longDescription,
        image: product.frontImage?.url || null,
      },
      quantity,
      unitPrice: basePrice,
      totalPrice: lineTotal,
      selectedColor: item.color || null,
      selectedSize: item.size || null,
      customizations: item.customizations || null,
      notes: item.notes || null,
    });

    itemsForClient.push({
      productId: product.id,
      productName: product.title,
      description: product.longDescription || null,
      quantity,
      price: basePrice,
      discountedPrice: toNumber(product.discountedPrice) || undefined,
      totalPrice: lineTotal,
      size: item.size || null,
      color: item.color || null,
      imageUrl: product.frontImage?.url || null,
    });
  }

  const subtotal = Number(
    itemsForClient.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)
  );

  const requestedDiscount = toNumber(rawOrder.discount) || 0;
  const discount = Math.max(0, Math.min(requestedDiscount, subtotal));

  const shippingCost = Number(calculateShippingCost(shippingMethod, subtotal).toFixed(2));

  const total = Number((subtotal - discount + shippingCost).toFixed(2));
  if (total <= 0) {
    throw new Error('Calculated order total must be greater than zero');
  }

  const shippingAddressComponent = buildShippingComponent(rawOrder.shippingAddress, shippingMethod);

  const metadata: OrderMetadata = {
    createdVia: 'mobile_app',
    userAgent: requestMeta.userAgent || 'unknown',
    ipAddress: requestMeta.ip || 'unknown',
    correlationId: randomUUID(),
  };

  return {
    orderNumber: generateOrderNumber(),
    shippingMethod,
    storeLocationId,
    subtotal,
    discount,
    shippingCost,
    total,
    metadata,
    itemsForPersistence,
    shippingAddressComponent,
    clientSummary: {
      items: itemsForClient,
      shippingAddress: buildClientShippingAddress(rawOrder.shippingAddress),
      shippingMethod,
      subtotal,
      discount,
      shippingCost,
      total,
    },
    mercadoPagoPayload: {
      items: itemsForClient.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        size: item.size || undefined,
        color: item.color || undefined,
      })),
      address: buildMercadoPagoAddress(rawOrder.shippingAddress),
      user: buildMercadoPagoGuestUser(guestInfo),
    },
  };
};

export const buildClientOrder = (
  orderEntity: OrderEntity | null,
  clientSummary: ClientSummary
): ClientOrder | null => {
  if (!orderEntity) {
    return null;
  }

  return {
    id: orderEntity.id,
    orderNumber: orderEntity.orderNumber,
    status: orderEntity.status,
    paymentStatus: orderEntity.paymentStatus,
    subtotal: clientSummary.subtotal,
    discount: clientSummary.discount,
    shippingCost: clientSummary.shippingCost,
    total: clientSummary.total,
    shippingMethod: clientSummary.shippingMethod,
    items: clientSummary.items,
    shippingAddress: clientSummary.shippingAddress,
    user: {
      id: orderEntity.user?.id,
      email: orderEntity.user?.email,
      firstName: orderEntity.user?.firstName,
      lastName: orderEntity.user?.lastName,
    },
    createdAt: orderEntity.createdAt,
    updatedAt: orderEntity.updatedAt,
  };
};

export default {
  sanitizeOrderPayload,
  sanitizeGuestOrderPayload,
  buildClientOrder,
  generateOrderNumber,
  calculateShippingCost,
  buildShippingComponent,
  buildClientShippingAddress,
  buildMercadoPagoAddress,
  buildMercadoPagoUser,
  buildMercadoPagoGuestUser,
};
