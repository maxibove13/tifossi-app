# Product Filtering System

## Overview

Tifossi implements a robust product filtering system that allows users to filter products by multiple criteria. This document details the implementation of the filters overlay, hook-based filtering logic, and integration with the product display components.

## Components

### 1. OverlayProductFilters (`app/_components/store/product/overlay/OverlayProductFilters.tsx`)

This modal overlay provides the UI for selecting and applying filters:

- **Filter Categories**:
  - Size selection (multi-select)
  - Color selection (multi-select)
  - Price range (dual-thumb slider)
- **Actions**:
  - Apply button: Applies selected filters to product list
  - Clear button: Resets all filters
- **Animations**: Smooth entry/exit animations using Animated API
- **Props**:
  - `isVisible`: Controls overlay visibility
  - `onClose`: Callback when overlay is closed
  - `onApplyFilters`: Callback with selected filters
  - `availableSizes`: Available product sizes to filter by
  - `availableColors`: Available product colors to filter by
  - `minPrice`/`maxPrice`: Price range boundaries
  - `initialFilters`: Pre-set filters (for restoring previous state)

### 2. useProductFilters Hook (`hooks/useProductFilters.ts`)

Custom hook that implements the filtering logic:

- **Input**: 
  - Product list (array of Product objects)
  - Applied filters object (sizes, colors, price range)
- **Output**: Filtered product list based on selected criteria
- **Logic**: Applies all filters simultaneously, returning only products that match all criteria

## Filter Types

The `ProductFilters` interface defines the structure for filters:

```typescript
export interface ProductFilters {
  sizes?: string[];          // Selected size values (e.g., ['S', 'M', 'L'])
  colorHexes?: string[];     // Selected color hex codes (e.g., ['#FF0000', '#00FF00'])
  priceRange?: { 
    min: number;             // Minimum price
    max: number;             // Maximum price
  };
}
```

## Implementation Details

### Multi-Selection Mechanism

The overlay implements multi-selection for both sizes and colors:

```typescript
// Toggle selection of a size
const toggleSize = (sizeValue: string) => {
  setSelectedSizes((prev) =>
    prev.includes(sizeValue) ? prev.filter((s) => s !== sizeValue) : [...prev, sizeValue]
  );
};

// Toggle selection of a color
const toggleColor = (colorHex: string) => {
  setSelectedColorHexes((prev) =>
    prev.includes(colorHex) ? prev.filter((c) => c !== colorHex) : [...prev, colorHex]
  );
};
```

### Dual-Thumb Price Slider

Implemented using `@ptomasroos/react-native-multi-slider` for price range selection:

```typescript
<MultiSlider
  values={[selectedPriceRange.min, selectedPriceRange.max]}
  sliderLength={Dimensions.get('window').width - spacing.lg * 2 - spacing.md * 2}
  onValuesChange={handlePriceRangeChange}
  min={minPrice}
  max={maxPrice}
  step={10}
  allowOverlap={false}
  snapped
  minMarkerOverlapDistance={40}
  trackStyle={styles.sliderTrack}
  selectedStyle={{ backgroundColor: colors.primary }}
  unselectedStyle={{ backgroundColor: colors.border }}
  markerStyle={styles.sliderMarker}
  pressedMarkerStyle={styles.sliderMarkerPressed}
/>
```

### Filtering Logic Implementation

Filtering is implemented in the `useProductFilters` hook using chained filtering:

```typescript
// Filter by Size(s)
if (appliedFilters.sizes && appliedFilters.sizes.length > 0) {
  results = results.filter((product) => {
    if (!product.sizes) return false;
    return product.sizes.some(
      (sizeInfo) => appliedFilters.sizes!.includes(sizeInfo.value) && sizeInfo.available
    );
  });
}

// Filter by Color(s)
if (appliedFilters.colorHexes && appliedFilters.colorHexes.length > 0) {
  results = results.filter((product) => {
    if (!product.colors) return false;
    return product.colors.some((colorInfo) =>
      appliedFilters.colorHexes!.includes(colorInfo.hex || '')
    );
  });
}

// Filter by Price Range
if (appliedFilters.priceRange) {
  const { min, max } = appliedFilters.priceRange;
  results = results.filter((product) => {
    const price = product.discountedPrice ?? product.price;
    return price >= min && price <= max;
  });
}
```

## Application in UI

To apply filters to a product list:

1. Initialize state for filters and filtered products:
   ```typescript
   const [filters, setFilters] = useState<ProductFilters>({});
   const filteredProducts = useProductFilters(products, filters);
   ```

2. Display the filters overlay and handle filter application:
   ```typescript
   const [showFilters, setShowFilters] = useState(false);
   
   // Handle filter application
   const handleApplyFilters = (newFilters: ProductFilters) => {
     setFilters(newFilters);
     setShowFilters(false);
   };
   ```

3. Show the filter overlay when needed:
   ```typescript
   <OverlayProductFilters
     isVisible={showFilters}
     onClose={() => setShowFilters(false)}
     onApplyFilters={handleApplyFilters}
     availableSizes={allSizes}
     availableColors={allColors}
     minPrice={minPrice}
     maxPrice={maxPrice}
     initialFilters={filters} // Pass current filters for state persistence
   />
   ```

## Features

1. **Multi-Criteria Filtering**: Products can be filtered by multiple criteria simultaneously 
2. **Restore Previous State**: The overlay restores previously selected filters when reopened
3. **Unique Options**: Only displays unique sizes and colors available in the product list
4. **Optimized Performance**: Uses useMemo for efficient filtering without recalculating on every render
5. **Clear All Filters**: One-tap option to reset all applied filters
6. **Visual Selection Feedback**: Selected filters are visually highlighted with proper styling
