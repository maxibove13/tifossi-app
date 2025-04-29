import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import Subheader from '../../../common/Subheader';
import PromotionCard from '../promotion/PromotionCard';
import MinicardLarge from '../minicard/large';
import ProductData from '../../../../_data/products';
import { spacing } from '../../../../_styles/spacing';
import { useRouter } from 'expo-router';

type RelatedProductsProps = {
  productId: string;
  title?: string;
  type?: 'promotion' | 'minicard';
  maxItems?: number;
  darkMode?: boolean;
};

export default function RelatedProducts({
  productId,
  title = 'Productos relacionados',
  type = 'promotion',
  maxItems = 5,
  darkMode = false,
}: RelatedProductsProps) {
  const router = useRouter();

  // Get related products (excluding current product)
  // In a real app, this would be a more sophisticated algorithm
  // or an API call to get products related to the current one
  const relatedProducts = ProductData.getRecommendedProducts()
    .filter((product) => product.id !== productId)
    .slice(0, maxItems);

  // If no related products, don't render anything
  if (relatedProducts.length === 0) {
    return null;
  }

  const handleProductPress = (id: string) => {
    router.push({
      pathname: '/products',
      params: { id },
    });
  };

  const CardComponent = type === 'promotion' ? PromotionCard : MinicardLarge;

  return (
    <View style={styles.container}>
      <Subheader
        title={title}
        buttonText="Ver Más"
        onButtonPress={() => {
          // In a real app, this would navigate to a category or collection page
          // For now, just navigate to the home page
          router.push('/');
        }}
        darkMode={darkMode}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {relatedProducts.map((product) => (
          <CardComponent
            key={product.id}
            product={product}
            onPress={() => handleProductPress(product.id)}
            darkMode={darkMode}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
});
