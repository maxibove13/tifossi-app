import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  View,
  ViewStyle,
  TextStyle
} from 'react-native';
import { colors, spacing, radius } from '../swipeable/styles';

interface AddToCartButtonProps {
  onPress: () => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  quantity?: number;
}

/**
 * AddToCartButton component
 * Button for adding products to cart with loading state support
 */
export default function AddToCartButton({ 
  onPress, 
  isLoading = false, 
  disabled = false,
  quantity = 1
}: AddToCartButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isDisabled && styles.buttonDisabled
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <View style={styles.buttonContent}>
          <Text style={styles.buttonText}>
            {quantity > 1 ? `Agregar al carrito (${quantity})` : 'Agregar al carrito'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

type Styles = {
  button: ViewStyle;
  buttonDisabled: ViewStyle;
  buttonContent: ViewStyle;
  buttonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  button: {
    backgroundColor: colors.primary.background,
    paddingVertical: spacing.md,
    borderRadius: radius.xxl, // 24px from radius constants
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    flexDirection: 'row',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.primary.text,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter',
  }
});