import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '../_components/store/layout/Header';
import EnhancedProductGallery from '../_components/store/product/gallery/EnhancedProductGallery';
import SwipeableEdge from '../_components/store/product/swipeable/SwipeableEdge';
import ProductData from '../_data/products';
import { colors } from '../_styles/colors';
import { isProduct, Product } from '../_types/product';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useCartStore } from '../_stores/cartStore';
import { useFavoritesStore } from '../_stores/favoritesStore';

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // We keep the direct data fetch for now, but in the future we could replace with TanStack Query
  const product = ProductData.getProductById(id as string);
  // const { data: product, isLoading } = useProduct(id as string);

  // State for selected color and quantity
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product?.colors && product.colors.length > 0 ? product.colors[0].colorName : undefined
  );
  const [selectedSize, _setSelectedSize] = useState<string | undefined>(
    product?.sizes && product.sizes.length > 0 ? product.sizes[0].value : undefined
  );
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Cart and favorites global state
  const addItemToCart = useCartStore((state) => state.addItem);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavorite = useFavoritesStore((state) => (product ? state.isFavorite(product.id) : false));

  // Get recommended products data
  const recommendedProducts = ProductData.getRecommendedProducts().filter((p) => p.id !== id);

  // Get related products data using the new function
  const relatedProducts = ProductData.getRelatedProducts().filter((p) => p.id !== id);

  // Get trending products data
  const trendingProducts = ProductData.getTrendingProducts().filter((p) => p.id !== id);

  const handleAddToCart = async (product: Product, quantity: number = selectedQuantity) => {
    if (!product) return Promise.resolve();

    try {
      await addItemToCart({
        productId: product.id,
        quantity,
        color: selectedColor,
        size: selectedSize,
      });

      console.log('Added to cart', {
        product: product.id,
        quantity,
        color: selectedColor,
        size: selectedSize,
      });

      return Promise.resolve();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      return Promise.reject(error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!product) return;

    try {
      await toggleFavorite(product.id);
      console.log(isFavorite ? 'Removed from favorites' : 'Added to favorites', product.id);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
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
        <Header title="Product not found" variant="product" />
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
      <Header title={product.title} variant="product" productId={product.id} />

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
            isFavorite: isFavorite,
          }}
          relatedProducts={relatedProducts}
          recommendedProducts={recommendedProducts}
          trendingProducts={trendingProducts}
          onAddToCart={() => handleAddToCart(product, selectedQuantity)}
          onViewMore={handleViewMore}
          onSupportAction={handleSupportAction}
          onProductPress={handleProductPress}
          onToggleFavorite={handleToggleFavorite} // Pass favorite toggle handler
          onExpandedChange={(expanded) => console.log('Panel expanded:', expanded)}
          quantity={selectedQuantity}
          onQuantityChange={setSelectedQuantity}
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

// Add metadata to help router identification
// eslint-disable-next-line unused-imports/no-unused-vars
const metadata = {
  isRoute: false,
  componentType: 'Component',
};
