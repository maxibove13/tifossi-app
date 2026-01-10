import { useState, useEffect, useCallback, useMemo } from 'react';
import strapiApi from '../app/_services/api/strapiApi';
import { Category } from '../app/_types/category';
import { allCategory, discountedCategory, labelCategories } from '../app/_data/categories';

export interface CategoriesResult {
  /** Product categories fetched from API */
  productCategories: Category[];
  /** Full main categories list: [todo, discounted, ...labels, ...productCategories] */
  mainCategories: Category[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch product categories from Strapi
 * Maintains the tab order: Todo -> Discounted -> labels -> product categories
 */
export function useCategories(): CategoriesResult {
  const [fetchedProductCategories, setFetchedProductCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const categories = await strapiApi.fetchCategories();
      setFetchedProductCategories(categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Build full main categories list with the correct tab order (memoized to prevent re-renders)
  const mainCategories = useMemo<Category[]>(
    () => [allCategory, discountedCategory, ...labelCategories, ...fetchedProductCategories],
    [fetchedProductCategories]
  );

  return {
    productCategories: fetchedProductCategories,
    mainCategories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
}
