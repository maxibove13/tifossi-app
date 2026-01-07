import mockApi from './mockApi';
import strapiApi from './strapiApi';

// Simple configuration
const USE_STRAPI = true; // Use Strapi API by default

// App Settings type
export interface AppSettings {
  supportPhoneNumber: string;
  supportEmail?: string;
  businessName?: string;
}

// Type definitions for the API interface
export interface ApiInterface {
  // Product methods
  fetchProducts(): Promise<import('../../_types/product').Product[]>;
  fetchProductById(id: string): Promise<import('../../_types/product').Product | undefined>;

  // Cart methods
  syncCart(items: import('./mockApi').CartItem[]): Promise<boolean>;

  // Favorites methods
  syncFavorites(productIds: string[]): Promise<boolean>;

  // Store methods
  fetchStores(): Promise<import('../../_types').StoreDetails[]>;

  // App settings methods
  fetchAppSettings(): Promise<AppSettings>;

  // Category and model methods
  fetchCategories(): Promise<import('../../_types/category').Category[]>;
  fetchProductModels(): Promise<import('../../_types/model').ProductModel[]>;

  // Authentication methods
  login(credentials: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: import('./mockApi').User }>;
  register(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: import('./mockApi').User }>;
  validateToken(token: string): Promise<import('./mockApi').User>;
  logout(token: string | null): Promise<boolean>;

  // Extended authentication methods
  changePassword(
    token: string,
    credentials: { currentPassword: string; newPassword: string }
  ): Promise<boolean>;
  updateProfilePicture(token: string, imageUri: string): Promise<{ profilePictureUrl: string }>;
  syncUserData(): Promise<boolean>;
}

// Simple API selection
const api = USE_STRAPI ? strapiApi : mockApi;

// Export the selected API as default
export default api;

// Export individual components for direct usage
export { mockApi, strapiApi };

// Export types (ApiInterface is already exported above as interface)
export type { User, CartItem } from './mockApi';

// Re-export error handling utilities
export * from './errorHandler';
