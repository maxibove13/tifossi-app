import { StyleSheet, View, ScrollView, Text, Image } from 'react-native';
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

interface HomeScreenData {
  highlightedProducts: Product[];
  featuredProduct: Product | null;
  recommendedProducts: Product[];
  relatedProducts: Product[];
  trendingProducts: Product[];
  newReleases: Product[];
}

export default function HomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<HomeScreenData>({
    highlightedProducts: [],
    featuredProduct: null,
    recommendedProducts: [],
    relatedProducts: [],
    trendingProducts: [],
    newReleases: [],
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
        await new Promise(resolve => setTimeout(resolve, 2500))

        const highlightedProducts = ProductData.getHighlightedProducts();
        const featuredProduct = ProductData.getFeaturedProduct();
        const recommendedProducts = productUtils.getRecommendedProducts();
        const relatedProducts = productUtils.getRelatedProducts();
        const trendingProducts = productUtils.getTrendingProducts();
        const newReleases = ProductData.getNewReleases();

        setData({
          highlightedProducts,
          featuredProduct,
          recommendedProducts,
          relatedProducts,
          trendingProducts,
          newReleases,
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

        {/* Product Sections */}
        <ProductSections
          relatedProducts={data.relatedProducts}
          recommendedProducts={data.recommendedProducts}
          trendingProducts={data.trendingProducts}
          onProductPress={handleProductPress}
          onViewMore={handleViewMore}
        />

        {/* Triple Vertical Layout */}
        <View style={[styles.section, styles.showcaseSection]}>
          <CategoryShowcase title="medias" onPress={() => {}} />
          <CategoryShowcase title="mochilas" onPress={() => {}} />
          <CategoryShowcase title="ver todo" onPress={() => {}} />
        </View>

        {/* Featured Product */}
        {data.featuredProduct && (
          <View style={styles.section}>
            <View style={styles.featuredCardContainer}>
              <FeaturedCard 
                product={data.featuredProduct}
                onBuyPress={() => handleProductPress(data.featuredProduct!.id)}
                onPress={() => handleProductPress(data.featuredProduct!.id)}
              />
            </View>
          </View>
        )}

        {/* CTA Button */}
        <View style={styles.buttonContainer}>
          <Button 
            variant="primary"
            text="Ver Todos los Productos" 
            onPress={() => {}}
          />
        </View>

        {/* Locations */}
        <StoreLocations />

        {/* Sos parte section */}
        <View style={styles.sosParteSection}>
          <Text style={styles.sosParteText}>Sos parte.</Text>
          <View style={styles.sosParteLogoContainer}>
            <Image 
              source={require('../../assets/images/logo/tiffosi.png')}
              style={styles.sosParteLogo}
              resizeMode="contain"
            />
          </View>
        </View>

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
    paddingVertical: 48,
  },
  horizontalScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  featuredCardContainer: {
    height: 400,
    paddingHorizontal: spacing.lg,
  },
  showcaseSection: {
    gap: spacing.md,
  },
  sosParteSection: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  sosParteText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  sosParteLogoContainer: {
    width: 100,
    height: 100,
  },
  sosParteLogo: {
    width: '100%',
    height: '100%',
  },
});
