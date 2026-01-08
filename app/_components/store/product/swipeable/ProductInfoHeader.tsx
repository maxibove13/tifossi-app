import { StyleSheet, View, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      {/* Main info row: left column (3 text items) + right column (2 prices) */}
      <View style={styles.infoRow}>
        {/* Left column: Discount, Product Name, Personalizable */}
        <View style={styles.leftColumn}>
          <Text style={[styles.discountLabel, !isDiscounted && styles.hidden]}>Descuento</Text>
          <Text style={styles.productName} numberOfLines={1}>
            {productName}
          </Text>
          <Text style={[styles.featureLabel, !isCustomizable && styles.hidden]}>
            Personalizable
          </Text>
        </View>

        {/* Right column: Current Price, Original Price */}
        <View style={styles.rightColumn}>
          <Text style={styles.currentPrice}>{currentPrice}</Text>
          <Text style={[styles.originalPrice, !originalPrice && styles.hidden]}>
            {originalPrice || '$0'}
          </Text>
        </View>
      </View>

      {/* Add to Cart Button */}
      <Pressable
        onPress={onAddToCart}
        disabled={disabled}
        testID="add-to-cart-button"
        style={({ pressed }) => [
          styles.addToCartButton,
          disabled && styles.addToCartButtonDisabled,
          pressed && styles.addToCartButtonPressed,
        ]}
      >
        <LinearGradient colors={[...colors.secondary.gradient]} style={styles.buttonGradient}>
          <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
            {addToCartLabel}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

type Styles = {
  container: ViewStyle;
  infoRow: ViewStyle;
  leftColumn: ViewStyle;
  rightColumn: ViewStyle;
  discountLabel: TextStyle;
  productName: TextStyle;
  featureLabel: TextStyle;
  currentPrice: TextStyle;
  originalPrice: TextStyle;
  addToCartButton: ViewStyle;
  addToCartButtonDisabled: ViewStyle;
  addToCartButtonPressed: ViewStyle;
  buttonGradient: ViewStyle;
  buttonText: TextStyle;
  buttonTextDisabled: TextStyle;
  hidden: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    marginTop: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.xxl,
  },
  leftColumn: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  rightColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  discountLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '400',
    fontSize: typography.body.fontSize,
    lineHeight: 16,
    color: colors.accent.discount,
  },
  productName: {
    fontFamily: typography.productTitle.fontFamily,
    fontWeight: '500',
    fontSize: typography.productTitle.fontSize,
    lineHeight: 20,
    color: colors.primary.text,
  },
  featureLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '400',
    fontSize: typography.body.fontSize,
    lineHeight: 16,
    color: colors.secondary.textDisabled,
  },
  currentPrice: {
    fontFamily: typography.productTitle.fontFamily,
    fontWeight: '500',
    fontSize: typography.productTitle.fontSize,
    lineHeight: 20,
    color: colors.primary.text,
    textAlign: 'right',
  },
  originalPrice: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '400',
    fontSize: typography.body.fontSize,
    lineHeight: 16,
    color: colors.secondary.textDisabled,
    textAlign: 'right',
    textDecorationLine: 'line-through',
  },
  addToCartButton: {
    width: '100%',
    height: 48,
    borderRadius: radius.xxl,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  addToCartButtonDisabled: {
    opacity: 0.5,
  },
  addToCartButtonPressed: {
    opacity: 0.8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: 10,
  },
  buttonText: {
    fontFamily: typography.button.fontFamily,
    fontWeight: '500',
    fontSize: typography.button.fontSize,
    lineHeight: 24,
    color: colors.primary.background,
    textAlign: 'center',
  },
  buttonTextDisabled: {
    opacity: 0.6,
  },
  hidden: {
    opacity: 0,
  },
});
