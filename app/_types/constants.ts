/**
 * App-wide constants for category and model identification
 */

export const CATEGORY_IDS = {
  ALL: 'todo',
  ACCESSORIES: 'accesorios',
  SWEATSHIRTS: 'buzos',
  BAGS: 'bolsos',
  SHIN_GUARDS: 'canilleras',
  FLIP_FLOPS: 'chanclas',
  CAPS: 'gorros',
  SOCKS: 'medias',
  BACKPACKS: 'mochilas',
  TOILETRY_BAG: 'neceser',
  PANTS: 'pantalones',
  SHIRTS: 'remeras',
};

export const MODEL_IDS = {
  ALL: 'all',
  // Socks models
  CLASSIC: 'classic',
  SPORT: 'sport',
  ANTI_SLIP: 'antideslizante',
  FAST: 'fast',
  // Shirts models
  REGULAR: 'regular',
  RELAXED: 'relaxed',
  OVERSIZE: 'oversize',
  TSHIRT: 'tshirt',
  // Backpacks models
  STANDARD: 'standard',
  TRAVEL: 'travel',
  PREMIUM: 'premium',
  // Bags models
  REGULAR_BAG: 'regular_bag',
  SPORT_BAG: 'sport_bag',
  // Sweatshirts models
  OVERSIZE_BUZO: 'oversize_buzo',
  JACKET: 'campera',
  // Caps models
  CAP: 'cap',
  // Toiletry bag models
  GLOBE: 'globo',
  BALL: 'ball',
  // Shin guards models
  PRO: 'pro',
  LITE: 'lite',
};

/**
 * Storage keys for persistence
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'tifossi_auth_token',
  CART: 'tifossi-cart-local',
  FAVORITES: 'tifossi-favorites-local',
};

/**
 * MMKV storage IDs
 */
export const MMKV_IDS = {
  CART: 'cart-storage',
  FAVORITES: 'favorites-storage',
};

/**
 * Mock API constants
 */
export const MOCK_API = {
  DELAY: 500, // ms
  TEST_EMAIL: 'test@tifossi.com',
  TEST_PASSWORD: 'password',
  AUTH_TOKEN_PREFIX: 'mock-jwt-token-',
  TOKEN_USER1: 'mock-jwt-token-12345',
  TOKEN_USER2: 'mock-jwt-token-67890',
  USER_ID_1: 'user-001',
  USER_ID_2: 'user-002',
};

/**
 * Route paths
 *
 * NOTE: These constants can be used with router.push() methods like:
 * router.push(ROUTES.PRODUCT_DETAIL + '?id=' + productId)
 *
 * However, they should NOT be used directly with Expo Router's href options
 * due to type checking. For href, use the string literals like '/cart' directly.
 */
export const ROUTES = {
  PRODUCT_DETAIL: '/products/product',
  CATALOG: '/catalog',
  HOME: '/',
  CART: '/cart',
  FAVORITES: '/favorites',
  PROFILE: '/profile',
  DELETED_CART: '/cart/deleted',
  TIFOSSI_EXPLORE: '/tiffosiExplore',
};

/**
 * Default values
 */
export const DEFAULTS = {
  RETURN_POLICY:
    'Si no estás satisfecho con tu compra, puedes devolver el producto sin usar dentro de los 30 días posteriores a la compra con el ticket original y el embalaje intacto.',
};

/**
 * Store locations constants
 */
export const STORE_IDS = {
  CENTRO_MVD: 'centro_mvd',
  PLAZA_ITALIA_MVD: 'plaza_italia_mvd',
  PUNTA_DEL_ESTE: 'punta_del_este_pde',
};

export const CITY_IDS = {
  MONTEVIDEO: 'mvd',
  PUNTA_DEL_ESTE: 'pde',
};

export const ZONE_IDS = {
  CENTRO: 'centro',
  PLAZA_ITALIA: 'plaza_italia',
  PUNTA_DEL_ESTE: 'punta_del_este',
};

// Add default export to fix router warnings
const utilityExport = {
  name: 'Constants',
  version: '1.0.0',
};

export default utilityExport;
