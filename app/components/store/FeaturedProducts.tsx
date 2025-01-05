import { StyleSheet, View, ScrollView, Image, Text, Pressable } from 'react-native';

type ProductCardProps = {
  image: any;
  isNew?: boolean;
  title: string;
  description: string[];
};

function ProductCard({ image, isNew, title, description }: ProductCardProps) {
  return (
    <Pressable style={styles.productCard}>
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.productImage} resizeMode="cover" />
      </View>
      <View style={styles.textContent}>
        {isNew && <Text style={styles.newLabel}>Nuevo</Text>}
        <Text style={styles.productTitle}>{title}</Text>
        <View style={styles.descriptionContainer}>
          {description.map((text, index) => (
            <>
              <Text key={index} style={styles.descriptionText}>{text}</Text>
              {index < description.length - 1 && <View style={styles.separator} />}
            </>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

export default function FeaturedProducts() {
  const products = [
    {
      image: require('../../../assets/images/products/socks-white.png'),
      isNew: true,
      title: 'Socks V2',
      description: [
        'Tecnología de secado rápido.',
        'Tejido suelto que brinda mayor confortabilidad.',
      ],
    },
    {
      image: require('../../../assets/images/products/socks-white.png'),
      title: 'Classic Socks',
      description: [
        'Tecnología de secado rápido.',
        'Tejido suelto que brinda mayor confortabilidad.',
      ],
    },
    {
      image: require('../../../assets/images/products/socks-white.png'),
      title: 'Tiffosi Fast',
      description: [
        'Tecnología de secado rápido.',
        'Tejido suelto que brinda mayor confortabilidad.',
      ],
    },
  ];

  return (
    <View style={styles.container}>
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
    backgroundColor: '#FAFAFA',
    borderTopWidth: 0.4,
    borderTopColor: '#DCDCDC',
    paddingVertical: 32,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FBFBFB',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  productImage: {
    width: 119,
    height: 142,
  },
  textContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  newLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: '#367C39',
    fontFamily: 'Inter',
  },
  productTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#0C0C0C',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  descriptionContainer: {
    paddingVertical: 8,
    gap: 8,
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 20,
    color: '#707070',
    fontFamily: 'Inter',
  },
  separator: {
    height: 1,
    backgroundColor: '#DCDCDC',
  },
}); 