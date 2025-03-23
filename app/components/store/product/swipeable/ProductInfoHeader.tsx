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
      {/* Discount Label - Top Row */}
      {isDiscounted && (
        <Text style={styles.discountLabel}>Descuento</Text>
      )}

      {/* Product Name and Current Price - Middle Row */}
      <View style={styles.titleRow}>
        <Text style={styles.productName}>{productName}</Text>
        <Text style={styles.currentPrice}>{currentPrice}</Text>
      </View>
      
      {/* Personalizable and Original Price - Bottom Row */}
      <View style={styles.detailsRow}>
        <View style={styles.leftColumn}>
          {isCustomizable && (
            <Text style={styles.featureLabel}>Personalizable</Text>
          )}
        </View>
        <View style={styles.rightColumn}>
          {originalPrice && (
            <Text style={styles.originalPrice}>{originalPrice}</Text>
          )}
        </View>
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
  discountLabel: TextStyle;
  titleRow: ViewStyle;
  detailsRow: ViewStyle;
  leftColumn: ViewStyle;
  rightColumn: ViewStyle;
  productName: TextStyle;
  featureLabel: TextStyle;
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
    gap: 0,
  },
  discountLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '400',
    fontSize: typography.body.fontSize,
    color: colors.accent.discount,
    marginBottom: 0,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 0,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  leftColumn: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  rightColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  productName: {
    fontFamily: typography.productTitle.fontFamily,
    fontWeight: '500',
    fontSize: typography.productTitle.fontSize,
    color: colors.primary.text,
  },
  featureLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '400',
    fontSize: typography.body.fontSize,
    color: colors.secondary.textDisabled,
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
    marginTop: spacing.md,
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