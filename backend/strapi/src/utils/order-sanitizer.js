'use strict';

const { randomUUID } = require('crypto');

const DEFAULT_SHIPPING_THRESHOLD = 100;
const DEFAULT_SHIPPING_FEE = 10;

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);

const toNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
};

const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);

  return `TIF-${year}${month}${day}-${timestamp}`;
};

const calculateShippingCost = (shippingMethod, subtotal) => {
  if (shippingMethod === 'pickup') {
    return 0;
  }

  if (subtotal >= DEFAULT_SHIPPING_THRESHOLD) {
    return 0;
  }

  return DEFAULT_SHIPPING_FEE;
};

const buildShippingComponent = (address, shippingMethod) => {
  if (!address) {
    throw new Error('Shipping address is required');
  }

  const requiredFields = ['firstName', 'lastName', 'street', 'number', 'city', 'country'];
  const missing = requiredFields.filter((field) => !address[field]);

  if (missing.length) {
    throw new Error(`Missing required address fields: ${missing.join(', ')}`);
  }

  const line1 = `${address.street} ${address.number}`.trim();

  return {
    firstName: address.firstName,
    lastName: address.lastName,
    company: address.company || null,
    addressLine1: line1,
    addressLine2: address.apartment || null,
    city: address.city,
    state: address.state || null,
    postalCode: address.zipCode || null,
    country: address.country,
    phoneNumber: address.phone || null,
    isDefault: Boolean(address.isDefault),
    type: shippingMethod === 'pickup' ? 'both' : 'shipping',
  };
};

const buildClientShippingAddress = (address) => ({
  firstName: address.firstName,
  lastName: address.lastName,
  company: address.company || null,
  street: address.street,
  number: address.number,
  apartment: address.apartment || null,
  city: address.city,
  state: address.state || null,
  country: address.country,
  zipCode: address.zipCode || null,
  phone: address.phone || null,
});

const buildMercadoPagoAddress = (address) => ({
  street: address.street,
  number: address.number,
  city: address.city,
  state: address.state || undefined,
  country: address.country,
  zipCode: address.zipCode || undefined,
});

const buildMercadoPagoUser = (user) => ({
  id: String(user.id),
  firstName: user.firstName || user.username || 'Usuario',
  lastName: user.lastName || '',
  email: user.email,
  phone:
    user.phoneNumber || user.phone
      ? {
          areaCode: '598',
          number: user.phoneNumber || user.phone,
        }
      : undefined,
});

const sanitizeOrderPayload = async ({
  strapi,
  rawOrder,
  authUser,
  requestMeta = {},
}) => {
  if (!rawOrder || typeof rawOrder !== 'object') {
    throw new Error('Invalid order payload');
  }

  const shippingMethod = rawOrder.shippingMethod || 'delivery';
  if (!['delivery', 'pickup'].includes(shippingMethod)) {
    throw new Error('Invalid shipping method');
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

  const products = await strapi.documents('api::product.product').findMany({
    filters: { id: { $in: productIds } },
    fields: ['id', 'title', 'price', 'discountedPrice', 'slug', 'longDescription'],
    populate: { frontImage: true },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  const itemsForPersistence = [];
  const itemsForClient = [];

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

  const shippingCost = Number(
    calculateShippingCost(shippingMethod, subtotal).toFixed(2)
  );

  const total = Number((subtotal - discount + shippingCost).toFixed(2));
  if (total <= 0) {
    throw new Error('Calculated order total must be greater than zero');
  }

  const shippingAddressComponent = buildShippingComponent(
    rawOrder.shippingAddress,
    shippingMethod
  );

  const metadata = {
    createdVia: 'mobile_app',
    userAgent: requestMeta.userAgent || 'unknown',
    ipAddress: requestMeta.ip || 'unknown',
    correlationId: randomUUID(),
  };

  return {
    orderNumber: generateOrderNumber(),
    shippingMethod,
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

const buildClientOrder = (orderEntity, clientSummary) => {
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

module.exports = {
  sanitizeOrderPayload,
  buildClientOrder,
};
