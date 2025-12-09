import { products, getProductById } from '../../_data/products';
import { Product } from '../../_types/product';
import { config, safeLog, safeWarn } from '../../_config/environment';

const MOCK_DELAY = config.mockDelay; // Use environment-specific delay

// Network simulation settings for offline testing
let SIMULATE_NETWORK_ISSUES = false;
let NETWORK_FAILURE_RATE = 0.1; // 10% chance of network failure
let SLOW_NETWORK_RATE = 0.2; // 20% chance of slow network
let SLOW_NETWORK_DELAY = 5000; // 5 seconds for slow network

// Network simulation controls
export const networkSimulation = {
  enable: () => {
    SIMULATE_NETWORK_ISSUES = true;
  },
  disable: () => {
    SIMULATE_NETWORK_ISSUES = false;
  },
  setFailureRate: (rate: number) => {
    NETWORK_FAILURE_RATE = Math.max(0, Math.min(1, rate));
  },
  setSlowNetworkRate: (rate: number) => {
    SLOW_NETWORK_RATE = Math.max(0, Math.min(1, rate));
  },
  setSlowNetworkDelay: (delay: number) => {
    SLOW_NETWORK_DELAY = delay;
  },
  getStatus: () => ({
    enabled: SIMULATE_NETWORK_ISSUES,
    failureRate: NETWORK_FAILURE_RATE,
    slowNetworkRate: SLOW_NETWORK_RATE,
    slowNetworkDelay: SLOW_NETWORK_DELAY,
  }),
};

// Simulate network conditions for testing
const simulateNetworkConditions = async (): Promise<void> => {
  if (!SIMULATE_NETWORK_ISSUES) return;

  const random = Math.random();

  // Simulate network failure
  if (random < NETWORK_FAILURE_RATE) {
    throw new Error('Network request failed (simulated)');
  }

  // Simulate slow network
  if (random < NETWORK_FAILURE_RATE + SLOW_NETWORK_RATE) {
    safeWarn('[Mock API] Simulating slow network...');
    await new Promise((resolve) => setTimeout(resolve, SLOW_NETWORK_DELAY));
  }
};

// Products are used directly without any media resolution
// In production, all media comes from Strapi with full URLs

// --- Product Mocks ---
export const mockFetchProducts = async (): Promise<Product[]> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
  safeLog('[Mock API] Fetching all products');
  return products;
};

export const mockFetchProductById = async (id: string): Promise<Product | undefined> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY / 2));
  safeLog(`[Mock API] Fetching product by ID: ${id}`);
  return getProductById(id);
};

// --- Cart Mocks ---
export interface CartItem {
  productId: string;
  quantity: number;
  color?: string; // hex value or name
  size?: string; // e.g., 'S', 'M', 'L'
}

export const mockSyncCart = async (items: CartItem[]): Promise<boolean> => {
  await simulateNetworkConditions();
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
  safeLog('[Mock API] Syncing cart:', items);
  return true;
};

// --- Favorites Mocks ---
export const mockSyncFavorites = async (productIds: string[]): Promise<boolean> => {
  await simulateNetworkConditions();
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
  safeLog('[Mock API] Syncing favorites:', productIds);
  return true;
};

// --- Store Mocks ---
export const mockFetchStores = async (): Promise<import('../../_types').StoreDetails[]> => {
  await simulateNetworkConditions();
  await new Promise((resolve) => setTimeout(resolve, 200));
  safeLog('[Mock API] Fetching stores');

  // Return local store data
  const { storesData } = await import('../../_data/stores');
  return storesData;
};

// --- App Settings Mocks ---
export const mockFetchAppSettings = async (): Promise<{
  supportPhoneNumber: string;
  supportEmail?: string;
  businessName?: string;
}> => {
  await simulateNetworkConditions();
  safeLog('[Mock API] Fetching app settings');

  return {
    supportPhoneNumber: '+59899000000',
    businessName: 'Tifossi',
  };
};

// --- Auth Mocks ---
export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  isEmailVerified?: boolean;
}

