/**
 * Comprehensive Test Data Generator for Tifossi Backend Migration
 *
 * This module generates realistic test data for all entities in the Tifossi
 * e-commerce system, supporting various testing scenarios including load testing,
 * integration testing, and E2E testing.
 */

const { faker } = require('@faker-js/faker');
const crypto = require('crypto');

// Configure faker for Spanish/Uruguayan locale
faker.locale = 'es';

/**
 * Product Data Generator
 * Generates realistic product catalog data matching production structure
 */
class ProductDataGenerator {
  constructor(options = {}) {
    this.options = {
      categories: ['football', 'basketball', 'running', 'fitness', 'casual'],
      brands: ['Tiffosi', 'Tiffosi Sport', 'Tiffosi Active'],
      priceRange: { min: 500, max: 15000 }, // UYU
      currency: 'UYU',
      ...options,
    };

    this.productStatuses = [
      'NEW',
      'SALE',
      'FEATURED',
      'POPULAR',
      'OPPORTUNITY',
      'RECOMMENDED',
      'APP_EXCLUSIVE',
      'HIGHLIGHTED',
    ];
    this.sizes = {
      clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      footwear: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
      accessories: ['Único'],
    };
    this.colors = [
      { name: 'Negro', hex: '#000000' },
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Azul', hex: '#0066CC' },
      { name: 'Rojo', hex: '#CC0000' },
      { name: 'Verde', hex: '#00CC66' },
      { name: 'Gris', hex: '#666666' },
      { name: 'Amarillo', hex: '#FFD700' },
      { name: 'Rosa', hex: '#FF69B4' },
    ];
  }

  /**
   * Generate a single product with realistic data
   */
  generateProduct(overrides = {}) {
    const category = faker.helpers.arrayElement(this.options.categories);
    const brand = faker.helpers.arrayElement(this.options.brands);
    const productType = this.getProductTypeForCategory(category);
    const price = faker.datatype.number(this.options.priceRange);
    const isOnSale = faker.datatype.boolean(0.25); // 25% chance of sale
    const statusCount = faker.datatype.number({ min: 1, max: 3 });
    const selectedStatuses = faker.helpers.arrayElements(this.productStatuses, statusCount);

    const product = {
      id: this.generateProductId(),
      title: this.generateProductTitle(brand, productType, category),
      price: price,
      discountedPrice: isOnSale
        ? Math.floor(price * faker.datatype.float({ min: 0.6, max: 0.9 }))
        : null,
      categoryId: category,
      modelId: this.generateModelId(category, productType),
      frontImage: this.generateImageUrl('front'),
      images: this.generateImageUrls(faker.datatype.number({ min: 2, max: 6 })),
      videoSource: faker.datatype.boolean(0.3) ? this.generateVideoUrl() : null,
      statuses: selectedStatuses,
      shortDescription: {
        line1: this.generateShortDescription(productType, 'line1'),
        line2: this.generateShortDescription(productType, 'line2'),
      },
      longDescription: this.generateLongDescription(productType, brand),
      isCustomizable: faker.datatype.boolean(0.4), // 40% customizable
      colors: this.generateProductColors(),
      sizes: this.generateProductSizes(category),
      warranty: this.generateWarranty(),
      returnPolicy: '30 días para devolución',
      dimensions: this.generateDimensions(),
      stock: faker.datatype.number({ min: 0, max: 200 }),
      weight: faker.datatype.number({ min: 100, max: 2000 }), // grams
      brand: brand,
      sku: this.generateSKU(category, brand),
      createdAt: faker.date.past(2).toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    };

    return { ...product, ...overrides };
  }

  /**
   * Generate a batch of products
   */
  generateProductBatch(count = 100, options = {}) {
    const products = [];

    for (let i = 0; i < count; i++) {
      const product = this.generateProduct(options);
      products.push(product);
    }

    return products;
  }

  /**
   * Generate products for a specific category
   */
  generateProductsForCategory(categoryId, count = 20) {
    return this.generateProductBatch(count, { categoryId });
  }

