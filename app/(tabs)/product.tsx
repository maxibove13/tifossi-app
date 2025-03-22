import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import ProductHeader from '../components/store/layout/ProductHeader'
import EnhancedProductGallery from '../components/store/product/gallery/EnhancedProductGallery'
import SwipeableEdge from '../components/store/product/swipeable/SwipeableEdge'
import ProductData from '../data/products'
import { colors } from '../styles/colors'
import { isProduct, Product } from '../types/product'
import { useState } from 'react'
import { StatusBar } from 'expo-status-bar'

export default function ProductScreen() {
  const { id } = useLocalSearchParams()
  // const router = useRouter() - Will use when we implement navigation to related products
  const product = ProductData.getProductById(id as string)

  // State for selected color
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product?.colors && product.colors.length > 0 ? product.colors[0].color : undefined
  )

  // This data will be used in future implementations
  // Keeping these as comments for future reference
  /*
  // Get related products data
  const relatedProducts = ProductData.getRecommendedProducts()
    .filter(p => p.id !== product?.id)
    .slice(0, 5)
    
  // Get recommended products data
  const recommendedProducts = ProductData.getHighlightedProducts()
    .filter(p => p.id !== product?.id)
    .slice(0, 5)
    
  // Get trending products data
  const trendingProducts = ProductData.getTrendingProducts()
    .filter(p => p.id !== product?.id)
    .slice(0, 5)
  */

  const handleAddToCart = async (product: Product, quantity: number) => {
    // Add to cart logic
    console.log('Added to cart', {
      product: product.id,
      quantity,
    })
    
    return Promise.resolve() // Return a resolved promise for the async function
  }
  
  // Will be used when product recommendations are implemented
  /* 
  const handleProductPress = (productId: string) => {
    router.push(`/(tabs)/product?id=${productId}`)
  }
  */

  const handleSupportAction = (action: 'chat' | 'faq' | 'call') => {
    console.log('Support action:', action)
    // Handle support actions
  }
  
  const handleViewMore = (section: string) => {
    console.log('View more:', section)
    // Navigate to section view
  }

  if (!product || !isProduct(product)) {
    return (
      <View style={styles.container}>
        <ProductHeader title="Product not found" />
      </View>
    )
  }

  // Format description - check if it's an array before joining
  const description = Array.isArray(product.description) 
    ? product.description.join(' ') 
    : product.description;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ProductHeader title={product.title} />
      
      <View style={styles.mainContent}>
        <EnhancedProductGallery 
          product={product}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
        />
        
        <SwipeableEdge
          product={{
            name: product.title,
            isCustomizable: product.isCustomizable,
            isDiscounted: !!product.discountedPrice,
            currentPrice: `$${product.discountedPrice || product.price}`,
            originalPrice: product.discountedPrice ? `$${product.price}` : undefined,
            description: description,
            sku: product.id
          }}
          onAddToCart={() => handleAddToCart(product, 1)}
          onViewMore={handleViewMore}
          onSupportAction={handleSupportAction}
          onExpandedChange={(expanded) => console.log('Panel expanded:', expanded)}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  mainContent: {
    flex: 1,
    backgroundColor: colors.background.light,
    position: 'relative', // For positioning SwipeableEdge
  },
})

// Metadata for the router (export to satisfy the linter)
export const screenExport = {
  name: 'ProductScreen',
  version: '1.0.0'
};