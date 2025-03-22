import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radius } from './styles';

interface ProductInfoHeaderProps {
  productName: string;
  isCustomizable?: boolean;
  isDiscounted?: boolean;
  currentPrice: string;
  originalPrice?: string;
  onAddToCart: () => void;
}

export default function ProductInfoHeader({
  productName,
  isCustomizable = false,
  isDiscounted = false,
  currentPrice,
  originalPrice,
  onAddToCart
}: ProductInfoHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Product Title Area */}
      <View style={styles.productTitleContainer}>
        {isDiscounted && (
          <Text style={styles.discountLabel}>Descuento</Text>
        )}
        <Text style={styles.productName}>{productName}</Text>
        {isCustomizable && (
          <Text style={styles.featureLabel}>Personalizable</Text>
        )}
      </View>

      {/* Price Area */}
      <View style={styles.priceContainer}>
        <Text style={styles.currentPrice}>{currentPrice}</Text>
        {originalPrice && (
          <Text style={styles.originalPrice}>{originalPrice}</Text>
        )}
      </View>

      {/* Add to Cart Button */}
      <TouchableOpacity 
        style={styles.addToCartButtonContainer}
        onPress={onAddToCart}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.secondary.gradientStart, colors.secondary.gradientEnd]}
          style={styles.addToCartButton}
        >
          <Text style={styles.buttonText}>Agregar al carrito</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

type Styles = {
  container: ViewStyle;
  productTitleContainer: ViewStyle;
  discountLabel: TextStyle;
  productName: TextStyle;
  featureLabel: TextStyle;
  priceContainer: ViewStyle;
  currentPrice: TextStyle;
  originalPrice: TextStyle;
  addToCartButtonContainer: ViewStyle;
  addToCartButton: ViewStyle;
  buttonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  productTitleContainer: {
    alignItems: 'flex-start',
  },
  discountLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '400',
    fontSize: typography.body.fontSize,
    color: colors.accent.discount,
    marginBottom: spacing.xs,
  },
  productName: {
    fontFamily: typography.productTitle.fontFamily,
    fontWeight: '500',
    fontSize: typography.productTitle.fontSize,
    color: colors.primary.text,
    marginBottom: spacing.xs,
  },
  featureLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '400',
    fontSize: typography.body.fontSize,
    color: colors.secondary.textDisabled,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontFamily: typography.productTitle.fontFamily,
    fontWeight: '500',
    fontSize: typography.productTitle.fontSize,
    color: colors.primary.text,
    textAlign: 'right',
  },
  originalPrice: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '400',
    fontSize: typography.body.fontSize,
    color: colors.secondary.textDisabled,
    textAlign: 'right',
    textDecorationLine: 'line-through',
  },
  addToCartButtonContainer: {
    width: '100%',
    height: 48,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  addToCartButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  buttonText: {
    fontFamily: typography.button.fontFamily,
    fontWeight: '500',
    fontSize: typography.button.fontSize,
    color: colors.primary.background,
    textAlign: 'center',
  },
});