import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
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

// Get explore products from our dedicated function in products.ts
// This function returns products in specific order with mochila-gold first (has video)
const exploreProducts: Product[] = getTiffosiExploreProducts();

// Placeholder Icon - Replace with actual SVG Icon component if available
const ArrowUpRightIcon = () => <Text style={styles.iconText}>↗</Text>;

// Component for a single Explore Product Card
const ExploreProductCard = ({ product }: { product: Product }) => {
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();

  const handleViewProduct = () => {
    router.push(`/products/product?id=${product.id}`);
  };

  return (
    <View style={[styles.cardContainer, { height: screenHeight }]}>
      <VideoBackground
        source={product.videoSource || ''}
        fallbackImage={product.frontImage}
        style={styles.videoBackground}
        overlayOpacity={0.3}
      >
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
            {product.label && (
              <View style={styles.labelBadge}>
                <Text style={styles.labelText}>{product.label}</Text>
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
      </VideoBackground>
    </View>
  );
};

export default function TiffosiExploreScreen() {
  const tabBarHeight = useBottomTabBarHeight(); // Get height for ScrollView padding

  return (
    <View style={styles.container}>
      {/* Header can remain outside ScrollView if needed */}
      {/* <View style={styles.header}> ... </View> */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: tabBarHeight }} // Add padding to avoid overlap
        showsVerticalScrollIndicator={false}
      >
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
  },
  contentContainer: {
    position: 'absolute',
    // bottom is now set dynamically using tabBarHeight in the component
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl, // Keep the original padding from Figma spec
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
});