  /**
   * Generate products with specific status distribution
   */
  generateProductsWithStatusDistribution(count = 100) {
    const statusDistribution = {
      NEW: 0.15,
      SALE: 0.25,
      FEATURED: 0.1,
      POPULAR: 0.3,
      REGULAR: 0.2,
    };

    const products = [];

    Object.entries(statusDistribution).forEach(([status, percentage]) => {
      const productCount = Math.floor(count * percentage);

      for (let i = 0; i < productCount; i++) {
        const product = this.generateProduct({
          statuses: status === 'REGULAR' ? [] : [status],
        });
        products.push(product);
      }
    });

    return products;
  }

  // Helper methods
  generateProductId() {
    return `prod_${faker.datatype.uuid()}`;
  }

  generateModelId(category, productType) {
    return `${category}_${productType}_${faker.datatype.number({ min: 1000, max: 9999 })}`;
  }

  generateProductTitle(brand, productType, category) {
    const adjectives = ['Clásico', 'Deportivo', 'Profesional', 'Casual', 'Premium', 'Básico'];
    const adjective = faker.helpers.arrayElement(adjectives);

    return `${brand} ${productType} ${adjective} ${category.charAt(0).toUpperCase() + category.slice(1)}`;
  }

  generateShortDescription(productType, lineNumber) {
    const line1Options = [
      'Máxima comodidad y estilo',
      'Diseño moderno y funcional',
      'Calidad premium garantizada',
      'Ideal para uso diario',
    ];

    const line2Options = [
      'Materiales de alta calidad',
      'Disponible en varios colores',
      'Ajuste perfecto',
      'Tecnología avanzada',
    ];

    return lineNumber === 'line1'
      ? faker.helpers.arrayElement(line1Options)
      : faker.helpers.arrayElement(line2Options);
  }

  generateLongDescription(productType, brand) {
    return (
      `${productType} de ${brand} fabricado con materiales de primera calidad. ` +
      `Diseñado para ofrecer la máxima comodidad y durabilidad en cada uso. ` +
      `Ideal para deportistas y personas activas que buscan lo mejor en equipamiento deportivo. ` +
      `Disponible en múltiples tallas y colores para adaptarse a todos los gustos y necesidades.`
    );
  }

  generateProductColors() {
    const colorCount = faker.datatype.number({ min: 1, max: 4 });
    return faker.helpers.arrayElements(this.colors, colorCount);
  }

  generateProductSizes(category) {
    let availableSizes;

    switch (category) {
      case 'football':
      case 'basketball':
      case 'running':
      case 'fitness':
        availableSizes = this.sizes.clothing;
        break;
      case 'casual':
        availableSizes = Math.random() > 0.5 ? this.sizes.clothing : this.sizes.footwear;
        break;
      default:
        availableSizes = this.sizes.accessories;
    }

    const sizeCount = faker.datatype.number({ min: 3, max: availableSizes.length });
    return faker.helpers.arrayElements(availableSizes, sizeCount);
  }

  generateImageUrl(type = 'product') {
    const imageId = faker.datatype.number({ min: 1000, max: 9999 });
    return `https://images.tifossi.com/products/${type}/${imageId}.jpg`;
  }

  generateImageUrls(count) {
    const urls = [];
    for (let i = 0; i < count; i++) {
      urls.push(this.generateImageUrl());
    }
    return urls;
  }

  generateVideoUrl() {
    const videoId = faker.datatype.number({ min: 1000, max: 9999 });
    return `https://videos.tifossi.com/products/${videoId}.mp4`;
  }

  generateWarranty() {
    const warranties = [
      '6 meses de garantía',
      '1 año de garantía',
      '2 años de garantía',
      'Sin garantía específica',
    ];
    return faker.helpers.arrayElement(warranties);
  }

  generateDimensions() {
    return {
      height: `${faker.datatype.number({ min: 5, max: 50 })}cm`,
      width: `${faker.datatype.number({ min: 10, max: 40 })}cm`,
      depth: `${faker.datatype.number({ min: 2, max: 20 })}cm`,
    };
  }

