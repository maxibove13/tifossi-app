import { StyleSheet, View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, typography, radius } from './styles';

interface ProductInfoHeaderProps {
  productName: string;
  isCustomizable?: boolean;
  isDiscounted?: boolean;
  currentPrice: string;
  originalPrice?: string;
  onAddToCart: () => void;
  addToCartLabel?: string;
  disabled?: boolean;
}

export default function ProductInfoHeader({
  productName,
  isCustomizable = false,
  isDiscounted = false,
  currentPrice,
  originalPrice,
  onAddToCart,
  addToCartLabel = 'Agregar al carrito',
  disabled = false,
}: ProductInfoHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Discount Label - Top Row (always reserve space for consistent height) */}
      <Text style={[styles.discountLabel, !isDiscounted && styles.hidden]}>Descuento</Text>

      {/* Product Name and Current Price - Middle Row */}
      <View style={styles.titleRow}>
        <Text style={styles.productName}>{productName}</Text>
        <Text style={styles.currentPrice}>{currentPrice}</Text>
      </View>

      {/* Personalizable and Original Price - Bottom Row (always reserve space) */}
      <View style={styles.detailsRow}>
        <View style={styles.leftColumn}>
          <Text style={[styles.featureLabel, !isCustomizable && styles.hidden]}>
            Personalizable
          </Text>
        </View>
        <View style={styles.rightColumn}>
          <Text style={[styles.originalPrice, !originalPrice && styles.hidden]}>
            {originalPrice || '$0'}
          </Text>
        </View>
      </View>

      {/* Add to Cart Button */}
      <TouchableOpacity
        style={[styles.addToCartButton, disabled && styles.addToCartButtonDisabled]}
        onPress={onAddToCart}
        activeOpacity={0.8}
        disabled={disabled}
        testID="add-to-cart-button"
      >
        <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
          {addToCartLabel}
        </Text>
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
  addToCartButton: ViewStyle;
  addToCartButtonDisabled: ViewStyle;
  buttonText: TextStyle;
  buttonTextDisabled: TextStyle;
  hidden: TextStyle;
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
  addToCartButton: {
    width: '100%',
    height: 48,
    borderRadius: radius.xxl,
    marginTop: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background.overlay,
  },
  addToCartButtonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: typography.button.fontFamily,
    fontWeight: '500',
    fontSize: typography.button.fontSize,
    color: colors.primary.text,
    textAlign: 'center',
  },
  buttonTextDisabled: {
    opacity: 0.6,
  },
  hidden: {
    opacity: 0,
  },
});
