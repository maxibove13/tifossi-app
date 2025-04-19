import { CriticalData } from './types';
import ProductData, { getFeaturedProduct } from '../../_data/products';
import { Product } from '../../_types/product';

/**
 * Loads critical product data from local data sources
 * In the future, this can be replaced with API calls
 *
 * PRODUCTION APPROACH:
 * - Only load absolute minimum data during startup
 * - Featured products are loaded because they appear on the first screen
 * - Other product data is loaded when the relevant screen is accessed
 */
export const loadCriticalData = async (
  progressCallback: (progress: number) => void
): Promise<CriticalData> => {
  try {
    // Simulate network request with a small delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    progressCallback(30);

    // Only get featured product for home screen (absolute minimum)
    const featuredProducts = [getFeaturedProduct()].filter(Boolean) as Product[];
    progressCallback(100);

    // Return only what's needed for immediate display
    return {
      featuredProducts,
      exploreProducts: [], // Will be loaded when TiffosiExplore screen is accessed
      trendingProducts: [], // Will be loaded when needed
    };
  } catch (error) {
    console.error('Error loading critical data:', error);
    // Return empty data on error
    return {
      featuredProducts: [],
      exploreProducts: [],
      trendingProducts: [],
    };
  }
};

/**
 * Placeholder for future API data loading implementation
 * This will be replaced with actual API calls when ready
 */
export const loadFromApi = async (
  endpoint: string,
  progressCallback: (progress: number) => void
): Promise<any> => {
  // This is just a placeholder for now
  // In the future, this will make actual API calls
  progressCallback(50);
  await new Promise((resolve) => setTimeout(resolve, 500));
  progressCallback(100);

  // For now, return local data
  return {
    products: ProductData.products.slice(0, 10),
    categories: ['Fashion', 'Sports', 'Accessories'],
  };
};

// Add default export to prevent Expo Router from treating this as a route
const utilityExport = {
  name: 'DataLoader',
  version: '1.0.0',
};

export default utilityExport;
