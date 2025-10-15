# Tifossi Loading System Documentation

## Overview

Tifossi implements a sophisticated progressive loading system that ensures optimal user experience by:

1. Loading essential app assets during the initial splash screen
2. Showing component-specific skeletons during content loading
3. Progressively revealing content as it becomes available

This document outlines the architecture and implementation of this system.

## Loading Flow

The application follows a clear loading sequence:

1. **SplashScreen** - Loads critical global assets:
   - App logos and essential UI elements
   - Does NOT load screen-specific assets

2. **Screen Skeletons** - Show while screen content loads:
   - Display placeholder UI that matches final content layout
   - Create a smooth visual transition from loading to loaded state

3. **Progressive Content Reveal** - Content appears in sections:
   - High-priority content loads and displays first
   - Lower-priority content loads in background and appears when ready
   - Staggered animation creates a "wave" effect as content becomes available

## Key Components

### 1. `app/_services/preload/service.ts`

The core singleton preload service that manages asset loading:

```typescript
class PreloadService {
  private static instance: PreloadService;
  private highPriorityAssets: PreloadAsset[] = [
    // Only global UI assets here
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
  ];
  private mediumPriorityAssets: PreloadAsset[] = [];

  // Preload essential assets needed before showing the app
  public async preloadEssentials(callback: ProgressCallback): Promise<void> {
    // Implementation for loading essential assets
  }

  // Preload secondary assets in the background
  public async preloadSecondary(): Promise<void> {
    // Implementation for background loading of less critical assets
  }

  // Update asset list dynamically
  public updateAssetList(assets: PreloadAsset[]): void {
    // Logic to update high/medium priority asset lists
  }
}
```

### 2. `app/_components/splash/SplashScreen.tsx`

Handles initial app loading and displays the splash screen:

- Uses `PreloadService` to load global essential assets
- Shows loading progress
- Transitions to main app when essential loading is complete

### 3. `app/_components/skeletons/HomeScreenSkeleton.tsx`

Advanced skeleton implementation for the home screen:

```typescript
export interface SectionLoadingState {
  highlighted: boolean;
  featured: boolean;
  recommended: boolean;
  trending: boolean;
  newReleases: boolean;
  launchOpportunity: boolean;
}

export default function HomeScreenSkeleton({
  isLoading = true,
  sectionLoadingState,
  children,
}: HomeScreenSkeletonProps) {
  // Implementation of section-specific loading states
}
```

### 4. `app/_components/skeletons/ProgressiveLoadingSection.tsx`

Reusable component for progressive section loading:

```typescript
export default function ProgressiveLoadingSection({
  isLoading,
  skeleton,
  children,
  style
}: ProgressiveLoadingSectionProps) {
  return (
    <View style={[styles.container, style]}>
      {isLoading ? skeleton : children}
    </View>
  );
}
```

### 5. `app/_services/preload/homeAssets.ts`

Screen-specific asset loader for home screen:

```typescript
export async function preloadHomeAssets() {
  // IMPORTANT: These assets are loaded DURING skeleton display,
  // NOT during splash screen
  // Implementation for loading home screen assets with proper prioritization
}
```

## Loading Strategy

### 1. Global Assets (SplashScreen)

- Load only the minimal assets required for basic app functioning
- Limited to logos and global UI elements
- Do NOT preload screen-specific content during splash screen

### 2. Screen-specific Assets (During Skeleton Display)

- Load assets for current screen while showing skeleton
- Prioritize "above the fold" content first
- Update UI progressively as assets become available

### 3. Background Loading

- Continue loading lower-priority assets after showing initial content
- Cache loaded assets for future use

## Progressive Loading Pattern

The home screen implements a staggered loading approach:

```typescript
// First wave: Above the fold content
if (loadedAssets.highlightedProducts.length > 0) {
  setData((current) => ({ ...current, highlightedProducts: loadedAssets.highlightedProducts }));
  setSectionLoadingState((current) => ({ ...current, highlighted: false }));
}

// Second wave (with small delay)
setTimeout(() => {
  if (loadedAssets.recommendedProducts.length > 0) {
    setData((current) => ({ ...current, recommendedProducts: loadedAssets.recommendedProducts }));
    setSectionLoadingState((current) => ({ ...current, recommended: false }));
  }
}, 200);

// Additional waves with increasing delays
// ...
```

## Asset Prioritization

Assets are categorized by priority:

1. **High Priority** (loaded first)
   - Global UI elements (logos, essential icons)
   - Above-the-fold content for current screen

2. **Medium Priority** (loaded after high priority)
   - Visible but not immediately interactive content
   - Content "just below the fold"

3. **Low Priority** (loaded in background)
   - Content requiring scrolling to view
   - Secondary and tertiary screens

## Implementation Guidelines

When implementing loading states:

1. **Always separate global and screen-specific loading**
   - SplashScreen should only load global assets
   - Screen-specific assets should load during skeleton display

2. **Use progressive loading for better UX**
   - Show content as soon as it's available
   - Prioritize above-the-fold content
   - Use staggered animation for natural content reveal

3. **Consistent skeleton design**
   - Skeletons should match the layout of final content
   - Use ShimmerPlaceholder for animated loading effect
   - Ensure proper spacing and dimensions

4. **Handle errors gracefully**
   - Provide fallbacks when assets fail to load
   - Never leave the user with a blank screen

## Example: TiffosiExplore Screen

The TiffosiExplore screen implements video preloading:

```typescript
useEffect(() => {
  if (preloaded) return;

  async function preloadExploreProducts() {
    try {
      // Load video sources for first 2 videos with high priority
      const videoProducts = exploreProducts.filter((p) => p.videoSource);

      if (videoProducts.length > 0) {
        const videoAssets = videoProducts.map((product, index) => {
          const priority: 'high' | 'medium' | 'low' = index < 2 ? 'high' : 'medium';
          return {
            key: `video_${product.id}`,
            asset: product.videoSource,
            type: 'video' as const,
            priority,
          };
        });

        preloadService.updateAssetList(videoAssets);
      }

      // Trigger background loading
      preloadService.preloadSecondary();
      setPreloaded(true);
    } catch (error) {
      console.error('Failed to preload explore assets:', error);
    }
  }

  preloadExploreProducts();
}, [preloaded]);
```

## Related Files

- `app/_components/splash/SplashScreen.tsx` - Initial app loading screen
- `app/_services/preload/service.ts` - Core preloading service
- `app/_services/preload/assetLoader.ts` - Asset loading utilities
- `app/_services/preload/dataLoader.ts` - Data loading utilities
- `app/_services/preload/types.ts` - Type definitions for preloading system
- `app/_services/preload/homeAssets.ts` - Home screen asset loader
- `app/_components/skeletons/HomeScreenSkeleton.tsx` - Home screen loading skeleton
- `app/_components/skeletons/ProgressiveLoadingSection.tsx` - Progressive loading component
- `app/_components/common/VideoBackground.tsx` - Video component with loading states
