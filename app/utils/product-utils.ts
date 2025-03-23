import ProductData from '../data/products';
import { Product } from '../types/product';

/**
 * Get products related to a specific product
 * @param currentProductId The ID of the current product to exclude from results
 * @param limit Maximum number of products to return
 */
export function getRelatedProducts(currentProductId?: string, limit: number = 5): Product[] {
  // For now, reuse the recommended products as related products
  return ProductData.getRecommendedProducts()
    .filter(p => !currentProductId || p.id !== currentProductId)
    .slice(0, limit);
}

/**
 * Get recommended products for the user
 * @param currentProductId The ID of the current product to exclude from results
 * @param limit Maximum number of products to return
 */
export function getRecommendedProducts(currentProductId?: string, limit: number = 5): Product[] {
  return ProductData.getHighlightedProducts()
    .filter(p => !currentProductId || p.id !== currentProductId)
    .slice(0, limit);
}

/**
 * Get trending products
 * @param currentProductId The ID of the current product to exclude from results
 * @param limit Maximum number of products to return
 */
export function getTrendingProducts(currentProductId?: string, limit: number = 5): Product[] {
  return ProductData.getTrendingProducts()
    .filter(p => !currentProductId || p.id !== currentProductId)
    .slice(0, limit);
}

const productUtils = {
  getRelatedProducts,
  getRecommendedProducts,
  getTrendingProducts
};

export default productUtils; 