import { Asset } from 'expo-asset';
import { Image } from 'react-native';
import { PreloadAsset } from './types';

/**
 * Loads a single asset and returns a promise that resolves when the asset is loaded
 * @param asset The asset to load
 * @returns A promise that resolves when the asset is loaded
 */
export const loadSingleAsset = async (asset: any): Promise<void> => {
  try {
    if (typeof asset === 'number') {
      // For required assets (which are numbers)
      await Asset.fromModule(asset).downloadAsync();
    } else if (
      typeof asset === 'string' &&
      (asset.includes('.png') || asset.includes('.jpg') || asset.includes('.jpeg'))
    ) {
      // For remote image URLs, use Image.prefetch
      await Image.prefetch(asset);
    } else if (asset && typeof asset === 'object' && asset.uri) {
      // For objects with uri property (e.g. local file paths)
      await Image.prefetch(asset.uri);
    } else {
      // For any other type, just log that we're skipping it
      console.log('Unknown asset type, skipping preload:', asset);
    }
  } catch (error) {
    console.error('Error loading asset:', error);
    // Don't throw - we want to continue loading other assets even if one fails
  }
};

/**
 * Loads multiple assets in parallel with progress tracking
 * @param assets Array of assets to load
 * @param progressCallback Function to call with progress updates
 * @returns A promise that resolves when all assets are loaded
 */
export const loadAssets = async (
  assets: PreloadAsset[],
  progressCallback: (progress: number) => void
): Promise<void> => {
  // Prioritize assets - load high priority first
  const highPriorityAssets = assets.filter((a) => a.priority === 'high');
  const mediumPriorityAssets = assets.filter((a) => a.priority === 'medium');
  const lowPriorityAssets = assets.filter((a) => a.priority === 'low');

  // First load high priority assets
  let loadedCount = 0;
  const totalAssets = highPriorityAssets.length + mediumPriorityAssets.length;

  // Load high priority assets first
  for (const assetInfo of highPriorityAssets) {
    await loadSingleAsset(assetInfo.asset);
    loadedCount++;
    progressCallback((loadedCount / totalAssets) * 100);
  }

  // Then load medium priority assets
  for (const assetInfo of mediumPriorityAssets) {
    await loadSingleAsset(assetInfo.asset);
    loadedCount++;
    progressCallback((loadedCount / totalAssets) * 100);
  }

  // Low priority assets are loaded in the background after main loading is complete
  if (lowPriorityAssets.length > 0) {
    setTimeout(() => {
      Promise.all(lowPriorityAssets.map((a) => loadSingleAsset(a.asset))).catch((err) =>
        console.error('Error loading low priority assets:', err)
      );
    }, 100);
  }
};

// Add default export to prevent Expo Router from treating this as a route
const utilityExport = {
  name: 'AssetLoader',
  version: '1.0.0',
};

export default utilityExport;
