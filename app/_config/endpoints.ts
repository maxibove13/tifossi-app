import { currentEnvironment, config } from './environment';

/**
 * API Endpoint Configuration
 */
export interface ApiEndpoints {
  baseUrl: string;
  apiVersion: string;
  timeout: number;

  // Core API endpoints
  products: string;
  product: (id: string) => string;
  categories: string;
  search: string;

  // Authentication endpoints
  auth: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
    verify: string;
    resendVerification: string;
    forgotPassword: string;
    resetPassword: string;
    validateToken: string;
  };

  // User endpoints
  user: {
    profile: string;
    updateProfile: string;
    updatePassword: string;
    updateAvatar: string;
    preferences: string;
  };

  // E-commerce endpoints
  cart: {
    sync: string;
    add: string;
    remove: string;
    update: string;
    clear: string;
  };

  favorites: {
    sync: string;
    add: string;
    remove: string;
    list: string;
  };

  orders: {
    create: string;
    list: string;
    details: (id: string) => string;
    cancel: (id: string) => string;
    track: (id: string) => string;
  };

  // Payment endpoints
  payment: {
    process: string;
    status: (id: string) => string;
    webhook: string;
    mercadoPago: {
      createPreference: string;
      getPayment: (id: string) => string;
      webhook: string;
    };
  };

  // Content endpoints
  content: {
    banners: string;
    promotions: string;
    blog: string;
    pages: string;
  };

  // Admin endpoints (staging/development only)
  admin?: {
    dashboard: string;
    analytics: string;
    users: string;
    products: string;
    orders: string;
  };
}

/**
 * Environment-specific endpoint configurations
 */
const endpointConfigurations: Record<string, ApiEndpoints> = {
  development: {
    baseUrl: 'http://localhost:1337',
    apiVersion: 'v1',
    timeout: config.apiTimeout,

    products: '/api/products',
    product: (id: string) => `/api/products/${id}`,
    categories: '/api/categories',
    search: '/api/search',

    auth: {
      login: '/api/auth/local',
      register: '/api/auth/local/register',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
      verify: '/api/auth/verify-email',
      resendVerification: '/api/auth/resend-verification',
      forgotPassword: '/api/auth/forgot-password',
      resetPassword: '/api/auth/reset-password',
      validateToken: '/api/auth/validate-token',
    },

    user: {
      profile: '/api/users/me',
      updateProfile: '/api/users/me',
      updatePassword: '/api/users/me/password',
      updateAvatar: '/api/users/me/avatar',
      preferences: '/api/users/me/preferences',
    },

    cart: {
      sync: '/api/cart/sync',
      add: '/api/cart/add',
      remove: '/api/cart/remove',
      update: '/api/cart/update',
      clear: '/api/cart/clear',
    },

    favorites: {
      sync: '/api/favorites/sync',
      add: '/api/favorites/add',
      remove: '/api/favorites/remove',
      list: '/api/favorites',
    },

    orders: {
      create: '/api/orders',
      list: '/api/orders',
      details: (id: string) => `/api/orders/${id}`,
      cancel: (id: string) => `/api/orders/${id}/cancel`,
      track: (id: string) => `/api/orders/${id}/track`,
    },

    payment: {
      process: '/api/payments/process',
      status: (id: string) => `/api/payments/${id}/status`,
      webhook: '/api/payments/webhook',
      mercadoPago: {
        createPreference: '/api/payments/mercadopago/preference',
        getPayment: (id: string) => `/api/payments/mercadopago/${id}`,
        webhook: '/api/payments/mercadopago/webhook',
      },
    },

    content: {
      banners: '/api/banners',
      promotions: '/api/promotions',
      blog: '/api/blog',
      pages: '/api/pages',
    },

    admin: {
      dashboard: '/api/admin/dashboard',
      analytics: '/api/admin/analytics',
      users: '/api/admin/users',
      products: '/api/admin/products',
      orders: '/api/admin/orders',
    },
  },

  staging: {
    baseUrl: 'https://staging-api.tifossi.app',
    apiVersion: 'v1',
    timeout: config.apiTimeout,

    products: '/api/products',
    product: (id: string) => `/api/products/${id}`,
    categories: '/api/categories',
    search: '/api/search',

    auth: {
      login: '/api/auth/local',
      register: '/api/auth/local/register',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
      verify: '/api/auth/verify-email',
      resendVerification: '/api/auth/resend-verification',
      forgotPassword: '/api/auth/forgot-password',
      resetPassword: '/api/auth/reset-password',
      validateToken: '/api/auth/validate-token',
    },

    user: {
      profile: '/api/users/me',
      updateProfile: '/api/users/me',
      updatePassword: '/api/users/me/password',
      updateAvatar: '/api/users/me/avatar',
      preferences: '/api/users/me/preferences',
    },

    cart: {
      sync: '/api/cart/sync',
      add: '/api/cart/add',
      remove: '/api/cart/remove',
      update: '/api/cart/update',
      clear: '/api/cart/clear',
    },

    favorites: {
      sync: '/api/favorites/sync',
      add: '/api/favorites/add',
      remove: '/api/favorites/remove',
      list: '/api/favorites',
    },

    orders: {
      create: '/api/orders',
      list: '/api/orders',
      details: (id: string) => `/api/orders/${id}`,
      cancel: (id: string) => `/api/orders/${id}/cancel`,
      track: (id: string) => `/api/orders/${id}/track`,
    },

    payment: {
      process: '/api/payments/process',
      status: (id: string) => `/api/payments/${id}/status`,
      webhook: '/api/payments/webhook',
      mercadoPago: {
        createPreference: '/api/payments/mercadopago/preference',
        getPayment: (id: string) => `/api/payments/mercadopago/${id}`,
        webhook: '/api/payments/mercadopago/webhook',
      },
    },

    content: {
      banners: '/api/banners',
      promotions: '/api/promotions',
      blog: '/api/blog',
      pages: '/api/pages',
    },

    admin: {
      dashboard: '/api/admin/dashboard',
      analytics: '/api/admin/analytics',
      users: '/api/admin/users',
      products: '/api/admin/products',
      orders: '/api/admin/orders',
    },
  },

  production: {
    baseUrl: 'https://api.tifossi.app',
    apiVersion: 'v1',
    timeout: config.apiTimeout,

    products: '/api/products',
    product: (id: string) => `/api/products/${id}`,
    categories: '/api/categories',
    search: '/api/search',

    auth: {
      login: '/api/auth/local',
      register: '/api/auth/local/register',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
      verify: '/api/auth/verify-email',
      resendVerification: '/api/auth/resend-verification',
      forgotPassword: '/api/auth/forgot-password',
      resetPassword: '/api/auth/reset-password',
      validateToken: '/api/auth/validate-token',
    },

    user: {
      profile: '/api/users/me',
      updateProfile: '/api/users/me',
      updatePassword: '/api/users/me/password',
      updateAvatar: '/api/users/me/avatar',
      preferences: '/api/users/me/preferences',
    },

    cart: {
      sync: '/api/cart/sync',
      add: '/api/cart/add',
      remove: '/api/cart/remove',
      update: '/api/cart/update',
      clear: '/api/cart/clear',
    },

    favorites: {
      sync: '/api/favorites/sync',
      add: '/api/favorites/add',
      remove: '/api/favorites/remove',
      list: '/api/favorites',
    },

    orders: {
      create: '/api/orders',
      list: '/api/orders',
      details: (id: string) => `/api/orders/${id}`,
      cancel: (id: string) => `/api/orders/${id}/cancel`,
      track: (id: string) => `/api/orders/${id}/track`,
    },

    payment: {
      process: '/api/payments/process',
      status: (id: string) => `/api/payments/${id}/status`,
      webhook: '/api/payments/webhook',
      mercadoPago: {
        createPreference: '/api/payments/mercadopago/preference',
        getPayment: (id: string) => `/api/payments/mercadopago/${id}`,
        webhook: '/api/payments/mercadopago/webhook',
      },
    },

    content: {
      banners: '/api/banners',
      promotions: '/api/promotions',
      blog: '/api/blog',
      pages: '/api/pages',
    },

    // No admin endpoints in production for security
  },
};

