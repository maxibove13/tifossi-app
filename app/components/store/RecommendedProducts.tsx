import { StyleSheet, View, ScrollView, Image, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ProductCardProps = {
  image: any;
  label?: string;
  title: string;
  price: string;
  discountedPrice?: string;
};

function ProductCard({ image, label, title, price, discountedPrice }: ProductCardProps) {
  return (
    <View style={styles.productCard}>
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.productImage} resizeMode="cover" />
        <Pressable style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={20} color="#0C0C0C" />
        </Pressable>
      </View>
      <View style={styles.textContent}>
        {label && (
          <Text style={[
            styles.label,
            { color: label === 'Nuevo' ? '#367C39' : '#AD3026' }
          ]}>
            {label}
          </Text>
        )}
        <Text style={styles.productTitle}>{title}</Text>
        <View style={styles.priceContainer}>
          {discountedPrice && (
            <Text style={styles.originalPrice}>{price}</Text>
          )}
          <Text style={[
            styles.price,
            discountedPrice ? styles.discountedPrice : null
          ]}>
            {discountedPrice || price}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function RecommendedProducts() {
  const products = [
    {
      image: require('../../../assets/images/products/neceser-ball.png'),
      label: 'Descuento',
      title: 'Neceser Ball',
      price: '$590.00',
      discountedPrice: '$390.00',
    },
    {
      image: require('../../../assets/images/products/socks-white.png'),
      title: 'Mochila Classic',
      price: '$590.00',
    },
    {
      image: require('../../../assets/images/products/socks-white.png'),
      title: 'Neceser WX',
      price: '$590.00',
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recomendados para ti</Text>
        <Pressable>
          <Text style={styles.viewAllButton}>Ver Todo</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map((product, index) => (
          <ProductCard key={index} {...product} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    color: '#0C0C0C',
    fontFamily: 'Roboto',
  },
  viewAllButton: {
    fontSize: 12,
    lineHeight: 16,
    color: '#707070',
    textDecorationLine: 'underline',
    fontFamily: 'Inter',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  productCard: {
    width: 132,
    gap: 12,
  },
  imageContainer: {
    width: 132,
    height: 132,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  favoriteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter',
  },
  productTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#0C0C0C',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  priceContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  price: {
    fontSize: 12,
    lineHeight: 16,
    color: '#707070',
    fontFamily: 'Inter',
  },
  originalPrice: {
    fontSize: 12,
    lineHeight: 16,
    color: '#707070',
    textDecorationLine: 'line-through',
    fontFamily: 'Inter',
  },
  discountedPrice: {
    color: '#AD3026',
    flex: 1,
  },
}); 