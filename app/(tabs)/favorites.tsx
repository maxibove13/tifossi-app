import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, FlatList, ViewStyle, TextStyle } from 'react-native';
import { spacing } from '../_styles/spacing';
import { colors } from '../_styles/colors';
import { fonts, fontSizes } from '../_styles/typography';
import { router } from 'expo-router';
import EmptyFavorites from '../_components/store/favorites/EmptyFavorites';
import PromotionCard from '../_components/store/product/promotion/PromotionCard';
import { Product } from '../_types/product';
import DefaultLargeCard from '../_components/store/product/default/large';
import { useFavoritesStore } from '../_stores/favoritesStore';
import { useProducts } from '../../hooks/useProducts';
import { getProductById, products } from '../_data/products';
import FavoritesSkeleton from '../_components/skeletons/FavoritesSkeleton';
import { useAuthStore } from '../_stores/authStore';
import ReusableAuthPrompt from '../_components/auth/AuthPrompt';
import ProductSections from '../_components/store/product/sections/ProductSections';

// Using recentlyViewedProducts as a placeholder for recommendedProducts data
const recommendedProductsData: Product[] = [
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
  scrollContentEmpty: ViewStyle;
  gridContainer: ViewStyle;
  columnWrapper: ViewStyle;
  cardWrapper: ViewStyle;
  centeredStatus: ViewStyle;
  errorText: TextStyle;
  authPromptContainer: ViewStyle;
  loadingFavoritesText: TextStyle;
  localFavoritesHeader: TextStyle;
};

export default function FavoritesScreen() {
  const {
    data: allProducts = [],
    isLoading: productsLoading,
    isError: productsError,
  } = useProducts();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const favoriteIds = useFavoritesStore((state) => state.productIds);

  const localOrSyncedFavorites = useMemo<Product[]>(() => {
    if (!allProducts || allProducts.length === 0) {
      return [];
    }
    return favoriteIds
      .map((id) => allProducts.find((product) => product.id === id))
      .filter((product): product is Product => product !== undefined);
  }, [favoriteIds, allProducts]);

  const handleGoToStore = () => {
    router.replace('/');
  };

  const handleProductPress = (productId: string) => {
    router.push(`/products/product?id=${productId}`);
  };

  const handleViewMore = (sectionTitle: string) => {
    if (sectionTitle.toLowerCase() === 'recomendados') {
      router.push('/catalog?title=Recomendados&category=recommended');
    } else {
      console.log(`View more for ${sectionTitle} - navigation not yet defined`);
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
    return <FavoritesSkeleton />;
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

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Section 1: Main Favorites Content (List or Empty State) */}
        {isLoggedIn ? (
          // LOGGED IN STATE
          localOrSyncedFavorites.length === 0 && !productsLoading ? (
            <EmptyFavorites onGoToStore={handleGoToStore} />
          ) : (
            <FlatList
              data={localOrSyncedFavorites}
              renderItem={renderFavoriteItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.gridContainer}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false} // Important for ScrollView parent
              ListEmptyComponent={
                productsLoading ? (
                  <Text style={styles.loadingFavoritesText}>Cargando tus favoritos...</Text>
                ) : null
              }
            />
          )
        ) : (
          // LOGGED OUT STATE
          <>
            {favoriteIds.length === 0 ? (
              <EmptyFavorites onGoToStore={handleGoToStore} />
            ) : (
              <>
                <FlatList
                  data={localOrSyncedFavorites}
                  renderItem={renderFavoriteItem}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={styles.columnWrapper}
                  contentContainerStyle={styles.gridContainer}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false} // Important for ScrollView parent
                  ListEmptyComponent={
                    productsLoading ? (
                      <Text style={styles.loadingFavoritesText}>
                        Cargando detalles de favoritos...
                      </Text>
                    ) : (
                      // If not loading and list is still empty, it implies product details for some IDs were not found
                      // This case might not need a message if favoriteIds.length > 0 implies we expect *some* items.
                      // Or, it could be an error state for specific items not found.
                      <Text style={styles.loadingFavoritesText}>
                        Algunos favoritos no pudieron ser cargados.
                      </Text>
                    )
                  }
                />
              </>
            )}
          </>
        )}

        {/* Section 2: Auth Prompt for Logged OUT users */}
        {!isLoggedIn && (
          <View style={styles.authPromptContainer}>
            {favoriteIds.length === 0 ? (
              <ReusableAuthPrompt message="Crea una cuenta para guardar y sincronizar tus productos favoritos en todos tus dispositivos." />
            ) : (
              <ReusableAuthPrompt message="¡Tus favoritos se guardan aquí! Inicia sesión para verlos en todos tus dispositivos y mantenerlos seguros." />
            )}
          </View>
        )}

        {/* Section 3: Recommended Products */}
        {localOrSyncedFavorites.length === 0 && recommendedProductsData.length > 0 && (
          <ProductSections
            title="Recomendados"
            products={recommendedProductsData}
            CardComponent={PromotionCard}
            onProductPress={handleProductPress}
            onViewMore={() => handleViewMore('Recomendados')}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.background.light,
    paddingBottom: spacing.xxl,
  },
  scrollContentEmpty: {
    // Styles for when the cart is empty - might make sense to center EmptyFavorites
    // justifyContent: 'center', // Example: if EmptyFavorites should be centered
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
  authPromptContainer: {
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  loadingFavoritesText: {
    textAlign: 'center',
    paddingVertical: spacing.xl,
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    color: colors.secondary,
  },
  localFavoritesHeader: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.lg,
    fontWeight: '500',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    color: colors.primary,
  },
});
