import { memo } from 'react'
import { StyleSheet, View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { BaseProductCardProps } from '../types'
import ProductImage from '../image/ProductImage'
import { mapProductToCardData } from '../../../../types/product'
import { getCardDimensions } from '../../../../types/product-card'
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../styles/typography'
import { spacing, radius } from '../../../../styles/spacing'
import { colors } from '../../../../styles/colors'

function DefaultLargeCard({
  product,
  onPress,
}: BaseProductCardProps) {
  const cardData = mapProductToCardData(product)
  const dimensions = getCardDimensions('default', 'large')
  
  return (
    <Pressable 
      style={[
        styles.container,
        { width: typeof dimensions.width === 'number' ? dimensions.width : '100%' }
      ]}
      onPress={onPress}
    >
      <View style={[styles.imageContainer, { width: dimensions.imageSize, height: dimensions.imageSize }]}>
        <ProductImage 
          source={cardData.image}
          size={dimensions.imageSize}
        />
        <Pressable style={styles.wishlistButton}>
          <Ionicons name="heart-outline" size={14} color={colors.border} />
        </Pressable>
      </View>
      
      <View style={styles.content}>
        {cardData.isNew && (
          <Text style={styles.tag}>Nuevo</Text>
        )}
        <Text style={styles.name} numberOfLines={1}>{cardData.name}</Text>
        {product.isCustomizable && (
          <Text style={styles.description} numberOfLines={1}>Personalizable</Text>
        )}
        <Text style={styles.price}>${cardData.price.toFixed(2)}</Text>
      </View>
    </Pressable>
  )
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
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    padding: 3.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
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
  description: {
    color: colors.secondary,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    lineHeight: lineHeights.md,
  },
  price: {
    color: colors.secondary,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    lineHeight: lineHeights.md,
  },
})

export default memo(DefaultLargeCard) 