import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../../../_styles/colors';
import { spacing, radius } from '../../../../_styles/spacing';
import { fonts, fontSizes, fontWeights, lineHeights } from '../../../../_styles/typography';
import { Ionicons } from '@expo/vector-icons';

interface AddToCartButtonProps {
  onPress: () => Promise<void>;
  disabled?: boolean;
  inCart?: boolean;
  price?: number;
  darkMode?: boolean;
  isLoading?: boolean;
  quantity?: number;
}

export default function AddToCartButton({
  onPress,
  disabled = false,
  inCart = false,
  price,
  darkMode = false,
  isLoading: externalLoading,
  quantity = 1,
}: AddToCartButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  const scaleAnim = useState(new Animated.Value(1))[0];

  const handlePress = async () => {
    if (disabled || loading) return;

    setInternalLoading(true);

    // Animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await onPress();
    } catch {
      // Error adding to cart
    } finally {
      setInternalLoading(false);
    }
  };

  const buttonText = inCart ? 'In Cart' : 'Agregar al carrito';

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={[
            styles.button,
            darkMode && styles.buttonDark,
            disabled && (darkMode ? styles.buttonDisabledDark : styles.buttonDisabled),
            inCart && styles.buttonInCart,
          ]}
          onPress={handlePress}
          disabled={disabled || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
                {quantity > 1 ? `${buttonText} (${quantity})` : buttonText}
              </Text>
              {price && (
                <View style={[styles.priceTag, darkMode && styles.priceTagDark]}>
                  <Text style={styles.priceText}>${price}</Text>
                </View>
              )}
              {inCart ? (
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={styles.icon} />
              ) : (
                <Ionicons name="cart-outline" size={20} color="#FFFFFF" style={styles.icon} />
              )}
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
      {disabled && !loading && (
        <Text style={[styles.helperText, darkMode && styles.helperTextDark]}>
          Please select a size
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  containerDark: {
    backgroundColor: 'transparent',
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
    height: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
  },
  buttonDark: {
    backgroundColor: 'rgba(251, 251, 251, 0.25)',
  },
  buttonDisabled: {
    backgroundColor: colors.secondary,
    opacity: 0.5,
  },
  buttonDisabledDark: {
    backgroundColor: 'rgba(251, 251, 251, 0.1)',
    opacity: 0.5,
  },
  buttonInCart: {
    backgroundColor: colors.success,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.medium,
    fontFamily: fonts.secondary,
    flex: 1,
    textAlign: 'center',
  },
  buttonTextDisabled: {
    opacity: 0.7,
  },
  icon: {
    marginLeft: spacing.sm,
  },
  priceTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    marginLeft: spacing.sm,
  },
  priceTagDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
  },
  helperText: {
    color: colors.error,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontFamily: fonts.secondary,
  },
  helperTextDark: {
    color: '#F6695E', // Red color from Figma
  },
});
