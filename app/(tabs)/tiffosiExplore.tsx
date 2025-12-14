import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../_styles/spacing';
import { colors } from '../_styles/colors';
import { fonts, fontSizes, lineHeights } from '../_styles/typography';
import VideoBackground from '../_components/common/VideoBackground';
import { Product } from '../_types/product';
import { getTiffosiExploreProducts } from '../_data/products';
import preloadService from '../_services/preload/service';
import { getPrimaryLabelFromStatuses, hasStatus, ProductStatus } from '../_types/product-status';
import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useProducts } from '../_services/api/queryHooks';

// Function to get app-exclusive products from API data
const getAppExclusiveProducts = (allProducts: Product[]): Product[] => {
  return allProducts.filter((product) => hasStatus(product.statuses, ProductStatus.APP_EXCLUSIVE));
};

// Fallback products from static data
const fallbackExploreProducts: Product[] = getTiffosiExploreProducts();

// Placeholder Icon - Replace with actual SVG Icon component if available
const ArrowUpRightIcon = () => <Text style={styles.iconText}>↗</Text>;

// Component for a single Explore Product Card
const ExploreProductCard = memo(({ product }: { product: Product }) => {
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();

  const handleViewProduct = useCallback(() => {
    router.push(`/products/product?id=${product.id}`);
  }, [product.id, router]);

  // Memoize the primary label to avoid recalculation
  const primaryLabel = useMemo(() => {
    return product.statuses.length > 0 ? getPrimaryLabelFromStatuses(product.statuses) : null;
  }, [product.statuses]);

  // Common content layout to avoid repetition
  const cardContent = useMemo(
    () => (
      <>
        {/* Added Gradient for bottom fade-to-black effect */}
        <LinearGradient
          colors={['rgba(12, 12, 12, 0)', colors.background.dark]}
          style={styles.bottomGradient}
        />

        {/* Content Section - Renders on top of the new gradient */}
        <View style={[styles.contentContainer, { bottom: tabBarHeight }]}>
          {/* Button aligned to the right */}
          <TouchableOpacity style={styles.viewProductButton} onPress={handleViewProduct}>
            <ArrowUpRightIcon />
            <Text style={styles.viewProductButtonText}>Ver Producto</Text>
          </TouchableOpacity>

          {/* Product Details aligned to the left */}
          <View style={styles.detailsContainer}>
            {primaryLabel && (
              <View style={styles.labelBadge}>
                <Text style={styles.labelText}>{primaryLabel}</Text>
              </View>
            )}
            <View style={styles.titleContainer}>
              <Text style={styles.productTitle}>{product.title}</Text>
            </View>
            <View style={styles.tagsContainer}>
              {product.isCustomizable && (
                <View style={styles.tagPersonalizable}>
                  <Text style={styles.tagTextPersonalizable}>Personalizable</Text>
                </View>
              )}
              <View style={styles.tagPrice}>
                <Text style={styles.tagTextPrice}>${product.price.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>
      </>
    ),
    [
      tabBarHeight,
      handleViewProduct,
      primaryLabel,
      product.title,
      product.isCustomizable,
      product.price,
    ]
  );

  // Memoize the image source to prevent unnecessary recreations
  const imageSource = useMemo(() => {
    return typeof product.frontImage === 'string'
      ? { uri: product.frontImage }
      : product.frontImage;
  }, [product.frontImage]);

  return (
    <View style={[styles.cardContainer, { height: screenHeight }]}>
      {product.videoSource ? (
        <VideoBackground
          source={product.videoSource}
          fallbackImage={product.frontImage}
          style={styles.videoBackground}
          overlayOpacity={0.3}
          preloadPriority="high"
        >
          {cardContent}
        </VideoBackground>
      ) : (
        <ImageBackground source={imageSource} style={styles.videoBackground} resizeMode="cover">
          {cardContent}
        </ImageBackground>
      )}
    </View>
  );
});

ExploreProductCard.displayName = 'ExploreProductCard';

// Enhanced TiffosiExploreScreen with strategic preloading
export default function TiffosiExploreScreen() {
  const [preloaded, setPreloaded] = useState(false);

  // Fetch products using TanStack Query
  const { data: allProducts, isLoading: productsLoading, error: productsError } = useProducts();

  // Get explore products from API data or use fallback
  const exploreProducts = useMemo(() => {
    if (allProducts && allProducts.length > 0) {
      return getAppExclusiveProducts(allProducts);
    }
    return fallbackExploreProducts;
  }, [allProducts]);

  // Preload all explore products when the screen is accessed (but only once)
  useEffect(() => {
    if (preloaded) return;

    // This function preloads all assets for products in TiffosiExplore
    async function preloadExploreProducts() {
      try {
        // First, preload all video sources with high priority
        const videoProducts = exploreProducts.filter((p) => p.videoSource);

        if (videoProducts.length > 0) {
          // Create preload assets array for videos with high priority
          const videoAssets = videoProducts.map((product) => ({
            key: `video_${product.id}`,
            asset: product.videoSource,
            type: 'video' as const,
            priority: 'high' as const,
          }));

          // Update preload service with these assets
          preloadService.updateAssetList(videoAssets);
        }

        // Then, preload all product images (medium priority)
        const imageAssets = exploreProducts.map((product) => ({
          key: `image_${product.id}`,
          asset: product.frontImage,
          type: 'image' as const,
          priority: 'medium' as const,
        }));

        // Update preload service with image assets
        preloadService.updateAssetList(imageAssets);

        // Trigger preload in background - don't await, let it happen in bg
        preloadService.preloadSecondary();

        // Mark as preloaded so we don't try to preload again
        setPreloaded(true);
      } catch {
        // Failed to preload explore assets
      }
    }

    // Execute the preload function
    preloadExploreProducts();
  }, [preloaded, exploreProducts]);

  // Show loading state while fetching products
  if (productsLoading && exploreProducts.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Cargando productos exclusivos...</Text>
      </View>
    );
  }

  // Show error state if products failed to load and no fallback
  if (productsError && exploreProducts.length === 0) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Error al cargar productos</Text>
        <Text style={styles.errorDetailText}>{productsError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* We don't block rendering with a loading indicator, 
          instead we let the VideoBackground components handle their fallbacks */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {exploreProducts.map((product) => (
          <ExploreProductCard key={product.id} product={product} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  scrollView: {
    flex: 1,
  },
  cardContainer: {
    width: '100%',
    // Height is set dynamically using useWindowDimensions
    overflow: 'hidden', // Clip video/content within the card bounds
  },
  videoBackground: {
    flex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '35%',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  contentContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  viewProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  iconText: {
    color: colors.background.light,
    fontSize: fontSizes.md,
    marginRight: spacing.xs,
  },
  viewProductButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.background.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.light,
    paddingBottom: 0.5,
  },
  detailsContainer: {
    alignSelf: 'stretch',
    gap: 2,
  },
  labelBadge: {
    backgroundColor: colors.error,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  labelText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.background.light,
    textAlign: 'center',
  },
  titleContainer: {
    backgroundColor: colors.background.light,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    alignSelf: 'stretch',
  },
  productTitle: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 2,
    alignSelf: 'flex-start',
  },
  tagPersonalizable: {
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  tagTextPersonalizable: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.background.light,
    textAlign: 'center',
  },
  tagPrice: {
    backgroundColor: colors.background.light,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  tagTextPrice: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.primary,
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    color: colors.background.light,
    textAlign: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    color: colors.error || colors.background.light,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorDetailText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    color: colors.background.light,
    textAlign: 'center',
  },
});
