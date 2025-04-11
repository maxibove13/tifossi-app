import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { spacing } from '../styles/spacing';
import { colors } from '../styles/colors';
import { fonts } from '../styles/typography';
import { router } from 'expo-router';
import EmptyCart from '../components/store/cart/EmptyCart';
import { Product } from '../types/product';
import { ProductLabel } from '../types/product-status';
import Subheader from '../components/common/Subheader';
import PromotionCard from '../components/store/product/promotion/PromotionCard';

// Dummy data for recently viewed products
const recentlyViewedProducts: Product[] = [
  {
    id: '1',
    title: 'Neceser Ball',
    price: 590.0,
    discountedPrice: 390.0,
    image: require('../../assets/images/products/neceser9-1.png'),
    label: ProductLabel.SALE,
  },
  {
    id: '2',
    title: 'Mochila Classic',
    price: 590.0,
    image: require('../../assets/images/products/product_bag_0.png'),
  },
  {
    id: '3',
    title: 'Neceser WX',
    price: 590.0,
    image: require('../../assets/images/products/product_bag_1.png'),
  },
  {
    id: '4',
    title: 'Neceser F2',
    price: 590.0,
    image: require('../../assets/images/products/product_bag_2.png'),
    label: ProductLabel.NEW,
  },
  {
    id: '5',
    title: 'Black Neceser',
    price: 590.0,
    image: require('../../assets/images/products/product_bag_3.png'),
  },
];

export default function CartScreen() {
  // In a real implementation, this would come from a cart context or store
  const [cartItems, setCartItems] = useState<any[]>([]);
  const isEmpty = cartItems.length === 0;

  const handleGoToStore = () => {
    router.replace('/');
  };

  const handleProductPress = (productId: string) => {
    router.push(`/products/product?id=${productId}`);
  };

  const handleViewMoreRecentlyViewed = () => {
    console.log('View all recently viewed products');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Carrito</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isEmpty ? (
          <EmptyCart onGoToStore={handleGoToStore} />
        ) : (
          // Cart items would go here
          <View />
        )}

        {/* Recently viewed products section */}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    backgroundColor: colors.background.light,
    paddingTop: 44,
    paddingBottom: 8,
    paddingHorizontal: spacing.lg,
    gap: 24,
  },
  title: {
    fontSize: 32,
    lineHeight: 44,
    color: colors.primary,
    fontFamily: fonts.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    paddingVertical: spacing.xl,
  },
  horizontalScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
