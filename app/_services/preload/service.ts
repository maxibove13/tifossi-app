import { PreloadAsset, ProgressCallback, CriticalData } from './types';
import { loadAssets } from './assetLoader';
import { loadCriticalData } from './dataLoader';
import { videoCache } from '../videoCache';
import strapiApi from '../api/strapiApi';
import { hasStatus, ProductStatus } from '../../_types/product-status';
import { useProductStore } from '../../_stores/productStore';

/**
 * Service for preloading assets and data
 * This is a singleton service with a single instance
 */
class PreloadService {
  private static instance: PreloadService;
  private criticalData: CriticalData | null = null;
  private isPreloading = false;
  private preloadComplete = false;

  // High priority assets that should be loaded immediately - global UI assets only
  private highPriorityAssets: PreloadAsset[] = [
    // Global UI assets - logos and essential imagery
    {
      key: 'logo',
      asset: require('../../../assets/images/logo/tiffosi.png'),
      type: 'image',
      priority: 'high',
    },
    {
      key: 'logo-light',
      asset: require('../../../assets/images/logo/tiffosi-light.png'),
      type: 'image',
      priority: 'high',
    },
    // Note: We're NOT preloading videos during app startup
    // Videos will be loaded when TiffosiExplore screen is accessed
  ];

  // Medium priority assets that can be loaded after high priority
  private mediumPriorityAssets: PreloadAsset[] = [];

  private constructor() {
    // Private constructor to ensure singleton
  }

  /**
   * Get the singleton instance of PreloadService
   */
  public static getInstance(): PreloadService {
    if (!PreloadService.instance) {
      PreloadService.instance = new PreloadService();
    }
    return PreloadService.instance;
  }

  /**
   * Preload essential assets and data needed before showing the app
   * @param callback Function to call with progress updates
   */
  public async preloadEssentials(callback: ProgressCallback): Promise<void> {
    if (this.isPreloading) return;
    if (this.preloadComplete) {
      callback({ progress: 100, stage: 'READY', isComplete: true });
      return;
    }

    this.isPreloading = true;

    try {
      // Step 1: Initial notification
      callback({ progress: 0, stage: 'INIT', isComplete: false });

      // Step 2: Load high priority image assets (20% of total progress)
      await this.loadImageAssets((imageProgress) => {
        callback({
          progress: imageProgress * 0.2,
          stage: 'LOADING_IMAGES',
          isComplete: false,
        });
      });

      // Step 3: Load critical data (30% of total progress)
      await this.loadData((dataProgress) => {
        callback({
          progress: 20 + dataProgress * 0.3,
          stage: 'LOADING_DATA',
          isComplete: false,
        });
      });

      // Step 4: Preload explore videos (50% of total progress)
      await this.preloadExploreVideos((videoProgress) => {
        callback({
          progress: 50 + videoProgress * 0.5,
          stage: 'LOADING_VIDEOS',
          isComplete: false,
        });
      });

      // Step 5: Complete
      this.preloadComplete = true;
      this.isPreloading = false;
      callback({ progress: 100, stage: 'READY', isComplete: true });

      // Immediately start loading medium priority assets in the background
      this.preloadSecondary();
    } catch {
      this.isPreloading = false;
      // Still mark as complete so the app can continue
      callback({ progress: 100, stage: 'READY', isComplete: true });
    }
  }

  /**
   * Preload secondary assets that are not needed immediately
   * This can be called after the app is already visible
   */
  public async preloadSecondary(): Promise<void> {
    try {
      // Load medium priority assets in the background
      const assets = [...this.mediumPriorityAssets];

      // No callback needed as this happens in the background
      await loadAssets(assets, () => {});
    } catch {}
  }

  /**
   * Get the critical data that was preloaded
   * This should be called after preloadEssentials completes
   */
  public getCriticalData(): CriticalData {
    if (!this.criticalData) {
      throw new Error('Critical data not loaded. Call preloadEssentials first.');
    }
    return this.criticalData;
  }

  /**
   * Get pre-computed category-model relationships
   * This provides optimized access to model filters for each category
   */
  public getCategoryModelMap(): Record<string, any> | undefined {
    return this.criticalData?.categoryModelMap;
  }

  /**
   * Preload explore videos by fetching products and creating buffered players
   */
  private async preloadExploreVideos(progressCallback: (progress: number) => void): Promise<void> {
    try {
      progressCallback(5);

      // Fetch products via store (handles caching) and categories in parallel
      await Promise.all([
        useProductStore.getState().fetchProducts(),
        strapiApi.fetchCategories(), // Pre-populate strapiApi cache for Catalog screen
        strapiApi.fetchProductModels(), // Pre-populate strapiApi cache for Catalog screen
      ]);

      progressCallback(50);

      // Get products from store for video preloading
      const products = useProductStore.getState().products;

      // Filter for APP_EXCLUSIVE products with video sources
      const exploreVideos = products
        .filter(
          (p) =>
            hasStatus(p.statuses, ProductStatus.APP_EXCLUSIVE) &&
            p.videoSource &&
            typeof p.videoSource === 'string'
        )
        .map((p) => p.videoSource as string);

      // Preload videos (creates players that start buffering)
      if (exploreVideos.length > 0) {
        videoCache.preload(exploreVideos);
      }

      progressCallback(100);
    } catch {
      // If fetching fails, continue - videos will load on-demand
      progressCallback(100);
    }
  }

  /**
   * Load image assets with progress tracking
   */
  private async loadImageAssets(progressCallback: (progress: number) => void): Promise<void> {
    const imageAssets = this.highPriorityAssets.filter((a) => a.type === 'image');
    await loadAssets(imageAssets, progressCallback);
  }

  /**
   * Load critical data with progress tracking
   */
  private async loadData(progressCallback: (progress: number) => void): Promise<void> {
    this.criticalData = await loadCriticalData(progressCallback);
  }

  /**
   * Update the list of assets to preload
   * This is useful when you have dynamic assets that you want to preload
   */
  public updateAssetList(assets: PreloadAsset[]): void {
    // Add new high priority assets
    const highPriorityAssets = assets.filter((a) => a.priority === 'high');
    this.highPriorityAssets = [
      ...this.highPriorityAssets,
      ...highPriorityAssets.filter(
        (newAsset) =>
          !this.highPriorityAssets.some((existingAsset) => existingAsset.key === newAsset.key)
      ),
    ];

    // Add new medium priority assets
    const mediumPriorityAssets = assets.filter((a) => a.priority === 'medium');
    this.mediumPriorityAssets = [
      ...this.mediumPriorityAssets,
      ...mediumPriorityAssets.filter(
        (newAsset) =>
          !this.mediumPriorityAssets.some((existingAsset) => existingAsset.key === newAsset.key)
      ),
    ];
  }
}

// Export the singleton instance
const preloadServiceInstance = PreloadService.getInstance();
export default preloadServiceInstance;

// Export the service instance
export { preloadServiceInstance };
