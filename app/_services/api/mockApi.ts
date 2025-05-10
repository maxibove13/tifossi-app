import { products, getProductById } from '../../_data/products';
import { Product } from '../../_types/product';

const MOCK_DELAY = 500; // ms

// --- Product Mocks ---
export const mockFetchProducts = async (): Promise<Product[]> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
  console.log('[Mock API] Fetching all products');
  return products;
};

export const mockFetchProductById = async (id: string): Promise<Product | undefined> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY / 2));
  console.log(`[Mock API] Fetching product by ID: ${id}`);
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
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
  console.log('[Mock API] Syncing cart:', items);
  return true;
};

// --- Favorites Mocks ---
export const mockSyncFavorites = async (productIds: string[]): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
  console.log('[Mock API] Syncing favorites:', productIds);
  return true;
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
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY * 1.5));
  console.log('[Mock API] Attempting login:', credentials.email);

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
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY * 2));
  console.log('[Mock API] Attempting registration:', userData.email);

  // Simulate successful registration
  return {
    token: 'mock-jwt-token-67890',
    user: { id: 'user-002', name: userData.name, email: userData.email },
  };
};

export const mockValidateToken = async (token: string): Promise<User> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
  console.log('[Mock API] Validating token:', token);

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
  console.log('[Mock API] Logging out token:', token);
  return true;
};

// --- Extended Authentication Methods ---

export const mockChangePassword = async (
  token: string,
  credentials: { currentPassword: string; newPassword: string }
): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
  console.log('[Mock API] Changing password for token:', token);

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
  console.log('[Mock API] Updating profile picture for token:', token);

  // Simulate image processing and storage
  // In a real implementation, this would upload to a storage service
  // and return the public URL of the uploaded image
  return { profilePictureUrl: imageUri };
};

export const mockResendVerificationEmail = async (token: string): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
  console.log('[Mock API] Resending verification email/code for token:', token);

  // In a real implementation with a specific auth provider:
  // - With Firebase, this would call sendEmailVerification()
  // - With Auth0, this might call the Management API to trigger verification
  // - With a custom backend, this would hit a verification resend endpoint

  // Simulate occasional network failures (5% chance)
  if (Math.random() < 0.05) {
    throw new Error('Network error. Please check your connection and try again.');
  }

  return true;
};

export const mockVerifyEmail = async (token: string, code: string): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
  console.log('[Mock API] Verifying email with code:', code);

  // In a real implementation, this would validate the code against what was sent in the database
  // For development/mock purposes, accept any 6-digit code
  // This allows for easy testing while remaining agnostic to the actual auth provider
  if (!/^\d{6}$/.test(code)) {
    throw new Error('Invalid verification code format');
  }

  // For demo purposes, we'll simulate a 90% success rate to mimic real-world scenarios
  // In production, this would be replaced by actual validation against sent codes
  const randomSuccess = Math.random() > 0.1;
  if (!randomSuccess) {
    throw new Error('Invalid verification code');
  }

  return true;
};

// --- User Data Sync --- Simulate merging local/server state after login
export const mockSyncUserData = async (): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY * 1.5));
  console.log('[Mock API] Syncing user data (cart/favorites) after login');
  return true;
};

const mockApi = {
  fetchProducts: mockFetchProducts,
  fetchProductById: mockFetchProductById,
  syncCart: mockSyncCart,
  syncFavorites: mockSyncFavorites,
  login: mockLogin,
  register: mockRegister,
  validateToken: mockValidateToken,
  logout: mockLogout,
  syncUserData: mockSyncUserData,
  changePassword: mockChangePassword,
  updateProfilePicture: mockUpdateProfilePicture,
  resendVerificationEmail: mockResendVerificationEmail,
  verifyEmail: mockVerifyEmail,
};

export default mockApi;
