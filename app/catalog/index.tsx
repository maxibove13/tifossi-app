import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import DefaultLargeCard from '../_components/store/product/default/large';
import ProductData from '../_data/products';
import CategoryData from '../_data/categories';
import ModelsData from '../_data/models';
import { Category } from '../_types/category';
import { ProductModel } from '../_types/model';
import { Product } from '../_types/product';
import { ProductFilters } from '../_components/store/product/overlay/OverlayProductFilters';
import { useProductFilters } from '../../hooks/useProductFilters';
import { colors } from '../_styles/colors';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import { spacing } from '../_styles/spacing';
import Header from '../_components/store/layout/Header';
import ProductGridSkeleton from '../_components/skeletons/ProductGridSkeleton';
import { CATEGORY_IDS, MODEL_IDS } from '../_types/constants';

// Generic TabBar component with auto-scrolling to active tab
const TabBar = <T extends { id: string; name: string }>({
  items,
  activeItemId,
  onSelectItem,
  style,
  itemStyle,
  activeItemStyle,
  activeUnderlineStyle,
}: {
  items: T[];
  activeItemId: string;
  onSelectItem: (itemId: string) => void;
  style?: object;
  itemStyle?: object;
  activeItemStyle?: object;
  activeUnderlineStyle?: object;
}) => {
  // Create refs for the scroll view and item measurements
  const scrollViewRef = useRef<ScrollView>(null);
  const itemLayouts = useRef<{ [key: string]: { x: number; width: number } }>({});
  const scrollViewWidth = useRef<number>(0);
  const [initialized, setInitialized] = useState(false);

  // Measure the scroll view width once it's rendered
  const handleScrollViewLayout = (event: any) => {
    scrollViewWidth.current = event.nativeEvent.layout.width;
  };

  // Store the position and width of each tab item
  const measureItemLayout = (itemId: string, event: any) => {
    const { x, width } = event.nativeEvent.layout;
    itemLayouts.current[itemId] = { x, width };

    // If this is the active item and we haven't scrolled yet, scroll to it
    if (itemId === activeItemId && !initialized && Object.keys(itemLayouts.current).length > 0) {
      scrollToActiveItem();
      setInitialized(true);
    }
  };

  // Scroll to center the active item
  const scrollToActiveItem = () => {
    if (!scrollViewRef.current || !itemLayouts.current[activeItemId]) return;

    const { x, width } = itemLayouts.current[activeItemId];
    const scrollViewCenter = scrollViewWidth.current / 2;
    const itemCenter = x + width / 2;
    const scrollTo = itemCenter - scrollViewCenter;

    // Calculate safe scroll position (not beyond content edges)
    let safeScrollTo = Math.max(0, scrollTo);

    // Scroll with animation
    scrollViewRef.current.scrollTo({ x: safeScrollTo, animated: true });
  };

  // When active item changes, scroll to it
  useEffect(() => {
    if (initialized) {
      scrollToActiveItem();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItemId]);

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.tabsContainer, style]}
      style={styles.tabsScrollView}
      onLayout={handleScrollViewLayout}
    >
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onSelectItem(item.id)}
          android_ripple={{ borderless: true, color: 'transparent' }}
          style={({ pressed }) => [styles.tabItemContainer, { opacity: pressed ? 1 : 1 }]}
          onLayout={(event) => measureItemLayout(item.id, event)}
        >
          <Text
            style={[
              styles.tabText,
              itemStyle,
              activeItemId === item.id && styles.activeTabText,
              activeItemId === item.id && activeItemStyle,
            ]}
          >
            {item.name}
          </Text>
          {activeItemId === item.id && (
            <View style={[styles.activeTabUnderline, activeUnderlineStyle]} />
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
};

// Define mapping between section names and their corresponding titles
const SECTION_TO_TITLE_MAP: Record<string, string> = {
  Tienda: 'Productos Recomendados',
  Destacados: 'Productos Destacados',
  Tendencias: 'Tendencias',
  'Lanzamientos & Oportunidades': 'Lanzamientos & Oportunidades',
};

export default function CatalogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; title?: string; model?: string }>();
  const initialCategoryId = params.category || CategoryData.mainCategories[0].id;
  const initialModelId = params.model || MODEL_IDS.ALL;

  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);
  // Switch from tag-based to model-based
  const [activeModelId, setActiveModelId] = useState(initialModelId);
  const [availableModels, setAvailableModels] = useState<ProductModel[]>([]);
  const [categoryModelProducts, setCategoryModelProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<ProductFilters>({});

  // Use the original title or default to 'Tienda'
  const rawPageTitle = params.title || 'Tienda';

  useEffect(() => {
    // This effect handles category changes: update available models
    setLoading(true);

    // Check if the selected category is a regular product category or a label-based category
    const selectedCategory = CategoryData.mainCategories.find((cat) => cat.id === activeCategoryId);
    const isCategoryLabel = selectedCategory?.isLabel || activeCategoryId === CATEGORY_IDS.ALL;

    // Don't show secondary tabs for "Todo" or label-based categories
    if (isCategoryLabel) {
      setAvailableModels([]);
    } else {
      // Get models for the selected category
      const modelsForCategory = ModelsData.getModelsByCategory(activeCategoryId);
      setAvailableModels(modelsForCategory);
    }

    // Only reset the model if we're changing categories and there's no specific model in the URL
    if (!params.model) {
      setActiveModelId(MODEL_IDS.ALL);
    }

    // Reset applied filters when category changes
    setAppliedFilters({});
  }, [activeCategoryId, params.model]);

  useEffect(() => {
    // This effect fetches products based on category/model only.
    setLoading(true);
    setTimeout(() => {
      // Use the model-based filtering
      const products = ProductData.getProductsByCategoryAndModel(activeCategoryId, activeModelId);
      setCategoryModelProducts(products);
      setLoading(false);
    }, 150);
    // Explicitly depend only on category/model change for fetching base products
  }, [activeCategoryId, activeModelId]);

  // Apply overlay filters using the custom hook
  const productsToDisplay = useProductFilters(categoryModelProducts, appliedFilters);

  // Calculate available filter options based on category/model products
  const filterOptions = useMemo(() => {
    const sizes = new Map();
    const colors = new Map();
    let min = Infinity;
    let max = -Infinity;

    categoryModelProducts.forEach((product) => {
      // Aggregate sizes
      product.sizes?.forEach((size) => {
        if (size.available && !sizes.has(size.value)) {
          sizes.set(size.value, size);
        }
      });
      // Aggregate colors
      product.colors?.forEach((color) => {
        if (color.hex && !colors.has(color.hex)) {
          colors.set(color.hex, color);
        }
      });
      // Find min/max price
      const price = product.discountedPrice ?? product.price;
      if (price < min) min = price;
      if (price > max) max = price;
    });

    // Handle case with no products
    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 5000;

    return {
      availableSizes: Array.from(sizes.values()),
      availableColors: Array.from(colors.values()),
      minPrice: Math.floor(min),
      maxPrice: Math.ceil(max),
    };
  }, [categoryModelProducts]);

  // Handler to update applied filters from the overlay
  const handleApplyFilters = (filters: ProductFilters) => {
    setAppliedFilters(filters);
  };

  // Update URL params when category changes to maintain browsing state
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    // Reset model selection when switching to the "Todo" category
    if (categoryId === CATEGORY_IDS.ALL) {
      setActiveModelId(MODEL_IDS.ALL);
    }

    // Update URL to reflect the current filtering state
    // This helps with browser history and sharing links
    const newParams = new URLSearchParams();

    // Always omit the title param when switching to 'todo' category
    // to ensure we reset to the default 'Tienda' title
    if (categoryId !== CATEGORY_IDS.ALL && params.title) {
      newParams.append('title', params.title as string);
    }

    // Update category
    newParams.append('category', categoryId);

    // Reset models when switching to 'todo' for a clean state
    if (categoryId !== CATEGORY_IDS.ALL && activeModelId && activeModelId !== MODEL_IDS.ALL) {
      newParams.append('model', activeModelId);
    } else {
      // Explicitly remove model param if switching to 'todo' or if model is 'all'
      // This ensures the URL doesn't retain an invalid model for the 'todo' category
      // No need to append 'model' if it's already MODEL_IDS.ALL
    }

    // Also clear applied overlay filters when changing category
    setAppliedFilters({});

    // Update URL without triggering a navigation
    router.setParams(Object.fromEntries(newParams));
  };

  // Update URL params when model changes
  const handleModelChange = (modelId: string) => {
    setActiveModelId(modelId);

    // Update URL to reflect model changes
    const newParams = new URLSearchParams();

    // Keep the title as is
    if (params.title) {
      newParams.append('title', params.title as string);
    }

    // Keep the category
    newParams.append('category', activeCategoryId);

    // Only add model if not the ALL model
    if (modelId !== MODEL_IDS.ALL) {
      newParams.append('model', modelId);
    }

    // Also clear applied overlay filters when changing models
    setAppliedFilters({});

    // Update URL without triggering a navigation
    router.setParams(Object.fromEntries(newParams));
  };

  const handleProductPress = (productId: string) => {
    router.push(`/products/product?id=${productId}`);
  };

  function renderProductPair(products: Product[], startIndex: number) {
    return (
      <View style={styles.gridRow} key={`row-${startIndex}`}>
        {products.map((product) => (
          <View key={product.id} style={styles.gridItem}>
            <DefaultLargeCard product={product} onPress={() => handleProductPress(product.id)} />
          </View>
        ))}
      </View>
    );
  }

  // Function to get the display title based on context
  const getDisplayTitle = () => {
    // Special case: if category is the ALL/todo category, always use default title
    if (activeCategoryId === CATEGORY_IDS.ALL) {
      return 'Tienda';
    }

    // Get the current category info
    const selectedCategory = CategoryData.mainCategories.find((c) => c.id === activeCategoryId);

    // First priority: Label categories should just show their label name
    if (selectedCategory?.isLabel) {
      return selectedCategory.name;
    }

    // When the activeModelId is the ALL model, we should show category title or default title
    if (activeModelId === MODEL_IDS.ALL) {
      // If it's a regular category, show category name
      if (activeCategoryId && activeCategoryId !== CATEGORY_IDS.ALL) {
        const categoryName = selectedCategory?.name;
        if (categoryName) {
          return categoryName;
        }
      }

      // Default title without model suffix
      return rawPageTitle;
    }

    // If regular category and model selected, show "Category - Model"
    if (!selectedCategory?.isLabel && activeModelId !== MODEL_IDS.ALL) {
      const categoryName = selectedCategory?.name;

      const modelName = availableModels.find((m) => m.id === activeModelId)?.name;

      if (categoryName && modelName) {
        return `${categoryName} - ${modelName}`;
      }
    }

    // For section titles, use the mapping
    if (SECTION_TO_TITLE_MAP[rawPageTitle]) {
      return SECTION_TO_TITLE_MAP[rawPageTitle];
    }

    // Default back to original title
    return rawPageTitle;
  };

  // Calculate display title and update whenever category or model changes
  const displayTitle = getDisplayTitle();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Header
        title={displayTitle}
        variant="catalog"
        availableSizes={filterOptions.availableSizes}
        availableColors={filterOptions.availableColors}
        minPrice={filterOptions.minPrice}
        maxPrice={filterOptions.maxPrice}
        initialFilters={appliedFilters}
        onApplyFilters={handleApplyFilters}
      />

      <TabBar<Category>
        items={CategoryData.mainCategories}
        activeItemId={activeCategoryId}
        onSelectItem={handleCategoryChange}
      />

      {availableModels.length > 1 && (
        <TabBar<ProductModel>
          items={availableModels}
          activeItemId={activeModelId}
          onSelectItem={handleModelChange}
          style={styles.modelsTabBar}
          itemStyle={styles.modelItem}
          activeItemStyle={styles.activeModelItem}
          activeUnderlineStyle={styles.activeModelUnderline}
        />
      )}

      <ScrollView
        style={styles.productsContainer}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {loading ? (
          <ProductGridSkeleton />
        ) : (
          <View style={styles.gridContainer}>
            {productsToDisplay.reduce((acc, product, index) => {
              if (index % 2 === 0) {
                const pair = productsToDisplay.slice(index, index + 2);
                acc.push(renderProductPair(pair, index));
              }
              return acc;
            }, [] as JSX.Element[])}
            {productsToDisplay.length === 0 && !loading && (
              <Text style={styles.noResultsText}>
                No hay productos que coincidan con los filtros seleccionados.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  tabsScrollView: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xxl,
    alignItems: 'center',
    height: 40,
  },
  tabItemContainer: {
    paddingVertical: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  tabText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.secondary,
    fontWeight: fontWeights.medium,
    paddingBottom: 2,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: fontWeights.semibold,
  },
  activeTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.6,
    backgroundColor: colors.primary,
  },
  productsContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  gridContainer: {
    paddingVertical: spacing.xl,
    paddingHorizontal: 0,
    gap: spacing.xxxl,
    alignItems: 'center',
    flexGrow: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  gridItem: {
    flex: 1,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: spacing.xl,
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    color: colors.secondary,
  },
  // Renamed from tagsTabBar to modelsTabBar
  modelsTabBar: {
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
    height: 36,
  },
  // Renamed from tagItem to modelItem
  modelItem: {
    fontSize: fontSizes.sm,
    color: colors.secondary,
  },
  // Renamed from activeTagItem to activeModelItem
  activeModelItem: {
    color: colors.primary,
    fontWeight: fontWeights.semibold,
  },
  // Renamed from activeTagUnderline to activeModelUnderline
  activeModelUnderline: {
    backgroundColor: colors.primary,
    height: 1.5,
  },
});
