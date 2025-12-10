/**
 * Test Data Factory Functions
 *
 * This file contains factory functions to generate realistic test data
 * for products, users, cart items, orders, and other entities.
 *
 * Following TESTING_PRINCIPLES.md:
 * - Use realistic values, not "test" or "foo"
 * - Match production data structure
 * - Include edge cases (empty strings, null values)
 */

import { Product, ProductSize, ProductCardData } from '../../_types/product';
import { User } from '../../_types/auth';
import { CartItem } from '../../_stores/cartStore';
import { UserPreferences } from '../../_stores/userStore';
import { Address } from '../../_services/address/addressService';
import { Category } from '../../_types/category';
import { ProductStatus } from '../../_types/product-status';

// Import types for other data structures
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Realistic test images (using placeholder URLs that match production structure)
const TEST_IMAGES = {
  products: [
    'https://images.tifossi.com/products/medias-deportivas-nike-air-max-270-negras-01.jpg',
    'https://images.tifossi.com/products/zapatillas-adidas-ultraboost-22-blancas-01.jpg',
    'https://images.tifossi.com/products/camiseta-futbol-real-madrid-local-2024-01.jpg',
    'https://images.tifossi.com/products/shorts-nike-dri-fit-training-azul-marino-01.jpg',
    'https://images.tifossi.com/products/campera-adidas-3-stripes-track-negra-01.jpg',
    'https://images.tifossi.com/products/buzo-puma-hoodie-essentials-gris-01.jpg',
  ],
  profile: [
    'https://images.tifossi.com/profiles/avatar-01.jpg',
    'https://images.tifossi.com/profiles/avatar-02.jpg',
    'https://images.tifossi.com/profiles/avatar-03.jpg',
  ],
};

// Realistic product names and descriptions
const PRODUCT_NAMES = [
  'Medias Deportivas Nike Air Max',
  'Zapatillas Adidas Ultraboost 22',
  'Camiseta Fútbol Real Madrid Local',
  'Shorts Nike Dri-FIT Training',
  'Campera Adidas 3-Stripes Track',
  'Buzo Puma Hoodie Essentials',
  'Pantalón Jogging Under Armour',
  'Remera Nike Pro Dri-FIT',
  'Zapatillas Puma RS-X3',
  'Medias Adidas Crew 3-Pack',
];

const PRODUCT_DESCRIPTIONS = [
  {
    line1: 'Comodidad superior para entrenamientos intensos',
    line2: 'Tecnología Dri-FIT que absorbe la humedad',
  },
  {
    line1: 'Diseño clásico con máximo confort',
    line2: 'Perfectas para uso diario y deportivo',
  },
  {
    line1: 'Estilo auténtico para verdaderos fanáticos',
    line2: 'Material transpirable de alta calidad',
  },
  {
    line1: 'Libertad de movimiento total',
    line2: 'Ideal para running y entrenamientos',
  },
];

