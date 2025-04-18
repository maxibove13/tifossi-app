import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Product } from '../../../../_types/product';
import { spacing } from '../swipeable/styles';
import SectionHeader from './SectionHeader';

interface HorizontalProductListProps<T extends Product> {
  /**
   * Title for the section
   */
  title: string;
  /**
   * Products to display
   */
  products: T[];
  /**
   * Function to render each product
   */
  renderItem: (product: T, index: number) => React.ReactNode;
  /**
   * Show view all button
   */
  showViewAll?: boolean;
  /**
   * View all button press handler
   */
  onViewAllPress?: () => void;
  /**
   * Custom styles for the container
   */
  containerStyle?: object;
}

/**
 * HorizontalProductList component
 * Displays a horizontal scrollable list of products with a section header
 */
export default function HorizontalProductList<T extends Product>({
  title,
  products,
  renderItem,
  showViewAll = false,
  onViewAllPress,
  containerStyle,
}: HorizontalProductListProps<T>) {
  if (products.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <SectionHeader
        title={title}
        actionText={showViewAll ? 'Ver Más' : undefined}
        onActionPress={showViewAll ? onViewAllPress : undefined}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map((product, index) => (
          <View key={product.id} style={styles.productContainer}>
            {renderItem(product, index)}
          </View>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  productContainer: {
    // Individual product container styles can be applied here if needed
  },
});
