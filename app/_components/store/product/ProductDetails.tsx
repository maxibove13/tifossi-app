import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Product } from '../../../_types/product';
import ProductInformation from './information/ProductInformation';

interface ProductSpec {
  label: string;
  value: string;
}

interface ProductDetailsProps {
  product: Product;
  onAddToCart?: (product: Product, quantity: number) => void;
}

/**
 * ProductDetails component
 * Main container for product details inside SwipeableEdge
 */
export default function ProductDetails({ product, onAddToCart }: ProductDetailsProps) {
  const [quantity] = useState(1);
  const [_isLoading, setIsLoading] = useState(false);

  // Convert labels to tags for display
  const _productTags = product.status ? [product.status] : [];

  // Get the first color name or default
  const colorValue =
    product.colors && product.colors.length > 0 ? product.colors[0].colorName : 'Negro';

  // Mock specs data
  const productSpecs: ProductSpec[] = [
    { label: 'Material', value: 'Algodón' },
    { label: 'Color', value: colorValue },
    { label: 'Tamaño', value: product.size || 'M' },
    { label: 'Peso', value: '250g' },
  ];

  // Mock product details
  const productDetails = [
    'Alta calidad y durabilidad',
    'Fabricado con materiales sostenibles',
    'Diseñado en España',
    'Apto para lavado a máquina',
  ];

  // Mock return policy
  const returnPolicy =
    'Puedes devolver este producto en un plazo de 30 días si no estás satisfecho con tu compra. Consulta nuestra política de devoluciones para más información.';

  // Handle add to cart
  const _handleAddToCart = async () => {
    if (onAddToCart) {
      setIsLoading(true);
      try {
        await onAddToCart(product, quantity);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ProductInformation
        sku={product.id}
        specs={productSpecs}
        details={productDetails}
        returnPolicy={returnPolicy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
