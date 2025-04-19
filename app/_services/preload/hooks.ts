import { useState, useEffect, useCallback } from 'react';
import type { PreloadAsset } from './types';

// Import the preload service directly, not from index to avoid circular dependency
import preloadServiceInstance from './service';

/**
 * Hook for preloading assets in components
 *
 * @param assets Array of assets to preload
 * @param triggerOnMount Whether to trigger preloading on component mount (default: true)
 * @returns Object with loading state and trigger function
 */
export function useAssetPreload(
  assets: PreloadAsset[] | (() => PreloadAsset[]),
  triggerOnMount = true
) {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Function to trigger preloading
  const triggerPreload = useCallback(async () => {
    if (loading || loaded) return; // Don't preload if already loading or loaded

    setLoading(true);
    setError(null);

    try {
      // Resolve assets if it's a function
      const assetsToLoad = typeof assets === 'function' ? assets() : assets;

      // Update the asset list in the preload service
      preloadServiceInstance.updateAssetList(assetsToLoad);

      // Trigger preloading
      await preloadServiceInstance.preloadSecondary();

      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to preload assets'));
    } finally {
      setLoading(false);
    }
  }, [assets, loading, loaded]);

  // Trigger preloading on mount if specified
  useEffect(() => {
    if (triggerOnMount) {
      triggerPreload();
    }
  }, [triggerOnMount, triggerPreload]);

  return {
    loaded, // Whether assets are loaded
    loading, // Whether assets are currently loading
    error, // Any error that occurred during loading
    triggerPreload, // Function to manually trigger preloading
  };
}

/**
 * Hook for preloading a specific image or video
 *
 * @param source Image or video source (number, string, or object with uri)
 * @param type Asset type ('image' or 'video')
 * @param priority Asset priority ('high', 'medium', or 'low')
 * @returns Object with loading state
 */
export function useMediaPreload(
  source: number | string | { uri: string },
  type: 'image' | 'video' = 'image',
  priority: 'high' | 'medium' | 'low' = 'medium'
) {
  // Generate a unique key for this asset
  const getAssetKey = () => {
    if (typeof source === 'number') {
      return `${type}_${source}`;
    } else if (typeof source === 'string') {
      return `${type}_${source.split('/').pop()}`;
    } else if (source && typeof source === 'object' && 'uri' in source) {
      return `${type}_${source.uri.split('/').pop()}`;
    }
    return `${type}_${Math.random().toString(36).substring(7)}`;
  };

  // Create a PreloadAsset from the source
  const getAsset = (): PreloadAsset => ({
    key: getAssetKey(),
    asset: source,
    type,
    priority,
  });

  // Use the general asset preload hook
  return useAssetPreload(() => [getAsset()], true);
}

/**
 * Hook specifically for preloading video sources
 */
export function useVideoPreload(
  source: number | string,
  priority: 'high' | 'medium' | 'low' = 'high'
) {
  return useMediaPreload(source, 'video', priority);
}

/**
 * Hook specifically for preloading image sources
 */
export function useImagePreload(
  source: number | string | { uri: string },
  priority: 'high' | 'medium' | 'low' = 'medium'
) {
  return useMediaPreload(source, 'image', priority);
}

// Add default export to prevent Expo Router from treating this as a route
const utilityExport = {
  name: 'PreloadHooks',
  version: '1.0.0',
};

export default utilityExport;
