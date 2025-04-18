import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Product } from '../../../../_types/product';
import Subheader from '../../../common/Subheader';
import PromotionCard from '../promotion/PromotionCard';
import MinicardLarge from '../minicard/large';
import { spacing } from '../../../../_styles/spacing';
import SectionHeader from '../swipeable/SectionHeader';

type SectionType = 'recommended' | 'trending';

interface ProductSectionsProps {
  products: Product[];
  sectionType: SectionType;
  onProductPress: (productId: string) => void;
  onViewMore: (section: string) => void;
  invertTextColors?: boolean;
  useSwipeableStyle?: boolean;
}

export default function ProductSections({
  products,
  sectionType,
  onProductPress,
  onViewMore,
  invertTextColors = false,
  useSwipeableStyle = false,
}: ProductSectionsProps) {
  // Select the appropriate header component based on context
  const HeaderComponent = useSwipeableStyle ? SectionHeader : Subheader;

  // Use different styles for swipeable edge context
  const sectionStyle = useSwipeableStyle ? styles.swipeableSection : styles.section;

  // Set title and section based on sectionType
  const getSectionInfo = () => {
    if (sectionType === 'recommended') {
      return {
        title: 'Recomendados para ti',
        viewMoreSection: 'recommended',
        actionText: 'Ver Todo',
        CardComponent: PromotionCard,
      };
    } else {
      return {
        title: 'Tendencias',
        viewMoreSection: 'trending',
        actionText: 'Ver Todo',
        CardComponent: MinicardLarge,
      };
    }
  };

  const { title, viewMoreSection, actionText } = getSectionInfo();

  // Check if products is undefined or empty before accessing length
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <View style={sectionStyle}>
      {useSwipeableStyle ? (
        <HeaderComponent
          title={title}
          actionText={actionText}
          onActionPress={() => onViewMore(viewMoreSection)}
        />
      ) : (
        <HeaderComponent
          title={title}
          buttonText={actionText}
          onButtonPress={() => onViewMore(viewMoreSection)}
        />
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {products.map((product) => {
          if (sectionType === 'recommended') {
            return (
              <PromotionCard
                key={product.id}
                product={product}
                size="s"
                invertTextColor={invertTextColors}
                onPress={() => onProductPress(product.id)}
              />
            );
          } else {
            return (
              <MinicardLarge
                key={product.id}
                product={product}
                invertTextColor={invertTextColors}
                onPress={() => onProductPress(product.id)}
              />
            );
          }
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: spacing.xl,
  },
  swipeableSection: {
    paddingVertical: spacing.xl,
    paddingHorizontal: 0, // No horizontal padding inside SwipeableEdge
  },
  horizontalScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
