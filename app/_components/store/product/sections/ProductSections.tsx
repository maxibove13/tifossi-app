import React from 'react';
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

export default function ProductSections({
  title,
  products,
  CardComponent,
  onProductPress,
  onViewMore,
  invertTextColors = false,
  invertTitleColor = false,
  useSwipeableStyle = false,
}: ProductSectionsProps) {
  // Select the appropriate header component based on context
  const HeaderComponent = useSwipeableStyle ? SectionHeader : Subheader;

  // Use different styles for swipeable edge context
  const sectionStyle = useSwipeableStyle ? styles.swipeableSection : styles.section;

  // Adjust scroll content padding based on context
  const scrollContentStyle = useSwipeableStyle
    ? styles.swipeableHorizontalScrollContent
    : styles.horizontalScrollContent;

  // Define action text (could also be a prop if needed)
  const actionText = 'Ver Todo';

  // Check if products is undefined or empty before accessing length
  if (!products || products.length === 0) {
    return null;
  }

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
        {products.map((product) => (
          <CardComponent
            key={product.id}
            product={product}
            invertTextColor={invertTextColors}
            onPress={() => onProductPress(product.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

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
