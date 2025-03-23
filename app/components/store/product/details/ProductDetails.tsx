import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import ExpandableSection from './ExpandableSection'
import { fonts, fontSizes, lineHeights} from '../../../../styles/typography'
import { spacing } from '../../../../styles/spacing'
import { colors } from '../../../../styles/colors'
import { Product } from '../../../../types/product'

interface Section {
  title: string
  content: string | React.ReactNode
}

interface ProductDetailsProps {
  product: Product;
  sections?: Section[];
  darkMode?: boolean;
}

export default function ProductDetails({ product, sections = [], darkMode = false }: ProductDetailsProps) {
  // Format the product description
  const formatDescription = (
    longDescription?: string | string[], 
    shortDescription?: string | { line1: string; line2: string }
  ): string => {
    // First try to use longDescription
    if (longDescription) {
      if (Array.isArray(longDescription)) {
        return longDescription.join('\n\n')
      }
      return longDescription
    }
    
    // Fall back to shortDescription
    if (shortDescription) {
      if (typeof shortDescription === 'object') {
        return `${shortDescription.line1}\n\n${shortDescription.line2}`
      }
      return shortDescription
    }
    
    // Default description if none provided
    return 'Sin descripción disponible'
  }
  
  // Default sections if none provided
  const defaultSections = [
    {
      title: 'INFORMACIÓN DEL PRODUCTO',
      content: formatDescription(product.longDescription, product.shortDescription)
    },
    {
      title: 'POLÍTICA DE DEVOLUCIÓN Y REEMBOLSO',
      content: 'Si no está satisfecho con su compra, por favor póngase en contacto con nosotros para solicitar una devolución del producto en un plazo de 60 días luego de haberlo recibido. Los productos deben ser devueltos en el embalaje original en el que fueron entregados.'
    }
  ]
  
  const allSections = sections.length > 0 ? sections : defaultSections
  
  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      {product.isCustomizable && (
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, darkMode && styles.infoTextDark]}>Personalizable</Text>
          <Text style={[styles.infoText, darkMode && styles.infoTextDark]}>Garantía: 2 meses</Text>
          <Text style={[styles.infoText, darkMode && styles.infoTextDark]}>SKU: {product.id || '2001202104'}</Text>
        </View>
      )}
      
      {allSections.map((section, index) => (
        <ExpandableSection 
          key={index} 
          title={section.title} 
          initiallyExpanded={index === 0}
          darkMode={darkMode}
        >
          {typeof section.content === 'string' ? (
            <Text style={[styles.sectionContent, darkMode && styles.sectionContentDark]}>
              {section.content}
            </Text>
          ) : (
            section.content
          )}
        </ExpandableSection>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  containerDark: {
    backgroundColor: 'transparent',
  },
  infoSection: {
    marginBottom: spacing.lg,
  },
  infoText: {
    color: colors.secondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    lineHeight: lineHeights.md,
    marginBottom: spacing.xs,
  },
  infoTextDark: {
    color: colors.background.light,
  },
  sectionContent: {
    color: colors.secondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    lineHeight: lineHeights.md,
  },
  sectionContentDark: {
    color: '#B1B1B1', // Light gray as per Figma
  },
}) 