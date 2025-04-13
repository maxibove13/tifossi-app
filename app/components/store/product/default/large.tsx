import React, { memo } from 'react';
import { StyleSheet, View, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BaseProductCardProps } from '../types';
import ProductImage from '../image/ProductImage';
import { mapProductToCardData, Product } from '../../../../types/product';
import { getCardDimensions } from '../../../../types/product-card';
import { fonts, fontSizes, lineHeights } from '../../../../styles/typography';
import { spacing, radius } from '../../../../styles/spacing';
import { colors } from '../../../../styles/colors';
import HeartActiveIcon from '../../../ui/icons/HeartActiveIcon';
import DiscountBadge from '../../../ui/badges/DiscountBadge';

interface DefaultLargeCardProps extends BaseProductCardProps {
  product: Product;
  isFavorite?: boolean;
}

// Define Styles type
type Styles = {
  container: ViewStyle;
  imageContainer: ViewStyle;
  wishlistButton: ViewStyle;
  discountBadge: ViewStyle;
  content: ViewStyle;
  discountTag: TextStyle;
  newTag: TextStyle;
  name: TextStyle;
  description: TextStyle;
  priceRow: ViewStyle;
  originalPrice: TextStyle;
  discountPrice: TextStyle;
  price: TextStyle;
  colorPaletteContainer: ViewStyle;
  colorCircle: ViewStyle;
  colorMoreText: TextStyle;
};

function DefaultLargeCard({ product, onPress, isFavorite = false }: DefaultLargeCardProps) {
  const cardData = mapProductToCardData(product);
  const dimensions = getCardDimensions('default', 'large');

  const discountPercentage = cardData.discountPercentage || 0;
  const hasDiscount = discountPercentage > 0 && cardData.discountedPrice !== undefined;

  const handleWishlistPress = () => {
    console.log('Wishlist button pressed for product:', product.id);
  };

  // Determine how to render the color palette
  const renderColorPalette = () => {
    if (!product.colors || product.colors.length === 0) {
      return null;
    }

    const maxVisibleColors = 4;
    const hasMoreColors = product.colors.length > maxVisibleColors;
    const visibleColors = product.colors.slice(0, maxVisibleColors);
    const extraColorsCount = product.colors.length - maxVisibleColors;

    return (
      <View style={styles.colorPaletteContainer}>
        {visibleColors.map((color, index) => (
          <View
            key={`${color.colorName}-${index}`}
            style={[styles.colorCircle, { backgroundColor: color.hex || '#FAFAFA' }]}
          />
        ))}
        {hasMoreColors && <Text style={styles.colorMoreText}>+{extraColorsCount}</Text>}
      </View>
    );
  };

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
          onPress={handleWishlistPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <HeartActiveIcon size={16} color={colors.primary} />
          ) : (
            <Ionicons name="heart-outline" size={16} color={colors.secondary} />
          )}
        </Pressable>

        {hasDiscount && (
          <DiscountBadge percentage={discountPercentage} style={styles.discountBadge} />
        )}
      </View>

      <View style={styles.content}>
        {hasDiscount && <Text style={styles.discountTag}>Descuento</Text>}
        {!hasDiscount && cardData.isNew && <Text style={styles.newTag}>Nuevo</Text>}
        <Text style={styles.name} numberOfLines={1}>
          {cardData.name}
        </Text>
        {product.isCustomizable && (
          <Text style={styles.description} numberOfLines={1}>
            Personalizable
          </Text>
        )}
        {hasDiscount &&
        cardData.discountedPrice !== undefined &&
        cardData.originalPrice !== undefined ? (
          <View style={styles.priceRow}>
            <Text style={styles.originalPrice}>${cardData.originalPrice.toFixed(2)}</Text>
            <Text style={styles.discountPrice}>${cardData.discountedPrice.toFixed(2)}</Text>
          </View>
        ) : (
          <Text style={styles.price}>${cardData.price.toFixed(2)}</Text>
        )}

        {renderColorPalette()}
      </View>
    </Pressable>
  );
}

// Use typed StyleSheet.create
const styles = StyleSheet.create<Styles>({
  container: {
    gap: spacing.sm,
  },
  imageContainer: {
    borderRadius: radius.xs,
    overflow: 'hidden',
    position: 'relative',
  },
  wishlistButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 28,
    height: 28,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  discountBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 1,
    borderTopRightRadius: radius.xs,
    borderBottomLeftRadius: radius.xs,
  },
  content: {
    paddingHorizontal: 0,
    gap: spacing.xs,
  },
  discountTag: {
    color: colors.error,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: '400',
    lineHeight: lineHeights.sm,
  },
  newTag: {
    color: colors.success,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: '400',
    lineHeight: lineHeights.sm,
  },
  name: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    fontWeight: '500',
    lineHeight: lineHeights.md,
  },
  description: {
    color: colors.secondary,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    fontWeight: '400',
    lineHeight: lineHeights.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  originalPrice: {
    color: colors.secondary,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    fontWeight: '400',
    lineHeight: lineHeights.md,
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    color: colors.error,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    fontWeight: '400',
    lineHeight: lineHeights.md,
  },
  price: {
    color: colors.secondary,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    fontWeight: '400',
    lineHeight: lineHeights.md,
  },
  colorPaletteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  colorCircle: {
    width: 12,
    height: 12,
    borderRadius: radius.circle,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  colorMoreText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.secondary,
    fontWeight: '500',
    color: colors.secondary,
  },
});

export default memo(DefaultLargeCard);
