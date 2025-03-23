import { StyleSheet, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { FeaturedCardProps } from '../types';
import ProductImage from '../image/ProductImage';
import { getCardDimensions } from '../../../../types/product-card';
import { mapProductToCardData } from '../../../../types/product';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../styles/typography';
import { spacing, radius } from '../../../../styles/spacing';
import { colors } from '../../../../styles/colors';

export default function FeaturedCard({ 
  product, 
  onBuyPress,
  onPress,
  size = 'small'
}: FeaturedCardProps) {
  const cardData = mapProductToCardData(product);
  const dimensions = getCardDimensions('featured', size);
  const isFullWidth = dimensions.width === 'full';

  const formatPrice = (value: number | undefined) => {
    if (typeof value !== 'number') return 'Precio no disponible';
    return `$${value.toFixed(2)}`;
  };

  return (
    <Pressable onPress={onPress} style={{ width: '100%', height: '100%' }}>
      <LinearGradient
        colors={[colors.secondary, colors.primary]}
        style={[
          styles.container,
          {
            width: typeof dimensions.width === 'number' ? dimensions.width : '100%',
            height: dimensions.height
          }
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.textSection}>
            {cardData.isNew && <Text style={styles.label}>Nuevo</Text>}
            <Text style={styles.title}>{cardData.name || 'Producto no disponible'}</Text>
            {product.isCustomizable && <Text style={styles.customizable}>Personalizable</Text>}
          </View>

          <View style={[
            styles.imageSection,
            isFullWidth ? styles.imageFullWidth : styles.imageSmall,
            { height: dimensions.imageSize }
          ]}>
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
              style={[styles.buyButton, !cardData.price && styles.buyButtonDisabled]} 
              onPress={(e) => {
                e.stopPropagation();
                onBuyPress && onBuyPress();
              }}
              disabled={!cardData.price}
            >
              <Text style={[styles.buyButtonText, !cardData.price && styles.buyButtonTextDisabled]}>
                {cardData.price ? 'Comprar' : 'No disponible'}
              </Text>
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
    color: colors.success,
    fontSize: fontSizes.sm,
    fontFamily: `${fonts.secondary}-${fontWeights.medium}`,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
    alignSelf: 'stretch',
  },
  title: {
    color: colors.background.light,
    fontSize: fontSizes.xl,
    fontFamily: `${fonts.primary}-${fontWeights.medium}`,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.xl,
    alignSelf: 'stretch',
  },
  customizable: {
    color: colors.border,
    fontSize: fontSizes.sm,
    fontFamily: `${fonts.secondary}-${fontWeights.regular}`,
    lineHeight: lineHeights.sm,
    alignSelf: 'stretch',
  },
  price: {
    flex: 1,
    color: colors.secondary,
    fontSize: fontSizes.sm,
    fontFamily: `${fonts.secondary}-${fontWeights.regular}`,
    lineHeight: lineHeights.sm,
  },
  buyButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(251, 251, 251, 0.25)',
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonDisabled: {
    backgroundColor: 'rgba(251, 251, 251, 0.1)',
  },
  buyButtonText: {
    color: colors.background.light,
    fontSize: fontSizes.sm,
    fontFamily: `${fonts.secondary}-${fontWeights.medium}`,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
  },
  buyButtonTextDisabled: {
    color: 'rgba(251, 251, 251, 0.5)',
  },
}); 