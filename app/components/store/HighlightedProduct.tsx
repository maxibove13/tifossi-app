import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HighlightedProduct() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Destacado</Text>
        <Pressable>
          <Text style={styles.viewMoreButton}>Ver Más</Text>
        </Pressable>
      </View>
      <View style={styles.productCardWrapper}>
        <Pressable>
          <LinearGradient
            colors={['#373737', '#0C0C0C']}
            style={styles.productCard}
          >
            <View style={styles.textContent}>
              <Text style={styles.newLabel}>Nuevo</Text>
              <Text style={styles.productTitle}>Neceser Globo</Text>
              <Text style={styles.customizable}>Personalizable</Text>
            </View>
            <View style={styles.imageWrapper}>
              <Image
                source={require('../../../assets/images/products/socks-white.png')}
                style={styles.productImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.footer}>
              <Text style={styles.price}>$1490.00</Text>
              <Pressable style={styles.buyButton}>
                <Text style={styles.buyButtonText}>Comprar</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Pressable>
      </View>
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
  viewMoreButton: {
    fontSize: 12,
    lineHeight: 16,
    color: '#707070',
    textDecorationLine: 'underline',
    fontFamily: 'Inter',
  },
  productCardWrapper: {
    paddingHorizontal: 16,
  },
  productCard: {
    borderRadius: 4,
    paddingVertical: 28,
    gap: 28,
  },
  textContent: {
    paddingHorizontal: 28,
    gap: 4,
  },
  newLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: '#70BF73',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  productTitle: {
    fontSize: 20,
    lineHeight: 28,
    color: '#FBFBFB',
    fontWeight: '500',
    fontFamily: 'Roboto',
  },
  customizable: {
    fontSize: 12,
    lineHeight: 16,
    color: '#DCDCDC',
    fontFamily: 'Inter',
  },
  imageWrapper: {
    alignItems: 'center',
  },
  productImage: {
    width: 293,
    height: 220,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  price: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: '#B1B1B1',
    fontFamily: 'Inter',
  },
  buyButton: {
    backgroundColor: 'rgba(251, 251, 251, 0.25)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  buyButtonText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#FBFBFB',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
}); 