import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ProductCardProps = {
  image: any;
  label?: string;
  title: string;
  isCustomizable?: boolean;
  price: string;
  discountedPrice?: string;
  colors?: string[];
  discount?: string;
};

function ProductCard({
  image,
  label,
  title,
  isCustomizable,
  price,
  discountedPrice,
  colors,
  discount,
}: ProductCardProps) {
  return (
    <View style={styles.productCard}>
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.productImage} resizeMode="cover" />
        <Pressable style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={20} color="#0C0C0C" />
        </Pressable>
        {discount && (
          <View style={styles.discountLabel}>
            <Text style={styles.discountText}>{discount}</Text>
          </View>
        )}
      </View>
      <View style={styles.textContent}>
        <Text style={[
          styles.label,
          { color: label === 'Nuevo' ? '#367C39' : label === 'Destacado' ? '#AD3026' : '#AD3026' }
        ]}>
          {label}
        </Text>
        <Text style={styles.productTitle}>{title}</Text>
        {isCustomizable && (
          <Text style={styles.customizable}>Personalizable</Text>
        )}
        <View style={styles.priceContainer}>
          {discountedPrice ? (
            <>
              <Text style={styles.originalPrice}>{price}</Text>
              <Text style={styles.discountedPrice}>{discountedPrice}</Text>
            </>
          ) : (
            <Text style={styles.price}>{price}</Text>
          )}
        </View>
        {colors && (
          <View style={styles.colorsContainer}>
            {colors.map((color, index) => (
              <View
                key={index}
                style={[styles.colorCircle, { backgroundColor: color }]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export default function NewReleases() {
  const products = [
    {
      image: require('../../../assets/images/products/socks-white.png'),
      label: 'Nuevo',
      title: 'Socks V2',
      isCustomizable: true,
      price: '$590.00',
      colors: ['#FAFAFA', '#0C0C0C'],
    },
    {
      image: require('../../../assets/images/products/socks-white.png'),
      label: 'Destacado',
      title: 'Regular Black',
      price: '$990.00',
      colors: ['#FAFAFA', '#0C0C0C', '#FFBA54', '#FFF27C'],
    },
    {
      image: require('../../../assets/images/products/socks-white.png'),
      label: 'Oportunidad',
      title: 'Mochila SQ',
      isCustomizable: true,
      price: '$1190.00',
      discountedPrice: '$890.00',
      discount: '-20%',
    },
    {
      image: require('../../../assets/images/products/socks-white.png'),
      title: 'Buzo Oversize',
      isCustomizable: true,
      price: '$1590.00',
      colors: ['#FAFAFA', '#0C0C0C'],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lanzamientos & Oportunidades</Text>
        <Pressable>
          <Text style={styles.viewMoreButton}>Ver Más</Text>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {products.map((product, index) => (
          <ProductCard key={index} {...product} />
        ))}
      </View>
      <Pressable style={styles.viewAllButton}>
        <Text style={styles.viewAllButtonText}>Ver todo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    gap: 16,
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
  viewMoreButton: {
    fontSize: 12,
    lineHeight: 16,
    color: '#707070',
    textDecorationLine: 'underline',
    fontFamily: 'Inter',
  },
  grid: {
    paddingHorizontal: 16,
    gap: 40,
  },
  productCard: {
    gap: 8,
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  favoriteButton: {
    position: 'absolute',
    top: 4,
    right: 3.5,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountLabel: {
    position: 'absolute',
    bottom: 8,
    left: 16,
    backgroundColor: '#AD3026',
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  discountText: {
    fontSize: 10,
    lineHeight: 14,
    color: '#FAFAFA',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  textContent: {
    paddingHorizontal: 16,
    gap: 4,
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
  customizable: {
    fontSize: 14,
    lineHeight: 20,
    color: '#575757',
    fontFamily: 'Inter',
  },
  priceContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  price: {
    fontSize: 14,
    lineHeight: 20,
    color: '#707070',
    fontFamily: 'Inter',
  },
  originalPrice: {
    fontSize: 14,
    lineHeight: 20,
    color: '#707070',
    textDecorationLine: 'line-through',
    fontFamily: 'Inter',
  },
  discountedPrice: {
    fontSize: 14,
    lineHeight: 20,
    color: '#AD3026',
    fontFamily: 'Inter',
  },
  colorsContainer: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 4,
  },
  colorCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#DCDCDC',
  },
  viewAllButton: {
    alignSelf: 'center',
    backgroundColor: '#0C0C0C',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  viewAllButtonText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#FBFBFB',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
}); 