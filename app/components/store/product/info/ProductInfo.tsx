import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { Product } from '../../../../types/product'
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../styles/typography'
import { spacing, radius } from '../../../../styles/spacing'
import { colors } from '../../../../styles/colors'
import { STATUS_TO_LABEL } from '../../../../types/product-status'

type ProductInfoProps = {
  product: Product;
  darkMode?: boolean;
}

export default function ProductInfo({ product, darkMode = false }: ProductInfoProps) {
  const hasDiscount = product.discountedPrice !== undefined && 
                     product.discountedPrice < product.price
  
  const discountPercentage = hasDiscount ? 
    Math.round(((product.price - (product.discountedPrice || 0)) / product.price) * 100) : 0
  
  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <View style={styles.header}>
        {product.status && (
          <View style={styles.tagContainer}>
            <Text style={styles.tagText}>
              {STATUS_TO_LABEL[product.status]}
            </Text>
          </View>
        )}
        {hasDiscount && (
          <View style={styles.discountTag}>
            <Text style={styles.discountTagText}>
              {discountPercentage}% OFF
            </Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.title, darkMode && styles.titleDark]}>
        {product.title}
      </Text>
      
      {product.isCustomizable && (
        <View style={styles.customizableContainer}>
          <Text style={[styles.customizable, darkMode && styles.customizableDark]}>
            Personalizable
          </Text>
        </View>
      )}
      
      <View style={styles.priceContainer}>
        {hasDiscount ? (
          <>
            <Text style={[styles.discountedPrice, darkMode && styles.discountedPriceDark]}>
              ${product.discountedPrice?.toFixed(2)}
            </Text>
            <Text style={[styles.originalPrice, darkMode && styles.originalPriceDark]}>
              ${product.price.toFixed(2)}
            </Text>
          </>
        ) : (
          <Text style={[styles.price, darkMode && styles.priceDark]}>
            ${product.price.toFixed(2)}
          </Text>
        )}
      </View>
      
      {Array.isArray(product.description) && product.description.length > 0 && (
        <View style={styles.shortDescription}>
          <Text style={[styles.descriptionText, darkMode && styles.descriptionTextDark]}>
            {product.description[0]}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.background.light,
  },
  containerDark: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  tagContainer: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.xs,
    marginRight: spacing.sm,
  },
  tagText: {
    color: colors.background.light,
    fontSize: fontSizes.xs,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
  },
  discountTag: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.xs,
  },
  discountTagText: {
    color: colors.background.light,
    fontSize: fontSizes.xs,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
  },
  title: {
    color: colors.primary,
    fontSize: fontSizes.lg,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    marginBottom: spacing.xs,
  },
  titleDark: {
    color: colors.background.light,
  },
  customizableContainer: {
    marginBottom: spacing.sm,
  },
  customizable: {
    color: colors.secondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    lineHeight: lineHeights.sm,
  },
  customizableDark: {
    color: '#B1B1B1', // Light gray as per Figma design
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  price: {
    color: colors.primary,
    fontSize: fontSizes.lg,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
  },
  priceDark: {
    color: colors.background.light,
  },
  discountedPrice: {
    color: colors.error,
    fontSize: fontSizes.lg,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
  },
  discountedPriceDark: {
    color: colors.background.light,
  },
  originalPrice: {
    color: colors.secondary,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    lineHeight: lineHeights.md,
    textDecorationLine: 'line-through',
  },
  originalPriceDark: {
    color: '#B1B1B1', // Light gray as per Figma design
  },
  shortDescription: {
    marginTop: spacing.sm,
  },
  descriptionText: {
    color: colors.secondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    lineHeight: lineHeights.md,
  },
  descriptionTextDark: {
    color: '#B1B1B1', // Light gray as per Figma design
  },
}) 