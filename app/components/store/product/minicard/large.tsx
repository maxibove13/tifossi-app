import { memo } from 'react'
import { StyleSheet, View, Text, Pressable } from 'react-native'
import type { MinicardProps } from '../types'
import ProductImage from '../image/ProductImage'
import { mapProductToCardData } from '../../../../types/product'
import { getCardDimensions } from '../../../../types/product-card'
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../styles/typography'
import { spacing, radius } from '../../../../styles/spacing'
import { colors } from '../../../../styles/colors'

function MinicardLarge({
  product,
  onPress,
}: MinicardProps) {
  const cardData = mapProductToCardData(product)
  const dimensions = getCardDimensions('minicard', 'large')
  
  return (
    <Pressable 
      style={[
        styles.container,
        { width: typeof dimensions.width === 'number' ? dimensions.width : '100%' }
      ]}
      onPress={onPress}
    >
      <View style={[styles.imageContainer, { height: dimensions.imageSize }]}>
        <ProductImage 
          source={cardData.image}
          size={dimensions.imageSize}
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{cardData.name}</Text>
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
    width: '100%',
    borderRadius: radius.xs,
    overflow: 'hidden',
  },
  content: {
    height: 40,
    paddingHorizontal: spacing.xs,
    flexDirection: 'column',
    justifyContent: 'flex-start',
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
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    lineHeight: lineHeights.md,
  },
})

export default memo(MinicardLarge) 