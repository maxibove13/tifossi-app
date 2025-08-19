import { useState, useEffect, useCallback } from 'react';
import apiManager from './index';
import { Product } from '../../_types/product';

export interface QueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch all products
 */
export function useProducts(): QueryResult<Product[]> {
  const [data, setData] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const products = await apiManager.fetchProducts();
      setData(products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchProducts,
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
      console.error('Failed to fetch product:', err);
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

// Default export utility
const utilityExport = {
  name: 'QueryHooks',
  version: '1.0.0',
};

export default utilityExport;
