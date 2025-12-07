import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import ProductImage from './image/ProductImage';
import { Product } from '../../../_types/product';

type Props = {
  product: Product;
  onColorChange?: (colorIndex: number) => void;
};

export default function ColorSlider({ product, onColorChange }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Get color images from product data
  const colorImages =
    product.colors?.filter((color) => color.images?.main).map((color) => color.images!.main) ?? [];

  // If no color images, fall back to frontImage or return null
  if (colorImages.length === 0) {
    if (!product.frontImage) return null;
    // Show single frontImage if no colors
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.colorButton, styles.selectedColor]}>
            <ProductImage source={product.frontImage} size={96} />
          </View>
        </View>
      </View>
    );
  }

  const handleColorPress = (index: number) => {
    setSelectedIndex(index);
    onColorChange?.(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {colorImages.map((image, index) => (
          <Pressable
            key={`color-${index}`}
            onPress={() => handleColorPress(index)}
            style={[styles.colorButton, selectedIndex === index && styles.selectedColor]}
          >
            <ProductImage
              source={image}
              size={96}
              overlay={selectedIndex !== index}
              overlayOpacity={0.1}
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 112,
    backgroundColor: '#FBFBFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  colorButton: {
    width: 96,
    height: 96,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectedColor: {
    borderColor: '#0C0C0C',
  },
});
