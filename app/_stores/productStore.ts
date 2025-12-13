import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import httpClient from '../_services/api/httpClient';
import { transformStrapiProduct, StrapiResponse, StrapiProduct } from '../_utils/apiTransforms';
import { Product } from '../_types/product';
import { ProductStatus } from '../_types/product-status';

// Setup MMKV storage for product data caching
const storage = new MMKV({ id: 'product-storage' });
const mmkvStorage = createJSONStorage(() => ({
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.delete(name),
}));

export type ProductActionStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ProductOperationState {
  fetchProducts: ProductActionStatus;
  fetchProductById: ProductActionStatus;
  refresh: ProductActionStatus;
}

interface ProductState {
  // Products data
  products: Product[];
  productCache: Record<string, Product>;

  // Loading and error states
  isLoading: boolean;
  error: string | null;
  lastFetchTimestamp: number | null;
  cacheExpiryTime: number; // 30 minutes in ms

  // Action tracking
  actionStatus: ProductOperationState;

  // Actions
  fetchProducts: (force?: boolean) => Promise<void>;
  fetchProductById: (id: string, force?: boolean) => Promise<Product | undefined>;
  refreshProducts: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  searchProducts: (query: string) => Product[];
  filterProductsByCategory: (categoryId: string) => Product[];
  invalidateCache: () => void;
  clearError: () => void;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      // Initial state
      products: [],
      productCache: {},
      isLoading: false,
      error: null,
      lastFetchTimestamp: null,
      cacheExpiryTime: 30 * 60 * 1000, // 30 minutes
      actionStatus: {
        fetchProducts: 'idle',
        fetchProductById: 'idle',
        refresh: 'idle',
      },

      fetchProducts: async (force = false) => {
        const { lastFetchTimestamp, cacheExpiryTime, products } = get();
        const now = Date.now();

        // Check if we have fresh cached data
        if (
          !force &&
          lastFetchTimestamp &&
          now - lastFetchTimestamp < cacheExpiryTime &&
          products.length > 0
        ) {
          return;
        }

        try {
          set({
            isLoading: true,
            error: null,
            actionStatus: { ...get().actionStatus, fetchProducts: 'loading' },
          });

          // Direct API call using httpClient
          const response: StrapiResponse<StrapiProduct[]> = await httpClient.get('/products', {
            params: {
              populate: [
                'category',
                'model',
                'statuses',
                'frontImage',
                'images',
                'videoSource',
                'colors.mainImage',
                'colors.additionalImages',
                'shortDescription',
              ],
            },
          });

          // Transform Strapi products to app format
          const fetchedProducts = response.data.map(transformStrapiProduct);

          // Build product cache for quick lookups
          const productCache: Record<string, Product> = {};
          fetchedProducts.forEach((product) => {
            productCache[product.id] = product;
          });

          set({
            products: fetchedProducts,
            productCache,
            isLoading: false,
            lastFetchTimestamp: now,
            actionStatus: { ...get().actionStatus, fetchProducts: 'success' },
          });
        } catch (e) {
          set({
            isLoading: false,
            error: e instanceof Error ? e.message : 'Failed to fetch products',
            actionStatus: { ...get().actionStatus, fetchProducts: 'error' },
          });

          // If force refresh was requested, propagate the error
          // This allows refreshProducts to catch and handle it
          if (force) {
            throw e;
          }
        }
      },

      fetchProductById: async (id: string, force = false) => {
        const { productCache, lastFetchTimestamp, cacheExpiryTime } = get();
        const now = Date.now();

        // Check if we have fresh cached data for this product
        if (
          !force &&
          productCache[id] &&
          lastFetchTimestamp &&
          now - lastFetchTimestamp < cacheExpiryTime
        ) {
          return productCache[id];
        }

        try {
          set({
            isLoading: true,
            error: null,
            actionStatus: { ...get().actionStatus, fetchProductById: 'loading' },
          });

          // Direct API call using httpClient
          const response: StrapiResponse<StrapiProduct> = await httpClient.get(`/products/${id}`, {
            params: {
              populate: [
                'category',
                'model',
                'statuses',
                'frontImage',
                'images',
                'videoSource',
                'colors.mainImage',
                'colors.additionalImages',
                'shortDescription',
              ],
            },
          });

          const product = transformStrapiProduct(response.data);

          if (product) {
            // Update cache with the fetched product
            set({
              productCache: { ...get().productCache, [id]: product },
              isLoading: false,
              actionStatus: { ...get().actionStatus, fetchProductById: 'success' },
            });
          } else {
            set({
              isLoading: false,
              actionStatus: { ...get().actionStatus, fetchProductById: 'success' },
            });
          }

          return product;
        } catch (e) {
          set({
            isLoading: false,
            error: e instanceof Error ? e.message : `Failed to fetch product ${id}`,
            actionStatus: { ...get().actionStatus, fetchProductById: 'error' },
          });

          return undefined;
        }
      },