const COLORS = [
  { name: 'Negro', hex: '#000000' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Azul Marino', hex: '#001f3f' },
  { name: 'Gris', hex: '#808080' },
  { name: 'Rojo', hex: '#FF4136' },
  { name: 'Verde', hex: '#2ECC40' },
  { name: 'Rosa', hex: '#F012BE' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Counter for generating unique IDs
let idCounter = 1000;

/**
 * Generates a unique ID for test entities
 */
const generateId = (prefix = 'test'): string => {
  return `${prefix}_${idCounter++}`;
};

/**
 * Picks a random item from an array
 */
const randomChoice = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Generates a random integer between min and max (inclusive)
 */
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generates a random price between min and max
 */
const randomPrice = (min = 1500, max = 15000): number => {
  return Math.round((Math.random() * (max - min) + min) / 100) * 100; // Round to nearest 100
};

/**
 * Product Factory Functions
 */
export const productFactory = {
  /**
   * Creates a single realistic product
   */
  create: (overrides: DeepPartial<Product> = {}): Product => {
    const name = randomChoice(PRODUCT_NAMES);
    const price = randomPrice();
    const hasDiscount = Math.random() < 0.3; // 30% chance of discount
    const discountedPrice = hasDiscount ? Math.round(price * 0.8) : undefined;

    // Generate colors for this product
    const numColors = randomInt(1, 3);
    const productColors = Array.from({ length: numColors }, (_, _index) => {
      const color = randomChoice(COLORS);
      return {
        colorName: color.name,
        hex: color.hex,
        quantity: randomInt(0, 50),
        images: {
          main: randomChoice(TEST_IMAGES.products),
          additional: Math.random() < 0.5 ? [randomChoice(TEST_IMAGES.products)] : undefined,
        },
      };
    });

    // Ensure at least one color has stock (unless explicitly creating out of stock product)
    if (productColors.every((color) => color.quantity === 0)) {
      productColors[0].quantity = randomInt(1, 50);
    }

    // Generate sizes for this product
    const numSizes = randomInt(3, 6);
    const productSizes: ProductSize[] = SIZES.slice(0, numSizes).map((size) => ({
      value: size,
      available: Math.random() < 0.8, // 80% chance of being available
    }));

    // Generate statuses for this product
    const statuses: ProductStatus[] = [];
    if (Math.random() < 0.3) statuses.push(ProductStatus.NEW);
    if (hasDiscount) statuses.push(ProductStatus.SALE);
    if (Math.random() < 0.2) statuses.push(ProductStatus.FEATURED);
    if (Math.random() < 0.15) statuses.push(ProductStatus.POPULAR);

    const baseProduct: Product = {
      id: generateId('prod'),
      title: name,
      price,
      categoryId: randomChoice(['medias', 'zapatillas', 'camisetas', 'pantalones', 'camperas']),
      modelId: generateId('model'),
      frontImage: randomChoice(TEST_IMAGES.products),
      images: [randomChoice(TEST_IMAGES.products), randomChoice(TEST_IMAGES.products)],
      shortDescription: randomChoice(PRODUCT_DESCRIPTIONS),
      longDescription: [
        'Producto diseñado con los más altos estándares de calidad.',
        'Perfecto para entrenamientos y uso casual.',
        'Tecnología avanzada que garantiza comodidad y durabilidad.',
      ],
      discountedPrice,
      statuses,
      colors: productColors,
      sizes: productSizes,
      isCustomizable: Math.random() < 0.1, // 10% chance
      warranty: '6 meses de garantía del fabricante',
      returnPolicy: 'Devoluciones gratuitas hasta 30 días',
      dimensions: {
        height: '30cm',
        width: '20cm',
        depth: '10cm',
      },
    };

    // Deep merge overrides
    return deepMerge(baseProduct, overrides);
  },

  /**
   * Creates multiple products
   */
  createMany: (count: number, overrides: DeepPartial<Product> = {}): Product[] => {
    return Array.from({ length: count }, () => productFactory.create(overrides));
  },

  /**
   * Creates a product specifically for cart testing
   */
  createForCart: (overrides: DeepPartial<Product> = {}): Product => {
    return productFactory.create({
      colors: [
        {
          colorName: 'Negro',
          hex: '#000000',
          quantity: 10,
          images: {
            main: randomChoice(TEST_IMAGES.products),
          },
        },
      ],
      sizes: [
        { value: 'M', available: true },
        { value: 'L', available: true },
      ],
      ...overrides,
    });
  },

  /**
   * Creates a product that's out of stock
   */
  createOutOfStock: (overrides: DeepPartial<Product> = {}): Product => {
    return productFactory.create({
      colors: [
        {
          colorName: 'Negro',
          hex: '#000000',
          quantity: 0,
          images: {
            main: randomChoice(TEST_IMAGES.products),
          },
        },
      ],
      ...overrides,
    });
  },

  /**
   * Creates a discounted product
   */
  createOnSale: (overrides: DeepPartial<Product> = {}): Product => {
    const price = randomPrice(2000, 10000);
    return productFactory.create({
      price,
      discountedPrice: Math.round(price * 0.7),
      statuses: [ProductStatus.SALE],
      ...overrides,
    });
  },
};

/**
 * User Factory Functions
 */
export const userFactory = {
  /**
   * Creates a realistic user
   */
  create: (overrides: DeepPartial<User> = {}): User => {
    const firstNames = [
      'María',
      'José',
      'Ana',
      'Luis',
      'Carmen',
      'Miguel',
      'Isabel',
      'Pedro',
      'Lucía',
      'Francisco',
    ];
    const lastNames = [
      'García',
      'Rodríguez',
      'González',
      'Fernández',
      'López',
      'Martínez',
      'Sánchez',
      'Pérez',
      'Gómez',
      'Martín',
    ];

    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`;

    const baseUser: User = {
      id: generateId('user'),
      name: fullName,
      email,
      profilePicture: Math.random() < 0.4 ? randomChoice(TEST_IMAGES.profile) : null,
      isEmailVerified: Math.random() < 0.8, // 80% are verified
      firstName,
      lastName,
      phone: `+598 9${randomInt(1000000, 9999999)}`, // Uruguayan phone format
      metadata: {
        provider: randomChoice(['email', 'google', 'apple'] as const),
        hasReceivedUserData: true,
      },
    };

    return deepMerge(baseUser, overrides);
  },

  /**
   * Creates an unverified user
   */
  createUnverified: (overrides: DeepPartial<User> = {}): User => {
    return userFactory.create({
      isEmailVerified: false,
      ...overrides,
    });
  },

  /**
   * Creates a user with Apple Sign-In
   */
  createWithApple: (overrides: DeepPartial<User> = {}): User => {
    return userFactory.create({
      metadata: {
        provider: 'apple',
        isPrivateEmail: Math.random() < 0.5,
        appleUserId: generateId('apple'),
        hasReceivedUserData: true,
      },
      ...overrides,
    });
  },

  /**
   * Creates multiple users
   */
  createMany: (count: number, overrides: DeepPartial<User> = {}): User[] => {
    return Array.from({ length: count }, () => userFactory.create(overrides));
  },
};

/**
 * Cart Item Factory Functions
 */
export const cartItemFactory = {
  /**
   * Creates a cart item
   */
  create: (overrides: DeepPartial<CartItem> = {}): CartItem => {
    const baseItem: CartItem = {
      productId: generateId('prod'),
      quantity: randomInt(1, 3),
      color: randomChoice(COLORS).name,
      size: randomChoice(['S', 'M', 'L', 'XL']),
      price: randomInt(50, 200),
    };

    return { ...baseItem, ...overrides };
  },

  /**
   * Creates multiple cart items
   */
  createMany: (count: number, overrides: DeepPartial<CartItem> = {}): CartItem[] => {
    return Array.from({ length: count }, () => cartItemFactory.create(overrides));
  },

  /**
   * Creates cart items from products
   */
  fromProducts: (products: Product[]): CartItem[] => {
    return products.map((product) => ({
      productId: product.id,
      quantity: randomInt(1, 2),
      color: product.colors[0]?.colorName || 'Negro',
      size: product.sizes?.find((s) => s.available)?.value || 'M',
      price: product.price,
      discountPrice: product.discountedPrice,
      product: product,
    }));
  },
};

/**
 * Category Factory Functions
 */
export const categoryFactory = {
  /**
   * Creates a category
   */
  create: (overrides: DeepPartial<Category> = {}): Category => {
    const categories = [
      { name: 'Medias', slug: 'medias' },
      { name: 'Zapatillas', slug: 'zapatillas' },
      { name: 'Camisetas', slug: 'camisetas' },
      { name: 'Pantalones', slug: 'pantalones' },
      { name: 'Camperas', slug: 'camperas' },
      { name: 'Buzos', slug: 'buzos' },
    ];

    const category = randomChoice(categories);
    const baseCategory: Category = {
      id: generateId('cat'),
      name: category.name,
      slug: category.slug,
      displayOrder: randomInt(1, 10),
      isLabel: false,
    };

    return { ...baseCategory, ...overrides };
  },

  /**
   * Creates multiple categories
   */
  createMany: (count: number, overrides: DeepPartial<Category> = {}): Category[] => {
    return Array.from({ length: count }, () => categoryFactory.create(overrides));
  },
};

/**
 * Address Factory Functions
 */
export const addressFactory = {
  /**
   * Creates a user address matching the Strapi schema
   */
  create: (overrides: DeepPartial<Address> = {}): Address => {
    const streets = [
      '18 de Julio 1234',
      'Av. Rivera 567',
      'Bulevar Artigas 890',
      '8 de Octubre 321',
      'Av. Brasil 456',
      'Mercedes 789',
    ];

    const cities = ['Montevideo', 'Canelones', 'Maldonado', 'Salto', 'Paysandú'];
    const firstNames = ['María', 'José', 'Ana', 'Luis'];
    const lastNames = ['García', 'Rodríguez', 'González', 'Fernández'];

    const baseAddress: Address = {
      id: randomInt(0, 100), // Numeric ID (array index)
      firstName: randomChoice(firstNames),
      lastName: randomChoice(lastNames),
      addressLine1: randomChoice(streets),
      addressLine2: Math.random() < 0.3 ? 'Apto 4B' : undefined,
      city: randomChoice(cities),
      state: 'Montevideo',
      country: 'UY',
      postalCode: `${randomInt(10000, 99999)}`,
      phoneNumber: `+598 9${randomInt(1000000, 9999999)}`,
      isDefault: Math.random() < 0.3, // 30% chance of being default
      type: randomChoice(['shipping', 'billing', 'both'] as const),
    };

    return { ...baseAddress, ...overrides };
  },

  /**
   * Creates multiple addresses
   */
  createMany: (count: number, overrides: DeepPartial<Address> = {}): Address[] => {
    return Array.from({ length: count }, () => addressFactory.create(overrides));
  },
};

/**
 * User Preferences Factory Functions
 */
export const preferencesFactory = {
  /**
   * Creates user preferences
   */
  create: (overrides: DeepPartial<UserPreferences> = {}): UserPreferences => {
    const basePreferences: UserPreferences = {
      notifications: {
        push: Math.random() < 0.8,
        email: Math.random() < 0.7,
        promotions: Math.random() < 0.4,
        orderUpdates: Math.random() < 0.9,
      },
      privacy: {
        shareAnalytics: Math.random() < 0.3,
        personalizedAds: Math.random() < 0.2,
      },
      accessibility: {
        fontSize: randomChoice(['small', 'medium', 'large'] as const),
        highContrast: Math.random() < 0.1,
        reducedMotion: Math.random() < 0.05,
      },
      language: randomChoice(['es', 'en']),
      currency: 'UYU',
    };

    return deepMerge(basePreferences, overrides);
  },
};

/**
 * Product Card Data Factory Functions
 */
export const productCardFactory = {
  /**
   * Creates product card data from a product
   */
  fromProduct: (
    product: Product,
    overrides: DeepPartial<ProductCardData> = {}
  ): ProductCardData => {
    const finalPrice = product.discountedPrice ?? product.price;
    const originalPrice = product.discountedPrice ? product.price : undefined;
    const discountPercentage =
      product.discountedPrice && product.price
        ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
        : undefined;

    const baseCardData: ProductCardData = {
      id: product.id,
      name: product.title,
      price: finalPrice,
      image: product.frontImage,
      isNew: product.statuses.includes(ProductStatus.NEW),
      description: product.shortDescription || { line1: '', line2: '' },
      originalPrice,
      discountedPrice: product.discountedPrice,
      discountPercentage,
      color: product.colors?.[0]?.colorName,
      size: product.size,
    };

    return { ...baseCardData, ...overrides };
  },

  /**
   * Creates standalone product card data
   */
  create: (overrides: DeepPartial<ProductCardData> = {}): ProductCardData => {
    const product = productFactory.create();
    return productCardFactory.fromProduct(product, overrides);
  },

  /**
   * Creates multiple product card data items
   */
  createMany: (count: number, overrides: DeepPartial<ProductCardData> = {}): ProductCardData[] => {
    return Array.from({ length: count }, () => productCardFactory.create(overrides));
  },
};

/**
 * Utility Functions
 */

/**
 * Deep merge two objects
 */
function deepMerge<T>(target: T, source: DeepPartial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key], source[key] as any);
      } else {
        result[key] = source[key] as any;
      }
    }
  }

  return result;
}

/**
 * Reset the ID counter (useful for deterministic tests)
 */
export const resetIdCounter = (startValue = 1000): void => {
  idCounter = startValue;
};

/**
 * Generate a specific number for deterministic testing
 */
export const deterministicRandom = {
  choice: <T>(arr: T[], seed: number): T => {
    return arr[seed % arr.length];
  },

  int: (min: number, max: number, seed: number): number => {
    return min + (seed % (max - min + 1));
  },

  price: (min = 1500, max = 15000, seed: number): number => {
    const price = min + (seed % (max - min + 1));
    return Math.round(price / 100) * 100;
  },
};

// Export all factory functions
export const factories = {
  product: productFactory,
  user: userFactory,
  cartItem: cartItemFactory,
  category: categoryFactory,
  address: addressFactory,
  preferences: preferencesFactory,
  productCard: productCardFactory,
};