  generateSKU(category, brand) {
    const prefix = category.substring(0, 3).toUpperCase();
    const brandCode = brand.substring(0, 3).toUpperCase();
    const number = faker.datatype.number({ min: 10000, max: 99999 });
    return `${prefix}-${brandCode}-${number}`;
  }

  getProductTypeForCategory(category) {
    const productTypes = {
      football: ['Camiseta', 'Short', 'Medias', 'Botines', 'Pelota'],
      basketball: ['Camiseta', 'Short', 'Zapatillas', 'Pelota', 'Accesorios'],
      running: ['Remera', 'Calza', 'Zapatillas', 'Accesorios'],
      fitness: ['Top', 'Leggings', 'Zapatillas', 'Pesas', 'Accesorios'],
      casual: ['Remera', 'Pantalón', 'Zapatillas', 'Buzo', 'Campera'],
    };

    return faker.helpers.arrayElement(productTypes[category] || ['Producto']);
  }
}

/**
 * User Data Generator
 * Creates realistic user profiles with various behavior patterns
 */
class UserDataGenerator {
  constructor(options = {}) {
    this.options = {
      domains: ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'tifossi.com'],
      uruguayanDepartments: [
        'Montevideo',
        'Canelones',
        'Maldonado',
        'Colonia',
        'San José',
        'Paysandú',
        'Salto',
        'Rivera',
        'Tacuarembó',
        'Artigas',
      ],
      ...options,
    };

