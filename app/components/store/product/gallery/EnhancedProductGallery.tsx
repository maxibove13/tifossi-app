import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  Dimensions, 
  ImageSourcePropType,
  Animated,
  Pressable
} from 'react-native';
import { colors } from '../../../../styles/colors';
import { Product } from '../../../../types/product';
import { spacing, radius } from '../../../../styles/spacing';
import { Ionicons } from '@expo/vector-icons';

interface EnhancedProductGalleryProps {
  product: Product;
  selectedColor?: string;
  onColorChange?: (color: string) => void;
}

// Define a type for the product images we'll use
interface ProductImage {
  source: ImageSourcePropType;
  color?: string;
  thumbnail?: ImageSourcePropType;
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width;
const THUMBNAIL_SIZE = 56;
const IMAGE_HEIGHT = ITEM_WIDTH * 1.25; // Adjusted for better aspect ratio

export default function EnhancedProductGallery({ 
  product, 
  selectedColor,
  onColorChange
}: EnhancedProductGalleryProps) {
  // Use the first color as default if none is selected
  const [activeColor, setActiveColor] = useState<string>(
    selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0].color : '')
  );
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList>(null);
  
  // Create product images array with proper handling of both string and required image sources
  const productImages: ProductImage[] = product.colors ? 
    product.colors.map(colorObj => ({
      source: product.image as ImageSourcePropType,
      color: colorObj.color,
      thumbnail: product.image as ImageSourcePropType
    })) : 
    [{ source: product.image as ImageSourcePropType }];
  
  // Get images for the selected color
  const activeColorImages = productImages.filter(
    img => !img.color || img.color === activeColor
  );
  
  // If we don't have any images for the active color, use all images
  const imagesToDisplay = activeColorImages.length > 0 ? activeColorImages : productImages;
  
  const handleColorChange = (color: string) => {
    setActiveColor(color);
    setActiveIndex(0); // Reset to first image when changing color
    
    // Scroll back to the start
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    
    if (onColorChange) {
      onColorChange(color);
    }
  };
  
  const handleImagePress = () => {
    // Toggle zoom effect with animation
    Animated.timing(scale, {
      toValue: isZoomed ? 1 : 1.5, 
      duration: 300,
      useNativeDriver: true
    }).start();
    
    setIsZoomed(!isZoomed);
  };
  
  const handleScroll = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };
  
  const scrollToImage = (index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ 
        offset: index * ITEM_WIDTH, 
        animated: true 
      });
    }
    setActiveIndex(index);
  };
  
  return (
    <View style={styles.container}>
      {/* Main image gallery */}
      <View style={styles.galleryContainer}>
        <FlatList
          ref={flatListRef}
          horizontal
          data={imagesToDisplay}
          keyExtractor={(item, index) => `${item.color || ''}-${index}`}
          renderItem={({ item }) => (
            <Pressable 
              style={styles.imageContainer}
              onPress={handleImagePress}
            >
              <Animated.Image
                source={item.source}
                style={[
                  styles.image,
                  { transform: [{ scale: scale }] }
                ]}
                resizeMode="cover"
              />
            </Pressable>
          )}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
        />
        
        {/* Image slide indicators */}
        {imagesToDisplay.length > 1 && (
          <View style={styles.indicatorContainer}>
            {imagesToDisplay.map((_, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.indicator,
                  activeIndex === index && styles.indicatorActive
                ]}
                onPress={() => scrollToImage(index)}
              />
            ))}
          </View>
        )}
      </View>
      
      {/* Color options */}
      {product.colors && product.colors.length > 1 && (
        <View style={styles.colorSection}>
          <View style={styles.colorContainer}>
            {product.colors.map((colorObj, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorOption,
                  { backgroundColor: colorObj.color },
                  activeColor === colorObj.color && styles.selectedColor
                ]}
                onPress={() => handleColorChange(colorObj.color)}
                activeOpacity={0.7}
              >
                {activeColor === colorObj.color && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      {/* Thumbnail gallery for quick navigation */}
      {imagesToDisplay.length > 1 && (
        <FlatList
          horizontal
          data={imagesToDisplay}
          keyExtractor={(item, index) => `thumb-${item.color || ''}-${index}`}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.thumbnailContainer,
                activeIndex === index && styles.selectedThumbnail,
              ]}
              onPress={() => scrollToImage(index)}
            >
              <Image 
                source={item.thumbnail || item.source}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  galleryContainer: {
    position: 'relative',
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    width: 16,
    backgroundColor: colors.primary,
  },
  colorSection: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  thumbnailList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  thumbnailContainer: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectedThumbnail: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
}); 