import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, FlatList, ViewStyle, TextStyle } from 'react-native';
import { spacing, radius } from '../_styles/spacing';
import { colors } from '../_styles/colors';
import { fonts, fontSizes } from '../_styles/typography';
import { router } from 'expo-router';
import EmptyFavorites from '../_components/store/favorites/EmptyFavorites';
import Subheader from '../_components/common/Subheader';
import PromotionCard from '../_components/store/product/promotion/PromotionCard';
import { Product } from '../_types/product';
import DefaultLargeCard from '../_components/store/product/default/large';
import { useFavoritesStore } from '../_stores/favoritesStore';
import { useProducts } from '../../hooks/useProducts';
import { getProductById, products } from '../_data/products';
import FavoritesSkeleton from '../_components/skeletons/FavoritesSkeleton';
import ScreenHeader from '../_components/common/ScreenHeader';

// Keeping recentlyViewedProducts based on static data for now
// Consider fetching/deriving this differently if needed
const recentlyViewedProducts: Product[] = [
  getProductById('neceser-ball') || products[0],
  getProductById('mochila-classic') || products[1],
  getProductById('mochila-sq') || products[2],
  getProductById('buzo-oversize') || products[3],
  getProductById('cap-v3') || products[4],
].filter((p): p is Product => p !== undefined);

// Define Styles type
type Styles = {
  container: ViewStyle;
  toggleButton: ViewStyle;
  toggleButtonText: TextStyle;
  scrollContent: ViewStyle;
  scrollContentEmpty: ViewStyle;
  gridContainer: ViewStyle;
  columnWrapper: ViewStyle;
  cardWrapper: ViewStyle;
  section: ViewStyle;
  horizontalScrollContent: ViewStyle;
  centeredStatus: ViewStyle;
  errorText: TextStyle;
};

export default function FavoritesScreen() {
  // Get all products with loading/error states
  const { data: allProducts = [], isLoading, isError } = useProducts();

  // Get favorites state
  const favoriteIds = useFavoritesStore((state) => state.productIds);

  // Convert favorite IDs to actual product objects
  const favorites = useMemo<Product[]>(() => {
    // Handle case where products are loading or empty
    if (!allProducts || allProducts.length === 0) {
      return [];
    }
    return favoriteIds
      .map((id) => allProducts.find((product) => product.id === id))
      .filter((product): product is Product => product !== undefined);
  }, [favoriteIds, allProducts]);

  // isEmpty should reflect the calculated favorites AFTER loading/filtering
  const isEmpty = !isLoading && !isError && favorites.length === 0;

  const handleGoToStore = () => {
    router.replace('/');
  };

  const handleProductPress = (productId: string) => {
    router.push(`/products/product?id=${productId}`);
  };

  const handleViewMoreRecentlyViewed = () => {
    console.log('View all recently viewed products');
  };

  const renderFavoriteItem = ({ item }: { item: Product }) => {
    return (
      <View style={styles.cardWrapper}>
        <DefaultLargeCard product={item} onPress={() => handleProductPress(item.id)} />
      </View>
    );
  };

  // Loading State - Use Skeleton
  if (isLoading) {
    return <FavoritesSkeleton />;
  }

  // Error State
  if (isError) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Favorites" />
        <View style={styles.centeredStatus}>
          <Text style={styles.errorText}>Failed to load products. Please try again later.</Text>
        </View>
      </View>
    );
  }

  // Main Content (Favorites or Empty State)
  return (
    <View style={styles.container}>
      <ScreenHeader title="Favorites" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isEmpty && styles.scrollContentEmpty, // Apply empty style only when truly empty
        ]}
      >
        {isEmpty ? (
          <>
            <EmptyFavorites onGoToStore={handleGoToStore} />
            {/* Recently viewed products section - Show only when favorites IS empty */}
            {recentlyViewedProducts.length > 0 && (
              <View style={styles.section}>
                <Subheader
                  title="Vistos recientemente"
                  buttonText="Ver Todo"
                  onButtonPress={handleViewMoreRecentlyViewed}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {recentlyViewedProducts.map((product) => (
                    <PromotionCard
                      key={product.id}
                      product={product}
                      size="s"
                      onPress={() => handleProductPress(product.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderFavoriteItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false} // Disable FlatList scrolling, use ScrollView
          />
        )}
      </ScrollView>
    </View>
  );
}

// Use typed StyleSheet.create
const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  toggleButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, // Use radius token
    alignSelf: 'flex-start',
  },
  toggleButtonText: {
    color: colors.background.light,
    fontSize: fontSizes.sm,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.background.light,
  },
  scrollContentEmpty: {
    // No specific style needed here now, handled by isEmpty logic structure
    // Keeping for potential future use
  },
  gridContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardWrapper: {
    width: '48.5%',
  },
  section: {
    paddingVertical: spacing.xl,
    backgroundColor: colors.background.light,
  },
  horizontalScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  // Added styles for loading/error states
  centeredStatus: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    fontSize: fontSizes.md,
    fontFamily: fonts.primary,
  },
});
