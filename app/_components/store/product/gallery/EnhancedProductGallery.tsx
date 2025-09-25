import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  ScrollView,
  Text,
} from 'react-native';
import { colors } from '../../../../_styles/colors';
import { Product } from '../../../../_types/product';
import { spacing } from '../../../../_styles/spacing';
import ProductViewGallery from './views/ProductViewGallery';

interface EnhancedProductGalleryProps {
  product: Product;
  selectedColor?: string;
  onColorChange?: (color: string) => void;
}

// Size constants
const COLOR_OPTION_SIZE = 96;

function EnhancedProductGallery({
  product,
  selectedColor,
  onColorChange,
}: EnhancedProductGalleryProps) {
  // Use the first color as default if none is selected
  const [activeColor, setActiveColor] = useState<string>(
    selectedColor ||
      (product.colors && product.colors.length > 0 ? product.colors[0].colorName : '')
  );

  // Reset activeColor when product or selectedColor changes
  useEffect(() => {
    setActiveColor(
      selectedColor ||
        (product.colors && product.colors.length > 0 ? product.colors[0].colorName : '')
    );
  }, [product.id, selectedColor, product.colors]);

  const colorSliderRef = useRef<ScrollView>(null);

  // Get the color object for the selected color
  const selectedColorObject = product.colors?.find((c) => c.colorName === activeColor);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // If no matching color object is found, use the first available color from this product
  useEffect(() => {
    const colors = product.colors;
    if (colors && colors.length > 0 && !selectedColorObject) {
      setActiveColor(colors[0].colorName);
    }
  }, [product.id, selectedColorObject, product.colors]);

  const productImages: ImageSourcePropType[] = useMemo(() => {
    const images: ImageSourcePropType[] = [];

    if (selectedColorObject?.images) {
      images.push(selectedColorObject.images.main as ImageSourcePropType);

      if (selectedColorObject.images.additional?.length) {
        selectedColorObject.images.additional.forEach((img) => {
          if (img) {
            images.push(img as ImageSourcePropType);
          }
        });
      }
    }

    if (images.length === 0 && product.frontImage) {
      images.push(product.frontImage as ImageSourcePropType);
    }

    return images;
  }, [product.frontImage, selectedColorObject]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [productImages.length]);

  const handleColorChange = (color: string) => {
    setActiveColor(color);
    setActiveImageIndex(0);

    if (onColorChange) {
      onColorChange(color);
    }
  };

  return (
    <View style={styles.container} testID="product-gallery-container">
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
                  activeColor === colorObj.colorName && styles.selectedColorOption,
                ]}
                onPress={() => handleColorChange(colorObj.colorName)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: activeColor === colorObj.colorName }}
                testID={`color-option-${colorObj.colorName.toLowerCase()}`}
              >
                <Image
                  source={
                    colorObj.images?.main
                      ? (colorObj.images.main as ImageSourcePropType)
                      : (product.frontImage as ImageSourcePropType)
                  }
                  style={styles.colorThumbnail}
                  resizeMode="cover"
                />
                <Text style={styles.colorLabel}>{colorObj.colorName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ProductViewGallery
        key={`product-gallery-${product.id}-${activeColor}`}
        images={productImages}
        onImagePress={(_index) => {
          /* Image pressed */
        }}
        activeIndex={activeImageIndex}
        onActiveIndexChange={setActiveImageIndex}
        testID="product-gallery"
      />

      {productImages.length > 1 && (
        <View style={styles.galleryIndicators}>
          {productImages.map((_, index) => (
            <View
              key={`indicator-${index}`}
              testID={`gallery-indicator-${index}`}
              style={[styles.indicatorDot, { opacity: activeImageIndex === index ? 0.9 : 0.3 }]}
            />
          ))}
        </View>
      )}
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
    backgroundColor: colors.background.light,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  colorSliderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  colorOption: {
    width: COLOR_OPTION_SIZE,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    backgroundColor: colors.background.light,
    alignItems: 'center',
  },
  selectedColorOption: {
    borderColor: colors.primary || '#0C0C0C',
  },
  colorThumbnail: {
    width: '100%',
    height: COLOR_OPTION_SIZE - 28,
  },
  colorLabel: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.primary,
    textAlign: 'center',
  },

  galleryIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  // Product images section handled by ProductViewGallery component
});

// Add explicit default export
export default EnhancedProductGallery;

// Metadata for the router (export to satisfy the linter)
export const componentExport = {
  name: 'EnhancedProductGallery',
  version: '1.0.0',
};