    this.userArchetypes = {
      new_user: {
        orderCount: { min: 0, max: 0 },
        favoriteCount: { min: 0, max: 3 },
        cartItems: { min: 0, max: 2 },
        isEmailVerified: false,
        weight: 0.3,
      },
      casual_shopper: {
        orderCount: { min: 1, max: 5 },
        favoriteCount: { min: 3, max: 10 },
        cartItems: { min: 1, max: 5 },
        isEmailVerified: true,
        weight: 0.4,
      },
      frequent_buyer: {
        orderCount: { min: 6, max: 20 },
        favoriteCount: { min: 10, max: 30 },
        cartItems: { min: 2, max: 8 },
        isEmailVerified: true,
        weight: 0.25,
      },
      power_user: {
        orderCount: { min: 21, max: 100 },
        favoriteCount: { min: 20, max: 50 },
        cartItems: { min: 3, max: 15 },
        isEmailVerified: true,
        weight: 0.05,
      },
    };
  }

  /**
   * Generate a single user with realistic data
   */
  generateUser(archetypeOverride = null, overrides = {}) {
    const archetype = archetypeOverride || this.selectRandomArchetype();
    const archetypeData = this.userArchetypes[archetype];

    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const email = this.generateEmail(firstName, lastName);

    const user = {
      id: this.generateUserId(),
      email: email,
      name: `${firstName} ${lastName}`,
      firstName: firstName,
      lastName: lastName,
      profilePicture: faker.datatype.boolean(0.3) ? faker.image.avatar() : null,
      isEmailVerified: archetypeData.isEmailVerified,
      phone: this.generateUruguayanPhone(),
      dateOfBirth: faker.date.birthdate({ min: 16, max: 70, mode: 'age' }).toISOString(),
      createdAt: faker.date.past(3).toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      preferences: {
        newsletter: faker.datatype.boolean(0.7),
        notifications: faker.datatype.boolean(0.8),
        language: faker.helpers.arrayElement(['es', 'en']),
      },
      addresses: this.generateUserAddresses(),
      favoriteProducts: [], // Will be populated later
      archetype: archetype,
    };

    return { ...user, ...overrides };
  }

  /**
   * Generate a batch of users with archetype distribution
   */
  generateUserBatch(count = 100) {
    const users = [];

    Object.entries(this.userArchetypes).forEach(([archetype, data]) => {
      const archetypeCount = Math.floor(count * data.weight);

      for (let i = 0; i < archetypeCount; i++) {
        users.push(this.generateUser(archetype));
      }
    });

    // Fill remaining slots with random archetypes
    while (users.length < count) {
      users.push(this.generateUser());
    }

    return users.slice(0, count);
  }

  /**
   * Generate user with complete shopping history
   */
  generateUserWithHistory(archetype = 'frequent_buyer') {
    const user = this.generateUser(archetype);
    const archetypeData = this.userArchetypes[archetype];

    // Generate order history
    const orderCount = faker.datatype.number(archetypeData.orderCount);
    const orders = [];

    for (let i = 0; i < orderCount; i++) {
      orders.push(this.generateUserOrder(user.id));
    }

    // Generate favorites
    const favoriteCount = faker.datatype.number(archetypeData.favoriteCount);
    const favorites = this.generateFavoriteProductIds(favoriteCount);

    return {
      user,
      orders,
      favorites,
    };
  }

  // Helper methods
  generateUserId() {
    return `user_${faker.datatype.uuid()}`;
  }

  generateEmail(firstName, lastName) {
    const domain = faker.helpers.arrayElement(this.options.domains);
    const variations = [
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}${faker.datatype.number({ min: 10, max: 999 })}@${domain}`,
      `${firstName.toLowerCase()}_${lastName.toLowerCase()}@${domain}`,
    ];

    return faker.helpers.arrayElement(variations);
  }

  generateUruguayanPhone() {
    // Uruguayan mobile format: +598 9X XXX XXXX
    const areaCode = faker.helpers.arrayElement([
      '91',
      '92',
      '93',
      '94',
      '95',
      '96',
      '97',
      '98',
      '99',
    ]);
    const number = faker.datatype.number({ min: 100000, max: 999999 });
    return `+598 ${areaCode} ${Math.floor(number / 1000)} ${number % 1000}`;
  }

  generateUserAddresses() {
    const addressCount = faker.datatype.number({ min: 1, max: 3 });
    const addresses = [];

    for (let i = 0; i < addressCount; i++) {
      addresses.push({
        id: faker.datatype.uuid(),
        type: faker.helpers.arrayElement(['home', 'work', 'other']),
        name: faker.helpers.arrayElement(['Casa', 'Trabajo', 'Otro']),
        street: faker.address.streetAddress(),
        city: faker.helpers.arrayElement(this.options.uruguayanDepartments),
        postalCode: faker.datatype.number({ min: 10000, max: 99999 }).toString(),
        country: 'Uruguay',
        isDefault: i === 0,
        createdAt: faker.date.past().toISOString(),
      });
    }

    return addresses;
  }

  generateUserOrder(userId) {
    const itemCount = faker.datatype.number({ min: 1, max: 5 });
    const items = [];
    let subtotal = 0;

    for (let i = 0; i < itemCount; i++) {
      const price = faker.datatype.number({ min: 1000, max: 8000 });
      const quantity = faker.datatype.number({ min: 1, max: 3 });
      const itemTotal = price * quantity;

      items.push({
        productId: `prod_${faker.datatype.uuid()}`,
        quantity: quantity,
        price: price,
        size: faker.helpers.arrayElement(['S', 'M', 'L']),
        color: faker.helpers.arrayElement(['Negro', 'Blanco', 'Azul']),
        total: itemTotal,
      });

      subtotal += itemTotal;
    }

    const shipping = faker.datatype.number({ min: 200, max: 500 });
    const taxes = Math.floor(subtotal * 0.22); // 22% IVA
    const total = subtotal + shipping + taxes;

    return {
      id: `order_${faker.datatype.uuid()}`,
      userId: userId,
      status: faker.helpers.arrayElement([
        'pending',
        'confirmed',
        'shipped',
        'delivered',
        'cancelled',
      ]),
      items: items,
      subtotal: subtotal,
      taxes: taxes,
      shipping: shipping,
      total: total,
      currency: 'UYU',
      paymentMethod: faker.helpers.arrayElement(['credit_card', 'debit_card', 'bank_transfer']),
      mpCollectionStatus: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    };
  }

  generateFavoriteProductIds(count) {
    const favorites = [];
    for (let i = 0; i < count; i++) {
      favorites.push(`prod_${faker.datatype.uuid()}`);
    }
    return favorites;
  }

  selectRandomArchetype() {
    const rand = Math.random();
    let cumulative = 0;

    for (const [archetype, data] of Object.entries(this.userArchetypes)) {
      cumulative += data.weight;
      if (rand <= cumulative) {
        return archetype;
      }
    }

    return 'casual_shopper'; // fallback
  }
}

/**
 * Order Data Generator
 * Creates realistic order data with various statuses and payment methods
 */
class OrderDataGenerator {
  constructor(options = {}) {
    this.options = {
      currencies: ['UYU'],
      paymentMethods: ['credit_card', 'debit_card', 'bank_transfer', 'mercadopago'],
      shippingMethods: ['standard', 'express', 'pickup'],
      ...options,
    };

    this.orderStatuses = {
      pending: 0.1,
      confirmed: 0.15,
      processing: 0.15,
      shipped: 0.2,
      delivered: 0.35,
      cancelled: 0.04,
      refunded: 0.01,
    };

    this.paymentStatuses = {
      pending: 0.05,
      approved: 0.85,
      rejected: 0.08,
      refunded: 0.02,
    };
  }

  /**
   * Generate a single order
   */
  generateOrder(userId = null, overrides = {}) {
    const itemCount = faker.datatype.number({ min: 1, max: 6 });
    const items = this.generateOrderItems(itemCount);
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const shipping = this.calculateShipping(subtotal);
    const taxes = Math.floor(subtotal * 0.22); // 22% IVA Uruguay
    const discount = faker.datatype.boolean(0.15)
      ? Math.floor(subtotal * faker.datatype.float({ min: 0.05, max: 0.2 }))
      : 0;
    const total = subtotal + shipping + taxes - discount;

    const order = {
      id: this.generateOrderId(),
      userId: userId || `user_${faker.datatype.uuid()}`,
      status: this.selectWeightedStatus(this.orderStatuses),
      items: items,
      subtotal: subtotal,
      taxes: taxes,
      shipping: shipping,
      discount: discount,
      total: total,
      currency: faker.helpers.arrayElement(this.options.currencies),
      paymentMethod: faker.helpers.arrayElement(this.options.paymentMethods),
      mpCollectionStatus: this.selectWeightedStatus(this.paymentStatuses),
      shippingMethod: faker.helpers.arrayElement(this.options.shippingMethods),
      shippingAddress: this.generateShippingAddress(),
      billingAddress: this.generateBillingAddress(),
      customerNotes: faker.datatype.boolean(0.2) ? faker.lorem.sentence() : null,
      trackingNumber: this.generateTrackingNumber(),
      estimatedDelivery: faker.date.future().toISOString(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      shippedAt: faker.datatype.boolean(0.6) ? faker.date.recent().toISOString() : null,
      deliveredAt: faker.datatype.boolean(0.4) ? faker.date.recent().toISOString() : null,
    };

    return { ...order, ...overrides };
  }

  /**
   * Generate batch of orders with realistic distribution
   */
  generateOrderBatch(count = 100, userIds = []) {
    const orders = [];

    for (let i = 0; i < count; i++) {
      const userId = userIds.length > 0 ? faker.helpers.arrayElement(userIds) : null;

      orders.push(this.generateOrder(userId));
    }

    return orders;
  }

  /**
   * Generate orders for load testing with specific patterns
   */
  generateLoadTestOrders(count = 1000, pattern = 'realistic') {
    const patterns = {
      realistic: () => this.generateOrder(),
      high_value: () =>
        this.generateOrder(null, {
          subtotal: faker.datatype.number({ min: 10000, max: 50000 }),
        }),
      bulk_orders: () =>
        this.generateOrder(null, {
          items: this.generateOrderItems(faker.datatype.number({ min: 5, max: 15 })),
        }),
      international: () =>
        this.generateOrder(null, {
          shippingAddress: this.generateInternationalAddress(),
        }),
    };

    const orders = [];
    const generator = patterns[pattern] || patterns.realistic;

    for (let i = 0; i < count; i++) {
      orders.push(generator());
    }

    return orders;
  }

  // Helper methods
  generateOrderId() {
    return `ORD-${Date.now()}-${faker.datatype.number({ min: 1000, max: 9999 })}`;
  }

  generateOrderItems(count) {
    const items = [];

    for (let i = 0; i < count; i++) {
      const price = faker.datatype.number({ min: 500, max: 12000 });
      const quantity = faker.datatype.number({ min: 1, max: 4 });
      const total = price * quantity;

      items.push({
        id: faker.datatype.uuid(),
        productId: `prod_${faker.datatype.uuid()}`,
        productName: faker.commerce.productName(),
        quantity: quantity,
        price: price,
        total: total,
        size: faker.helpers.arrayElement(['XS', 'S', 'M', 'L', 'XL']),
        color: faker.helpers.arrayElement(['Negro', 'Blanco', 'Azul', 'Rojo']),
        sku: faker.random.alphaNumeric(10).toUpperCase(),
      });
    }

    return items;
  }

  calculateShipping(subtotal) {
    if (subtotal > 5000) return 0; // Free shipping
    if (subtotal > 2000) return 200;
    return 400;
  }

  generateShippingAddress() {
    return {
      name: faker.name.fullName(),
      street: faker.address.streetAddress(),
      city: faker.helpers.arrayElement([
        'Montevideo',
        'Punta del Este',
        'Maldonado',
        'Colonia',
        'Paysandú',
      ]),
      postalCode: faker.datatype.number({ min: 10000, max: 99999 }).toString(),
      country: 'Uruguay',
      phone: `+598 9${faker.datatype.number({ min: 1000000, max: 9999999 })}`,
    };
  }

  generateBillingAddress() {
    return this.generateShippingAddress(); // Often same as shipping
  }

  generateInternationalAddress() {
    const countries = ['Argentina', 'Brasil', 'Paraguay', 'Chile'];
    const country = faker.helpers.arrayElement(countries);

    return {
      name: faker.name.fullName(),
      street: faker.address.streetAddress(),
      city: faker.address.city(),
      postalCode: faker.address.zipCode(),
      country: country,
      phone: faker.phone.phoneNumber(),
    };
  }

  generateTrackingNumber() {
    return faker.datatype.boolean(0.7)
      ? `TF${faker.datatype.number({ min: 1000000000, max: 9999999999 })}`
      : null;
  }

  selectWeightedStatus(statusWeights) {
    const rand = Math.random();
    let cumulative = 0;

    for (const [status, weight] of Object.entries(statusWeights)) {
      cumulative += weight;
      if (rand <= cumulative) {
        return status;
      }
    }

    return Object.keys(statusWeights)[0]; // fallback
  }
}

/**
 * Category Data Generator
 * Creates product category hierarchies
 */
class CategoryDataGenerator {
  constructor() {
    this.categoryStructure = {
      football: {
        name: 'Fútbol',
        subcategories: ['Camisetas', 'Shorts', 'Medias', 'Botines', 'Accesorios'],
      },
      basketball: {
        name: 'Basketball',
        subcategories: ['Camisetas', 'Shorts', 'Zapatillas', 'Pelotas', 'Accesorios'],
      },
      running: {
        name: 'Running',
        subcategories: ['Remeras', 'Calzas', 'Zapatillas', 'Accesorios'],
      },
      fitness: {
        name: 'Fitness',
        subcategories: ['Tops', 'Leggings', 'Calzado', 'Equipamiento'],
      },
      casual: {
        name: 'Casual',
        subcategories: ['Remeras', 'Pantalones', 'Zapatillas', 'Buzos', 'Camperas'],
      },
    };
  }

  generateCategories() {
    const categories = [];
    let categoryId = 1;
    let subcategoryId = 1000;

    Object.entries(this.categoryStructure).forEach(([slug, data]) => {
      const category = {
        id: categoryId++,
        name: data.name,
        slug: slug,
        description: `Productos de ${data.name.toLowerCase()} de alta calidad`,
        parentId: null,
        image: `https://images.tifossi.com/categories/${slug}.jpg`,
        isActive: true,
        sortOrder: categoryId,
        seoTitle: `${data.name} - Tifossi`,
        seoDescription: `Encuentra los mejores productos de ${data.name.toLowerCase()} en Tifossi`,
        productCount: faker.datatype.number({ min: 10, max: 100 }),
      };

      categories.push(category);

      // Generate subcategories
      data.subcategories.forEach((subName, index) => {
        categories.push({
          id: subcategoryId++,
          name: subName,
          slug: `${slug}-${subName.toLowerCase().replace(/\s+/g, '-')}`,
          description: `${subName} de ${data.name.toLowerCase()}`,
          parentId: category.id,
          image: `https://images.tifossi.com/categories/${slug}/${subName.toLowerCase()}.jpg`,
          isActive: true,
          sortOrder: index + 1,
          seoTitle: `${subName} ${data.name} - Tifossi`,
          seoDescription: `${subName} de ${data.name.toLowerCase()} de las mejores marcas`,
          productCount: faker.datatype.number({ min: 5, max: 50 }),
        });
      });
    });

    return categories;
  }
}

