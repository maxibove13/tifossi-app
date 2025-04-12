import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../../styles/colors';
import { spacing } from '../../../styles/spacing';
import { fonts, fontSizes, lineHeights } from '../../../styles/typography';

interface DiscountBadgeProps {
  percentage: number;
  style?: ViewStyle;
}

// Define Styles type
type Styles = {
  discountBadge: ViewStyle;
  discountBadgeText: TextStyle;
};

const DiscountBadge: React.FC<DiscountBadgeProps> = ({ percentage, style }) => {
  if (percentage <= 0) {
    return null; // Don't render if no discount
  }

  return (
    <View style={[styles.discountBadge, style]}>
      <Text style={styles.discountBadgeText}>-{percentage}%</Text>
    </View>
  );
};

// Use typed StyleSheet.create
const styles = StyleSheet.create<Styles>({
  discountBadge: {
    backgroundColor: colors.error, // #AD3026
    paddingHorizontal: spacing.xs, // 4px
    paddingVertical: 2, // Match CartProductCard
    borderRadius: 2, // Match Figma
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadgeText: {
    fontFamily: fonts.secondary, // Inter
    fontSize: fontSizes.xs, // 10px
    fontWeight: '500', // Match Figma (fontWeight 500)
    lineHeight: lineHeights.xs, // 14px lineHeight (1.4em of 10px)
    color: colors.background.light, // #FAFAFA
    textAlign: 'center',
  },
});

export default DiscountBadge;
