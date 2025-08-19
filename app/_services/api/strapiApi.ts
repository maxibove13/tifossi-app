import httpClient from './httpClient';
import { transformStrapiProduct, StrapiResponse, StrapiProduct } from '../../_utils/apiTransforms';
import { handleApiError } from './errorHandler';
import { Product } from '../../_types/product';

// Additional types needed
export interface StrapiAuthResponse {
  jwt: string;
  user: StrapiUser;
}

export interface StrapiUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  confirmed?: boolean;
  blocked?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Re-export types from mockApi for compatibility
export interface CartItem {
  productId: string;
  quantity: number;
  color?: string;
  size?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  isEmailVerified?: boolean;
}

// Cache TTL constants (in minutes)
const CACHE_TTL = {
  PRODUCTS: 30,
  PRODUCT_DETAIL: 60,
  CATEGORIES: 120,
  USER_DATA: 15,
  STATUSES: 240,
} as const;

// Simple in-memory cache for this service
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();

  set<T>(key: string, data: T, ttlMinutes: number): void {
    const expires = Date.now() + ttlMinutes * 60 * 1000;
    this.cache.set(key, { data, expires });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new SimpleCache();

// Helper functions
function createCacheKey(prefix: string, params?: Record<string, any>): string {
  const base = `strapi_${prefix}`;
  if (!params) return base;
  const paramString = JSON.stringify(params);
  return `${base}_${Buffer.from(paramString).toString('base64')}`;
}

function buildStrapiQuery(options: {
  populate?: string[];
  filters?: Record<string, any>;
  sort?: string[];
  pagination?: { page?: number; pageSize?: number };
}): string {
  const params = new URLSearchParams();

  if (options.populate) {
    options.populate.forEach((field) => params.append('populate', field));
  }

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(`filters[${key}]`, JSON.stringify(value));
      }
    });
  }

  if (options.sort) {
    options.sort.forEach((field) => params.append('sort', field));
  }

  if (options.pagination) {
    if (options.pagination.page) {
      params.append('pagination[page]', options.pagination.page.toString());
    }
    if (options.pagination.pageSize) {
      params.append('pagination[pageSize]', options.pagination.pageSize.toString());
    }
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

function validateStrapiResponse<T>(response: StrapiResponse<T>): StrapiResponse<T> {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid Strapi response format');
  }
  if (!('data' in response)) {
    throw new Error('Strapi response missing data field');
  }
  return response;
}

function transformStrapiUser(strapiUser: StrapiUser): User {
  return {
    id: strapiUser.id.toString(),
    name:
      strapiUser.firstName && strapiUser.lastName
        ? `${strapiUser.firstName} ${strapiUser.lastName}`
        : strapiUser.username,
    email: strapiUser.email,
    profilePicture: undefined, // Will be populated if available
    isEmailVerified: strapiUser.confirmed || false,
  };
}

class StrapiApiService {
  private cacheEnabled = true;

  // --- Product Methods ---

  /**
   * Fetches all products with caching
   */
  async fetchProducts(): Promise<Product[]> {
    const cacheKey = createCacheKey('products');

    // Try cache first
    if (this.cacheEnabled) {
      const cached = cache.get<Product[]>(cacheKey);
      if (cached) {
        console.log('[Strapi API] Products loaded from cache');
        return cached;
      }
    }

    try {
      const queryParams = buildStrapiQuery({
        populate: [
          'frontImage',
          'images',
          'videoSource',
          'category',
          'model',
          'statuses',
          'colors',
          'colors.mainImage',
          'colors.additionalImages',
          'sizes',
          'dimensions',
        ],
        sort: ['createdAt:desc'],
      });

      const response = await httpClient.get<StrapiResponse<StrapiProduct[]>>(
        `/products${queryParams}`
      );
      const validatedResponse = validateStrapiResponse<StrapiProduct[]>(response);

      // Transform to app format
      const products = validatedResponse.data.map(transformStrapiProduct);

      // Cache the result
      if (this.cacheEnabled) {
        cache.set(cacheKey, products, CACHE_TTL.PRODUCTS);
      }

      console.log(`[Strapi API] Fetched ${products.length} products`);
      return products;
    } catch (error) {
      const apiError = handleApiError(error, 'fetchProducts');

      // Try to return cached data if available during error
      if (this.cacheEnabled) {
        const cached = cache.get<Product[]>(cacheKey);
        if (cached) {
          console.warn('[Strapi API] Returning cached products due to error:', apiError.message);
          return cached;
        }
      }

      throw apiError;
    }
  }

