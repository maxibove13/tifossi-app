import { useState, useEffect, useCallback } from 'react';
import apiManager from './index';
import { strapiApi } from './index';
import { Product } from '../../_types/product';

export interface QueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch all products
 * Initializes with cached data if available for instant rendering
 * Uses SWR pattern: show stale data immediately, revalidate in background
 */
export function useProducts(): QueryResult<Product[]> {
  const cachedData = strapiApi.getCachedProducts();
  const [data, setData] = useState<Product[] | null>(() => cachedData);
  // Only show loading if we have NO data at all
  const [isLoading, setIsLoading] = useState(() => !cachedData);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(
    async (invalidateCache = false) => {
      try {
        // Only show loading if we have no data (not during background refresh)
        if (!data) {
          setIsLoading(true);
        }
        setError(null);
        // Clear cache if requested (pull-to-refresh)
        if (invalidateCache) {
          strapiApi.clearCache();
        }
        const products = await apiManager.fetchProducts();
        setData(products);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setIsLoading(false);
      }
    },
    [data]
  );

  useEffect(() => {
    // Always fetch to ensure fresh data, but won't show loading if cached
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchProducts(true), // Invalidate cache on manual refresh
  };
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(productId: string | null): QueryResult<Product> {
  const [data, setData] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const product = await apiManager.fetchProductById(productId);
      setData(product || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchProduct,
  };
}

/**
 * Hook to fetch app settings
 */
export interface AppSettings {
  supportPhoneNumber: string;
  supportEmail?: string;
  businessName?: string;
}

export function useAppSettings(): QueryResult<AppSettings> {
  const [data, setData] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const settings = await apiManager.fetchAppSettings();
      setData(settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch app settings');
      // Return defaults on error
      setData({
        supportPhoneNumber: '+59899000000',
        businessName: 'Tifossi',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchSettings,
  };
}

// Default export utility
const utilityExport = {
  name: 'QueryHooks',
  version: '1.0.0',
};

export default utilityExport;
