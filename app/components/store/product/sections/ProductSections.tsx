import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Product } from '../../../../types/product';
import Subheader from '../../../common/Subheader';
import PromotionCard from '../promotion/PromotionCard';
import MinicardLarge from '../minicard/large';
import { spacing } from '../../../../styles/spacing';
import SectionHeader from '../swipeable/SectionHeader';

interface ProductSectionsProps {
  relatedProducts: Product[];
  recommendedProducts: Product[];
  trendingProducts: Product[];
  onProductPress: (productId: string) => void;
  onViewMore: (section: string) => void;
  invertTextColors?: boolean;
  useSwipeableStyle?: boolean;
}

export default function ProductSections({
  relatedProducts,
  recommendedProducts,
  trendingProducts,
  onProductPress,
  onViewMore,
  invertTextColors = false,
  useSwipeableStyle = false
}: ProductSectionsProps) {
  // Select the appropriate header component based on context
  const HeaderComponent = useSwipeableStyle ? SectionHeader : Subheader;

  // Use different styles for swipeable edge context
  const sectionStyle = useSwipeableStyle ? styles.swipeableSection : styles.section;
  
  return (
    <>
      {relatedProducts.length > 0 && (
        <View style={sectionStyle}>
          {useSwipeableStyle ? (
            <HeaderComponent 
              title="Productos Relacionados" 
              actionText="Ver Más"
              onActionPress={() => onViewMore('related')}
            />
          ) : (
            <HeaderComponent 
              title="Productos Relacionados"
              buttonText="Ver Todo"
              onButtonPress={() => onViewMore('related')}
            />
          )}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {relatedProducts.map((product) => (
              <PromotionCard 
                key={product.id}
                product={product}
                size="s"
                invertTextColor={invertTextColors}
                onPress={() => onProductPress(product.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {recommendedProducts.length > 0 && (
        <View style={sectionStyle}>
          {useSwipeableStyle ? (
            <HeaderComponent 
              title="Recomendados para ti" 
              actionText="Ver Más"
              onActionPress={() => onViewMore('recommended')}
            />
          ) : (
            <HeaderComponent 
              title="Recomendados para ti"
              buttonText="Ver Todo"
              onButtonPress={() => onViewMore('recommended')}
            />
          )}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {recommendedProducts.map((product) => (
              <PromotionCard 
                key={product.id}
                product={product}
                size="s"
                invertTextColor={invertTextColors}
                onPress={() => onProductPress(product.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {trendingProducts.length > 0 && (
        <View style={sectionStyle}>
          {useSwipeableStyle ? (
            <HeaderComponent 
              title="Tendencias" 
              actionText="Ver Todo"
              onActionPress={() => onViewMore('trends')}
            />
          ) : (
            <HeaderComponent 
              title="Tendencias"
              buttonText="Ver Todo"
              onButtonPress={() => onViewMore('trending')}
            />
          )}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {trendingProducts.map((product) => (
              <MinicardLarge
                key={product.id}
                product={product}
                invertTextColor={invertTextColors}
                onPress={() => onProductPress(product.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </>
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