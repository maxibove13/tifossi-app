import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Image, 
  TouchableOpacity, 
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

// Define placeholder for backward compatibility
// This will be removed when all products are migrated to the new format

// Size constants
const COLOR_OPTION_SIZE = 96;

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
  
  // Get the color object for the selected color
  const selectedColorObject = product.colors?.find(c => c.color === activeColor);
  
  // Get all available images for the selected color (main + additional)
  // Only include images that actually exist (don't add placeholders)
  const productImages: ImageSourcePropType[] = [];
  
  if (selectedColorObject?.images) {
    // Add the main image
    productImages.push(selectedColorObject.images.main as ImageSourcePropType);
    
    // Add additional images if available
    if (selectedColorObject.images.additional && selectedColorObject.images.additional.length > 0) {
      selectedColorObject.images.additional.forEach(img => {
        if (img) {
          productImages.push(img as ImageSourcePropType);
        }
      });
    }
  } else {
    // Fallback to product main image if no color-specific images
    productImages.push(product.image as ImageSourcePropType);
  }
  
  const handleColorChange = (color: string) => {
    setActiveColor(color);
    
    if (onColorChange) {
      onColorChange(color);
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Color Slider at the top - following the product_screen_1.json specification */}
      {product.colors && product.colors.length > 1 && (
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
                  source={colorObj.images?.main ? (colorObj.images.main as ImageSourcePropType) : (product.image as ImageSourcePropType)}
                  style={styles.colorThumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Use the ProductViewGallery component to display all images for the selected color */}
      <ProductViewGallery 
        images={productImages}
        onImagePress={(index) => console.log(`Image ${index} pressed`)}
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