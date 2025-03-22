import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Product } from '../../../../types/product'
import { colors } from '../../../../styles/colors'
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../styles/typography'
import ProductImage from '../image/ProductImage'

type ProductCardSize = 's' | 'l'

type PromotionCardProps = {
  product: Product
  size?: ProductCardSize
  onPress?: () => void
  darkMode?: boolean
}

export default function PromotionCard({ 
  product, 
  size = 's', 
  onPress,
  darkMode = false
}: PromotionCardProps) {
  const isSmall = size === 's'
  const { title, price, discountedPrice, image } = product

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.imageContainer}>
        <ProductImage 
          source={image}
          size={132}
        />
        <Pressable style={styles.wishlistButton}>
          <Ionicons name="heart-outline" size={14} color={darkMode ? colors.background.light : "#DCDCDC"} />
        </Pressable>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.label}>Nuevo</Text>
        <Text style={[styles.title, darkMode && styles.titleDark]} numberOfLines={1}>{title}</Text>
        <View style={styles.priceContainer}>
          <Text style={[styles.originalPrice, darkMode && styles.originalPriceDark]}>${price.toFixed(2)}</Text>
          <Text style={styles.salePrice}>${discountedPrice?.toFixed(2)}</Text>
        </View>
      </View>
    </Pressable>
  )
}

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
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    padding: 3.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 4,
  },
  label: {
    color: '#AD3026',
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm,
  },
  title: {
    color: '#0C0C0C',
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
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
}) 