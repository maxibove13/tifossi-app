import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Product } from '../../../types/product';
import ProductHeader from './header/ProductHeader';
import AddToCartButton from './header/AddToCartButton';
import ProductInformation from './information/ProductInformation';
import ProductListsContainer from './lists/ProductListsContainer';
import SupportSection from './support/SupportSection';

interface ProductSpec {
  label: string;
  value: string;
}

interface SupportOption {
  title: string;
  description: string;
  onPress: () => void;
  icon?: React.ReactNode;
}

interface ProductDetailsProps {
  product: Product;
  relatedProducts?: Product[];
  recommendedProducts?: Product[];
  trendingProducts?: Product[];
  onAddToCart?: (product: Product, quantity: number) => void;
  onProductPress?: (productId: string) => void;
}

/**
 * ProductDetails component
 * Main container for product details inside SwipeableEdge
 */
export default function ProductDetails({
  product,
  relatedProducts = [],
  recommendedProducts = [],
  trendingProducts = [],
  onAddToCart,
  onProductPress
}: ProductDetailsProps) {
  const [quantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Convert labels to tags for display
  const productTags = product.status ? [product.status] : [];
  
  // Get the first color name or default
  const colorValue = product.colors && product.colors.length > 0 
    ? product.colors[0].color 
    : 'Negro';
  
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
  const returnPolicy = 'Puedes devolver este producto en un plazo de 30 días si no estás satisfecho con tu compra. Consulta nuestra política de devoluciones para más información.';
  
  // Mock support options
  const supportOptions: SupportOption[] = [
    {
      title: 'Chat en vivo',
      description: 'Habla con nuestro equipo de soporte',
      onPress: () => console.log('Chat pressed'),
    },
    {
      title: 'Preguntas frecuentes',
      description: 'Consulta las preguntas más comunes',
      onPress: () => console.log('FAQ pressed'),
    }
  ];
  
  // Handle add to cart
  const handleAddToCart = async () => {
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
      {/* Product Header */}
      <ProductHeader
        title={product.title}
        price={product.price}
        originalPrice={product.discountedPrice}
        tags={productTags}
      />
      
      {/* Add to Cart Button */}
      <AddToCartButton
        onPress={handleAddToCart}
        isLoading={isLoading}
        quantity={quantity}
      />
      
      {/* Product Information */}
      <ProductInformation
        sku={product.id}
        specs={productSpecs}
        details={productDetails}
        returnPolicy={returnPolicy}
      />
      
      {/* Product Lists */}
      <ProductListsContainer
        relatedProducts={relatedProducts}
        recommendedProducts={recommendedProducts}
        trendingProducts={trendingProducts}
        onProductPress={onProductPress}
      />
      
      {/* Support Section */}
      <SupportSection
        options={supportOptions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
}); 