/**
 * Store Location Generator
 * Creates realistic store location data for Uruguay
 */
class StoreLocationGenerator {
  constructor() {
    this.uruguayanStores = [
      {
        city: 'Montevideo',
        zones: ['Centro', 'Pocitos', 'Punta Carretas', 'Cordón', 'Villa Biarritz'],
        coordinates: { lat: -34.9032, lng: -56.1882 },
      },
      {
        city: 'Punta del Este',
        zones: ['Centro', 'La Barra', 'José Ignacio'],
        coordinates: { lat: -34.9489, lng: -54.9574 },
      },
      {
        city: 'Maldonado',
        zones: ['Centro', 'San Carlos'],
        coordinates: { lat: -34.9042, lng: -54.9637 },
      },
    ];
  }

  generateStores() {
    const stores = [];
    let storeId = 1;

    this.uruguayanStores.forEach((cityData) => {
      cityData.zones.forEach((zone) => {
        stores.push({
          id: storeId++,
          name: `Tifossi ${cityData.city} ${zone}`,
          address: faker.address.streetAddress(),
          city: cityData.city,
          zone: zone,
          phone: `+598 ${faker.datatype.number({ min: 20000000, max: 99999999 })}`,
          email: `${cityData.city.toLowerCase()}.${zone.toLowerCase()}@tifossi.com`,
          hours: {
            monday: { open: '09:00', close: '20:00' },
            tuesday: { open: '09:00', close: '20:00' },
            wednesday: { open: '09:00', close: '20:00' },
            thursday: { open: '09:00', close: '20:00' },
            friday: { open: '09:00', close: '20:00' },
            saturday: { open: '09:00', close: '18:00' },
            sunday: { open: '10:00', close: '16:00' },
          },
          coordinates: {
            lat: cityData.coordinates.lat + faker.datatype.float({ min: -0.1, max: 0.1 }),
            lng: cityData.coordinates.lng + faker.datatype.float({ min: -0.1, max: 0.1 }),
          },
          services: faker.helpers.arrayElements([
            'pickup',
            'returns',
            'repairs',
            'personal_shopping',
          ]),
          isActive: true,
          createdAt: faker.date.past().toISOString(),
        });
      });
    });

    return stores;
  }
}

