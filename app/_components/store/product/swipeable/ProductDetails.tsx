import React from 'react';
import { StyleSheet, View, Text, TextStyle, ViewStyle } from 'react-native';
import { colors, spacing, typography } from './styles';
import { defaultReturnPolicy } from '../../../../_data/products';

interface ProductDetailsProps {
  isCustomizable?: boolean;
  warranty?: string;
  dimensions?: {
    height?: string;
    depth?: string;
    width?: string;
  };
  sku?: string;
  shortDescription?:
    | string
    | {
        line1: string;
        line2: string;
      };
  longDescription?: string | string[];
  returnPolicy?: string;
}

export default function ProductDetails({
  isCustomizable,
  warranty,
  dimensions,
  sku,
  shortDescription,
  longDescription,
  returnPolicy, // eslint-disable-line unused-imports/no-unused-vars
}: ProductDetailsProps) {
  // Only combine dimensions if they exist
  const dimensionsText = dimensions ? Object.values(dimensions).filter(Boolean).join(' | ') : '';

  return (
    <View style={styles.container}>
      {/* Specifications */}
      <View style={styles.section}>
        <Text style={styles.specifications}>
          {isCustomizable ? 'Personalizable\n' : ''}
          {warranty ? `Garantía: ${warranty}\n` : ''}
          {dimensionsText ? `Medidas: ${dimensionsText}` : ''}
        </Text>
        {sku && <Text style={styles.sku}>SKU: {sku}</Text>}
      </View>

      {/* Product Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INFORMACIÓN DEL PRODUCTO</Text>
        <Text style={styles.sectionText}>
          {longDescription
            ? typeof longDescription === 'string'
              ? longDescription
              : longDescription.join('\n')
            : typeof shortDescription === 'string'
              ? shortDescription
              : shortDescription
                ? `${shortDescription.line1}\n${shortDescription.line2}`
                : ''}
        </Text>
      </View>

      {/* Return Policy - Always show and use the default policy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>POLÍTICA DE DEVOLUCIÓN Y REEMBOLSO</Text>
        <Text style={styles.sectionText}>{defaultReturnPolicy}</Text>
      </View>
    </View>
  );
}

// Define type-safe styles
type Styles = {
  container: ViewStyle;
  section: ViewStyle;
  specifications: TextStyle;
  sku: TextStyle;
  sectionTitle: TextStyle;
  sectionText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.xs,
  },
  specifications: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '500',
    fontSize: typography.body.fontSize,
    lineHeight: 20,
    color: colors.primary.text,
  },
  sku: {
    fontFamily: typography.small.fontFamily,
    fontWeight: '400',
    fontSize: typography.small.fontSize,
    lineHeight: 14,
    color: colors.primary.text,
  },
  sectionTitle: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '400',
    fontSize: typography.body.fontSize,
    lineHeight: 16,
    color: colors.primary.text,
    paddingBottom: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary.text,
    alignSelf: 'flex-start',
  },
  sectionText: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '400',
    fontSize: typography.body.fontSize,
    lineHeight: 20,
    color: colors.primary.text,
  },
});
