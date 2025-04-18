import { StyleSheet, View, ScrollView, Pressable } from 'react-native'
import { useState } from 'react'
import ProductImage from '../image/ProductImage'

type Props = {
  product: {
    title: string
    images: string[]
  }
}

export default function ColorSlider({ product }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {product.images.map((image, index) => (
          <Pressable 
            key={`${image}-${index}`}
            onPress={() => setSelectedIndex(index)}
            style={[
              styles.colorButton,
              selectedIndex === index && styles.selectedColor
            ]}
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
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorButton: {
    borderRadius: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectedColor: {
    borderColor: '#0C0C0C',
  },
}) 