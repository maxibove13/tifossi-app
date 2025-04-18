import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { spacing, radius } from '../_styles/spacing';
import { colors } from '../_styles/colors';
import { fonts, fontSizes, lineHeights } from '../_styles/typography';
import { router } from 'expo-router';
import EmptyFavorites from '../_components/store/favorites/EmptyFavorites';
import Subheader from '../_components/common/Subheader';
import PromotionCard from '../_components/store/product/promotion/PromotionCard';
import { Product } from '../_types/product';
import { getProductById, products } from '../_data/products';
import DefaultLargeCard from '../_components/store/product/default/large';

// Dummy data for recently viewed products - use actual products from data file
const recentlyViewedProducts: Product[] = [
  getProductById('neceser-ball') || products[0],
  getProductById('mochila-classic') || products[1],
  getProductById('mochila-sq') || products[2],
  getProductById('buzo-oversize') || products[3],
  getProductById('cap-v3') || products[4],
].filter((p): p is Product => p !== undefined);

// Mock favorite product IDs
const mockFavoriteIds = ['neceser-ball', 'mochila-sq', 'socks-v2', 'media-fast', 'buzo-oversize'];

// Get mock favorite products from data
const mockFavoriteProducts: Product[] = mockFavoriteIds
  .map((id) => getProductById(id))
  .filter((p): p is Product => p !== undefined);

// Define Styles type
type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  headerTopSpace: ViewStyle;
  title: TextStyle;
  toggleButton: ViewStyle;
  toggleButtonText: TextStyle;
  scrollContent: ViewStyle;
  scrollContentEmpty: ViewStyle;
  gridContainer: ViewStyle;
  columnWrapper: ViewStyle;
  cardWrapper: ViewStyle;
  section: ViewStyle;
  horizontalScrollContent: ViewStyle;
};

export default function FavoritesScreen() {
  // TEMPORARY FOR TESTING - START
  const [showMockItems, setShowMockItems] = useState(true);
  const [favorites, setFavorites] = useState<Product[]>(showMockItems ? mockFavoriteProducts : []);
  const isEmpty = favorites.length === 0;
  // TEMPORARY FOR TESTING - END

  const handleGoToStore = () => {
    router.replace('/');
  };

  const handleProductPress = (productId: string) => {
    router.push(`/products/product?id=${productId}`);
  };

  const handleViewMoreRecentlyViewed = () => {
    console.log('View all recently viewed products');
  };

  // TEMPORARY FOR TESTING - START
  const toggleFavoritesView = () => {
    const nextShowMockItems = !showMockItems;
    setShowMockItems(nextShowMockItems);
    setFavorites(nextShowMockItems ? mockFavoriteProducts : []);
  };
  // TEMPORARY FOR TESTING - END

  const renderFavoriteItem = ({ item }: { item: Product }) => {
    return (
      <View style={styles.cardWrapper}>
        <DefaultLargeCard
          product={item}
          onPress={() => handleProductPress(item.id)}
          isFavorite={true} // All items in this list are favorites
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopSpace} />
        <Text style={styles.title}>Favorites</Text>
        {/* TEMPORARY FOR TESTING - START */}
        <TouchableOpacity onPress={toggleFavoritesView} style={styles.toggleButton}>
          <Text style={styles.toggleButtonText}>{showMockItems ? 'Ver Vacío' : 'Ver Items'}</Text>
        </TouchableOpacity>
        {/* TEMPORARY FOR TESTING - END */}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, isEmpty && styles.scrollContentEmpty]}
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
  header: {
    backgroundColor: colors.background.light,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  headerTopSpace: {
    height: spacing.xxxl,
  },
  title: {
    fontSize: fontSizes.xxxl,
    lineHeight: lineHeights.xxxl,
    color: colors.primary,
    fontFamily: fonts.primary,
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
    backgroundColor: colors.background.light,
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
});