export const mockLogin = async (credentials: {
  email: string;
  password: string;
}): Promise<{ token: string; user: User }> => {
  await simulateNetworkConditions();
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY * 1.5));
  safeLog('[Mock API] Attempting login:', credentials.email);

  // Simulate login (in a real app, this would verify credentials with a backend)
  if (credentials.email === 'test@tifossi.com' && credentials.password === 'password') {
    return {
      token: 'mock-jwt-token-12345',
      user: { id: 'user-001', name: 'Test User', email: credentials.email },
    };
  }
  throw new Error('Invalid credentials');
};

export const mockRegister = async (userData: {
  name: string;
  email: string;
  password: string;
}): Promise<{ token: string; user: User }> => {
  await simulateNetworkConditions();
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY * 2));
  safeLog('[Mock API] Attempting registration:', userData.email);

  // Simulate successful registration
  return {
    token: 'mock-jwt-token-67890',
    user: { id: 'user-002', name: userData.name, email: userData.email },
  };
};

export const mockValidateToken = async (token: string): Promise<User> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
  safeLog('[Mock API] Validating token:', token);

  if (token.startsWith('mock-jwt-token-')) {
    // Simulate returning user data based on token
    const userId = token.includes('12345') ? 'user-001' : 'user-002';
    return {
      id: userId,
      name: userId === 'user-001' ? 'Test User' : 'New User',
      email: userId === 'user-001' ? 'test@tifossi.com' : 'register@tifossi.com',
    };
  }
  throw new Error('Invalid or expired token');
};

export const mockLogout = async (token: string | null): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY / 2));
  safeLog('[Mock API] Logging out token:', token);
  return true;
};

// --- Extended Authentication Methods ---

export const mockChangePassword = async (
  token: string,
  credentials: { currentPassword: string; newPassword: string }
): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
  safeLog('[Mock API] Changing password for token:', token);

  // Validate current password (in a real API this would verify against stored hash)
  if (credentials.currentPassword !== 'password') {
    throw new Error('Current password is incorrect');
  }

  return true;
};

export const mockUpdateProfilePicture = async (
  token: string,
  imageUri: string
): Promise<{ profilePictureUrl: string }> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY * 1.5));
  safeLog('[Mock API] Updating profile picture for token:', token);

  // Simulate image processing and storage
  // In a real implementation, this would upload to a storage service
  // and return the public URL of the uploaded image
  return { profilePictureUrl: imageUri };
};

// --- User Data Sync --- Simulate merging local/server state after login
export const mockSyncUserData = async (): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY * 1.5));
  safeLog('[Mock API] Syncing user data (cart/favorites) after login');
  return true;
};

// --- Environment Information Mock ---
export const mockGetEnvironmentInfo = async (): Promise<{
  environment: string;
  version: string;
  buildNumber: string;
  useMockApi: boolean;
  mockDelay: number;
}> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY / 4));
  safeLog('[Mock API] Getting environment info');

  return {
    environment: config.name,
    version: config.version,
    buildNumber: config.buildNumber,
    useMockApi: config.useMockApi,
    mockDelay: MOCK_DELAY,
  };
};

// --- Health Check Mock ---
export const mockHealthCheck = async (): Promise<{
  status: 'ok' | 'error';
  timestamp: number;
  environment: string;
  uptime: number;
}> => {
  await new Promise((resolve) => setTimeout(resolve, 100)); // Quick health check
  safeLog('[Mock API] Health check');

  // Simulate occasional service issues in development
  const isHealthy = config.name === 'production' ? true : Math.random() > 0.05;

  return {
    status: isHealthy ? 'ok' : 'error',
    timestamp: Date.now(),
    environment: config.name,
    uptime: Math.floor(Math.random() * 86400), // Random uptime in seconds
  };
};

const mockApi = {
  // Core product and e-commerce APIs
  fetchProducts: mockFetchProducts,
  fetchProductById: mockFetchProductById,
  syncCart: mockSyncCart,
  syncFavorites: mockSyncFavorites,
  fetchStores: mockFetchStores,
  fetchAppSettings: mockFetchAppSettings,

  // Authentication APIs
  login: mockLogin,
  register: mockRegister,
  validateToken: mockValidateToken,
  logout: mockLogout,
  syncUserData: mockSyncUserData,
  changePassword: mockChangePassword,
  updateProfilePicture: mockUpdateProfilePicture,

  // System APIs
  getEnvironmentInfo: mockGetEnvironmentInfo,
  healthCheck: mockHealthCheck,
};

export default mockApi;
