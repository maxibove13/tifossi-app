/**
 * Home screen asset loading
 * This handles loading assets specifically for the home screen
 * NOTE: These assets are loaded DURING the skeleton display, not during splash screen
 */

import { Product } from '../../_types/product';
import ProductData from '../../_data/products';
import preloadService from './service';
import { PreloadAsset } from './types';

/**
 * Load assets for the home screen while skeleton is displayed
 * Returns the loaded data objects for immediate use
 * IMPORTANT: This is NOT part of the splash screen loading process
 */
export async function preloadHomeAssets() {
  try {
    // First, gather all the assets we need to preload
    const assetList: PreloadAsset[] = [];

    // 1. HIGH PRIORITY - Featured product and highlighted products (visible immediately)
    const featuredProduct = ProductData.getFeaturedProduct();
    const highlightedProducts = ProductData.getHighlightedProducts();

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
    const recommendedProducts = ProductData.getRecommendedProducts();
    recommendedProducts.forEach((product) => {
      assetList.push({
        key: `recommended_${product.id}`,
        asset: product.frontImage,
        type: 'image',
        priority: 'medium',
      });
    });

    // Add trending products with medium priority
    const trendingProducts = ProductData.getTrendingProducts();
    trendingProducts.forEach((product) => {
      assetList.push({
        key: `trending_${product.id}`,
        asset: product.frontImage,
        type: 'image',
        priority: 'medium',
      });
    });

    // 3. LOW PRIORITY - Products that appear at the bottom of the screen
    const newReleases = ProductData.getNewReleases();
    newReleases.forEach((product) => {
      assetList.push({
        key: `newRelease_${product.id}`,
        asset: product.frontImage,
        type: 'image',
        priority: 'low',
      });
    });

    const launchAndOpportunityProducts = ProductData.getLaunchAndOpportunityProducts();
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
