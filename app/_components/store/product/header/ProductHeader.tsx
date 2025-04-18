import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../swipeable/styles';

interface ProductHeaderProps {
  title: string;
  price: number;
  originalPrice?: number;
  tags?: string[];
  isCustomizable?: boolean;
}

/**
 * ProductHeader component
 * Displays product title, price and tags in the swipeable panel
 */
export default function ProductHeader({ 
  title, 
  price, 
  originalPrice, 
  tags = [],
  isCustomizable = false
}: ProductHeaderProps) {
  const hasDiscount = originalPrice !== undefined && originalPrice > price;
  
  return (
    <View style={styles.container}>
      {/* Title and tags section */}
      <View style={styles.titleContainer}>
        {tags.length > 0 && (
          <Text style={styles.tag}>{tags[0]}</Text>
        )}
        <Text style={styles.title}>{title}</Text>
        {isCustomizable && (
          <Text style={styles.customizable}>Personalizable</Text>
        )}
      </View>
      
      {/* Price section */}
      <View style={styles.priceContainer}>
        <Text style={styles.price}>${price.toFixed(2)}</Text>
        {hasDiscount && (
          <Text style={styles.originalPrice}>${originalPrice.toFixed(2)}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  titleContainer: {
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '500',
    color: colors.background.light,
    marginVertical: spacing.xs,
  },
  tag: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#AD3026', // Discount color from Figma
  },
  customizable: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: colors.secondary.text,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  price: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '500',
    color: colors.background.light,
  },
  originalPrice: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: colors.secondary.text,
    textDecorationLine: 'line-through',
  },
});