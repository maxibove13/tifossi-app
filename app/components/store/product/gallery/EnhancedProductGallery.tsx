import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  ImageSourcePropType,
  ScrollView
} from 'react-native';
import { colors } from '../../../../styles/colors';
import { Product } from '../../../../types/product';
import { spacing } from '../../../../styles/spacing';
import ProductViewGallery from './views/ProductViewGallery';

interface EnhancedProductGalleryProps {
  product: Product;
  selectedColor?: string;
  onColorChange?: (color: string) => void;
}

// Define a type for the product images we'll use
interface ProductImage {
  source: ImageSourcePropType;
  color?: string;
}

const { width } = Dimensions.get('window');
const COLOR_OPTION_SIZE = 96;
const ITEM_WIDTH = width;
const IMAGE_HEIGHT = ITEM_WIDTH;

function EnhancedProductGallery({ 
  product, 
  selectedColor,
  onColorChange
}: EnhancedProductGalleryProps) {
  // Use the first color as default if none is selected
  const [activeColor, setActiveColor] = useState<string>(
    selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0].color : '')
  );
  
  const colorSliderRef = useRef<ScrollView>(null);
  
  // Create product images array with proper handling of both string and required image sources
  const productImages: ProductImage[] = product.colors ? 
    product.colors.map(colorObj => ({
      // Use color-specific image if available, otherwise use the default product image
      source: colorObj.image ? (colorObj.image as ImageSourcePropType) : (product.image as ImageSourcePropType),
      color: colorObj.color
    })) : 
    [{ source: product.image as ImageSourcePropType }];
  
  // Get images for the selected color
  const activeColorImages = productImages.filter(
    img => !img.color || img.color === activeColor
  );
  
  // If we don't have any images for the active color, use all images
  const imagesToDisplay = activeColorImages.length > 0 ? activeColorImages : productImages;
  
  // Get the main product image for the selected color
  const mainProductImage = imagesToDisplay[0];
  
  const handleColorChange = (color: string) => {
    setActiveColor(color);
    
    if (onColorChange) {
      onColorChange(color);
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Color Slider at the top - following the product_screen_1.json specification */}
      {product.colors && product.colors.length > 0 && (
        <View style={styles.colorSliderContainer}>
          <ScrollView
            ref={colorSliderRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorSliderContent}
          >
            {product.colors.map((colorObj, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorOption,
                  activeColor === colorObj.color && styles.selectedColorOption
                ]}
                onPress={() => handleColorChange(colorObj.color)}
                activeOpacity={0.7}
              >
                <Image 
                  source={colorObj.image ? (colorObj.image as ImageSourcePropType) : (product.image as ImageSourcePropType)}
                  style={styles.colorThumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Use the ProductViewGallery component to display different views of the same image */}
      <ProductViewGallery 
        imageSource={mainProductImage.source}
        onImagePress={() => console.log('Image pressed')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  
  // Color slider styles
  colorSliderContainer: {
    height: 130, // Provides enough space for 96px images + padding
    backgroundColor: colors.background.light,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  colorSliderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  colorOption: {
    width: COLOR_OPTION_SIZE,
    height: COLOR_OPTION_SIZE,
    borderRadius: 2, // Per the design spec
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectedColorOption: {
    borderColor: colors.primary || '#0C0C0C',
  },
  colorThumbnail: {
    width: '100%', 
    height: '100%',
  },
  
  // Product images section handled by ProductViewGallery component
});

// Add explicit default export
export default EnhancedProductGallery;

// Metadata for the router (export to satisfy the linter)
export const componentExport = {
  name: 'EnhancedProductGallery',
  version: '1.0.0'
}; 