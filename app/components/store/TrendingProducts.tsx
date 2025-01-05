import { StyleSheet, View, ScrollView, Image, Text, Pressable } from 'react-native';

type ProductCardProps = {
  image: any;
  title: string;
  price: string;
};

function ProductCard({ image, title, price }: ProductCardProps) {
  return (
    <View style={styles.productCard}>
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.productImage} resizeMode="cover" />
      </View>
      <View style={styles.textContent}>
        <Text style={styles.productTitle}>{title}</Text>
        <Text style={styles.price}>{price}</Text>
      </View>
    </View>
  );
}

export default function TrendingProducts() {
  const products = [
    {
      image: require('../../../assets/images/products/socks-white.png'),
      title: 'Regular Black',
      price: '$590.00',
    },
    {
      image: require('../../../assets/images/products/socks-white.png'),
      title: 'Relaxed Black',
      price: '$590.00',
    },
    {
      image: require('../../../assets/images/products/socks-white.png'),
      title: 'Cap V3',
      price: '$590.00',
    },
    {
      image: require('../../../assets/images/products/socks-white.png'),
      title: 'Relaxed Classic',
      price: '$590.00',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tendencias</Text>
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
    width: 134,
    gap: 8,
  },
  imageContainer: {
    width: 134,
    height: 256,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  textContent: {
    gap: 4,
  },
  productTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#0C0C0C',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  price: {
    fontSize: 14,
    lineHeight: 20,
    color: '#707070',
    fontFamily: 'Inter',
  },
}); 