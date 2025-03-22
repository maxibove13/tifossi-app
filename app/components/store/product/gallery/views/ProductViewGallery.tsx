import React, { useState, useRef } from 'react';
import { 
  StyleSheet,
  ScrollView, 
  Pressable,
  ImageSourcePropType,
  Dimensions,
  Animated
} from 'react-native';
import { colors } from '../../../../../styles/colors';

interface ProductViewGalleryProps {
  /**
   * Main image source for the product
   */
  imageSource: ImageSourcePropType;
  /**
   * Optional callback when image is pressed
   */
  onImagePress?: () => void;
}

/**
 * ProductViewGallery displays three transformed views of the same product image
 * in a vertical scrollable gallery:
 * 1. Normal view - no transformation
 * 2. Zoomed view with horizontal flip
 * 3. More zoomed view - no flip
 */
function ProductViewGallery({ imageSource, onImagePress }: ProductViewGalleryProps) {
  // Get window dimensions for responsive sizing
  const { width } = Dimensions.get('window');
  
  // Track which image is being zoomed
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);
  
  // Animation values for each image
  const scaleAnimations = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current
  ];
  
  // Handle image press - toggle zoom effect
  const handleImagePress = (index: number) => {
    // Toggle zoom state
    const newZoomIndex = zoomedImageIndex === index ? null : index;
    setZoomedImageIndex(newZoomIndex);
    
    // Animate scale for the pressed image
    Animated.timing(scaleAnimations[index], {
      toValue: newZoomIndex === index ? 1.2 : 1,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    // Call the provided callback if any
    if (onImagePress) {
      onImagePress();
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
    >
      {/* View 1: Original image - no transformation */}
      <Pressable 
        style={styles.imageWrapper}
        onPress={() => handleImagePress(0)}
      >
        <Animated.Image
          source={imageSource}
          style={[
            styles.image,
            { transform: [{ scale: scaleAnimations[0] }] }
          ]}
          resizeMode="cover"
        />
      </Pressable>

      {/* View 2: Zoomed in and flipped horizontally */}
      <Pressable 
        style={styles.imageWrapper}
        onPress={() => handleImagePress(1)}
      >
        <Animated.Image
          source={imageSource}
          style={[
            styles.image,
            styles.zoomedImage,
            { transform: [
              { scale: Animated.multiply(1.5, scaleAnimations[1]) }, 
              { scaleX: -1 } // Horizontal flip
            ]}
          ]}
          resizeMode="cover"
        />
      </Pressable>

      {/* View 3: More zoomed in, no flip */}
      <Pressable 
        style={styles.imageWrapper}
        onPress={() => handleImagePress(2)}
      >
        <Animated.Image
          source={imageSource}
          style={[
            styles.image,
            { transform: [{ scale: Animated.multiply(2.0, scaleAnimations[2]) }] }
          ]}
          resizeMode="cover"
        />
      </Pressable>
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
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  zoomedImage: {
    // Base styles - transform is applied dynamically
  },
});

// Export component
export default ProductViewGallery;

// Metadata for the router (export to satisfy the linter)
export const componentExport = {
  name: 'ProductViewGallery',
  version: '1.0.0'
};