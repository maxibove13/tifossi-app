import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import DefaultLargeCard from '../_components/store/product/default/large';
import { useCategories } from '../../hooks/useCategories';
import { useProductModels } from '../../hooks/useProductModels';
import { Category } from '../_types/category';
import { ProductModel } from '../_types/model';
import { Product } from '../_types/product';
import { ProductFilters } from '../_components/store/product/overlay/OverlayProductFilters';
import { useProductFilters } from '../../hooks/useProductFilters';
import { useProductStore } from '../_stores/productStore';
import { colors } from '../_styles/colors';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import { spacing } from '../_styles/spacing';
import { RNLayoutChangeEvent } from '../_types/ui';
import Header from '../_components/store/layout/Header';
import { SkeletonLoader } from '../_components/common/SkeletonLoader';
import { CATEGORY_IDS, MODEL_IDS } from '../_types/constants';
import { hasStatus } from '../_types/product-status';

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
  const handleScrollViewLayout = (event: RNLayoutChangeEvent) => {
    scrollViewWidth.current = event.nativeEvent.layout.width;
  };

  // Store the position and width of each tab item
  const measureItemLayout = (itemId: string, event: RNLayoutChangeEvent) => {
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

export default function CategoryDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  // Fetch categories and models from API
  const { mainCategories, isLoading: isLoadingCategories } = useCategories();
  const { getModelsByCategory } = useProductModels();

  // Find category by slug or ID
  const findCategoryBySlug = useCallback(
    (slugParam: string): Category | undefined => {
      return mainCategories.find(
        (cat) =>
          cat.id === slugParam ||
          cat.name.toLowerCase().replace(/\s+/g, '-') === slugParam.toLowerCase()
      );
    },
    [mainCategories]
  );

  const targetCategory = findCategoryBySlug(slug);
  const initialCategoryId = targetCategory?.id || mainCategories[0]?.id || CATEGORY_IDS.ALL;
  const initialModelId = MODEL_IDS.ALL;

  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);
  const [activeModelId, setActiveModelId] = useState(initialModelId);
  const [availableModels, setAvailableModels] = useState<ProductModel[]>([]);
  const [categoryModelProducts, setCategoryModelProducts] = useState<Product[]>([]);

  // Fetch products using Zustand store (single source of truth)
  const {
    products: allProducts,
    isLoading: isLoadingProducts,
    error: productsError,
    fetchProducts,
    refreshProducts,
  } = useProductStore();
  const [appliedFilters, setAppliedFilters] = useState<ProductFilters>({});
  const [refreshing, setRefreshing] = useState(false);

  // Ensure products are fetched if store is empty (e.g., direct navigation, preload failed)
  useEffect(() => {
    if (allProducts.length === 0 && !isLoadingProducts) {
      fetchProducts();
    }
  }, [allProducts.length, isLoadingProducts, fetchProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProducts();
    } finally {
      setRefreshing(false);
    }
  }, [refreshProducts]);

  // Update active category when URL slug changes and categories are loaded
  useEffect(() => {
    if (!isLoadingCategories && mainCategories.length > 0) {
      const category = findCategoryBySlug(slug);
      if (category) {
        setActiveCategoryId(category.id);
      }
    }
  }, [slug, mainCategories, isLoadingCategories, findCategoryBySlug]);

  useEffect(() => {
    // This effect handles category changes: update available models
    // Check if the selected category is a regular product category or a label-based category
    const selectedCategory = mainCategories.find((cat) => cat.id === activeCategoryId);
    const isCategoryLabel = selectedCategory?.isLabel || activeCategoryId === CATEGORY_IDS.ALL;

    // Don't show secondary tabs for "Todo" or label-based categories
    if (isCategoryLabel) {
      setAvailableModels([]);
    } else {
      // Get models for the selected category (from API with fallback)
      const modelsForCategory = getModelsByCategory(activeCategoryId);
      setAvailableModels(modelsForCategory);
    }

    // Reset the model when category changes
    setActiveModelId(MODEL_IDS.ALL);

    // Reset applied filters when category changes
    setAppliedFilters({});
  }, [activeCategoryId, mainCategories, getModelsByCategory]);

  // Function to filter products by category and model using API data
  const filterProductsByCategoryAndModel = useCallback(
    (products: Product[], categoryId: string, modelId: string) => {
      let filteredProducts = products;

      // Filter by category
      if (categoryId !== CATEGORY_IDS.ALL) {
        // Check if this is a label-based category (status-based)
        const selectedCategory = mainCategories.find((cat) => cat.id === categoryId);

        if (selectedCategory?.isLabel) {
          // Special case for 'discounted' - filter by discountedPrice, not status
          if (categoryId === CATEGORY_IDS.DISCOUNTED) {
            filteredProducts = products.filter(
              (product) =>
                typeof product.discountedPrice === 'number' &&
                product.discountedPrice < product.price
            );
          } else {
            // Filter by status for other label categories
            filteredProducts = products.filter((product) =>
              hasStatus(product.statuses, categoryId as any)
            );
          }
        } else {
          // Regular category filtering
          filteredProducts = products.filter((product) => product.categoryId === categoryId);
        }
      }

      // Filter by model
      if (modelId !== MODEL_IDS.ALL) {
        filteredProducts = filteredProducts.filter((product) => product.modelId === modelId);
      }

      return filteredProducts;
    },
    [mainCategories]
  );

  useEffect(() => {
    // This effect processes products based on category/model when data is available
    const products = filterProductsByCategoryAndModel(allProducts, activeCategoryId, activeModelId);
    setCategoryModelProducts(products);
  }, [allProducts, activeCategoryId, activeModelId, filterProductsByCategoryAndModel]);

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

  // Update category when different category is selected
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    // Reset model selection when switching categories
    setActiveModelId(MODEL_IDS.ALL);

    // Navigate to the new category
    const newCategory = mainCategories.find((cat) => cat.id === categoryId);
    if (newCategory) {
      const newSlug = newCategory.name.toLowerCase().replace(/\s+/g, '-');
      router.replace(`/catalog/${newSlug}` as any);
    }

    // Clear applied overlay filters when changing category
    setAppliedFilters({});
  };

  // Update model when different model is selected
  const handleModelChange = (modelId: string) => {
    setActiveModelId(modelId);

    // Clear applied overlay filters when changing models
    setAppliedFilters({});
  };

  const handleProductPress = (productId: string) => {
    router.push(`/products/${productId}` as any);
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
    // Get the current category info
    const selectedCategory = mainCategories.find((c) => c.id === activeCategoryId);

    // Always show only the main category name, never the subcategory/model
    if (selectedCategory) {
      return selectedCategory.name;
    }

    // Default to category slug formatted
    return slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Calculate display title
  const displayTitle = getDisplayTitle();

  // Show error if category not found
  if (!targetCategory) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="Categoría no encontrada" variant="catalog" />

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>La categoría "{slug}" no existe.</Text>
          <Pressable style={styles.backButton} onPress={() => router.replace('/catalog')}>
            <Text style={styles.backButtonText}>Volver al catálogo</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
        items={mainCategories}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {(isLoadingProducts && allProducts.length === 0) || isLoadingCategories || refreshing ? (
          <SkeletonLoader type="productGrid" rows={3} />
        ) : productsError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error al cargar productos. Intenta de nuevo.</Text>
            <Text style={styles.errorDetailText}>{productsError}</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {productsToDisplay.reduce((acc, product, index) => {
              if (index % 2 === 0) {
                const pair = productsToDisplay.slice(index, index + 2);
                acc.push(renderProductPair(pair, index));
              }
              return acc;
            }, [] as JSX.Element[])}
            {productsToDisplay.length === 0 && !isLoadingProducts && (
              <Text style={styles.noResultsText}>No hay productos en esta categoría.</Text>
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
    backgroundColor: colors.background.offWhite,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  errorText: {
    textAlign: 'center',
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    color: colors.error || colors.secondary,
    marginBottom: spacing.md,
  },
  errorDetailText: {
    textAlign: 'center',
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    color: colors.secondary,
  },
  backButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
  },
  // Models tab bar styles
  modelsTabBar: {
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
    height: 36,
  },
  modelItem: {
    fontSize: fontSizes.sm,
    color: colors.secondary,
  },
  activeModelItem: {
    color: colors.primary,
    fontWeight: fontWeights.semibold,
  },
  activeModelUnderline: {
    backgroundColor: colors.primary,
    height: 1.5,
  },
});

// Metadata for the router (export to satisfy the linter)
export const screenExport = {
  name: 'CategoryDetailScreen',
  version: '1.0.0',
};

// Add metadata to help router identification
// eslint-disable-next-line unused-imports/no-unused-vars
const metadata = {
  isRoute: true,
  componentType: 'Screen',
  routePattern: '/catalog/[slug]',
};
