import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
// import { Default as DefaultLargeCard } from '../_components/store/product';
import DefaultLargeCard from '../_components/store/product/default/large';
import ProductData from '../_data/products';
import CategoryData from '../_data/categories';
import TagData from '../_data/tags';
import { Category } from '../_types/category';
import { Tag } from '../_types/tag';
import { Product } from '../_types/product';
import { colors } from '../_styles/colors';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import { spacing } from '../_styles/spacing';
import ProductHeader from '../_components/store/layout/ProductHeader';
import ProductGridSkeleton from '../_components/skeletons/ProductGridSkeleton';

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

// Define mapping between section names, tags, and display titles
const SECTION_TO_TAG_MAP: Record<string, { tagId: string; title: string }> = {
  Tienda: { tagId: 'recommended', title: 'Productos Recomendados' },
  Destacados: { tagId: 'featured', title: 'Productos Destacados' },
  Tendencias: { tagId: 'popular', title: 'Tendencias' },
  'Lanzamientos & Oportunidades': { tagId: 'opportunity', title: 'Lanzamientos & Oportunidades' },
};

export default function CatalogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; title?: string; tag?: string }>();
  const initialCategoryId = params.category || CategoryData.mainCategories[0].id;
  const initialTagId = params.tag || 'all';

  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);
  const [activeTagId, setActiveTagId] = useState(initialTagId);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Use the original title or default to 'Tienda'
  const rawPageTitle = params.title || 'Tienda';

  useEffect(() => {
    // This effect handles category changes: update available tags
    setLoading(true);

    // Fetch tags for the newly selected category
    const tagsForCategory = ProductData.getTagsForCategory(activeCategoryId);
    setAvailableTags(tagsForCategory);

    // Only reset the tag if we're changing categories and there's no specific tag in the URL
    // Otherwise keep the selected tag from URL params if it exists
    if (!params.tag) {
      setActiveTagId('all');
    }
  }, [activeCategoryId, params.tag]); // Depends on category and URL tag param

  useEffect(() => {
    // This effect handles fetching products whenever category or tag changes.
    setLoading(true);
    setTimeout(() => {
      let products;

      // If initial load with a specific tag from URL params
      if (params.tag && params.tag !== 'all' && activeTagId === params.tag) {
        // Find products across all categories with this tag
        products = ProductData.products.filter((p) => p.tagIds.includes(params.tag as string));
      } else {
        // Normal filtering by active category and tag
        products = ProductData.getProductsByCategoryAndTag(activeCategoryId, activeTagId);
      }

      setFilteredProducts(products);
      setLoading(false);
    }, 150);
  }, [activeCategoryId, activeTagId, params.tag]); // Depends on category, tag and URL param

  // Update URL params when category changes to maintain browsing state
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategoryId(categoryId);

    // Update URL to reflect the current filtering state
    // This helps with browser history and sharing links
    const newParams = new URLSearchParams();

    // Always omit the title param when switching to 'todo' category
    // to ensure we reset to the default 'Tienda' title
    if (categoryId !== 'todo' && params.title) {
      newParams.append('title', params.title as string);
    }

    // Update category
    newParams.append('category', categoryId);

    // Keep the tag if it exists and we're not switching to 'todo'
    // Reset tags when switching to 'todo' for a clean state
    if (categoryId !== 'todo' && activeTagId && activeTagId !== 'all') {
      newParams.append('tag', activeTagId);
    }

    // Update URL without triggering a navigation (just update the params)
    router.setParams(Object.fromEntries(newParams));
  };

  // Update URL params when tag changes
  const handleTagChange = (tagId: string) => {
    setActiveTagId(tagId);

    // Update URL to reflect tag changes
    const newParams = new URLSearchParams();

    // Keep the title as is
    if (params.title) {
      newParams.append('title', params.title as string);
    }

    // Keep the category
    newParams.append('category', activeCategoryId);

    // Only add tag if not 'all'
    if (tagId !== 'all') {
      newParams.append('tag', tagId);
    }

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
    // Special case: if category is 'todo', always use default title
    if (activeCategoryId === 'todo') {
      return 'Tienda';
    }

    // When the activeTagId is 'all', we should show category title or default title
    if (activeTagId === 'all') {
      // If it's a category, show category name
      if (activeCategoryId && activeCategoryId !== 'todo') {
        const categoryName = CategoryData.mainCategories.find(
          (c) => c.id === activeCategoryId
        )?.name;
        if (categoryName) {
          return categoryName;
        }
      }

      // Default title without tag suffix
      return rawPageTitle;
    }

    // If coming from a section with a specific tag
    if (params.tag && params.tag !== 'all') {
      // Look for a matching section mapping first
      for (const [section, details] of Object.entries(SECTION_TO_TAG_MAP)) {
        if (details.tagId === params.tag && rawPageTitle === section) {
          return details.title;
        }
      }

      // If no direct section match but we have a tag, show tag name
      const tagName = TagData.tags.find((t) => t.id === params.tag)?.name;
      if (tagName) {
        // If we also have a category, combine them
        if (params.category && params.category !== 'todo') {
          const categoryName = CategoryData.mainCategories.find(
            (c) => c.id === params.category
          )?.name;
          if (categoryName) {
            return `${categoryName} - ${tagName}`;
          }
        }
        return `${rawPageTitle} - ${tagName}`;
      }
    }

    // Default back to original title
    return rawPageTitle;
  };

  // Calculate display title and update whenever category or tag changes
  const displayTitle = getDisplayTitle();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ProductHeader title={displayTitle} variant="catalog" />

      <TabBar<Category>
        items={CategoryData.mainCategories}
        activeItemId={activeCategoryId}
        onSelectItem={handleCategoryChange}
      />

      {availableTags.length > 1 && (
        <TabBar<Tag>
          items={availableTags}
          activeItemId={activeTagId}
          onSelectItem={handleTagChange}
          style={styles.tagsTabBar}
          itemStyle={styles.tagItem}
          activeItemStyle={styles.activeTagItem}
          activeUnderlineStyle={styles.activeTagUnderline}
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
            {filteredProducts.reduce((acc, product, index) => {
              if (index % 2 === 0) {
                const pair = filteredProducts.slice(index, index + 2);
                acc.push(renderProductPair(pair, index));
              }
              return acc;
            }, [] as JSX.Element[])}
            {filteredProducts.length === 0 && !loading && (
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
  tagsTabBar: {
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
    height: 36,
  },
  tagItem: {
    fontSize: fontSizes.sm,
    color: colors.secondary,
  },
  activeTagItem: {
    color: colors.primary,
    fontWeight: fontWeights.semibold,
  },
  activeTagUnderline: {
    backgroundColor: colors.primary,
    height: 1.5,
  },
});
