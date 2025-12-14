import React from 'react';
import { StyleSheet, View, Pressable, ImageSourcePropType, Image, Dimensions } from 'react-native';
import { colors } from '../../../../../_styles/colors';

// Image height based on Figma: 318.33px for 375px width
const IMAGE_HEIGHT = 318;

interface ProductViewGalleryProps {
  images: ImageSourcePropType[];
  onImagePress?: (index: number) => void;
  testID?: string;
}

function resolveImageSource(image: ImageSourcePropType) {
  if (typeof image === 'string') {
    return { uri: image };
  }
  return image;
}

/**
 * ProductViewGallery displays product images in a vertical stack.
 */
function ProductViewGallery({ images, onImagePress, testID }: ProductViewGalleryProps) {
  const { width } = Dimensions.get('window');

  return (
    <View style={styles.container} testID={testID}>
      {images.map((image, index) => (
        <Pressable
          key={`product-view-${index}`}
          testID={`gallery-image-${index}`}
          style={[styles.imageWrapper, { width, height: IMAGE_HEIGHT }]}
          onPress={() => onImagePress?.(index)}
          accessibilityRole="imagebutton"
        >
          <Image source={resolveImageSource(image)} style={styles.image} resizeMode="cover" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.light,
  },
  imageWrapper: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default ProductViewGallery;
