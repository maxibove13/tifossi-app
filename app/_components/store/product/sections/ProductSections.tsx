import React, { memo, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Product } from '../../../../_types/product';
import Subheader from '../../../common/Subheader';
import { spacing } from '../../../../_styles/spacing';
import SectionHeader from '../swipeable/SectionHeader';

interface ProductSectionsProps {
  title: string;
  products: Product[];
  CardComponent: React.ComponentType<any>;
  onProductPress: (productId: string) => void;
  onViewMore: (title: string) => void;
  invertTextColors?: boolean;
  invertTitleColor?: boolean;
  useSwipeableStyle?: boolean;
}

const ProductSections = memo(function ProductSections({
  title,
  products,
  CardComponent,
  onProductPress,
  onViewMore,
  invertTextColors = false,
  invertTitleColor = false,
  useSwipeableStyle = false,
}: ProductSectionsProps) {
  // Memoize style computations to avoid recalculating on every render
  const styleComputations = useMemo(() => {
    const HeaderComponent = useSwipeableStyle ? SectionHeader : Subheader;
    const sectionStyle = useSwipeableStyle ? styles.swipeableSection : styles.section;
    const scrollContentStyle = useSwipeableStyle
      ? styles.swipeableHorizontalScrollContent
      : styles.horizontalScrollContent;

    return {
      HeaderComponent,
      sectionStyle,
      scrollContentStyle,
    };
  }, [useSwipeableStyle]);

  // Define action text (could also be a prop if needed)
  const actionText = 'Ver Todo';

  // Check if we have products to render
  const hasProducts = useMemo(() => {
    return products && products.length > 0;
  }, [products]);

  // Memoize the product cards to avoid recreating them on unrelated re-renders
  const productCards = useMemo(() => {
    if (!products || products.length === 0) {
      return [];
    }
    return products.map((product) => (
      <CardComponent
        key={product.id}
        product={product}
        invertTextColor={invertTextColors}
        onPress={() => onProductPress(product.id)}
      />
    ));
  }, [products, CardComponent, invertTextColors, onProductPress]);

  // Early return after all hooks have been called
  if (!hasProducts) {
    return null;
  }

  const { HeaderComponent, sectionStyle, scrollContentStyle } = styleComputations;

  return (
    <View style={sectionStyle}>
      {/* Add a wrapper View for consistent header padding */}
      <View style={styles.headerContainer}>
        {useSwipeableStyle ? (
          <HeaderComponent
            title={title}
            actionText={actionText}
            onActionPress={() => onViewMore(title)}
            invertTitleColor={invertTitleColor}
          />
        ) : (
          <Subheader
            title={title}
            buttonText={actionText}
            onButtonPress={() => onViewMore(title)}
          />
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={scrollContentStyle}
      >
        {productCards}
      </ScrollView>
    </View>
  );
});

export default ProductSections;

const styles = StyleSheet.create({
  section: {
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  swipeableSection: {
    paddingVertical: spacing.xl,
    gap: spacing.md,
    // Horizontal padding is handled by the parent in SwipeableEdge
  },
  headerContainer: {
    paddingVertical: spacing.sm,
    // Horizontal padding is handled by the parent or header component
  },
  horizontalScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  swipeableHorizontalScrollContent: {
    paddingHorizontal: 0, // No horizontal padding needed here
    gap: spacing.md,
  },
});
