import React from 'react'
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native'
import { fonts, fontSizes, lineHeights, fontWeights } from '../../../../styles/typography'
import { spacing, radius } from '../../../../styles/spacing'
import { colors } from '../../../../styles/colors'
import { ProductSize } from '../../../../types/product'

type SizeSelectorProps = {
  sizes: ProductSize[]
  selectedSize: string | null
  onSelectSize: (size: string) => void
  darkMode?: boolean
}

export default function SizeSelector({ 
  sizes, 
  selectedSize, 
  onSelectSize,
  darkMode = false
}: SizeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, darkMode && styles.labelDark]}>Talle</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sizesContainer}
      >
        {sizes.map((size) => (
          <Pressable
            key={size.value}
            style={[
              styles.sizeButton,
              darkMode && styles.sizeButtonDark,
              selectedSize === size.value && styles.selectedSize,
              selectedSize === size.value && darkMode && styles.selectedSizeDark,
              !size.available && styles.unavailableSize,
              !size.available && darkMode && styles.unavailableSizeDark
            ]}
            onPress={() => size.available && onSelectSize(size.value)}
            disabled={!size.available}
          >
            <Text 
              style={[
                styles.sizeText,
                darkMode && styles.sizeTextDark,
                selectedSize === size.value && styles.selectedSizeText,
                !size.available && styles.unavailableSizeText,
                !size.available && darkMode && styles.unavailableSizeTextDark
              ]}
            >
              {size.value}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  label: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
    marginBottom: spacing.sm,
  },
  labelDark: {
    color: colors.background.light,
  },
  sizesContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  sizeButton: {
    width: 48,
    height: 48,
    borderRadius: radius.xxl, // 24px for perfectly round buttons
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Semi-transparent background
  },
  sizeButtonDark: {
    borderColor: 'rgba(177, 177, 177, 0.5)', // Semi-transparent border on dark mode
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedSize: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  selectedSizeDark: {
    borderColor: colors.background.light,
    backgroundColor: colors.background.light,
  },
  unavailableSize: {
    borderColor: 'rgba(220, 220, 220, 0.3)',
    backgroundColor: 'rgba(220, 220, 220, 0.05)',
    opacity: 0.5,
  },
  unavailableSizeDark: {
    borderColor: 'rgba(177, 177, 177, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    opacity: 0.3,
  },
  sizeText: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.md,
  },
  sizeTextDark: {
    color: colors.background.light, // White text on dark mode
  },
  selectedSizeText: {
    color: colors.background.light,
    fontWeight: fontWeights.semibold,
  },
  unavailableSizeText: {
    color: colors.secondary,
  },
  unavailableSizeTextDark: {
    color: 'rgba(177, 177, 177, 0.5)',
  },
}) 