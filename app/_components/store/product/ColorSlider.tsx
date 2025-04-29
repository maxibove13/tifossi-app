import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import ProductImage from './image/ProductImage';
import { Product } from '../../../_types/product';

type Props = {
  product: Product;
};

export default function ColorSlider({ product: _product }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // For demo purposes, create an array of the same image
  const images = [
    require('../../../../assets/images/products/product_socks_0.png'),
    require('../../../../assets/images/products/product_socks_1.png'),
    require('../../../../assets/images/products/product_socks_2.png'),
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {images.map((image, index) => (
          <Pressable
            key={`${image}-${index}`}
            onPress={() => setSelectedIndex(index)}
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
    height: 112, // Account for padding and image size
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
