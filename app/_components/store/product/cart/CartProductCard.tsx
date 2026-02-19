import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Product } from '../../../../_types/product';
import ProductImage from '../image/ProductImage';
import { colors } from '../../../../_styles/colors';
import { spacing, radius } from '../../../../_styles/spacing';
import { fonts, fontSizes, fontWeights, lineHeights } from '../../../../_styles/typography';

// Define CartProduct inheriting from Product
interface CartProduct extends Product {
  quantity: number;
  isCustomizable?: boolean;
  color?: string; // Color name displayed in cart
  selectedSize?: string;
  sizes?: { value: string; available: boolean }[];
  size?: string;
}

interface CartProductCardProps {
  product: CartProduct;
  quantity: number;
  onQuantityChange?: (quantity: number) => void;
  onRemove?: () => void;
  onEdit?: () => void;
  isDark?: boolean;
}

// Define a type for the styles
type Styles = {
  container: ViewStyle;
  containerDark: ViewStyle;
  imageContainer: ViewStyle;
  content: ViewStyle;
  topSection: ViewStyle;
  titleEditRow: ViewStyle;
  title: TextStyle;
  titleDark: TextStyle;
  editButton: ViewStyle;
  editButtonText: TextStyle;
  customizableText: TextStyle;
  colorText: TextStyle;
  sizeRow: ViewStyle;
  sizeLabel: TextStyle;
  sizeValue: TextStyle;
  footer: ViewStyle;
  quantityRow: ViewStyle;
  quantityLabel: TextStyle;
  quantityValue: TextStyle;
  priceContainer: ViewStyle;
  originalPriceText: TextStyle;
  price: TextStyle;
  priceDark: TextStyle;
  discountPriceText: TextStyle;
  discountBadge: ViewStyle;
  discountBadgeText: TextStyle;
  emptyDiscountBadge: ViewStyle;
  emptyOriginalPrice: ViewStyle;
};

export const CartProductCard = ({
  product,
  quantity,
  onEdit,
  isDark = false,
}: CartProductCardProps) => {
  const {
    title,
    price,
    discountedPrice,
    frontImage,
    isCustomizable,
    color,
    selectedSize,
    sizes,
    size,
    colors,
  } = product;

  // Get the display color - prefer explicitly set color, fall back to first color's name
  const displayColor = color || (colors && colors.length > 0 ? colors[0].colorName : undefined);

  // Determine what size to display
  // 1. Use selectedSize if available
  // 2. Use size (legacy) if available
  // 3. Use the first available size from sizes array if exists
  // 4. For items like bags without size info, show "Único"
  const displaySize =
    selectedSize ||
    size ||
    (sizes && sizes.length > 0
      ? sizes.find((s) => s.available)?.value || sizes[0].value
      : 'Talle Único');

  // Calculate discount percentage if applicable
  const discountPercentage =
    discountedPrice && price ? Math.round(((price - discountedPrice) / price) * 100) : 0;

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <ProductImage source={frontImage} size={130} />
      </View>

      {/* Product Details */}
      <View style={styles.content}>
        {/* Top Section: Title and product info */}
        <View style={styles.topSection}>
          {/* Row for Title and Edit Button */}
          <View style={styles.titleEditRow}>
            <Text
              style={[styles.title, isDark && styles.titleDark]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
            {onEdit && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={onEdit}
                hitSlop={{
                  top: spacing.sm,
                  right: spacing.sm,
                  bottom: spacing.sm,
                  left: spacing.sm,
                }}
              >
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Product Attributes */}
          {isCustomizable && <Text style={styles.customizableText}>Personalizable</Text>}

          {displayColor && <Text style={styles.colorText}>{displayColor}</Text>}

          {displaySize && (
            <View style={styles.sizeRow}>
              <Text style={styles.sizeLabel}>Talle:</Text>
              <Text style={styles.sizeValue}>{displaySize}</Text>
            </View>
          )}
        </View>

        {/* Bottom Row: Quantity and Price - Fixed height section */}
        <View style={styles.footer}>
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Cantidad:</Text>
            <Text style={styles.quantityValue}>{quantity}</Text>
          </View>

          {/* Price Section - Fixed height regardless of discount presence */}
          <View style={styles.priceContainer}>
            {discountedPrice && discountPercentage > 0 ? (
              <>
                {/* Discount Badge */}
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>-{discountPercentage}%</Text>
                </View>

                {/* Original Price (strikethrough) and Discounted Price */}
                <Text style={[styles.originalPriceText, isDark && styles.priceDark]}>
                  ${price.toFixed(2)}
                </Text>
                <Text style={[styles.discountPriceText, isDark && styles.priceDark]}>
                  ${discountedPrice.toFixed(2)}
                </Text>
              </>
            ) : (
              <>
                {/* Empty space for consistent layout */}
                <View style={styles.emptyDiscountBadge} />

                {/* Empty space for original price */}
                <View style={styles.emptyOriginalPrice} />

                {/* Regular Price */}
                <Text style={[styles.price, isDark && styles.priceDark]}>${price.toFixed(2)}</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create<Styles>({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.light,
    gap: spacing.lg,
    alignItems: 'flex-start',
  },
  containerDark: {
    backgroundColor: colors.background.dark,
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  imageContainer: {
    width: 130,
    height: 130,
    overflow: 'hidden',
    borderRadius: radius.xs,
  },
  content: {
    flex: 1,
    paddingVertical: spacing.sm,
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 130,
  },
  topSection: {
    flexDirection: 'column',
    alignSelf: 'stretch',
    flexShrink: 1,
    flex: 1,
  },
  titleEditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    flexShrink: 1,
  },
  title: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: colors.primary,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  titleDark: {
    color: colors.background.light,
  },
  editButton: {
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
    paddingBottom: 2,
  },
  editButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm,
    color: colors.secondary,
  },
  customizableText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xs,
    color: colors.secondary,
    marginTop: spacing.xs,
  },
  colorText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xs,
    color: colors.secondary,
    marginTop: spacing.xs / 2,
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs / 2,
  },
  sizeLabel: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xs,
    color: colors.secondary,
    textAlign: 'right',
  },
  sizeValue: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xs,
    color: colors.secondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    gap: spacing.xs,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quantityLabel: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xs,
    color: colors.secondary,
    textAlign: 'right',
  },
  quantityValue: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xs,
    color: colors.secondary,
    textAlign: 'right',
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    height: lineHeights.xxxl,
    justifyContent: 'flex-end',
  },
  originalPriceText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm,
    color: colors.secondary,
    textDecorationLine: 'line-through',
    textAlign: 'right',
  },
  price: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: colors.primary,
    textAlign: 'right',
  },
  priceDark: {
    color: colors.background.light,
  },
  discountPriceText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    color: colors.error,
    textAlign: 'right',
  },
  discountBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadgeText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.xs,
    color: colors.background.light,
    textAlign: 'center',
  },
  emptyDiscountBadge: {
    height: lineHeights.sm,
  },
  emptyOriginalPrice: {
    height: lineHeights.sm,
  },
});

export default CartProductCard;
