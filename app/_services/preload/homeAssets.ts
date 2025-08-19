/**
 * Home screen asset loading
 * This handles loading assets specifically for the home screen
 * NOTE: These assets are loaded DURING the skeleton display, not during splash screen
 */

import { Product } from '../../_types/product';
import ProductData from '../../_data/products';
import preloadService from './service';
import { PreloadAsset } from './types';
import { hasStatus, ProductStatus } from '../../_types/product-status';

/**
 * Load assets for the home screen while skeleton is displayed
 * Returns the loaded data objects for immediate use
 * IMPORTANT: This is NOT part of the splash screen loading process
 *
 * @param allProducts - Optional array of products from API. If not provided, uses static data
 */
export async function preloadHomeAssets(allProducts?: Product[]) {
  try {
    // First, gather all the assets we need to preload
    const assetList: PreloadAsset[] = [];

    // Helper functions to get products from API data or fallback to static data
    const getFeaturedProduct = (products?: Product[]) => {
      if (products) {
        return products.find((p) => hasStatus(p.statuses, ProductStatus.FEATURED)) || null;
      }
      return ProductData.getFeaturedProduct();
    };

    const getHighlightedProducts = (products?: Product[]) => {
      if (products) {
        return products.filter((p) => hasStatus(p.statuses, ProductStatus.HIGHLIGHTED));
      }
      return ProductData.getHighlightedProducts();
    };

    const getRecommendedProducts = (products?: Product[]) => {
      if (products) {
        return products.filter((p) => hasStatus(p.statuses, ProductStatus.RECOMMENDED));
      }
      return ProductData.getRecommendedProducts();
    };

    const getTrendingProducts = (products?: Product[]) => {
      if (products) {
        return products.filter((p) => hasStatus(p.statuses, ProductStatus.POPULAR));
      }
      return ProductData.getTrendingProducts();
    };

    const getNewReleases = (products?: Product[]) => {
      if (products) {
        return products.filter((p) => hasStatus(p.statuses, ProductStatus.NEW));
      }
      return ProductData.getNewReleases();
    };

    const getLaunchAndOpportunityProducts = (products?: Product[]) => {
      if (products) {
        return products.filter((p) => hasStatus(p.statuses, ProductStatus.OPPORTUNITY));
      }
      return ProductData.getLaunchAndOpportunityProducts();
    };

    // 1. HIGH PRIORITY - Featured product and highlighted products (visible immediately)
    const featuredProduct = getFeaturedProduct(allProducts);
    const highlightedProducts = getHighlightedProducts(allProducts);

    // Add featured product image with high priority
    if (featuredProduct) {
      assetList.push({
        key: `featured_${featuredProduct.id}`,
        asset: featuredProduct.frontImage,
        type: 'image',
        priority: 'high',
      });
    }

    // Add highlighted product images with high priority
    highlightedProducts.forEach((product) => {
      assetList.push({
        key: `highlighted_${product.id}`,
        asset: product.frontImage,
        type: 'image',
        priority: 'high',
      });
    });

    // 2. MEDIUM PRIORITY - Products that appear in the middle of the screen
    const recommendedProducts = getRecommendedProducts(allProducts);
    recommendedProducts.forEach((product) => {
      assetList.push({
        key: `recommended_${product.id}`,
        asset: product.frontImage,
        type: 'image',
        priority: 'medium',
      });
    });

    // Add trending products with medium priority
    const trendingProducts = getTrendingProducts(allProducts);
    trendingProducts.forEach((product) => {
      assetList.push({
        key: `trending_${product.id}`,
        asset: product.frontImage,
        type: 'image',
        priority: 'medium',
      });
    });

    // 3. LOW PRIORITY - Products that appear at the bottom of the screen
    const newReleases = getNewReleases(allProducts);
    newReleases.forEach((product) => {
      assetList.push({
        key: `newRelease_${product.id}`,
        asset: product.frontImage,
        type: 'image',
        priority: 'low',
      });
    });

    const launchAndOpportunityProducts = getLaunchAndOpportunityProducts(allProducts);
    launchAndOpportunityProducts.forEach((product) => {
      assetList.push({
        key: `launchOpp_${product.id}`,
        asset: product.frontImage,
        type: 'image',
        priority: 'low',
      });
    });

    // Add all assets to the preload service
    preloadService.updateAssetList(assetList);

    // Start preloading in the background, but we don't await the full completion
    // This kicks off the loading process for all assets
    preloadService.preloadSecondary();

    // Return the data objects for immediate use
    return {
      featuredProduct,
      highlightedProducts,
      recommendedProducts,
      trendingProducts,
      newReleases,
      launchAndOpportunityProducts,
    };
  } catch (error) {
    console.error('Error preloading home assets:', error);
    // Return empty data as fallback
    return {
      featuredProduct: null,
      highlightedProducts: [],
      recommendedProducts: [],
      trendingProducts: [],
      newReleases: [],
      launchAndOpportunityProducts: [],
    };
  }
}

/**
 * Helper function to prioritize product preloading based on visibility
 */
export function prioritizeProductImages(
  products: Product[],
  keyPrefix: string,
  priority: 'high' | 'medium' | 'low'
): PreloadAsset[] {
  return products.map((product) => ({
    key: `${keyPrefix}_${product.id}`,
    asset: product.frontImage,
    type: 'image' as const,
    priority,
  }));
}

const homeAssetLoader = {
  preloadHomeAssets,
  prioritizeProductImages,
};

export default homeAssetLoader;
