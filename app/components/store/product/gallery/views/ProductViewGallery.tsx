import React, { useState } from 'react';
import { 
  StyleSheet,
  ScrollView, 
  Pressable,
  ImageSourcePropType,
  Animated,
  Dimensions
} from 'react-native';
import { colors } from '../../../../../styles/colors';

interface ProductViewGalleryProps {
  /**
   * Array of product images to display in the gallery
   */
  images: ImageSourcePropType[];
  /**
   * Optional callback when image is pressed
   */
  onImagePress?: (index: number) => void;
}

/**
 * ProductViewGallery displays multiple product images in a vertical scrollable gallery
 */
function ProductViewGallery({ images, onImagePress }: ProductViewGalleryProps) {
  // Track which image is being zoomed
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  
  // Get window width for responsive image sizing
  const { width } = Dimensions.get('window');
  
  // Handle image press
  const handleImagePress = (index: number) => {
    setActiveImageIndex(index === activeImageIndex ? null : index);
    
    // Call the provided callback if any
    if (onImagePress) {
      onImagePress(index);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
    >
      {/* Display each product image in sequence */}
      {images.map((image, index) => (
        <Pressable 
          key={`product-view-${index}`}
          style={[
            styles.imageWrapper,
            { width, height: width }
          ]}
          onPress={() => handleImagePress(index)}
        >
          <Animated.Image
            source={image}
            style={[
              styles.image,
              activeImageIndex === index && styles.activeImage
            ]}
            resizeMode="cover"
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  content: {
    flexDirection: 'column',
  },
  imageWrapper: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  activeImage: {
    // Add a subtle highlight effect when image is active/selected
    opacity: 0.9,
    borderWidth: 2,
    borderColor: colors.primary,
  },
});

// Export component
export default ProductViewGallery;

// Metadata for the router (export to satisfy the linter)
export const componentExport = {
  name: 'ProductViewGallery',
  version: '1.0.0'
};