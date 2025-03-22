import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Product } from '../../../../types/product'
import Counter from '../../../ui/form/Counter'
import ProductImage from '../image/ProductImage'

interface CartProduct extends Product {
  salePrice?: number
  image: string
  title: string
  price: number
}

interface CartProductCardProps {
  product: CartProduct
  quantity: number
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  isDark?: boolean
  isLoading?: boolean
}

export const CartProductCard = ({
  product,
  quantity,
  onQuantityChange,
  onRemove,
  isDark = false,
  isLoading = false,
}: CartProductCardProps) => {
  const totalPrice = product.salePrice 
    ? product.salePrice * quantity
    : product.price * quantity

  if (isLoading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={[
          styles.loadingImage,
          isDark && styles.loadingDark,
        ]} />
        <View style={styles.content}>
          <View style={[
            styles.loadingTitle,
            isDark && styles.loadingDark,
          ]} />
          <View style={[
            styles.loadingPrice,
            isDark && styles.loadingDark,
          ]} />
          <View style={[
            styles.loadingCounter,
            isDark && styles.loadingDark,
          ]} />
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <ProductImage source={product.image} size={80} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[styles.title, isDark && styles.titleDark]}
            numberOfLines={1}
          >
            {product.title}
          </Text>
          <TouchableOpacity
            onPress={onRemove}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons
              name="close"
              size={20}
              color={isDark ? '#FFFFFF' : '#707070'}
            />
          </TouchableOpacity>
        </View>

        {product.salePrice && (
          <Text style={styles.originalPrice}>
            ${product.price}
          </Text>
        )}

        <View style={styles.footer}>
          <Counter
            value={quantity}
            onChange={onQuantityChange}
            min={1}
            isDark={isDark}
          />
          <Text style={[styles.price, isDark && styles.priceDark]}>
            ${totalPrice.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#DCDCDC',
  },
  containerDark: {
    backgroundColor: '#0C0C0C',
    borderColor: '#373737',
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#0C0C0C',
    marginRight: 16,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  originalPrice: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: '#707070',
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  price: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#0C0C0C',
  },
  priceDark: {
    color: '#FFFFFF',
  },
  loadingImage: {
    width: 80,
    height: 80,
    borderRadius: 2,
    backgroundColor: '#F5F5F5',
  },
  loadingTitle: {
    width: '80%',
    height: 20,
    borderRadius: 2,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  loadingPrice: {
    width: 60,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#F5F5F5',
    marginTop: 4,
  },
  loadingCounter: {
    width: 120,
    height: 40,
    borderRadius: 2,
    backgroundColor: '#F5F5F5',
    marginTop: 12,
  },
  loadingDark: {
    backgroundColor: '#373737',
  },
})

export default CartProductCard 