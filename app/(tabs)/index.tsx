import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../_styles/colors';
import { spacing } from '../_styles/spacing';
import { StoreHeader, CategoryShowcase } from '../_components/store/layout';
import HighlightedCard from '../_components/store/product/horizontal/HighlightedCard';
import FeaturedCard from '../_components/store/product/featured/FeaturedCard';
import Button from '../_components/ui/buttons/Button';
import StoreLocations from '../_components/store/layout/Locations';
import Footer from '../_components/store/layout/Footer';
import { Product } from '../_types/product';
import HomeScreenSkeleton from '../_components/skeletons/HomeScreenSkeleton';
import ProgressiveLoadingSection, {
  createSectionSkeleton,
} from '../_components/skeletons/ProgressiveLoadingSection';
import ProductSections from '../_components/store/product/sections/ProductSections';
import { useState, useEffect } from 'react';
import DefaultLargeCard from '../_components/store/product/default/large';
import { fonts, fontSizes, lineHeights } from '../_styles/typography';
import PromotionCard from '../_components/store/product/promotion/PromotionCard';
import MinicardLarge from '../_components/store/product/minicard/large';
// Import the home assets loader directly
import homeAssetLoader from '../_services/preload/homeAssets';

interface HomeScreenData {
  highlightedProducts: Product[];
  featuredProduct: Product | null;
  recommendedProducts: Product[];
  trendingProducts: Product[];
  newReleases: Product[];
  launchAndOpportunityProducts: Product[];
}

function HomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Track loading state of individual sections for progressive loading
  const [sectionLoadingState, setSectionLoadingState] = useState({
    highlighted: true,
    featured: true,
    recommended: true,
    trending: true,
    newReleases: true,
    launchOpportunity: true,
  });

  const [data, setData] = useState<HomeScreenData>({
    highlightedProducts: [],
    featuredProduct: null,
    recommendedProducts: [],
    trendingProducts: [],
    newReleases: [],
    launchAndOpportunityProducts: [],
  });

  function handleProductPress(productId: string) {
    router.push(`/products/product?id=${productId}`);
  }

  function handleViewMore(title: string) {
    // Navigate to catalog page with title and tag filter
    switch (title) {
      case 'Tienda':
        router.push('/catalog?title=Tienda&tag=recommended');
        break;
      case 'featured':
        router.push('/catalog?title=Destacados&tag=featured');
        break;
      case 'Tendencias':
        router.push('/catalog?title=Tendencias&tag=popular');
        break;
      case 'launch':
        router.push('/catalog?title=Lanzamientos & Oportunidades&tag=opportunity');
        break;
      default:
        router.push('/catalog');
    }
  }

  // No unused preload implementation - we load assets while skeleton is displayed

  // Load home assets while showing the skeleton - NOT in splash screen
  useEffect(() => {
    const loadData = async () => {
      try {
        // Start with everything in loading state (shows skeleton)
        setIsLoading(true);

        // Load assets while skeleton is displayed (not preloaded during splash)
        const loadedAssets = await homeAssetLoader.preloadHomeAssets();

        // Staggered update approach - update each section sequentially with small delays
        // This creates a natural "wave" of content appearing on screen

        // First wave: Above the fold content (highlighted products & featured)
        if (loadedAssets.highlightedProducts.length > 0) {
          setData((current) => ({
            ...current,
            highlightedProducts: loadedAssets.highlightedProducts,
          }));

          // Mark this section as loaded
          setSectionLoadingState((current) => ({
            ...current,
            highlighted: false,
          }));
        }

        // Short delay before showing featured product (feels more natural)
        setTimeout(() => {
          if (loadedAssets.featuredProduct) {
            setData((current) => ({
              ...current,
              featuredProduct: loadedAssets.featuredProduct,
            }));

            setSectionLoadingState((current) => ({
              ...current,
              featured: false,
            }));
          }
        }, 100); // Very small delay for staggered effect

        // Second wave: Recommended products (mid-priority)
        setTimeout(() => {
          if (loadedAssets.recommendedProducts.length > 0) {
            setData((current) => ({
              ...current,
              recommendedProducts: loadedAssets.recommendedProducts,
            }));

            setSectionLoadingState((current) => ({
              ...current,
              recommended: false,
            }));
          }
        }, 200);

        // Third wave: Lower priority content with staggered updates
        setTimeout(() => {
          // Update trending products
          if (loadedAssets.trendingProducts.length > 0) {
            setData((current) => ({
              ...current,
              trendingProducts: loadedAssets.trendingProducts,
            }));

            setSectionLoadingState((current) => ({
              ...current,
              trending: false,
            }));
          }
        }, 300);

        setTimeout(() => {
          // Update new releases
          if (loadedAssets.newReleases.length > 0) {
            setData((current) => ({
              ...current,
              newReleases: loadedAssets.newReleases,
            }));

            setSectionLoadingState((current) => ({
              ...current,
              newReleases: false,
            }));
          }
        }, 400);

        setTimeout(() => {
          // Update launch & opportunity products
          if (loadedAssets.launchAndOpportunityProducts.length > 0) {
            setData((current) => ({
              ...current,
              launchAndOpportunityProducts: loadedAssets.launchAndOpportunityProducts,
            }));

            setSectionLoadingState((current) => ({
              ...current,
              launchOpportunity: false,
            }));
          }

          // Exit global loading state once all sections have started updating
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error loading home screen data:', error);
        // Ensure we exit loading state even if some data fails to load
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Now we use HomeScreenSkeleton differently:
  // 1. If fully loading (initial state), show the full skeleton
  // 2. Otherwise, use section-specific loading states with progressive rendering
  if (isLoading) {
    return <HomeScreenSkeleton isLoading={true} />;
  }

  // Helper to render product pairs for the grid
  function renderProductPair(products: Product[]) {
    return (
      <View style={styles.gridRow}>
        {products.map((product) => (
          <View key={product.id} style={styles.gridItem}>
            <DefaultLargeCard product={product} onPress={() => handleProductPress(product.id)} />
          </View>
        ))}
      </View>
    );
  }

  // Combined rendering approach with progressive loading
  // We're showing a hybrid view where some sections may still be loading
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StoreHeader />

        {/* Horizontal Scroll - Highlighted Products with Progressive Loading */}
        <ProgressiveLoadingSection
          isLoading={sectionLoadingState.highlighted}
          skeleton={
            <View style={styles.highlightedSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContent}
              >
                {[1, 2, 3].map((key) => (
                  <View key={key} style={styles.highlightedCardSkeleton}>
                    {createSectionSkeleton({
                      title: false,
                      height: 180,
                      width: 280,
                      borderRadius: 8,
                    })}
                  </View>
                ))}
              </ScrollView>
            </View>
          }
        >
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
        </ProgressiveLoadingSection>

        {/* Recommended Products with Progressive Loading */}
        <ProgressiveLoadingSection
          isLoading={sectionLoadingState.recommended}
          skeleton={createSectionSkeleton({
            title: true,
            height: 200,
            width: 160,
            count: 4,
            horizontal: true,
            style: styles.section,
          })}
        >
          <ProductSections
            title="Productos Recomendados"
            products={data.recommendedProducts}
            CardComponent={PromotionCard}
            onProductPress={handleProductPress}
            onViewMore={() => handleViewMore('Tienda')}
          />
        </ProgressiveLoadingSection>

        {/* Triple Vertical Layout - Static content, always shown */}
        <View style={[styles.section, styles.showcaseSection]}>
          <CategoryShowcase
            title="medias"
            onPress={() => router.push('/catalog?title=Medias&category=medias')}
          />
          <CategoryShowcase
            title="mochilas"
            onPress={() => router.push('/catalog?title=Mochilas&category=mochilas')}
          />
          <CategoryShowcase
            title="ver todo"
            onPress={() => router.push('/catalog?title=Productos')}
          />
        </View>

        {/* Trending Products with Progressive Loading */}
        <ProgressiveLoadingSection
          isLoading={sectionLoadingState.trending}
          skeleton={createSectionSkeleton({
            title: true,
            height: 240,
            width: 160,
            count: 4,
            horizontal: true,
            style: styles.section,
          })}
        >
          <ProductSections
            title="Tendencias"
            products={data.trendingProducts}
            CardComponent={MinicardLarge}
            onProductPress={handleProductPress}
            onViewMore={handleViewMore}
          />
        </ProgressiveLoadingSection>

        {/* Featured Product with Progressive Loading */}
        <ProgressiveLoadingSection
          isLoading={sectionLoadingState.featured}
          skeleton={
            <View style={styles.section}>
              <View style={styles.launchHeader}>
                <View style={styles.sectionTitleSkeleton} />
                <View style={styles.sectionButtonSkeleton} />
              </View>
              <View style={styles.featuredCardContainer}>
                {createSectionSkeleton({
                  title: false,
                  height: 400,
                  borderRadius: 8,
                })}
              </View>
            </View>
          }
        >
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
        </ProgressiveLoadingSection>

        {/* Lanzamientos & Oportunidades Section with Progressive Loading */}
        <ProgressiveLoadingSection
          isLoading={sectionLoadingState.launchOpportunity}
          skeleton={
            <View style={styles.launchSection}>
              <View style={styles.launchHeader}>
                <View style={styles.sectionTitleSkeleton} />
                <View style={styles.sectionButtonSkeleton} />
              </View>
              <View style={styles.launchGridContainer}>
                <View style={styles.gridRow}>
                  {[1, 2].map((key) => (
                    <View key={key} style={styles.gridItem}>
                      {createSectionSkeleton({
                        title: false,
                        height: 240,
                        borderRadius: 8,
                      })}
                    </View>
                  ))}
                </View>
                <View style={styles.gridRow}>
                  {[3, 4].map((key) => (
                    <View key={key} style={styles.gridItem}>
                      {createSectionSkeleton({
                        title: false,
                        height: 240,
                        borderRadius: 8,
                      })}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          }
        >
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
        </ProgressiveLoadingSection>

        {/* CTA Button - Static, always shown */}
        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            text="Ver Todo"
            onPress={() => router.push('/catalog?title=Todos los Productos')}
          />
        </View>

        {/* Locations - Static, always shown */}
        <StoreLocations />

        {/* Footer - Static, always shown */}
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
    paddingHorizontal: 0,
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
  // Skeleton styles
  highlightedSection: {
    marginBottom: spacing.xl,
  },
  highlightedCardSkeleton: {
    width: 280,
    height: 180,
    marginHorizontal: spacing.sm,
  },
  sectionTitleSkeleton: {
    width: 120,
    height: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  sectionButtonSkeleton: {
    width: 80,
    height: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
});

// Ensure this component is not treated as a route
export default HomeScreen;

// Add metadata to help router identification
// eslint-disable-next-line unused-imports/no-unused-vars
const metadata = {
  isRoute: false,
  componentType: 'Component',
};
