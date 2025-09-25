import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { colors } from '../../../../_styles/colors';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../_styles/typography';
import { Product } from '../../../../_types/product';
import ProductImage from '../image/ProductImage';
import { ProductStatus, hasStatus } from '../../../../_types/product-status';
import { useFavoriteStatus } from '../../../../../hooks/useFavoriteStatus';

// Import SVG icons
import HeartActive from '../../../../../assets/icons/heart_active.svg';
import HeartInactive from '../../../../../assets/icons/heart_inactive.svg';

type ProductCardSize = 's' | 'm' | 'l';

type PromotionCardProps = {
  product: Product;
  size?: ProductCardSize;
  onPress?: () => void;
  darkMode?: boolean;
  invertTextColor?: boolean;
};

const PromotionCard = memo(function PromotionCard({
  product,
  size: _size = 's',
  onPress,
  darkMode = false,
  invertTextColor = false,
}: PromotionCardProps) {
  const { isFavorite, toggle: toggleFavorite } = useFavoriteStatus(product.id);
  const { title, price, discountedPrice, frontImage, statuses } = product;

  // Memoize expensive computations
  const computedValues = useMemo(() => {
    const hasDiscount = discountedPrice !== undefined && discountedPrice < price;
    const labelColor = hasDiscount ? colors.error : colors.tag.new;
    const hasNewStatus = hasStatus(statuses, ProductStatus.NEW);

    return {
      hasDiscount,
      labelColor,
      hasNewStatus,
    };
  }, [discountedPrice, price, statuses]);

  // Memoize style computations
  const titleStyles = useMemo(
    () => [styles.title, darkMode && styles.titleDark, invertTextColor && styles.invertedTitle],
    [darkMode, invertTextColor]
  );

  const originalPriceStyles = useMemo(
    () => [styles.originalPrice, darkMode && styles.originalPriceDark],
    [darkMode]
  );

  const regularPriceStyles = useMemo(
    () => [styles.price, darkMode && styles.priceDark],
    [darkMode]
  );

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.imageContainer}>
        <ProductImage source={frontImage} size={132} />
        <Pressable
          style={styles.wishlistButton}
          onPress={toggleFavorite}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <HeartActive width={24} height={24} />
          ) : (
            <HeartInactive width={24} height={24} />
          )}
        </Pressable>
      </View>
      <View style={styles.content}>
        {computedValues.hasNewStatus && (
          <Text style={[styles.label, { color: computedValues.labelColor }]}>Nuevo</Text>
        )}
        <Text style={titleStyles} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.priceContainer}>
          {computedValues.hasDiscount ? (
            <>
              <Text style={originalPriceStyles}>${price.toFixed(2)}</Text>
              <Text style={styles.salePrice}>${discountedPrice!.toFixed(2)}</Text>
            </>
          ) : (
            <Text style={regularPriceStyles}>${price.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 132,
    gap: 12,
  },
  imageContainer: {
    width: 132,
    height: 132,
  },
  wishlistButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(220, 220, 220, 0.1)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 4,
  },
  label: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.regular,
  },
  title: {
    color: '#0C0C0C',
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
  },
  invertedTitle: {
    color: colors.background.light,
  },
  titleDark: {
    color: colors.background.light,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  originalPrice: {
    color: '#707070',
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm,
    textDecorationLine: 'line-through',
  },
  originalPriceDark: {
    color: 'rgba(220, 220, 220, 0.7)',
  },
  salePrice: {
    color: '#AD3026',
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm,
  },
  price: {
    color: '#707070',
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm,
  },
  priceDark: {
    color: 'rgba(220, 220, 220, 0.7)',
  },
});

export default PromotionCard;