/**
 * Current endpoints configuration
 */
export const endpoints = endpointConfigurations[currentEnvironment];

/**
 * URL builder utilities
 */
export const buildUrl = (endpoint: string, params?: Record<string, string | number>): string => {
  let url = `${endpoints.baseUrl}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value.toString());
    });
    url += `?${searchParams.toString()}`;
  }

  return url;
};

export const buildFullUrl = (
  endpoint: string,
  params?: Record<string, string | number>
): string => {
  return buildUrl(endpoint, params);
};

/**
 * Environment-specific overrides
 */
export const getEndpointOverride = (key: string): string | undefined => {
  // Allow environment variables to override specific endpoints
  return process.env[`EXPO_PUBLIC_API_${key.toUpperCase()}`];
};

/**
 * Health check endpoint
 */
export const getHealthCheckUrl = (): string => {
  return buildUrl('/api/health');
};

/**
 * WebSocket endpoints (for real-time features)
 */
export const getWebSocketUrl = (): string => {
  const wsProtocol = endpoints.baseUrl.startsWith('https') ? 'wss' : 'ws';
  const wsUrl = endpoints.baseUrl.replace(/^https?/, wsProtocol);
  return `${wsUrl}/ws`;
};

/**
 * CDN and media endpoints
 */
export const getMediaUrl = (path: string): string => {
  if (path.startsWith('http')) {
    return path; // Already a full URL
  }

  // For development, use local media server
  if (currentEnvironment === 'development') {
    return `${endpoints.baseUrl}/uploads/${path}`;
  }

  // For staging/production, use CDN
  const cdnBase =
    currentEnvironment === 'staging'
      ? 'https://staging-cdn.tifossi.app'
      : 'https://cdn.tifossi.app';

  return `${cdnBase}/${path}`;
};

/**
 * Endpoint validation
 */
export const validateEndpoints = (): boolean => {
  try {
    // Check if baseUrl is accessible
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(endpoints.baseUrl)) {
      return false;
    }

    // Check if timeout is reasonable
    if (endpoints.timeout < 1000 || endpoints.timeout > 60000) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Request headers factory
 */
export const getDefaultHeaders = (includeAuth = false): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-App-Version': config.version,
    'X-App-Platform': config.name,
    'X-App-Environment': currentEnvironment,
  };

  if (includeAuth) {
    // Auth token will be added by the auth service
    headers['Authorization'] = 'Bearer {{TOKEN}}';
  }

  return headers;
};

// Default export for easy access
const endpointsExport = {
  current: endpoints,
  build: buildUrl,
  buildFull: buildFullUrl,
  getOverride: getEndpointOverride,
  getHealthCheck: getHealthCheckUrl,
  getWebSocket: getWebSocketUrl,
  getMedia: getMediaUrl,
  validate: validateEndpoints,
  getHeaders: getDefaultHeaders,
};

export default endpointsExport;
