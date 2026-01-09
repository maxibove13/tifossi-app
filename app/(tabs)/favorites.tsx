import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, FlatList, ViewStyle, TextStyle } from 'react-native';
import { spacing } from '../_styles/spacing';
import { colors } from '../_styles/colors';
import { fonts, fontSizes } from '../_styles/typography';
import { router } from 'expo-router';
import EmptyState from '../_components/common/EmptyState';
import PromotionCard from '../_components/store/product/promotion/PromotionCard';
import { Product } from '../_types/product';
import DefaultLargeCard from '../_components/store/product/default/large';
import { useFavoritesStore } from '../_stores/favoritesStore';
import { useProductStore } from '../_stores/productStore';
import ProductData, { getProductById, products } from '../_data/products';
import { SkeletonLoader } from '../_components/common/SkeletonLoader';
import { hasStatus, ProductStatus } from '../_types/product-status';
import { useAuthStore } from '../_stores/authStore';
import ProductSections from '../_components/store/product/sections/ProductSections';

// Function to get recommended products from API data
const getRecommendedProducts = (allProducts: Product[]): Product[] => {
  return allProducts
    .filter((product) => hasStatus(product.statuses, ProductStatus.RECOMMENDED))
    .slice(0, 5);
};

// Fallback recommended products from static data if API is not available
const fallbackRecommendedProducts: Product[] = [
  getProductById('neceser-ball') || products[0],
  getProductById('mochila-classic') || products[1],
  getProductById('mochila-sq') || products[2],
  getProductById('buzo-oversize') || products[3],
  getProductById('cap-v3') || products[4],
].filter((p): p is Product => p !== undefined);

// Define Styles type
type Styles = {
  container: ViewStyle;
  scrollContent: ViewStyle;
  gridContainer: ViewStyle;
  columnWrapper: ViewStyle;
  cardWrapper: ViewStyle;
  centeredStatus: ViewStyle;
  errorText: TextStyle;
  loadingFavoritesText: TextStyle;
  recommendedSection: ViewStyle;
};

export default function FavoritesScreen() {
  const {
    products: allProducts,
    isLoading: productsLoading,
    error: productsError,
    fetchProducts,
  } = useProductStore();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const favoriteIds = useFavoritesStore((state) => state.productIds);

  // Fetch products when component mounts
  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Get recommended products from API data or fallback
  const recommendedProductsData = useMemo(() => {
    if (allProducts && allProducts.length > 0) {
      return getRecommendedProducts(allProducts);
    }
    return fallbackRecommendedProducts;
  }, [allProducts]);

  const localOrSyncedFavorites = useMemo<Product[]>(() => {
    if (!allProducts || allProducts.length === 0) {
      // If API data is not available, try to use static data as fallback
      if (!productsLoading) {
        return favoriteIds
          .map((id) => ProductData.getProductById(id))
          .filter((product): product is Product => product !== undefined);
      }
      return [];
    }
    return favoriteIds
      .map((id) => allProducts.find((product) => product.id === id))
      .filter((product): product is Product => product !== undefined);
  }, [favoriteIds, allProducts, productsLoading]);

  const handleGoToStore = () => {
    router.replace('/');
  };

  const handleLogin = () => {
    router.push('/(tabs)/profile');
  };

  const handleProductPress = (productId: string) => {
    router.push(`/products/product?id=${productId}`);
  };

  const handleViewMore = (sectionTitle: string) => {
    if (sectionTitle.toLowerCase() === 'recomendados') {
      router.push('/catalog?title=Recomendados&category=recommended');
    } else {
      router.push('/catalog');
    }
  };

  const renderFavoriteItem = ({ item }: { item: Product }) => {
    return (
      <View style={styles.cardWrapper}>
        <DefaultLargeCard product={item} onPress={() => handleProductPress(item.id)} />
      </View>
    );
  };

  // Full screen skeleton if products are loading AND we have no local favorite IDs to even attempt to display
  if (productsLoading && favoriteIds.length === 0) {
    return <SkeletonLoader type="favorites" count={6} />;
  }

  // Full screen error if products errored AND we have no local favorite IDs
  if (productsError && favoriteIds.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centeredStatus}>
          <Text style={styles.errorText}>Error al cargar productos. Intenta de nuevo.</Text>
        </View>
      </View>
    );
  }

  // Determine which state to show (one action per page rule)
  const hasFavorites =
    localOrSyncedFavorites.length > 0 || (favoriteIds.length > 0 && productsLoading);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Case A: Logged in with no favorites -> EmptyFavorites "Nada guardado" */}
        {/* Case B: Logged out with no local favorites -> EmptyFavorites "No has iniciado sesión" */}
        {/* Case C: Has favorites -> show favorites grid */}
        {hasFavorites ? (
          <FlatList
            data={localOrSyncedFavorites}
            renderItem={renderFavoriteItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            ListEmptyComponent={
              productsLoading ? (
                <Text style={styles.loadingFavoritesText}>Cargando tus favoritos...</Text>
              ) : null
            }
          />
        ) : isLoggedIn ? (
          // Case A: Logged in, no favorites
          <EmptyState variant="noFavorites" onPress={handleGoToStore} />
        ) : (
          // Case B: Not logged in, no local favorites
          <EmptyState variant="notLoggedIn" onPress={handleLogin} />
        )}

        {/* Recommended Products - only show when no favorites */}
        {!hasFavorites && recommendedProductsData.length > 0 && (
          <View style={styles.recommendedSection}>
            <ProductSections
              title="Recomendados"
              products={recommendedProductsData}
              CardComponent={PromotionCard}
              onProductPress={handleProductPress}
              onViewMore={() => handleViewMore('Recomendados')}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: colors.background.offWhite,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  gridContainer: {
    padding: spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardWrapper: {
    width: '48.5%',
  },
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
  loadingFavoritesText: {
    textAlign: 'center',
    paddingVertical: spacing.xl,
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    color: colors.secondary,
  },
  recommendedSection: {
    marginTop: 64,
  },
});
