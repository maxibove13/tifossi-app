import { currentEnvironment, config, safeLog, safeWarn, safeError } from './environment';

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
 * Get API base URL from environment
 * Uses a fallback URL in production if env var is missing to prevent crashes
 */
const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

  // Test environment - always provide default
  if (process.env.NODE_ENV === 'test') {
    return envUrl || 'http://localhost:1337';
  }

  // If env var is set, use it
  if (envUrl) {
    return envUrl;
  }

  // Development fallback
  if (currentEnvironment === 'development') {
    safeWarn(
      '⚠️ API URL not configured. Using localhost:1337. Set EXPO_PUBLIC_API_BASE_URL in .env'
    );
    return 'http://localhost:1337';
  }

  // Production/staging fallback - use production URL to prevent crash
  // This ensures the app doesn't crash if env var wasn't properly inlined at build time
  safeWarn('⚠️ API URL not configured, using production fallback');
  return 'https://tifossi-strapi-backend.onrender.com';
};

/**
 * Create endpoint configuration
 * Single configuration used for all environments - baseUrl is determined by env var
 */
const createEndpointConfig = (): ApiEndpoints => ({
  baseUrl: getApiBaseUrl(),
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
    validateToken: '/api/auth/validate',
  },

  user: {
    profile: '/api/users/me',
    updateProfile: '/api/user-profile/me',
    updatePassword: '/api/users/me/password',
    updateAvatar: '/api/users/me/avatar',
    preferences: '/api/users/me/preferences',
  },

  cart: {
    sync: '/api/user-profile/me',
    add: '/api/cart/add',
    remove: '/api/cart/remove',
    update: '/api/cart/update',
    clear: '/api/cart/clear',
  },

  favorites: {
    sync: '/api/user-profile/me',
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

  // Admin endpoints only in non-production
  ...(currentEnvironment !== 'production' && {
    admin: {
      dashboard: '/api/admin/dashboard',
      analytics: '/api/admin/analytics',
      users: '/api/admin/users',
      products: '/api/admin/products',
      orders: '/api/admin/orders',
    },
  }),
});

/**
 * Current endpoints configuration
 */
export const endpoints = createEndpointConfig();

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
 * Endpoint validation - ensures configuration is correct
 */
export const validateEndpoints = (): boolean => {
  try {
    // Check if baseUrl is a valid URL
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(endpoints.baseUrl)) {
      safeError(`❌ Invalid API URL format: ${endpoints.baseUrl}`);
      return false;
    }

    // Check if timeout is reasonable
    if (endpoints.timeout < 1000 || endpoints.timeout > 60000) {
      safeError(`❌ Invalid timeout value: ${endpoints.timeout}`);
      return false;
    }

    // Warn if using localhost in non-development environment
    if (currentEnvironment !== 'development' && endpoints.baseUrl.includes('localhost')) {
      safeError('❌ Using localhost URL in non-development environment!');
      return false;
    }

    return true;
  } catch (error) {
    safeError('❌ Failed to validate endpoints:', error);
    return false;
  }
};

/**
 * Initialize and validate endpoints configuration
 * Call this early in app initialization to fail fast
 */
export const initializeEndpoints = (): void => {
  safeLog(`🔧 Initializing API endpoints for ${currentEnvironment} environment...`);

  if (!validateEndpoints()) {
    throw new Error('INVALID_API_CONFIGURATION: Endpoints validation failed');
  }

  safeLog(`✅ API configured: ${endpoints.baseUrl}`);
};

/**
 * Request headers factory
 */
export const getDefaultHeaders = (_includeAuth = false): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-App-Version': config.version,
    'X-App-Platform': config.name,
    'X-App-Environment': currentEnvironment,
  };

  // Note: Auth token will be added by the auth service when includeAuth is true
  // Do not set Authorization header here to avoid placeholder tokens

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
