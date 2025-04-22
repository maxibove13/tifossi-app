import { useQuery } from '@tanstack/react-query';
import mockApi from '../app/_services/api/mockApi';
import { Product } from '../app/_types/product';

export const productQueryKeys = {
  all: ['products'] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
};

export function useProducts() {
  return useQuery<Product[], Error>({
    queryKey: productQueryKeys.all,
    queryFn: mockApi.fetchProducts,
    staleTime: 1000 * 60 * 60 * 24, // Cache products for 24 hours
  });
}

export function useProduct(productId: string | undefined) {
  return useQuery<Product | undefined, Error>({
    queryKey: productQueryKeys.detail(productId || ''),
    queryFn: () => {
      if (!productId) return Promise.resolve(undefined);
      return mockApi.fetchProductById(productId);
    },
    enabled: !!productId, // Only run query if productId is defined
    staleTime: 1000 * 60 * 60 * 24, // Cache product details too
  });
}
