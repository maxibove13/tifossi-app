import { memo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import type { BaseProductCardProps } from '../types';
import ProductImage from '../image/ProductImage';
import { mapProductToCardData, Product } from '../../../../_types/product';
import { getCardDimensions } from '../../../../_types/product-card';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../_styles/typography';
import { spacing, radius } from '../../../../_styles/spacing';
import { colors } from '../../../../_styles/colors';
import { useFavoriteStatus } from '../../../../../hooks/useFavoriteStatus';
import HeartActive from '../../../../../assets/icons/heart_active.svg';
import HeartInactive from '../../../../../assets/icons/heart_inactive.svg';

interface DefaultSmallCardProps
  extends Omit<BaseProductCardProps, 'isFavorite' | 'onToggleFavorite'> {
  product: Product;
}

function DefaultSmallCard({ product, onPress }: DefaultSmallCardProps) {
  const { isFavorite, toggle: toggleFavorite } = useFavoriteStatus(product.id);
  const cardData = mapProductToCardData(product);
  const dimensions = getCardDimensions('default', 'small');

  return (
    <Pressable
      style={[
        styles.container,
        { width: typeof dimensions.width === 'number' ? dimensions.width : '100%' },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.imageContainer,
          { width: dimensions.imageSize, height: dimensions.imageSize },
        ]}
      >
        <ProductImage source={cardData.image} size={dimensions.imageSize} />
        <Pressable
          style={styles.wishlistButton}
          onPress={toggleFavorite}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <HeartActive width={14} height={14} />
          ) : (
            <HeartInactive width={14} height={14} />
          )}
        </Pressable>
      </View>

      <View style={styles.content}>
        {cardData.isNew && <Text style={styles.tag}>Nuevo</Text>}
        <Text style={styles.name} numberOfLines={1}>
          {cardData.name}
        </Text>
        <Text style={styles.price}>${cardData.price.toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  imageContainer: {
    borderRadius: radius.xs,
    overflow: 'hidden',
  },
  wishlistButton: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    backgroundColor: colors.background.light,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  content: {
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  tag: {
    color: colors.success,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    lineHeight: lineHeights.sm,
  },
  name: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
  },
  price: {
    color: colors.secondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    lineHeight: lineHeights.sm,
  },
});

export default memo(DefaultSmallCard);
