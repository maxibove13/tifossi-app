import { useState, useEffect, useCallback } from 'react';
import strapiApi from '../app/_services/api/strapiApi';
import { ProductModel } from '../app/_types/model';
import { CATEGORY_IDS, MODEL_IDS } from '../app/_types/constants';

export interface ProductModelsResult {
  /** All product models */
  models: ProductModel[];
  /** Get models for a specific category (includes "Todos" as first item) */
  getModelsByCategory: (categoryId: string) => ProductModel[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch product models from Strapi
 */
export function useProductModels(): ProductModelsResult {
  const [models, setModels] = useState<ProductModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedModels = await strapiApi.fetchProductModels();
      setModels(fetchedModels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product models');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Memoized function to get models for a category
  const getModelsByCategory = useCallback(
    (categoryId: string): ProductModel[] => {
      if (categoryId === CATEGORY_IDS.ALL) {
        return []; // No models for 'todo' category
      }

      const categoryModels = models.filter((model) => model.categoryId === categoryId);

      // Add "Todos" model at the beginning
      return [{ id: MODEL_IDS.ALL, name: 'Todos', slug: 'todos', categoryId }, ...categoryModels];
    },
    [models]
  );

  return {
    models,
    getModelsByCategory,
    isLoading,
    error,
    refetch: fetchModels,
  };
}
