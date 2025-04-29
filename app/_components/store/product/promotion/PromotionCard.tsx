import React from 'react';
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

const PromotionCard = ({
  product,
  size = 's',
  onPress,
  darkMode = false,
  invertTextColor = false,
}: PromotionCardProps) => {
  const { isFavorite, toggle: toggleFavorite } = useFavoriteStatus(product.id);
  const _isSmall = size === 's';
  const { title, price, discountedPrice, frontImage, statuses } = product;

  const hasDiscount = discountedPrice !== undefined && discountedPrice < price;
  const labelColor = hasDiscount ? colors.error : colors.tag.new;

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
        {hasStatus(statuses, ProductStatus.NEW) && (
          <Text style={[styles.label, { color: labelColor }]}>Nuevo</Text>
        )}
        <Text
          style={[
            styles.title,
            darkMode && styles.titleDark,
            invertTextColor && styles.invertedTitle,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={styles.priceContainer}>
          {discountedPrice ? (
            <>
              <Text style={[styles.originalPrice, darkMode && styles.originalPriceDark]}>
                ${price.toFixed(2)}
              </Text>
              <Text style={styles.salePrice}>${discountedPrice.toFixed(2)}</Text>
            </>
          ) : (
            <Text style={[styles.price, darkMode && styles.priceDark]}>${price.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

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