/**
 * Main Test Data Generator
 * Orchestrates all data generators and provides unified interface
 */
class TestDataGenerator {
  constructor(options = {}) {
    this.productGenerator = new ProductDataGenerator(options.products);
    this.userGenerator = new UserDataGenerator(options.users);
    this.orderGenerator = new OrderDataGenerator(options.orders);
    this.categoryGenerator = new CategoryDataGenerator();
    this.storeGenerator = new StoreLocationGenerator();
  }

  /**
   * Generate complete test dataset
   */
  generateCompleteDataset(config = {}) {
    const defaultConfig = {
      products: 1000,
      users: 500,
      orders: 2000,
      includeCategories: true,
      includeStores: true,
      relateData: true,
    };

    const finalConfig = { ...defaultConfig, ...config };

    console.log('Generating complete test dataset...');

    const categories = finalConfig.includeCategories
      ? this.categoryGenerator.generateCategories()
      : [];

    const stores = finalConfig.includeStores ? this.storeGenerator.generateStores() : [];

    const products = this.productGenerator.generateProductBatch(finalConfig.products);
    const users = this.userGenerator.generateUserBatch(finalConfig.users);

    // Generate orders with user relationships
    const userIds = users.map((u) => u.id);
    const orders = this.orderGenerator.generateOrderBatch(finalConfig.orders, userIds);

    // Create relationships if requested
    if (finalConfig.relateData) {
      this.createDataRelationships(products, users, orders);
    }

    const dataset = {
      categories,
      stores,
      products,
      users,
      orders,
      metadata: {
        generatedAt: new Date().toISOString(),
        config: finalConfig,
        counts: {
          categories: categories.length,
          stores: stores.length,
          products: products.length,
          users: users.length,
          orders: orders.length,
        },
      },
    };

    console.log('Test dataset generation complete:', dataset.metadata.counts);
    return dataset;
  }

