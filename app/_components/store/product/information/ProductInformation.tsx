import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../swipeable/styles';

interface ProductSpec {
  label: string;
  value: string;
}

interface ProductInformationProps {
  sku: string;
  specs?: ProductSpec[];
  details?: string[];
  returnPolicy?: string;
}

/**
 * ProductInformation component
 * Displays product specifications, details, and return policy
 */
export default function ProductInformation({
  sku,
  specs = [],
  details = [],
  returnPolicy
}: ProductInformationProps) {
  return (
    <View style={styles.container}>
      {/* Product details */}
      <Text style={styles.sku}>SKU: {sku}</Text>
      
      <Text style={styles.detailsText}>
        {specs.map(spec => `${spec.label}: ${spec.value}`).join('\n')}
      </Text>
      
      {/* Information section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INFORMACIÓN DEL PRODUCTO</Text>
        <Text style={styles.sectionContent}>
          {details.join('. ')}
        </Text>
      </View>
      
      {/* Return policy section */}
      {returnPolicy && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>POLÍTICA DE DEVOLUCIÓN Y REEMBOLSO</Text>
          <Text style={styles.sectionContent}>
            {returnPolicy}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  sku: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: colors.background.light,
    marginBottom: spacing.md,
  },
  detailsText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: colors.background.light,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: colors.background.light,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  sectionContent: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: colors.background.light,
    lineHeight: 20,
  },
});