import React from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  ImageSourcePropType,
  Animated,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { colors } from '../../../../../_styles/colors';

interface ProductViewGalleryProps {
  /** Array of product images to display in the gallery */
  images: ImageSourcePropType[];
  /** Optional callback when image is pressed */
  onImagePress?: (index: number) => void;
  /** Currently active image index for indicator support */
  activeIndex?: number;
  /** Notify parent when visible image changes (after scroll) */
  onActiveIndexChange?: (index: number) => void;
  /** Optional testID override for the ScrollView */
  testID?: string;
}

function resolveImageSource(image: ImageSourcePropType) {
  if (typeof image === 'string') {
    return { uri: image };
  }
  return image;
}

/**
 * ProductViewGallery displays multiple product images in a horizontal, paging-enabled gallery.
 */
function ProductViewGallery({
  images,
  onImagePress,
  activeIndex = 0,
  onActiveIndexChange,
  testID,
}: ProductViewGalleryProps) {
  const { width } = Dimensions.get('window');

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = event.nativeEvent;
    const index = Math.round(contentOffset.x / width);
    if (onActiveIndexChange) {
      onActiveIndexChange(index);
    }
  };

  const handleImagePress = (index: number) => {
    onImagePress?.(index);
  };

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={[styles.content, { width: width * Math.max(images.length, 1) }]}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      scrollEventThrottle={16}
      testID={testID}
    >
      {images.map((image, index) => (
        <Pressable
          key={`product-view-${index}`}
          testID={`gallery-image-${index}`}
          style={[styles.imageWrapper, { width }]}
          onPress={() => handleImagePress(index)}
          accessibilityRole="imagebutton"
          accessibilityState={{ selected: activeIndex === index }}
        >
          <Animated.Image
            source={resolveImageSource(image)}
            style={[styles.image, activeIndex === index && styles.activeImage]}
            resizeMode="cover"
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    backgroundColor: colors.background.light,
  },
  content: {
    flexDirection: 'row',
  },
  imageWrapper: {
    overflow: 'hidden',
    height: Dimensions.get('window').width,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  activeImage: {
    opacity: 0.95,
    borderWidth: 2,
    borderColor: colors.primary,
  },
});

export default ProductViewGallery;

export const componentExport = {
  name: 'ProductViewGallery',
  version: '1.0.0',
};