      refreshProducts: async () => {
        set({ actionStatus: { ...get().actionStatus, refresh: 'loading' } });

        try {
          await get().fetchProducts(true); // Force refresh
          set({ actionStatus: { ...get().actionStatus, refresh: 'success' } });
        } catch (error) {
          set({ actionStatus: { ...get().actionStatus, refresh: 'error' } });
          throw error;
        }
      },

      getProductById: (id: string) => {
        const { products, productCache } = get();

        // First check the cache for individual product fetches
        if (productCache[id]) {
          return productCache[id];
        }

        // Then check the products array
        return products.find((product) => product.id === id);
      },

      searchProducts: (query: string) => {
        const { products } = get();
        const lowercaseQuery = query.toLowerCase().trim();

        if (!lowercaseQuery) return products;

        return products.filter(
          (product) =>
            product.title.toLowerCase().includes(lowercaseQuery) ||
            product.shortDescription?.line1?.toLowerCase().includes(lowercaseQuery) ||
            product.shortDescription?.line2?.toLowerCase().includes(lowercaseQuery) ||
            (typeof product.longDescription === 'string'
              ? product.longDescription.toLowerCase().includes(lowercaseQuery)
              : Array.isArray(product.longDescription)
                ? product.longDescription.some((line) =>
                    line.toLowerCase().includes(lowercaseQuery)
                  )
                : false) ||
            product.categoryId?.toLowerCase().includes(lowercaseQuery) ||
            product.modelId?.toLowerCase().includes(lowercaseQuery)
        );
      },

      filterProductsByCategory: (categoryId: string) => {
        const { products } = get();
        return products.filter((product) => product.categoryId === categoryId);
      },

      invalidateCache: () => {
        set({
          lastFetchTimestamp: null,
          productCache: {},
          products: [],
          actionStatus: {
            fetchProducts: 'idle',
            fetchProductById: 'idle',
            refresh: 'idle',
          },
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'tifossi-product-store',
      storage: mmkvStorage,
      partialize: (state) => ({
        products: state.products,
        productCache: state.productCache,
        lastFetchTimestamp: state.lastFetchTimestamp,
        // Don't persist loading states or errors
      }),
      onRehydrateStorage: () => (state) => {
        // Reset transient state after hydration
        if (state) {
          state.isLoading = false;
          state.error = null;
          state.actionStatus = {
            fetchProducts: 'idle',
            fetchProductById: 'idle',
            refresh: 'idle',
          };

          // Check if cache has expired
          const now = Date.now();
          if (state.lastFetchTimestamp && now - state.lastFetchTimestamp >= state.cacheExpiryTime) {
            state.lastFetchTimestamp = null;
          }
        }
      },
    }
  )
);

// Helper functions for common product operations
export const ProductHelpers = {
  /**
   * Get product display price (considering discounts)
   */
  getDisplayPrice: (
    product: Product
  ): {
    original: number;
    final: number;
    hasDiscount: boolean;
    discountPercentage?: number;
  } => {
    const original = product.price;
    const discount = product.discountedPrice ? original - product.discountedPrice : 0;
    const final = product.discountedPrice || original;
    const hasDiscount = discount > 0;
    const discountPercentage = hasDiscount ? Math.round((discount / original) * 100) : undefined;

    return { original, final, hasDiscount, discountPercentage };
  },

  /**
   * Check if product is available in specific size/color
   */
  isVariantAvailable: (product: Product, size?: string, color?: string): boolean => {
    if (!product.sizes && !product.colors) return true; // No variants

    let sizeAvailable = true;
    let colorAvailable = true;

    if (size && product.sizes) {
      sizeAvailable = product.sizes.some((s) => s.value === size && s.available);
    }

    if (color && product.colors) {
      colorAvailable = product.colors.some((c) => c.colorName === color);
    }

    return sizeAvailable && colorAvailable;
  },

  /**
   * Get available variants for a product
   */
  getAvailableVariants: (
    product: Product
  ): {
    sizes: string[];
    colors: string[];
  } => {
    const sizes = product.sizes?.filter((s) => s.available).map((s) => s.value) || [];
    const colors = product.colors?.map((c) => c.colorName) || [];

    return { sizes, colors };
  },

  /**
   * Format product for display in lists
   */
  formatProductForDisplay: (product: Product) => ({
    id: product.id,
    title: product.title,
    price: ProductHelpers.getDisplayPrice(product),
    image: typeof product.frontImage === 'string' ? product.frontImage : product.images?.[0] || '',
    categoryId: product.categoryId,
    modelId: product.modelId,
    shortDescription: product.shortDescription,
    isNew: product.statuses.includes(ProductStatus.NEW),
    isFeatured: product.statuses.includes(ProductStatus.FEATURED),
    hasDiscount: !!product.discountedPrice,
  }),
};

const utilityExport = {
  name: 'ProductStore',
  version: '1.0.0',
};

export default utilityExport;