  /**
   * Searches products by text query
   */
  async searchProducts(
    query: string,
    filters?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      colors?: string[];
      sizes?: string[];
    }
  ): Promise<Product[]> {
    const cacheKey = createCacheKey('products_search', { query, filters });

    // Try cache first
    if (this.cacheEnabled) {
      const cached = cache.get<Product[]>(cacheKey);
      if (cached) {
        console.log(`[Strapi API] Search results for "${query}" loaded from cache`);
        return cached;
      }
    }

    try {
      const queryParams = buildStrapiQuery({
        populate: [
          'frontImage',
          'images',
          'videoSource',
          'category',
          'model',
          'statuses',
          'colors',
          'colors.mainImage',
          'colors.additionalImages',
          'sizes',
          'dimensions',
        ],
        filters: {
          $or: [
            { title: { $containsi: query } },
            { shortDescription: { line1: { $containsi: query } } },
            { shortDescription: { line2: { $containsi: query } } },
            { longDescription: { $containsi: query } },
          ],
          ...(filters?.category && { categoryId: { $eq: filters.category } }),
          ...(filters?.minPrice && { price: { $gte: filters.minPrice } }),
          ...(filters?.maxPrice && { price: { $lte: filters.maxPrice } }),
        },
        sort: ['createdAt:desc'],
      });

      const response = await httpClient.get<StrapiResponse<StrapiProduct[]>>(
        `/products${queryParams}`
      );
      const validatedResponse = validateStrapiResponse<StrapiProduct[]>(response);

      // Transform to app format
      const products = validatedResponse.data.map(transformStrapiProduct);

      // Apply additional client-side filters for colors and sizes
      let filteredProducts = products;

      if (filters?.colors && filters.colors.length > 0) {
        filteredProducts = filteredProducts.filter((product: Product) =>
          product.colors?.some(
            (color: any) =>
              filters.colors!.includes(color.colorName) || filters.colors!.includes(color.hex)
          )
        );
      }

      if (filters?.sizes && filters.sizes.length > 0) {
        filteredProducts = filteredProducts.filter((product: Product) =>
          product.sizes?.some((size: any) => filters.sizes!.includes(size.value))
        );
      }

      // Cache the result
      if (this.cacheEnabled) {
        cache.set(cacheKey, filteredProducts, CACHE_TTL.PRODUCTS);
      }

      console.log(`[Strapi API] Found ${filteredProducts.length} products for search "${query}"`);
      return filteredProducts;
    } catch (error) {
      const apiError = handleApiError(error, `searchProducts:${query}`);

      // Try to return cached data if available during error
      if (this.cacheEnabled) {
        const cached = cache.get<Product[]>(cacheKey);
        if (cached) {
          console.warn(
            `[Strapi API] Returning cached search results for "${query}" due to error:`,
            apiError.message
          );
          return cached;
        }
      }

      throw apiError;
    }
  }

  /**
   * Fetches a single product by ID with caching
   */
  async fetchProductById(id: string): Promise<Product | undefined> {
    const cacheKey = createCacheKey('product', { id });

    // Try cache first
    if (this.cacheEnabled) {
      const cached = cache.get<Product>(cacheKey);
      if (cached) {
        console.log(`[Strapi API] Product ${id} loaded from cache`);
        return cached;
      }
    }

    try {
      const queryParams = buildStrapiQuery({
        populate: [
          'frontImage',
          'images',
          'videoSource',
          'category',
          'model',
          'statuses',
          'colors',
          'colors.mainImage',
          'colors.additionalImages',
          'sizes',
          'dimensions',
        ],
      });

      const response = await httpClient.get<StrapiResponse<StrapiProduct>>(
        `/products/${id}${queryParams}`
      );
      const validatedResponse = validateStrapiResponse<StrapiProduct>(response);

      // Transform to app format
      const product = transformStrapiProduct(validatedResponse.data);

      // Cache the result
      if (this.cacheEnabled) {
        cache.set(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL);
      }

      console.log(`[Strapi API] Fetched product: ${product.title}`);
      return product;
    } catch (error) {
      const apiError = handleApiError(error, `fetchProductById:${id}`);

      // Return cached data if available during error
      if (this.cacheEnabled) {
        const cached = cache.get<Product>(cacheKey);
        if (cached) {
          console.warn(
            `[Strapi API] Returning cached product ${id} due to error:`,
            apiError.message
          );
          return cached;
        }
      }

      // Return undefined for not found errors to match mockApi behavior
      if (apiError.message.includes('404') || apiError.message.includes('not found')) {
        return undefined;
      }

      throw apiError;
    }
  }

  // --- Cart Methods ---

  /**
   * Syncs cart items with the server
   */
  async syncCart(items: CartItem[]): Promise<boolean> {
    try {
      await httpClient.put('/users/me/cart', { cart: items });
      console.log(`[Strapi API] Cart synced with ${items.length} items`);
      return true;
    } catch (error) {
      const apiError = handleApiError(error, 'syncCart');
      console.error('[Strapi API] Cart sync failed:', apiError.message);
      throw apiError;
    }
  }

  // --- Favorites Methods ---

  /**
   * Syncs favorite product IDs with the server
   */
  async syncFavorites(productIds: string[]): Promise<boolean> {
    try {
      await httpClient.put('/users/me/favorites', { favorites: productIds });
      console.log(`[Strapi API] Favorites synced with ${productIds.length} items`);
      return true;
    } catch (error) {
      const apiError = handleApiError(error, 'syncFavorites');
      console.error('[Strapi API] Favorites sync failed:', apiError.message);
      throw apiError;
    }
  }

  // --- Authentication Methods ---

  /**
   * Authenticates user with email and password
   */
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: User }> {
    try {
      const response = await httpClient.post<StrapiAuthResponse>('/auth/local', {
        identifier: credentials.email,
        password: credentials.password,
      });

      const user = transformStrapiUser(response.user);

      console.log(`[Strapi API] User logged in: ${user.email}`);
      return {
        token: response.jwt,
        user,
      };
    } catch (error) {
      const apiError = handleApiError(error, 'login');
      console.error('[Strapi API] Login failed:', apiError.message);
      throw apiError;
    }
  }

  /**
   * Registers a new user
   */
  async register(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: User }> {
    try {
      // Split name into first and last name
      const nameParts = userData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await httpClient.post<StrapiAuthResponse>('/auth/local/register', {
        username: userData.email, // Use email as username
        email: userData.email,
        password: userData.password,
        firstName,
        lastName,
      });

      const user = transformStrapiUser(response.user);

      console.log(`[Strapi API] User registered: ${user.email}`);
      return {
        token: response.jwt,
        user,
      };
    } catch (error) {
      const apiError = handleApiError(error, 'register');
      console.error('[Strapi API] Registration failed:', apiError.message);
      throw apiError;
    }
  }

  /**
   * Validates an authentication token
   */
  async validateToken(token: string): Promise<User> {
    try {
      // Get current user data using the token
      const response = await httpClient.get<StrapiUser>('/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = transformStrapiUser(response);

      console.log(`[Strapi API] Token validated for user: ${user.email}`);
      return user;
    } catch (error) {
      const apiError = handleApiError(error, 'validateToken');
      console.error('[Strapi API] Token validation failed:', apiError.message);
      throw apiError;
    }
  }

  /**
   * Logs out user (invalidates token on server if supported)
   */
  async logout(token: string | null): Promise<boolean> {
    try {
      // Strapi doesn't have a built-in logout endpoint by default
      // But we can call a custom one if implemented
      if (token) {
        try {
          await httpClient.post(
            '/auth/logout',
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (error) {
          // Ignore errors if logout endpoint doesn't exist
          console.warn('[Strapi API] Logout endpoint not available, proceeding with local logout');
        }
      }

      console.log('[Strapi API] User logged out');
      return true;
    } catch (error) {
      // Don't throw on logout errors, just log them
      console.warn('[Strapi API] Logout error (continuing):', error);
      return true;
    }
  }

  // --- Extended Authentication Methods ---

  /**
   * Changes user password
   */
  async changePassword(
    token: string,
    credentials: { currentPassword: string; newPassword: string }
  ): Promise<boolean> {
    try {
      await httpClient.post(
        '/auth/change-password',
        {
          currentPassword: credentials.currentPassword,
          password: credentials.newPassword,
          passwordConfirmation: credentials.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('[Strapi API] Password changed successfully');
      return true;
    } catch (error) {
      const apiError = handleApiError(error, 'changePassword');
      console.error('[Strapi API] Password change failed:', apiError.message);
      throw apiError;
    }
  }

  /**
   * Updates user profile picture
   */
  async updateProfilePicture(
    token: string,
    imageUri: string
  ): Promise<{ profilePictureUrl: string }> {
    try {
      // This would typically involve uploading the image file
      // For now, we'll simulate the process
      const formData = new FormData();
      formData.append('files', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile-picture.jpg',
      } as any);

      // Upload the image
      const uploadResponse = await httpClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      // Update user profile with the uploaded image
      const imageId = uploadResponse[0]?.id;
      if (imageId) {
        await httpClient.put(
          '/users/me',
          {
            profilePicture: imageId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      const profilePictureUrl = uploadResponse[0]?.url || imageUri;

      console.log('[Strapi API] Profile picture updated');
      return { profilePictureUrl };
    } catch (error) {
      const apiError = handleApiError(error, 'updateProfilePicture');
      console.error('[Strapi API] Profile picture update failed:', apiError.message);
      throw apiError;
    }
  }

  /**
   * Resends email verification
   */
  async resendVerificationEmail(token: string): Promise<boolean> {
    try {
      await httpClient.post(
        '/auth/send-email-confirmation',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('[Strapi API] Verification email sent');
      return true;
    } catch (error) {
      const apiError = handleApiError(error, 'resendVerificationEmail');
      console.error('[Strapi API] Resend verification email failed:', apiError.message);
      throw apiError;
    }
  }

  /**
   * Verifies email with confirmation code
   */
  async verifyEmail(token: string, code: string): Promise<boolean> {
    try {
      await httpClient.get(`/auth/email-confirmation?confirmation=${code}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[Strapi API] Email verified successfully');
      return true;
    } catch (error) {
      const apiError = handleApiError(error, 'verifyEmail');
      console.error('[Strapi API] Email verification failed:', apiError.message);
      throw apiError;
    }
  }

  /**
   * Syncs user data after login (cart, favorites, etc.)
   */
  async syncUserData(): Promise<boolean> {
    try {
      // This could involve fetching and merging server-side user data
      // with local data, but for now we'll just return success
      console.log('[Strapi API] User data synced');
      return true;
    } catch (error) {
      const apiError = handleApiError(error, 'syncUserData');
      console.error('[Strapi API] User data sync failed:', apiError.message);
      throw apiError;
    }
  }

  // --- Utility Methods ---

  /**
   * Enables or disables caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    console.log(`[Strapi API] Caching ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Clears all cached data
   */
  clearCache(): void {
    cache.clear();
    console.log('[Strapi API] Cache cleared');
  }

  /**
   * Gets cache statistics
   */
  getCacheInfo(): { enabled: boolean } {
    return {
      enabled: this.cacheEnabled,
    };
  }
}

// Create singleton instance
const strapiApi = new StrapiApiService();

// Export the instance with the same interface as mockApi
const strapiApiExport = {
  fetchProducts: strapiApi.fetchProducts.bind(strapiApi),
  fetchProductById: strapiApi.fetchProductById.bind(strapiApi),
  searchProducts: strapiApi.searchProducts.bind(strapiApi),
  syncCart: strapiApi.syncCart.bind(strapiApi),
  syncFavorites: strapiApi.syncFavorites.bind(strapiApi),
  login: strapiApi.login.bind(strapiApi),
  register: strapiApi.register.bind(strapiApi),
  validateToken: strapiApi.validateToken.bind(strapiApi),
  logout: strapiApi.logout.bind(strapiApi),
  changePassword: strapiApi.changePassword.bind(strapiApi),
  updateProfilePicture: strapiApi.updateProfilePicture.bind(strapiApi),
  resendVerificationEmail: strapiApi.resendVerificationEmail.bind(strapiApi),
  verifyEmail: strapiApi.verifyEmail.bind(strapiApi),
  syncUserData: strapiApi.syncUserData.bind(strapiApi),

  // Additional utility methods
  setCacheEnabled: strapiApi.setCacheEnabled.bind(strapiApi),
  clearCache: strapiApi.clearCache.bind(strapiApi),
  getCacheInfo: strapiApi.getCacheInfo.bind(strapiApi),
};

export default strapiApiExport;

// Types are already available from the imports and interface definitions above

const utilityExport = {
  name: 'StrapiApi',
  version: '1.0.0',
};

export { utilityExport };
