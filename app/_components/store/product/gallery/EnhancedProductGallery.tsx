import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  ScrollView,
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
  // Filter out inactive colors as a safety net (should already be filtered by backend)
  const activeColors = useMemo(
    () => product.colors?.filter((color) => color.isActive !== false) || [],
    [product.colors]
  );

  // Use the first color as default if none is selected
  const [activeColor, setActiveColor] = useState<string>(
    selectedColor || (activeColors.length > 0 ? activeColors[0].colorName : '')
  );

  // Reset activeColor when product or selectedColor changes
  useEffect(() => {
    setActiveColor(selectedColor || (activeColors.length > 0 ? activeColors[0].colorName : ''));
  }, [product.id, selectedColor, activeColors]);

  // Get the color object for the selected color
  const selectedColorObject = activeColors.find((c) => c.colorName === activeColor);

  // If no matching color object is found, use the first available color from this product
  useEffect(() => {
    if (activeColors.length > 0 && !selectedColorObject) {
      setActiveColor(activeColors[0].colorName);
    }
  }, [product.id, selectedColorObject, activeColors]);

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

  const handleColorChange = (color: string) => {
    setActiveColor(color);
    onColorChange?.(color);
  };

  return (
    <View style={styles.container} testID="product-gallery-container">
      {activeColors.length > 1 && (
        <View style={styles.colorSliderContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorSliderContent}
          >
            {activeColors.map((colorObj, index) => (
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
                      ? typeof colorObj.images.main === 'string'
                        ? { uri: colorObj.images.main }
                        : colorObj.images.main
                      : typeof product.frontImage === 'string'
                        ? { uri: product.frontImage }
                        : product.frontImage
                  }
                  style={styles.colorThumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ProductViewGallery
        key={`product-gallery-${product.id}-${activeColor}`}
        images={productImages}
        testID="product-gallery"
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
    backgroundColor: colors.background.light,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  colorSliderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  colorOption: {
    width: COLOR_OPTION_SIZE,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    backgroundColor: colors.background.light,
  },
  selectedColorOption: {
    borderColor: colors.primary || '#0C0C0C',
  },
  colorThumbnail: {
    width: '100%',
    height: COLOR_OPTION_SIZE,
  },
});

// Add explicit default export
export default EnhancedProductGallery;

// Metadata for the router (export to satisfy the linter)
export const componentExport = {
  name: 'EnhancedProductGallery',
  version: '1.0.0',
};
