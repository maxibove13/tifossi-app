import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ProductHeader from '../components/store/layout/ProductHeader';
import EnhancedProductGallery from '../components/store/product/gallery/EnhancedProductGallery';
import SwipeableEdge from '../components/store/product/swipeable/SwipeableEdge';
import ProductData from '../data/products';
import { colors } from '../styles/colors';
import { isProduct, Product } from '../types/product';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const product = ProductData.getProductById(id as string);

  // State for selected color and quantity
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product?.colors && product.colors.length > 0 ? product.colors[0].colorName : undefined
  );
  const [selectedQuantity, _setSelectedQuantity] = useState(1);

  // Get recommended products data (will be used for both related and recommended sections)
  const recommendedProducts = ProductData.getRecommendedProducts().filter((p) => p.id !== id);

  // Get trending products data
  const trendingProducts = ProductData.getTrendingProducts().filter((p) => p.id !== id);

  const handleAddToCart = async (product: Product, quantity: number = selectedQuantity) => {
    // Add to cart logic with quantity
    console.log('Added to cart', {
      product: product.id,
      quantity,
    });

    return Promise.resolve(); // Return a resolved promise for the async function
  };

  const handleProductPress = (productId: string) => {
    router.push(`/products/product?id=${productId}`);
  };

  const handleSupportAction = (action: 'chat' | 'faq' | 'call') => {
    console.log('Support action:', action);
    // Handle support actions
  };

  const handleViewMore = (section: string) => {
    console.log('View more:', section);
    // Navigate to section view
  };

  if (!product || !isProduct(product)) {
    return (
      <View style={styles.container}>
        <ProductHeader title="Product not found" />
      </View>
    );
  }

  // Use shortDescription directly, no fallback to description
  const shortDescription = product.shortDescription;

  // Use longDescription directly, no fallback to description
  const longDescription = product.longDescription;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ProductHeader title={product.title} />

      <View style={styles.mainContent}>
        <EnhancedProductGallery
          product={product}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
        />

        <SwipeableEdge
          key={`product-edge-${product.id}`}
          product={{
            id: product.id,
            name: product.title,
            isCustomizable: product.isCustomizable,
            isDiscounted: !!product.discountedPrice,
            currentPrice: `$${product.discountedPrice || product.price}`,
            originalPrice: product.discountedPrice ? `$${product.price}` : undefined,
            shortDescription: shortDescription,
            longDescription: longDescription,
            sku: product.id,
            warranty: product.warranty,
            returnPolicy: product.returnPolicy,
            dimensions: product.dimensions,
          }}
          relatedProducts={recommendedProducts}
          recommendedProducts={recommendedProducts}
          trendingProducts={trendingProducts}
          onAddToCart={() => handleAddToCart(product, selectedQuantity)}
          onViewMore={handleViewMore}
          onSupportAction={handleSupportAction}
          onProductPress={handleProductPress}
          onExpandedChange={(expanded) => console.log('Panel expanded:', expanded)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  mainContent: {
    flex: 1,
    backgroundColor: colors.background.light,
    position: 'relative', // For positioning SwipeableEdge
  },
});

// Metadata for the router (export to satisfy the linter)
export const screenExport = {
  name: 'ProductScreen',
  version: '1.0.0',
};