  /**
   * Generate dataset for specific test scenario
   */
  generateScenarioData(scenario) {
    const scenarios = {
      load_testing: {
        products: 10000,
        users: 5000,
        orders: 20000,
        relateData: true,
      },
      integration_testing: {
        products: 100,
        users: 50,
        orders: 200,
        relateData: true,
      },
      unit_testing: {
        products: 10,
        users: 5,
        orders: 20,
        relateData: false,
      },
    };

    const config = scenarios[scenario];
    if (!config) {
      throw new Error(`Unknown scenario: ${scenario}`);
    }

    return this.generateCompleteDataset(config);
  }

  /**
   * Create realistic relationships between entities
   */
  createDataRelationships(products, users, orders) {
    // Assign favorite products to users
    users.forEach((user) => {
      const favoriteCount = faker.datatype.number({ min: 0, max: 10 });
      user.favoriteProducts = faker.helpers.arrayElements(
        products.map((p) => p.id),
        favoriteCount
      );
    });

    // Ensure order items reference existing products
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const randomProduct = faker.helpers.arrayElement(products);
        item.productId = randomProduct.id;
        item.productName = randomProduct.title;
        item.price = randomProduct.discountedPrice || randomProduct.price;
        item.total = item.price * item.quantity;
      });

      // Recalculate order totals
      const subtotal = order.items.reduce((sum, item) => sum + item.total, 0);
      order.subtotal = subtotal;
      order.total = subtotal + order.taxes + order.shipping - order.discount;
    });
  }

  /**
   * Export dataset to JSON file
   */
  exportToJSON(dataset, filename = 'test-data.json') {
    const fs = require('fs');
    const path = require('path');

    const outputPath = path.join(process.cwd(), 'backend/tests/fixtures', filename);

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));
    console.log(`Test data exported to: ${outputPath}`);

    return outputPath;
  }

  /**
   * Export dataset to CSV files (separate file for each entity)
   */
  exportToCSV(dataset) {
    const fs = require('fs');
    const path = require('path');

    const csvDir = path.join(process.cwd(), 'backend/tests/fixtures/csv');

    // Ensure directory exists
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }

    Object.entries(dataset).forEach(([entityType, data]) => {
      if (Array.isArray(data) && data.length > 0) {
        const csvContent = this.arrayToCSV(data);
        const csvPath = path.join(csvDir, `${entityType}.csv`);
        fs.writeFileSync(csvPath, csvContent);
        console.log(`${entityType} exported to: ${csvPath}`);
      }
    });
  }

  /**
   * Convert array of objects to CSV string
   */
  arrayToCSV(array) {
    if (array.length === 0) return '';

    const headers = Object.keys(array[0]);
    const csvRows = [headers.join(',')];

    array.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value).replace(/"/g, '""');
      });
      csvRows.push(values.map((value) => `"${value}"`).join(','));
    });

    return csvRows.join('\n');
  }
}

// Export all generators
module.exports = {
  TestDataGenerator,
  ProductDataGenerator,
  UserDataGenerator,
  OrderDataGenerator,
  CategoryDataGenerator,
  StoreLocationGenerator,
};

// CLI usage
if (require.main === module) {
  const generator = new TestDataGenerator();
  const dataset = generator.generateCompleteDataset();
  generator.exportToJSON(dataset);
  generator.exportToCSV(dataset);
}
