import React from 'react';
import { StyleSheet, View, Text, TextStyle, ViewStyle } from 'react-native';
import { colors, spacing, typography } from './styles';

interface ProductDetailsProps {
  isCustomizable?: boolean;
  warranty?: string;
  dimensions?: {
    height?: string;
    depth?: string;
    width?: string;
  };
  sku?: string;
  description?: string;
  returnPolicy?: string;
}

export default function ProductDetails({
  isCustomizable = false,
  warranty = '2 meses',
  dimensions = {
    height: '12cm alto',
    depth: '12cm profundidad',
    width: '24cm ancho',
  },
  sku = '2001202104',
  description = 'Tiffosi le ofrece un producto altamente confeccionado. Un diseño a medida para el deportista. Productos personalizados.',
  returnPolicy = 'Si no está satisfecho con su compra, por favor póngase en contacto con nosotros para solicitar una devolución del producto en un plazo de 60 días luego de haberlo recibido. Los productos deben ser devueltos en el embalaje original en el que fueron entregados.'
}: ProductDetailsProps) {
  // Combine dimensions into a formatted string
  const dimensionsText = Object.values(dimensions)
    .filter(Boolean)
    .join(' | ');

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
        <Text style={styles.sectionText}>{description}</Text>
      </View>

      {/* Return Policy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>POLÍTICA DE DEVOLUCIÓN Y REEMBOLSO</Text>
        <Text style={styles.sectionText}>{returnPolicy}</Text>
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
    gap: spacing.sm,
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
    color: colors.primary.text,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '400',
    fontSize: typography.body.fontSize,
    color: colors.primary.text,
    marginBottom: spacing.xs,
  },
  sectionText: {
    fontFamily: typography.body.fontFamily,
    fontWeight: '400',
    fontSize: typography.body.fontSize,
    lineHeight: 20,
    color: colors.primary.text,
  },
});