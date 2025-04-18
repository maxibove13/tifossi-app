import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Product } from '../../../../_types/product';
import { spacing } from '../swipeable/styles';
import HorizontalProductList from './HorizontalProductList';
import HighlightedCard from '../../product/horizontal/HighlightedCard';
import PromotionCard from '../../product/promotion/PromotionCard';
import MinicardLarge from '../../product/minicard/large';

interface ProductListsContainerProps {
  relatedProducts?: Product[];
  recommendedProducts?: Product[];
  trendingProducts?: Product[];
  onProductPress?: (productId: string) => void;
}

/**
 * ProductListsContainer component
 * Container for all product list sections in the product detail screen
 */
export default function ProductListsContainer({
  relatedProducts = [],
  recommendedProducts = [],
  trendingProducts = [],
  onProductPress
}: ProductListsContainerProps) {
  // Skip rendering if no products
  if (relatedProducts.length === 0 && 
      recommendedProducts.length === 0 && 
      trendingProducts.length === 0) {
    return null;
  }
  
  // Handler for product press
  const handleProductPress = (productId: string) => {
    onProductPress?.(productId);
  };
  
  return (
    <View style={styles.container}>
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <HorizontalProductList
          title="Productos relacionados"
          products={relatedProducts}
          showViewAll={relatedProducts.length > 5}
          onViewAllPress={() => console.log('View all related products')}
          renderItem={(product) => (
            <HighlightedCard
              product={product}
              onPress={() => handleProductPress(product.id)}
            />
          )}
        />
      )}
      
      {/* Recommended Products */}
      {recommendedProducts.length > 0 && (
        <HorizontalProductList
          title="Recomendados para ti"
          products={recommendedProducts}
          showViewAll={recommendedProducts.length > 5}
          onViewAllPress={() => console.log('View all recommended products')}
          renderItem={(product) => (
            <PromotionCard
              product={product}
              size="s"
              onPress={() => handleProductPress(product.id)}
            />
          )}
        />
      )}
      
      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <HorizontalProductList
          title="Tendencias"
          products={trendingProducts}
          showViewAll={trendingProducts.length > 5}
          onViewAllPress={() => console.log('View all trending products')}
          renderItem={(product) => (
            <MinicardLarge
              product={product}
              onPress={() => handleProductPress(product.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
  }
}); 