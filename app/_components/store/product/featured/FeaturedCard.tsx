import { StyleSheet, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { FeaturedCardProps } from '../types';
import ProductImage from '../image/ProductImage';
import { getCardDimensions } from '../../../../_types/product-card';
import { mapProductToCardData } from '../../../../_types/product';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../_styles/typography';
import { spacing, radius } from '../../../../_styles/spacing';
import { colors } from '../../../../_styles/colors';
import { ProductLabel } from '../../../../_types/product-status';

// Helper component for the button gradient to handle state logic
const ButtonGradient = ({ pressed, disabled }: { pressed: boolean; disabled: boolean }) => {
  const gradientColors = disabled
    ? colors.button.disabledGradient
    : pressed
      ? (['transparent', 'transparent'] as const) // Transparent when pressed (solid background shows)
      : colors.button.defaultGradient;

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.buyButtonGradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <Text style={[styles.buyButtonText, disabled && styles.buyButtonTextDisabled]}>
        {disabled ? 'No disponible' : 'Comprar'}
      </Text>
    </LinearGradient>
  );
};

export default function FeaturedCard({
  product,
  onBuyPress,
  onPress,
  size = 'small',
}: FeaturedCardProps) {
  const cardData = mapProductToCardData(product);
  const dimensions = getCardDimensions('featured', size);
  const isFullWidth = dimensions.width === 'full';

  const formatPrice = (value: number | undefined) => {
    if (typeof value !== 'number') return 'Precio no disponible';
    return `$${value.toFixed(2)}`;
  };

  const isBuyDisabled = !cardData.price;
  const isNew = product.label === ProductLabel.NEW;

  return (
    <Pressable onPress={onPress} style={{ width: '100%', height: '100%' }}>
      <LinearGradient
        colors={[colors.secondary, colors.primary] as const} // Card background
        style={[
          styles.container,
          {
            width: typeof dimensions.width === 'number' ? dimensions.width : '100%',
            height: dimensions.height,
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.textSection}>
            {isNew && <Text style={styles.label}>Nuevo</Text>}
            <Text style={styles.title}>{cardData.name || 'Producto no disponible'}</Text>
            {product.isCustomizable && <Text style={styles.customizable}>Personalizable</Text>}
          </View>

          <View
            style={[
              styles.imageSection,
              isFullWidth ? styles.imageFullWidth : styles.imageSmall,
              { height: dimensions.imageSize },
            ]}
          >
            <ProductImage
              source={cardData.image}
              overlay
              overlayColor={colors.primary}
              overlayOpacity={0.0}
              size={dimensions.imageSize}
            />
          </View>

          <View style={styles.actionSection}>
            <Text style={styles.price}>{formatPrice(cardData.price)}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.buyButtonContainer,
                isBuyDisabled && styles.buyButtonDisabled,
                pressed && !isBuyDisabled && { backgroundColor: colors.button.pressed },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onBuyPress && onBuyPress();
              }}
              disabled={isBuyDisabled}
            >
              {({ pressed }) => <ButtonGradient pressed={pressed} disabled={isBuyDisabled} />}
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xs,
    overflow: 'hidden',
    width: '100%',
  },
  content: {
    flex: 1,
    paddingVertical: spacing.xxl,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: spacing.xxl,
    alignSelf: 'stretch',
  },
  textSection: {
    paddingHorizontal: spacing.xxl,
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  imageSection: {
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  imageSmall: {
    width: 293,
    height: 220,
    alignSelf: 'flex-end',
  },
  imageFullWidth: {
    width: '100%',
    right: 0,
  },
  actionSection: {
    paddingHorizontal: spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  label: {
    color: colors.tag.new,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: (lineHeights.sm * 1.333) / ((fontSizes.sm * 1.333) / 12),
    alignSelf: 'stretch',
  },
  title: {
    color: colors.background.light,
    fontSize: fontSizes.xl,
    fontFamily: fonts.primary,
    fontWeight: fontWeights.regular,
    lineHeight: (lineHeights.xl * 1.4) / ((fontSizes.xl * 1.4) / 20),
    alignSelf: 'stretch',
  },
  customizable: {
    color: colors.border,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.regular,
    lineHeight: (lineHeights.sm * 1.333) / ((fontSizes.sm * 1.333) / 12),
    alignSelf: 'stretch',
  },
  price: {
    flex: 1,
    color: colors.secondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm,
  },
  buyButtonContainer: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
  buyButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonDisabled: {
    opacity: 0.7,
  },
  buyButtonText: {
    color: '#FBFBFB',
    fontSize: fontSizes.lg,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
  },
  buyButtonTextDisabled: {
    color: 'rgba(251, 251, 251, 0.7)',
  },
});
