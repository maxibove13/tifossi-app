import { StyleSheet, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import type { FeaturedCardProps } from '../types';
import { getCardDimensions } from '../../../../_types/product-card';
import { mapProductToCardData } from '../../../../_types/product';
import { fonts, fontSizes, fontWeights } from '../../../../_styles/typography';
import { radius } from '../../../../_styles/spacing';
import { colors } from '../../../../_styles/colors';
import { ProductStatus, hasStatus } from '../../../../_types/product-status';

export default function FeaturedCard({ product, onBuyPress, size = 'small' }: FeaturedCardProps) {
  const cardData = mapProductToCardData(product);
  const dimensions = getCardDimensions('featured', size);

  const formatPrice = (value: number | undefined) => {
    if (typeof value !== 'number') return 'Precio no disponible';
    return `$${value.toFixed(2)}`;
  };

  const isBuyDisabled = !cardData.price;
  const isNew = hasStatus(product.statuses, ProductStatus.NEW);

  return (
    <LinearGradient
      colors={[colors.secondary, colors.primary] as const}
      style={[
        styles.container,
        {
          width: typeof dimensions.width === 'number' ? dimensions.width : '100%',
          height: dimensions.height,
        },
      ]}
    >
      {/* Image positioned absolutely to avoid flex layout gaps */}
      <View style={[styles.imageSectionContainer, { height: dimensions.imageSize }]}>
        <Image
          source={{ uri: cardData.image as string }}
          style={styles.image}
          contentFit="cover"
          contentPosition="left center"
        />
      </View>

      {/* Text and action sections */}
      <View style={styles.textSection}>
        {isNew && <Text style={styles.label}>Nuevo</Text>}
        <Text style={styles.title}>{cardData.name || 'Producto no disponible'}</Text>
        {product.isCustomizable && <Text style={styles.customizable}>Personalizable</Text>}
      </View>

      <View style={styles.actionSection}>
        <Text style={styles.price}>{formatPrice(cardData.price)}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.buyButton,
            isBuyDisabled && styles.buyButtonDisabled,
            pressed && !isBuyDisabled && styles.buyButtonPressed,
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onBuyPress && onBuyPress();
          }}
          disabled={isBuyDisabled}
        >
          <Text style={[styles.buyButtonText, isBuyDisabled && styles.buyButtonTextDisabled]}>
            {isBuyDisabled ? 'No disponible' : 'Comprar'}
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xs,
    overflow: 'hidden',
    width: '100%',
  },
  textSection: {
    position: 'absolute',
    top: 28,
    left: 28,
    right: 28,
  },
  imageSectionContainer: {
    position: 'absolute',
    right: 0,
    top: 116,
    width: 293,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionSection: {
    position: 'absolute',
    bottom: 28,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 32,
  },
  label: {
    color: colors.tag.new,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: 16,
  },
  title: {
    color: colors.background.light,
    fontSize: fontSizes.xl,
    fontFamily: fonts.primary,
    fontWeight: fontWeights.regular,
    lineHeight: 28,
  },
  customizable: {
    color: colors.border,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.regular,
    lineHeight: 16,
  },
  price: {
    flex: 1,
    color: '#B1B1B1',
    fontSize: 12,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.regular,
    lineHeight: 16,
  },
  buyButton: {
    height: 32,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 251, 251, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonPressed: {
    backgroundColor: 'rgba(251, 251, 251, 0.35)',
  },
  buyButtonDisabled: {
    opacity: 0.7,
  },
  buyButtonText: {
    color: '#FBFBFB',
    fontSize: 12,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: 16,
  },
  buyButtonTextDisabled: {
    color: 'rgba(251, 251, 251, 0.7)',
  },
});
