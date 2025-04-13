import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../styles/colors';
import { spacing } from '../styles/spacing';
import { StoreHeader, CategoryShowcase } from '../components/store/layout';
import HighlightedCard from '../components/store/product/horizontal/HighlightedCard';
import FeaturedCard from '../components/store/product/featured/FeaturedCard';
import Button from '../components/ui/buttons/Button';
import StoreLocations from '../components/store/layout/Locations';
import ProductData from '../data/products';
import Footer from '../components/store/layout/Footer';
import { Product } from '../types/product';
import HomeScreenSkeleton from '../components/skeletons/HomeScreenSkeleton';
import ProductSections from '../components/store/product/sections/ProductSections';
import { useState, useEffect } from 'react';
import productUtils from '../utils/product-utils';
import DefaultLargeCard from '../components/store/product/default/large';
import { fonts, fontSizes, lineHeights } from '../styles/typography';

interface HomeScreenData {
  highlightedProducts: Product[];
  featuredProduct: Product | null;
  recommendedProducts: Product[];
  trendingProducts: Product[];
  newReleases: Product[];
  launchAndOpportunityProducts: Product[];
}

export default function HomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<HomeScreenData>({
    highlightedProducts: [],
    featuredProduct: null,
    recommendedProducts: [],
    trendingProducts: [],
    newReleases: [],
    launchAndOpportunityProducts: [],
  });

  const handleProductPress = (productId: string) => {
    router.push(`/products/product?id=${productId}`);
  };

  const handleViewMore = (section: string) => {
    console.log('View more:', section);
    // Handle view more action
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Add a delay to demonstrate the skeleton
        await new Promise((resolve) => setTimeout(resolve, 2500));

        const highlightedProducts = ProductData.getHighlightedProducts();
        const featuredProduct = ProductData.getFeaturedProduct();
        const recommendedProducts = productUtils.getRecommendedProducts();
        const trendingProducts = productUtils.getTrendingProducts();
        const newReleases = ProductData.getNewReleases();
        const launchAndOpportunityProducts = ProductData.getLaunchAndOpportunityProducts();

        setData({
          highlightedProducts,
          featuredProduct,
          recommendedProducts,
          trendingProducts,
          newReleases,
          launchAndOpportunityProducts,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return <HomeScreenSkeleton />;
  }

  // Helper to render product pairs for the grid
  const renderProductPair = (products: Product[]) => {
    return (
      <View style={styles.gridRow}>
        {products.map((product) => (
          <View key={product.id} style={styles.gridItem}>
            <DefaultLargeCard product={product} onPress={() => handleProductPress(product.id)} />
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Home Header */}
        <StoreHeader />

        {/* Horizontal Scroll - Highlighted Products */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {data.highlightedProducts.map((product) => (
            <HighlightedCard
              key={product.id}
              product={product}
              onPress={() => handleProductPress(product.id)}
            />
          ))}
        </ScrollView>

        {/* Recommended Products */}
        <ProductSections
          products={data.recommendedProducts}
          sectionType="recommended"
          onProductPress={handleProductPress}
          onViewMore={handleViewMore}
        />

        {/* Triple Vertical Layout */}
        <View style={[styles.section, styles.showcaseSection]}>
          <CategoryShowcase title="medias" onPress={() => {}} />
          <CategoryShowcase title="mochilas" onPress={() => {}} />
          <CategoryShowcase title="ver todo" onPress={() => {}} />
        </View>

        {/* Trending Products */}
        <ProductSections
          products={data.trendingProducts}
          sectionType="trending"
          onProductPress={handleProductPress}
          onViewMore={handleViewMore}
        />

        {/* Featured Product */}
        {data.featuredProduct && (
          <View style={styles.section}>
            <View style={styles.launchHeader}>
              <Text style={styles.launchTitle}>Destacados</Text>
              <Pressable onPress={() => handleViewMore('featured')}>
                <Text style={styles.launchViewMore}>Ver Más</Text>
              </Pressable>
            </View>
            <View style={styles.featuredCardContainer}>
              <FeaturedCard
                product={data.featuredProduct}
                onBuyPress={() => handleProductPress(data.featuredProduct!.id)}
                onPress={() => handleProductPress(data.featuredProduct!.id)}
              />
            </View>
          </View>
        )}

        {/* Lanzamientos & Oportunidades Section */}
        <View style={styles.launchSection}>
          <View style={styles.launchHeader}>
            <Text style={styles.launchTitle}>Lanzamientos & Oportunidades</Text>
            <Pressable onPress={() => handleViewMore('launch')}>
              <Text style={styles.launchViewMore}>Ver Más</Text>
            </Pressable>
          </View>
          <View style={styles.launchGridContainer}>
            {renderProductPair(data.launchAndOpportunityProducts.slice(0, 2))}
            {renderProductPair(data.launchAndOpportunityProducts.slice(2, 4))}
          </View>
        </View>

        {/* CTA Button */}
        <View style={styles.buttonContainer}>
          <Button variant="primary" text="Ver Todo" onPress={() => {}} />
        </View>

        {/* Locations */}
        <StoreLocations />

        {/* Footer */}
        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    paddingVertical: spacing.xxl, // Use token for 32px vertical padding (adjust if needed)
    paddingHorizontal: spacing.lg, // Add horizontal padding here
    gap: spacing.lg, // Add gap between header and content
  },
  horizontalScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    marginTop: 20,
  },
  featuredCardContainer: {
    height: 400,
    // Remove horizontal padding, handled by parent section now
  },
  showcaseSection: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl, // Consistent vertical padding
  },
  launchSection: {
    paddingVertical: spacing.xl, // Use token for 24px approx
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    alignItems: 'center',
  },
  launchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    // Remove vertical padding, handled by parent gap
  },
  launchTitle: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    fontWeight: '400',
    lineHeight: (lineHeights.xl * 1.4) / ((fontSizes.xl * 1.4) / 20),
    color: colors.primary,
  },
  launchViewMore: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: '400',
    lineHeight: (lineHeights.sm * 1.333) / ((fontSizes.sm * 1.333) / 12),
    color: colors.secondary,
    textDecorationLine: 'underline',
  },
  launchGridContainer: {
    width: '100%',
    gap: 40,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.lg,
  },
  gridItem: {
    flex: 1,
  },
});
