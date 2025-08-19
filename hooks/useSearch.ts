import { useState, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import { useProductStore } from '../app/_stores/productStore';
import { Product } from '../app/_types/product';
import type { IFuseOptions } from 'fuse.js';

const fuseOptions: IFuseOptions<Product> = {
  keys: [
    'title',
    'shortDescription.line1',
    'shortDescription.line2',
    'longDescription',
    'categoryId',
    'tagIds',
  ],
  includeScore: true,
  threshold: 0.4, // Adjust sensitivity (0=exact, 1=anything)
  minMatchCharLength: 2,
};

export function useSearch() {
  const { products, isLoading: isLoadingProducts, error: productsError } = useProductStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [fuseInstance, setFuseInstance] = useState<Fuse<Product> | null>(null);

  // Create Fuse instance when products load/change
  useEffect(() => {
    if (products.length > 0) {
      setFuseInstance(new Fuse(products, fuseOptions));
    }
  }, [products]);

  // Perform search when searchTerm or fuseInstance changes
  const searchResults = useMemo(() => {
    if (!fuseInstance || !searchTerm) {
      return []; // Return empty array if no search term or data
    }
    return fuseInstance.search(searchTerm).map((result) => result.item);
  }, [searchTerm, fuseInstance]);

  return {
    searchTerm,
    setSearchTerm, // Expose setter to update search term from UI
    searchResults,
    isLoading: isLoadingProducts, // Indicate if initial product data is loading
    hasSearched: searchTerm.length > 0,
    error: productsError, // Expose error state
    totalProducts: products.length, // Useful for empty states
  };
}
