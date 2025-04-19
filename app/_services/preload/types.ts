import { Product } from '../../_types/product';

/**
 * Stages of the preloading process
 */
export type PreloadStage =
  | 'INIT' // Initial state
  | 'LOADING_VIDEOS' // Loading video assets
  | 'LOADING_IMAGES' // Loading image assets
  | 'LOADING_DATA' // Loading product data
  | 'READY'; // Ready to show main app

/**
 * Progress information for the preloading process
 */
export interface PreloadProgress {
  progress: number; // 0-100
  stage: PreloadStage; // Current loading stage
  isComplete: boolean; // Whether loading is complete
}

/**
 * Callback function for progress updates
 */
export type ProgressCallback = (progress: PreloadProgress) => void;

/**
 * Critical data that needs to be preloaded
 */
export interface CriticalData {
  featuredProducts: Product[];
  exploreProducts: Product[];
  trendingProducts: Product[];
}

/**
 * Assets that need to be preloaded
 */
export interface PreloadAsset {
  key: string; // Unique identifier for the asset
  asset: any; // The asset to preload
  type: 'video' | 'image' | 'other';
  priority: 'high' | 'medium' | 'low';
}

// Add default export to prevent Expo Router from treating this as a route
const utilityExport = {
  name: 'PreloadTypes',
  version: '1.0.0',
};

export default utilityExport;
